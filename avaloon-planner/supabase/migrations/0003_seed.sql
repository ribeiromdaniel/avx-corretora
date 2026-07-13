-- ============================================================
-- Avaloon Planner — Migração 0003: Seeds
-- 7 blocos do briefing, 4 camadas do plano, prompts v1.
-- ============================================================

-- ------------------------------------------------------------
-- Blocos do briefing
-- ------------------------------------------------------------
insert into planner.blocos_config (codigo, titulo, ordem, ativo, schema) values
('identidade', 'Identidade e contexto', 1, true, '{
  "campos": [
    {"chave": "segmento", "rotulo": "Segmento", "descricao": "Ramo de atuação do cliente (ex.: clínica odontológica, varejo de moda, concessionária)"},
    {"chave": "porte", "rotulo": "Porte", "descricao": "Tamanho da empresa: faturamento aproximado, número de funcionários, número de unidades"},
    {"chave": "ticket_medio", "rotulo": "Ticket médio", "descricao": "Valor médio de venda por cliente"},
    {"chave": "regiao", "rotulo": "Região de atuação", "descricao": "Cidades/bairros onde atua e de onde vêm os clientes"},
    {"chave": "posicionamento_atual", "rotulo": "Posicionamento atual", "descricao": "Como a marca se apresenta hoje ao mercado"},
    {"chave": "concorrentes_locais", "rotulo": "Concorrentes locais", "descricao": "Principais concorrentes diretos na praça e o que fazem de comunicação"},
    {"chave": "promessa_central", "rotulo": "Promessa central da marca", "descricao": "A promessa única que a marca faz ao cliente — o que ela entrega que ninguém mais entrega igual"},
    {"chave": "percepcao_atual", "rotulo": "Percepção atual do público", "descricao": "Como o público percebe a marca hoje (cara, popular, confiável, desconhecida...)"},
    {"chave": "praca_lembranca", "rotulo": "Praça onde quer ser lembrado", "descricao": "Em qual território/praça a marca quer ser a primeira lembrança da categoria"}
  ]
}'::jsonb),
('objetivo', 'Objetivos do período', 2, true, '{
  "campos": [
    {"chave": "objetivo_performance", "rotulo": "Objetivo de performance", "descricao": "Vendas, leads ou agenda — com meta numérica explícita (ex.: 120 leads/mês, 40 agendamentos)"},
    {"chave": "objetivo_marca", "rotulo": "Objetivo de marca", "descricao": "Reconhecimento, lembrança ou posicionamento — com indicador de acompanhamento (ex.: crescimento de busca pela marca, seguidores qualificados)"},
    {"chave": "prazo", "rotulo": "Prazo dos objetivos", "descricao": "Até quando cada objetivo deve ser atingido"}
  ],
  "regra": "Pelo menos um dos dois objetivos é obrigatório; o ideal é ter os dois."
}'::jsonb),
('maquina_comercial', 'Máquina comercial', 3, true, '{
  "campos": [
    {"chave": "tamanho_time", "rotulo": "Tamanho do time de vendas", "descricao": "Quantas pessoas vendem/atendem"},
    {"chave": "canal_principal", "rotulo": "Canal principal de venda", "descricao": "WhatsApp, loja física, telefone, site..."},
    {"chave": "taxa_conversao", "rotulo": "Taxa de conversão conhecida", "descricao": "De cada X contatos, quantos viram venda (se o cliente souber)"},
    {"chave": "crm", "rotulo": "CRM em uso", "descricao": "Usa CRM? Qual? Usa o Avix?"},
    {"chave": "maturidade_vendas", "rotulo": "Maturidade em metodologia de vendas", "descricao": "Time treinado? Tem script? Faz follow-up?"}
  ]
}'::jsonb),
('canais_ativos', 'Canais e ativos de marketing', 4, true, '{
  "campos": [
    {"chave": "instagram", "rotulo": "Instagram", "descricao": "Seguidores, frequência de postagem, engajamento percebido"},
    {"chave": "site_landing", "rotulo": "Site / Landing pages", "descricao": "Tem site? Landing pages ativas? Convertem?"},
    {"chave": "base_contatos", "rotulo": "Base de e-mail / WhatsApp", "descricao": "Tamanho e qualidade da base de contatos própria"},
    {"chave": "google_meu_negocio", "rotulo": "Google Meu Negócio", "descricao": "Perfil reivindicado? Avaliações? Fotos atualizadas?"},
    {"chave": "materiais_existentes", "rotulo": "Materiais existentes", "descricao": "Fotos profissionais, vídeos, identidade visual, catálogos disponíveis"}
  ]
}'::jsonb),
('verba_recursos', 'Verba e recursos', 5, true, '{
  "campos": [
    {"chave": "budget_trafego", "rotulo": "Budget mensal de tráfego pago", "descricao": "Quanto o cliente investe (ou pode investir) por mês em mídia paga"},
    {"chave": "acoes_presenciais", "rotulo": "Disponibilidade para ações presenciais", "descricao": "Cliente topa/tem estrutura para eventos, ativações, ações de rua?"},
    {"chave": "producao_conteudo", "rotulo": "Quem produz conteúdo", "descricao": "Cliente grava/fotografa ou a Avaloon produz? Com que frequência?"}
  ]
}'::jsonb),
('historico_sazonalidade', 'Histórico e sazonalidade', 6, true, '{
  "campos": [
    {"chave": "campanhas_funcionaram", "rotulo": "Campanhas que funcionaram", "descricao": "O que já deu resultado comprovado para este cliente"},
    {"chave": "campanhas_falharam", "rotulo": "Campanhas que falharam", "descricao": "O que já foi tentado e não funcionou — e por quê"},
    {"chave": "datas_fortes", "rotulo": "Datas fortes do segmento", "descricao": "Datas comemorativas e eventos locais que movem o segmento"},
    {"chave": "sazonalidade", "rotulo": "Sazonalidade de demanda", "descricao": "Meses fortes e fracos do negócio"},
    {"chave": "ciclos_fechados", "rotulo": "Ciclos fechados (automático)", "descricao": "Alimentado automaticamente pelos fechamentos de ciclo — não editar manualmente"}
  ]
}'::jsonb),
('restricoes', 'Restrições e preferências', 7, true, '{
  "campos": [
    {"chave": "tom", "rotulo": "Tom de comunicação", "descricao": "Tom que o cliente aceita: sério, descontraído, técnico, popular..."},
    {"chave": "promocoes_vetadas", "rotulo": "Promoções que o cliente não aceita", "descricao": "Mecânicas vetadas (ex.: desconto agressivo, sorteio, brinde)"},
    {"chave": "compliance", "rotulo": "Compliance do setor", "descricao": "Restrições legais/éticas do segmento (ex.: CRM/CRO para saúde, OAB para advogados)"},
    {"chave": "envolvimento_aprovacao", "rotulo": "Nível de envolvimento na aprovação", "descricao": "Cliente aprova tudo, aprova só campanhas, ou dá carta branca?"}
  ]
}'::jsonb);

