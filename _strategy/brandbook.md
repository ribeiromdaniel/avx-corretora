# Brandbook — AVX Corretora

*Última atualização: 2026-04-16*
*Design system inspirado em: Airtable (estrutura, clareza, profissionalismo)*

---

## 1. Identidade de Marca

### Nome
**AVX Corretora**

- **AV** — marca do Grupo Aventi. Continuidade, confiança, origem.
- **X** — multiplicador de resultados. Transformação, potência, diferença.
- **Corretora** — clareza de categoria sem rodeios.

Em comunicações informais: **AVX** (sem "Corretora").
Nunca: "avx corretora" (minúsculo), "AVX®" (sem registro), "A.V.X.".

---

### Propósito
Garantir que toda empresa tenha o melhor benefício possível — negociado por quem conhece o mercado por dentro e gerenciado por quem entende que o empresário tem outros problemas para resolver.

### Missão
Assessorar empresas e famílias na contratação e gestão de planos de saúde, consórcios e seguros com total transparência, profundidade técnica e suporte ativo — eliminando a burocracia e garantindo sempre o melhor negócio.

### Visão
Ser a corretora de referência no interior de Minas Gerais — reconhecida não por volume de vendas, mas pela qualidade do relacionamento e pelo conhecimento que protege os nossos clientes.

### Valores
- **Transparência** — dizemos o que sabemos, inclusive quando a resposta é "não vale a pena trocar agora"
- **Expertise** — nossa vantagem vem de onde trabalhamos antes, não de onde queremos chegar
- **Presença** — não vendemos e sumimos; somos a corretora que atende quando o problema aparece
- **Resultado** — cada contrato precisa fazer sentido financeiro e estratégico para o cliente

---

## 2. Personalidade da Marca

### Arquétipo
**O Especialista + O Parceiro**

A AVX não é a marca que grita nas redes sociais. É aquela que, quando fala, todo mundo presta atenção porque sabe que tem conteúdo por trás. É a corretora que o empresário recomenda sem que ninguém peça — porque fez a diferença de verdade.

### Tom de Voz

| Situação | Tom |
|----------|-----|
| Conteúdo educacional | Claro, direto, sem jargão — explica como quem sabe muito mas não quer impressionar |
| Proposta comercial | Consultivo, confiante, baseado em dados — não vende, apresenta |
| Resposta a problema do cliente | Presente, rápido, resolutivo — sem escorregões para o "aguarde nosso retorno" |
| Redes sociais | Profissional mas humano — pode ter humor suave, nunca irônico ou informal demais |
| Anúncios pagos | Direto ao ponto, problema → solução → ação em até 3 linhas |

### Adjetivos da Marca
**Confiável · Especialista · Transparente · Presente · Consultivo**

### O que a AVX nunca é:
- Vendedora de plantão (não é urgente, não tem promoção relâmpago)
- Genérica (cada comunicação deve ser específica para quem recebe)
- Complicada (se precisou de 3 parágrafos para explicar, simplifica)
- Arrogante (sabe muito, mas não precisar provar o tempo todo)

---

## 3. Paleta de Cores

*Inspiração: Airtable — clareza estrutural, profissionalismo, confiança.*
*Adaptação: inserção de âncora dourada do Grupo Aventi para continuidade visual.*

### Cores Primárias

| Papel | Nome | Hex | Uso |
|-------|------|-----|-----|
| Texto principal | **Deep Navy** | `#181d26` | Títulos, corpo de texto, headlines |
| Fundo principal | **Branco** | `#ffffff` | Canvas, cards, formulários |
| CTA / Destaque | **AVX Blue** | `#1b61c9` | Botões, links, elementos interativos |

### Cores Secundárias

| Papel | Nome | Hex | Uso |
|-------|------|-----|-----|
| Acento dourado | **AVX Gold** | `#c9961b` | Detalhes premium, ícones de destaque, separadores |
| Superfície suave | **Light Surface** | `#f8fafc` | Fundos de seção, cards secundários |
| Texto fraco | **Muted Text** | `rgba(4,14,32,0.60)` | Subtextos, metadados, legendas |
| Borda | **Border** | `#e0e2e6` | Cards, inputs, divisores |

