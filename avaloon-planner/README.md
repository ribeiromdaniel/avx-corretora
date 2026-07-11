# Avaloon Planner

Sistema interno de planejamento de campanhas da Avaloon Marketing. Centraliza um
**dossiê vivo por cliente**, gera **planos de campanha em camadas** via API do
Claude, passa por **revisão obrigatória do GC** e **aprovação de diretoria**,
registra **demandas extras** e fecha o ciclo com **resultados reais** que
alimentam o plano seguinte.

**Stack:** React + Vite + TypeScript + Tailwind · Supabase (Postgres, Auth, RLS,
Edge Functions) · API Anthropic (`claude-sonnet-4-6`) · Netlify.

---

## Setup

### 1. Banco de dados (Supabase)

Crie um projeto em [supabase.com](https://supabase.com) e aplique as migrações
na ordem, via SQL Editor ou CLI:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push   # aplica supabase/migrations/000{1,2,3}_*.sql
```

- `0001_schema.sql` — tabelas, máquina de estados do plano (trigger), trilha de
  eventos, RPCs `decidir_plano` e `fechar_ciclo`.
- `0002_rls.sql` — Row Level Security: GC vê só os seus clientes; diretor vê
  tudo; admin gerencia configuração.
- `0003_seed.sql` — os 7 blocos do briefing, as 4 camadas do plano e os prompts
  v1 (`detectar_lacunas`, `gerar_plano`).
- `0004_bloco_marca.sql` — bloco 8 do dossiê: **marca e identidade visual**
  (logo, cores hex, tipografia, tom visual, restrições). A entrevista guiada
  cobre essas lacunas automaticamente, e a apresentação do plano aprovado usa
  esses campos.
- `0005_prompt_grade_posts.sql` — `gerar_plano:v2`: a camada de conteúdo
  orgânico passa a incluir `grade_posts` (data, hora, formato, criativo e
  legenda prontos para publicar), que vira um slide por post na apresentação,
  no formato do deck mensal Avaloon.

### 2. Edge Functions

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy detectar-lacunas
supabase functions deploy gerar-plano
```

As duas funções usam o JWT do usuário chamador — todas as queries respeitam RLS.
A API key da Anthropic vive apenas em secret do Supabase, nunca no client.

### 3. Usuários

Crie os usuários em **Auth → Users** no painel do Supabase (e-mail/senha). Cada
usuário ganha um profile automático com papel `gerente_conta`. Promova o
primeiro admin via SQL:

```sql
update public.profiles set papel = 'admin', cargo_diretor = 'Diretor Comercial'
where email = 'daniel@avaloon.com.br';
```

Depois, os papéis dos demais (Andrey → `diretor`/Diretor Criativo, Tiago →
`diretor`/Diretor de Marketing) são ajustados na tela **Admin → Usuários**.

### 4. Frontend

```bash
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Deploy no Netlify: aponte o site para este repositório — o `netlify.toml` já
define `base = avaloon-planner`, build `npm run build` e publish `dist`, com
redirect de SPA.

---

## Fluxo do plano

```
rascunho_ia → em_revisao_gc → aguardando_aprovacao → aprovado → apresentado_cliente → em_execucao → ciclo_fechado
                    ↑                   |
                    └── ajustes_solicitados
```

Regras aplicadas **no banco** (trigger `valida_transicao_plano`):

- Enviar para aprovação exige `ajustes_gc` com ≥ 200 caracteres.
- Aprovar/solicitar ajustes é exclusivo de diretores; basta **um** decidir
  (RPC `decidir_plano`, sempre auditada em `aprovacoes`).
- Solicitar ajustes exige comentário e devolve o plano ao GC.
- Apresentação só a partir de `aprovado`: deck de slides HTML autocontido
  (`src/lib/apresentacao.ts`) na estrutura padrão Avaloon — capa, objetivos do
  período em destaque, resumo executivo, conceito/ações/metas por camada —
  vestido com as cores e o logo do cliente (bloco "marca" do dossiê); sem marca
  preenchida, sai no padrão laranja/preto da Avaloon. Navegação por teclado ou
  clique, imprimível em PDF (um slide por página).
- Toda mudança de status vira linha em `eventos` (base para automações futuras).
- `fechar_ciclo` grava os resultados reais e alimenta automaticamente o bloco
  "Histórico e sazonalidade" do dossiê — memória para o próximo plano.

## Extensibilidade

- **Blocos e camadas são dados**: criar um bloco de briefing ou camada de
  entregável nova = inserir linha em `blocos_config`/`camadas_config` (tela
  Admin). A UI e os prompts se adaptam sem deploy.
- **Prompts versionados** em `prompts_config`: a metodologia evolui pelo Admin;
  cada plano registra a `versao_prompt` usada.
- **JSONB em todo conteúdo**: campos novos não exigem migração.
- **Edge Functions isoladas por responsabilidade**: features futuras (criativos
  via Higgsfield, relatório mensal, e-mail marketing) entram como novas
  functions + linhas de config.