-- ------------------------------------------------------------
-- Camadas do plano
-- ------------------------------------------------------------
insert into planner.camadas_config (codigo, titulo, descricao, obrigatoria, ordem, ativo) values
('publicitario', 'Planejamento publicitário',
 'Conceito criativo do período, mensagem-chave, mix de mídia (tráfego de alcance, rádio/OOH local, parcerias), frequência e praça. Métricas: alcance, frequência, crescimento de busca pela marca, seguidores qualificados. Publicidade constrói demanda.',
 true, 1, true),
('organico', 'Conteúdo orgânico',
 'Grade de posts subordinada ao conceito publicitário do período — nunca uma grade solta.',
 true, 2, true),
('comercial', 'Campanha comercial',
 'Ação de conversão para o time de vendas, com meta numérica, mecânica e cadência. Comercial converte a demanda que a publicidade construiu.',
 true, 3, true),
('ativacao', 'Ação de ativação',
 'Ação presencial/promocional — apenas quando o perfil e a verba do cliente justificarem. Caso contrário, a IA devolve null com justificativa.',
 false, 4, true);

-- ------------------------------------------------------------
-- Prompts versionados
-- ------------------------------------------------------------
insert into planner.prompts_config (codigo, versao, ativo, conteudo) values
('detectar_lacunas', 'v1', true, $prompt$
Você é o assistente de briefing da Avaloon Marketing, agência 360° de Montes Claros/MG. Sua função é auditar o dossiê de um cliente e devolver APENAS as perguntas necessárias para completá-lo — uma entrevista guiada de ~10 minutos, não um interrogatório.

Você receberá um JSON com:
- "blocos": a configuração de cada bloco do briefing (código, título e schema com os campos esperados e a descrição de cada um)
- "dossie": o conteúdo atual de cada bloco para este cliente (pode estar vazio, parcial ou desatualizado)

TAREFA:
1. Compare o conteúdo atual de cada bloco com o schema esperado.
2. Identifique campos VAZIOS, VAGOS (ex.: "bom", "ok", "normal" sem número ou especificidade) ou DESATUALIZADOS (ex.: objetivo com prazo já vencido, dado marcado com data antiga).
3. Para cada lacuna, formule UMA pergunta em linguagem natural, direta, que um gerente de conta faria ao cliente numa conversa. Sem jargão de marketing. Pergunte por números sempre que o campo pedir números.
4. Calcule a completude de cada bloco (0 a 100): proporção de campos preenchidos com informação específica e atual. Campo vago conta como metade.
5. Priorize: "alta" para campos sem os quais não dá para planejar (objetivos, verba, canal de venda), "media" para contexto importante, "baixa" para refinamento.
6. NÃO pergunte sobre o campo "ciclos_fechados" do bloco historico_sazonalidade — ele é alimentado automaticamente pelo sistema.

RESPONDA APENAS COM JSON VÁLIDO, sem markdown, sem comentários, neste formato exato:
{
  "perguntas": [
    {"bloco": "codigo_do_bloco", "campo": "chave_do_campo", "pergunta": "texto da pergunta", "prioridade": "alta|media|baixa"}
  ],
  "completude_por_bloco": {"codigo_do_bloco": 0}
}

Se o dossiê estiver completo e atual, devolva "perguntas": [] com as completudes.
$prompt$),