### Cores Semânticas

| Papel | Hex | Uso |
|-------|-----|-----|
| Sucesso | `#006400` | Confirmações, "contrato ativo", status positivo |
| Alerta | `#b45309` | Reajuste, vencimento próximo, atenção |
| Erro | `#c0392b` | Problemas, cobertura negada, ação urgente |

### Sombras (sistema Airtable)

```css
/* Sombra padrão — uso em cards */
box-shadow: rgba(0,0,0,0.32) 0px 0px 1px,
            rgba(0,0,0,0.08) 0px 0px 2px,
            rgba(45,127,249,0.18) 0px 1px 3px,
            rgba(0,0,0,0.06) 0px 0px 0px 0.5px inset;

/* Sombra suave — hover, seções */
box-shadow: rgba(15,48,106,0.05) 0px 0px 20px;
```

---

## 4. Tipografia

*Font principal: **Inter** (web) — proxy para Haas, padrão Airtable.*
*Fallback: -apple-system, system-ui, Segoe UI, Roboto.*

### Hierarquia Tipográfica

| Papel | Tamanho | Peso | Line Height | Letter Spacing |
|-------|---------|------|-------------|----------------|
| Hero Headline | 48px | 700 | 1.15 | normal |
| Section Heading | 36px | 600 | 1.20 | normal |
| Sub-heading | 28px | 600 | 1.20 | normal |
| Card Title | 20px | 600 | 1.25 | 0.10px |
| Body | 16px | 400 | 1.50 | 0.08px |
| Caption / Meta | 13px | 400–500 | 1.35 | 0.20px |
| Button | 15px | 600 | 1.25 | 0.08px |
| Label / Tag | 11px | 600 | 1.20 | 0.40px uppercase |

**Regra:** manter letter-spacing positivo no corpo de texto. Nunca compactar letras.

---

## 5. Logo

### Conceito
O logotipo da AVX é composto por:
- **Wordmark "AVX"** — tipografia weight 700, espaçamento generoso entre letras
- **"X" destacado** — cor AVX Blue (`#1b61c9`) ou AVX Gold (`#c9961b`) dependendo do contexto
- **"Corretora"** — abaixo ou ao lado, tipografia leve (weight 400), corpo menor

### Variações
| Versão | Quando usar |
|--------|-------------|
| Principal (fundo branco) | Site, materiais digitais, apresentações |
| Invertida (fundo navy) | Rodapé, header escuro, cartão de visita verso |
| Ícone (só "AVX") | Avatar de redes sociais, favicon, aplicações pequenas |
| Monocromática | Carimbos, documentos formais, impressão em 1 cor |

### Área de proteção
Manter espaço mínimo equivalente à altura da letra "A" em todos os lados do logo.

### Nunca
- Distorcer proporções
- Usar sobre fundos que reduzam contraste
- Adicionar sombras, gradientes ou efeitos ao logo
- Colocar o logo sobre fotografia sem overlay de opacidade

---

## 6. Componentes Visuais

### Botões

```
Primário:   fundo #1b61c9 | texto branco | radius 12px | padding 12px 24px
Secundário: fundo branco | texto #181d26 | borda 1px #e0e2e6 | radius 12px
Ghost:      sem fundo | texto #1b61c9 | borda 1px #1b61c9 | radius 12px
```

**Textos de CTA:** sempre verbos de ação + benefício específico
- ✅ "Agendar Diagnóstico Gratuito"
- ✅ "Calcular o Custo do Meu Plano"
- ❌ "Saiba Mais" / "Clique Aqui" / "Enviar"

### Cards

```
Fundo: branco | Borda: 1px solid #e0e2e6 | Radius: 16px
Sombra: sistema Airtable (ver seção 3)
Padding interno: 24px
Hover: border-color → #1b61c9, translateY(-2px)
```

### Badges / Tags

```
Radius: 6px | Padding: 3px 10px | Font: 11px 600 uppercase letter-spacing 0.4px
Ativo:    fundo rgba(27,97,201,0.10) | texto #1b61c9
Destaque: fundo rgba(201,150,27,0.12) | texto #c9961b
Neutro:   fundo #f8fafc | texto rgba(4,14,32,0.60)
```