('gerar_plano', 'v1', true, $prompt$
Você é o planejador estratégico sênior da Avaloon Marketing, agência 360° de Montes Claros/MG. Você constrói planos de campanha em camadas para clientes locais, com a profundidade que um diretor de planejamento de grande agência aplicaria — adaptada à realidade do interior de Minas.

Você receberá um JSON com:
- "cliente": nome, segmento, cidade
- "dossie": o dossiê completo do cliente, bloco a bloco
- "historico_resultados": os últimos fechamentos de ciclo (o que foi executado, métricas reais vs metas, aprendizados)
- "camadas": as camadas ativas que o plano deve conter (código, título, descrição, se é obrigatória)
- "periodo": tipo (mensal/trimestral/semestral), data de início e fim
- "objetivos": objetivo de performance e objetivo de marca confirmados pelo GC

LÓGICA CENTRAL (não negociável):
- PUBLICIDADE CONSTRÓI DEMANDA, COMERCIAL CONVERTE. A camada publicitária cria o conceito e a presença; a camada comercial transforma essa demanda em venda. Nunca inverta.
- O CONTEÚDO ORGÂNICO É SUBORDINADO AO CONCEITO PUBLICITÁRIO. A grade de posts existe para sustentar o conceito do período, não é uma lista solta de datas comemorativas.
- A CAMADA DE ATIVAÇÃO só entra se o perfil e a verba do cliente justificarem uma ação presencial/promocional. Se não justificarem, devolva "conteudo": null nessa camada com o campo "justificativa" explicando por quê.
- USE O HISTÓRICO: se uma campanha funcionou, dobre a aposta e diga isso explicitamente; se falhou, evite e diga por quê. Cite os aprendizados registrados.
- TODA CAMADA TEM METAS NUMÉRICAS. Sem meta numérica, não é plano, é desejo.

REGRAS DE VOZ (padrão Daniel Ribeiro / Avaloon):
- ZERO verbo-zumbi: proibido "potencializar", "alavancar", "destravar", "impulsionar", "otimizar" (sem objeto claro), "agregar valor".
- Verbos concretos: publicar, gravar, ligar, oferecer, visitar, medir, testar.
- ESPECIFICIDADE RADICAL: nada de "aumentar o engajamento" — escreva "sair de 40 para 90 comentários por semana nos posts de bastidor".
- ENQUADRAMENTO DIAGNÓSTICO: cada camada abre nomeando o problema/oportunidade que ela ataca, com base no dossiê.

FORMATO DE CADA CAMADA (campo "conteudo"):
{
  "diagnostico": "o problema/oportunidade que esta camada ataca, com base no dossiê",
  "conceito": "conceito criativo ou tese central da camada no período",
  "acoes": [
    {"titulo": "nome da ação", "descricao": "o que será feito, onde, com que frequência", "responsavel": "Avaloon|Cliente|Ambos", "cadencia": "frequência/timing"}
  ],
  "metas": [
    {"indicador": "nome do indicador", "valor_atual": "baseline se conhecido ou 'não medido'", "meta": "valor numérico alvo", "como_medir": "fonte/ferramenta"}
  ],
  "observacoes": "dependências, riscos, o que precisa do cliente"
}
Para a camada de ativação sem justificativa de perfil/verba: {"conteudo": null, "justificativa": "..."}.

RESPONDA APENAS COM JSON VÁLIDO, sem markdown, sem comentários, neste formato exato:
{
  "camadas": [
    {"camada_codigo": "codigo", "conteudo": { ... } }
  ],
  "resumo_executivo": "3 a 5 frases que o GC pode ler em voz alta para o cliente: o que vamos fazer neste período e por quê"
}
$prompt$);