---

## 7. Fotografia e Visual

### Estilo fotográfico
- **Empresários reais** em contexto de trabalho — reuniões, escritórios, ambientes de negócio
- **Luz natural**, ambientes claros, sem excesso de positividade forçada (sem sorriso de banco americano)
- **Diversidade** de porte de empresa — escritório pequeno tem o mesmo valor que empresa grande
- Evitar: fotos de banco de imagem óbvias (apertos de mão genéricos, gráficos de pizza flutuando)

### Ícones
- Estilo: line icons, stroke width 1.5–2px, Lucide ou equivalente
- Cor: Deep Navy (`#181d26`) em contexto claro; Branco em contexto escuro; AVX Blue para destaque
- Tamanho padrão: 20px (inline), 32px (card), 48px (hero)

### Ilustrações
- Mínimas — priorizar dados reais e textos concretos sobre ilustrações genéricas
- Quando usar: explicar processos complexos (como funciona a ANS, o que é portabilidade de carência)
- Estilo: flat, paleta reduzida (Deep Navy + AVX Blue + White), sem gradientes

---

## 8. Aplicações Digitais

### Site / Landing Page
- Canvas branco (`#ffffff`) como fundo base
- Seções alternadas: branco ↔ light surface (`#f8fafc`)
- Seção hero ou CTA final: Deep Navy (`#181d26`) com texto branco
- Máximo de 1080px de largura de conteúdo

### Instagram
- Grid coerente — paleta branco/navy/azul com detalhes gold
- Stories: fundo navy com texto branco e CTA em azul
- Formato de carrossel para conteúdo educacional (explicar ANS, tipos de plano, consórcio)
- Reels: câmera direta, fundo clean, legenda sempre

### WhatsApp Business
- Foto de perfil: logo AVX fundo navy
- Status: tagline da AVX
- Catálogo: produtos separados por categoria (Saúde PJ, PJ Familiar, Consórcio)
- Mensagem automática de boas-vindas com CTA para diagnóstico gratuito

### LinkedIn
- Banner: logo AVX + tagline sobre fundo navy
- Posts: formato de lista ou carrossel para conteúdo técnico
- Ton: mais formal que Instagram, foco em dados e expertise

---

## 9. Templates de Comunicação

### E-mail / WhatsApp Outbound (Tiago — ABM)
```
Assunto/abertura: problema específico → pergunta direta
Corpo: 3 linhas máximo → credencial → CTA
CTA: link para diagnóstico ou WhatsApp da Daiane
Assinatura: Nome | AVX Corretora | WhatsApp | não usar disclaimers longos
```

### Proposta Comercial
```
Cabeçalho: logo + data + nome do cliente
Seções: Diagnóstico do Cenário Atual → Recomendação → Por Que a AVX → Próximos Passos
Paleta: Deep Navy para títulos, AVX Blue para destaques, fundo branco/light surface
Rodapé: contatos + frase de encerramento consultiva (não vendedora)
```

### Apresentação (Pitch)
```
Slides: máximo 8 para reunião inicial
Estrutura: Problema que eles têm → Prova que entendemos → Solução AVX → Diferencial → Como funciona → Próximo passo
Design: um conceito por slide, tipografia grande, dados reais, sem bullet points longos
```

---

## 10. Do's & Don'ts

### ✅ Fazer sempre
- Falar de problema real antes de falar de produto
- Usar dados concretos (percentual de economia, dias de prazo, quantidade de movimentações)
- Nomear o diferencial de insider (ex-gerente + ex-coordenadora de operadora)
- Terminar toda comunicação com um CTA específico e sem atrito
- Manter consistência de paleta e tipografia em todos os canais

### ❌ Nunca fazer
- Prometer "o mais barato" ou "o maior desconto"
- Usar linguagem de urgência artificial ("oferta por tempo limitado", "vagas limitadas")
- Publicar conteúdo sem revisar dados regulatórios da ANS
- Usar foto genérica de banco de imagem em material assinado pela AVX
- Falar mal de corretoras concorrentes pelo nome (criticar o modelo, não as empresas)
- Criar peças fora da paleta ou com fontes diferentes sem aprovação
