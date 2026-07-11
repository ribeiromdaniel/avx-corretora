import type { CamadaConfig, Cliente, Plano, PlanoCamada } from './types'

// ------------------------------------------------------------
// Padrão visual Avaloon (calibrado pelo deck real de planejamento):
// tema claro #F7F7F7, marca d'água do logotipo, gradiente laranja
// #F09340→#F89843 na borda direita da capa/encerramento, mês/ano
// rotacionados na lateral, títulos pesados em caixa alta, kicker
// com letter-spacing largo. A marca do cliente (bloco 'marca' do
// dossiê) entra como logo na capa e cor de destaque nos cards.
// ------------------------------------------------------------
export interface MarcaCliente {
  logo_url?: string
  cor_primaria?: string
  cor_secundaria?: string
  cor_escura?: string
  tipografia?: string
}

const AVALOON = {
  laranja: '#EE8433',
  laranjaClaro: '#F89843',
  fundo: '#F7F7F7',
  carvao: '#2B2A29',
  cinza: '#8A8A8A',
}

function hexValido(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const m = v.trim().match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/)
  return m ? `#${m[1]}` : null
}

function urlSegura(v: unknown): string | null {
  if (typeof v !== 'string') return null
  try {
    const u = new URL(v.trim())
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null
  } catch {
    return null
  }
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtData(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const MESES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
]

function mesDe(dataIso: string): string {
  const m = Number(dataIso.split('-')[1])
  return MESES[m - 1] ?? ''
}

/** Rótulo lateral do período: "JULHO" ou "JUL – SET". */
function rotuloPeriodo(plano: Plano): string {
  const ini = mesDe(plano.periodo_inicio)
  const fim = mesDe(plano.periodo_fim)
  if (ini === fim) return ini
  return `${ini.slice(0, 3)} – ${fim.slice(0, 3)}`
}

const NOME_PERIODO: Record<string, string> = {
  mensal: 'MENSAL',
  trimestral: 'TRIMESTRAL',
  semestral: 'SEMESTRAL',
}

// Marca d'água: letras do logotipo repetidas em cinza sutil,
// como no deck de referência.
function watermarkCss(): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='520' height='400'>` +
    `<g fill='%23000000' fill-opacity='0.016' font-family='Arial Black,Arial,sans-serif' font-weight='900'>` +
    `<text x='-30' y='120' font-size='150' transform='rotate(18 100 100)'>AV</text>` +
    `<text x='240' y='300' font-size='150' transform='rotate(-14 300 260)'>ON</text>` +
    `<text x='60' y='380' font-size='150' transform='rotate(8 120 340)'>LO</text>` +
    `</g></svg>`
  return `url("data:image/svg+xml,${svg}")`
}

// ------------------------------------------------------------
// Conteúdo das camadas
// ------------------------------------------------------------
interface Acao {
  titulo?: string
  descricao?: string
  responsavel?: string
  cadencia?: string
}

interface Meta {
  indicador?: string
  valor_atual?: string
  meta?: string
  como_medir?: string
}

function renderAcoes(acoes: Acao[]): string {
  return `<div class="acoes">${acoes
    .map(
      (a) => `
    <div class="acao">
      <div class="acao-titulo">${esc(a.titulo)}</div>
      <div class="acao-desc">${esc(a.descricao)}</div>
      ${
        a.responsavel || a.cadencia
          ? `<div class="acao-chips">${[a.responsavel, a.cadencia]
              .filter(Boolean)
              .map((c) => `<span>${esc(c)}</span>`)
              .join('')}</div>`
          : ''
      }
    </div>`,
    )
    .join('')}</div>`
}

function renderMetas(metas: Meta[]): string {
  return `<div class="metas">${metas
    .map(
      (m) => `
    <div class="meta-card">
      <div class="meta-indicador">${esc(m.indicador)}</div>
      <div class="meta-valor">${esc(m.meta)}</div>
      ${m.valor_atual ? `<div class="meta-base">hoje: ${esc(m.valor_atual)}</div>` : ''}
      ${m.como_medir ? `<div class="meta-base">medição: ${esc(m.como_medir)}</div>` : ''}
    </div>`,
    )
    .join('')}</div>`
}

function slideCamada(
  numero: number,
  titulo: string,
  conteudo: Record<string, unknown>,
): string {
  const diagnostico = typeof conteudo.diagnostico === 'string' ? conteudo.diagnostico : ''
  const conceito = typeof conteudo.conceito === 'string' ? conteudo.conceito : ''
  const observacoes = typeof conteudo.observacoes === 'string' ? conteudo.observacoes : ''
  const acoes = Array.isArray(conteudo.acoes) ? (conteudo.acoes as Acao[]) : []
  const metas = Array.isArray(conteudo.metas) ? (conteudo.metas as Meta[]) : []
  const tituloCaps = esc(titulo).toUpperCase()

  const conceitoSlide = `
  <section class="slide">
    <div class="kicker">CAMADA 0${numero}</div>
    <h2>${tituloCaps}</h2>
    ${diagnostico ? `<p class="diagnostico">${esc(diagnostico)}</p>` : ''}
    ${conceito ? `<p class="conceito">${esc(conceito)}</p>` : ''}
  </section>`

  const acoesSlide =
    acoes.length > 0
      ? `
  <section class="slide">
    <div class="kicker">CAMADA 0${numero} · ${tituloCaps}</div>
    <h2>O QUE VAMOS FAZER</h2>
    ${renderAcoes(acoes)}
    ${observacoes ? `<p class="obs">${esc(observacoes)}</p>` : ''}
  </section>`
      : ''

  const metasSlide =
    metas.length > 0
      ? `
  <section class="slide">
    <div class="kicker">CAMADA 0${numero} · ${tituloCaps}</div>
    <h2>COMO VAMOS MEDIR</h2>
    ${renderMetas(metas)}
  </section>`
      : ''

  return conceitoSlide + acoesSlide + metasSlide
}

// ------------------------------------------------------------
// Deck completo
// ------------------------------------------------------------
export function gerarApresentacao(
  cliente: Cliente,
  plano: Plano,
  camadas: PlanoCamada[],
  configs: CamadaConfig[],
  marca: Record<string, unknown>,
): string {
  const corCliente = hexValido(marca.cor_primaria) ?? AVALOON.laranja
  const logoUrl = urlSegura(marca.logo_url)

  const configPorCodigo = Object.fromEntries(configs.map((c) => [c.codigo, c]))
  const objPerf = plano.objetivo_performance as Record<string, unknown>
  const objMarca = plano.objetivo_marca as Record<string, unknown>
  const resumo = typeof objMarca?.resumo_executivo === 'string' ? objMarca.resumo_executivo : ''
  const ano = plano.periodo_inicio.slice(0, 4)
  const periodoLateral = rotuloPeriodo(plano)
  const nomePeriodo = NOME_PERIODO[plano.periodo_tipo] ?? 'DE CAMPANHA'

  const clienteNaCapa = logoUrl
    ? `<img class="logo-cliente" src="${esc(logoUrl)}" alt="${esc(cliente.nome)}" onerror="this.outerHTML='<div class=subtitulo>${esc(cliente.nome).toUpperCase()}</div>'">`
    : `<div class="subtitulo">${esc(cliente.nome).toUpperCase()}</div>`

  const wordmark = `
    <div class="wordmark">
      <span class="wm-nome">AVALOON</span>
      <span class="wm-sub">MARKETING &amp; TECNOLOGIA</span>
    </div>`

  const lateral = `
    <div class="lateral lateral-ano">${esc(ano)}</div>
    <div class="lateral lateral-mes">${esc(periodoLateral)}</div>`

  const cardObjetivo = (
    rotulo: string,
    descricao: unknown,
    destaque: unknown,
    destaqueRotulo: string,
    cor: string,
  ) =>
    descricao || destaque
      ? `
    <div class="obj-card" style="border-top-color: ${cor}">
      <div class="obj-tipo">${rotulo}</div>
      <div class="obj-desc">${esc(descricao)}</div>
      ${destaque ? `<div class="obj-meta" style="color: ${cor}"><span>${destaqueRotulo}</span>${esc(destaque)}</div>` : ''}
    </div>`
      : ''

  const slidesCamadas = [...camadas]
    .sort((a, b) => a.ordem - b.ordem)
    .filter((c) => c.conteudo && (c.conteudo as Record<string, unknown>).conteudo !== null)
    .map((c, i) =>
      slideCamada(
        i + 1,
        configPorCodigo[c.camada_codigo]?.titulo ?? c.camada_codigo,
        c.conteudo as Record<string, unknown>,
      ),
    )
    .join('\n')

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(cliente.nome)} — Planejamento ${esc(nomePeriodo.toLowerCase())} | Avaloon</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800;900&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --laranja: ${AVALOON.laranja};
    --laranja-claro: ${AVALOON.laranjaClaro};
    --fundo: ${AVALOON.fundo};
    --carvao: ${AVALOON.carvao};
    --cinza: ${AVALOON.cinza};
    --marca-cliente: ${corCliente};
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: 'Poppins', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: var(--carvao); color: var(--carvao); overflow: hidden;
  }
  .slide {
    display: none; position: fixed; inset: 0;
    flex-direction: column; justify-content: center;
    padding: 7vh 9vw 7vh 11vw;
    background: var(--fundo);
    background-image: ${watermarkCss()};
  }
  .slide.ativa { display: flex; }

  .kicker {
    color: var(--laranja); font-size: clamp(11px, 1.3vw, 15px); font-weight: 700;
    letter-spacing: 0.32em; text-transform: uppercase; margin-bottom: 2.2vh;
  }
  h1, h2 {
    font-family: 'Montserrat', 'Poppins', sans-serif;
    color: var(--carvao); text-transform: uppercase; line-height: 1.04;
  }
  h1 { font-size: clamp(38px, 7vw, 96px); font-weight: 900; letter-spacing: 0.01em; }
  h2 { font-size: clamp(24px, 3.8vw, 52px); font-weight: 800; margin-bottom: 3.5vh; }

  /* Capa e encerramento: gradiente laranja na borda direita */
  .capa::after, .final::after {
    content: ''; position: absolute; inset: 0 0 0 auto; width: 34vw;
    background: linear-gradient(90deg, rgba(248,152,67,0) 0%, ${AVALOON.laranjaClaro}cc 55%, ${AVALOON.laranja} 100%);
    pointer-events: none;
  }
  .capa, .final { position: fixed; z-index: 0; }
  .capa > *, .final > * { position: relative; z-index: 1; }

  .lateral {
    position: absolute; left: 3.2vw; z-index: 2;
    writing-mode: vertical-rl; transform: rotate(180deg);
    font-family: 'Montserrat', sans-serif; font-weight: 600;
    font-size: clamp(14px, 1.8vw, 24px); letter-spacing: 0.35em; color: var(--carvao);
  }
  .lateral-ano { top: 8vh; }
  .lateral-mes { bottom: 8vh; }

  .wordmark { display: flex; flex-direction: column; gap: 2px; margin-bottom: 2.4vh; }
  .wm-nome {
    font-family: 'Montserrat', sans-serif; font-weight: 900;
    font-size: clamp(16px, 1.9vw, 24px); letter-spacing: 0.14em; color: var(--laranja);
  }
  .wm-sub { font-size: clamp(7px, 0.75vw, 10px); letter-spacing: 0.42em; color: var(--laranja); font-weight: 600; }

  .subtitulo {
    font-size: clamp(16px, 2.4vw, 34px); font-weight: 500; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--carvao); margin-top: 2vh;
  }
  .logo-cliente { max-height: 9vh; max-width: 34vw; object-fit: contain; align-self: flex-start; margin-top: 2.5vh; }
  .periodo-capa { font-size: clamp(13px, 1.5vw, 18px); color: var(--cinza); margin-top: 1.6vh; }
  .seta {
    margin-top: 4vh; width: 84px; height: 44px; border: 2.5px solid var(--laranja);
    border-radius: 999px; display: flex; align-items: center; justify-content: center;
    color: var(--laranja); font-size: 22px; font-weight: 600;
  }

  .diagnostico { font-size: clamp(14px, 1.7vw, 21px); color: #5a5a5a; max-width: 62ch; margin-bottom: 3vh; }
  .conceito {
    font-family: 'Montserrat', sans-serif;
    font-size: clamp(19px, 2.6vw, 34px); font-weight: 800; line-height: 1.22;
    color: var(--carvao); max-width: 48ch;
    border-left: 7px solid var(--laranja); padding-left: 26px;
  }
  .obs { margin-top: 3vh; font-size: clamp(11px, 1.3vw, 14px); color: var(--cinza); max-width: 70ch; }

  /* Objetivos */
  .objetivos { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2.4vw; }
  .obj-card {
    background: #fff; border-radius: 10px; border-top: 7px solid var(--laranja);
    padding: 3.4vh 2.2vw; box-shadow: 0 14px 34px rgba(43, 42, 41, 0.10);
  }
  .obj-tipo { font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: var(--cinza); margin-bottom: 1.4vh; }
  .obj-desc { font-size: clamp(15px, 1.9vw, 23px); font-weight: 600; line-height: 1.32; margin-bottom: 2.2vh; }
  .obj-meta { font-family: 'Montserrat', sans-serif; font-size: clamp(24px, 3.4vw, 46px); font-weight: 900; line-height: 1.08; }
  .obj-meta span { display: block; font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase; color: var(--cinza); margin-bottom: 0.6vh; }

  .resumo-txt { font-size: clamp(18px, 2.4vw, 32px); font-weight: 600; line-height: 1.4; max-width: 56ch; color: var(--carvao); }

  /* Ações */
  .acoes { display: flex; flex-direction: column; gap: 1.6vh; max-height: 62vh; overflow: auto; padding: 4px; }
  .acao {
    background: #fff; border-radius: 10px; padding: 2vh 1.8vw;
    box-shadow: 0 10px 26px rgba(43, 42, 41, 0.08); border-left: 6px solid var(--laranja);
  }
  .acao-titulo { font-size: clamp(14px, 1.8vw, 21px); font-weight: 600; color: var(--carvao); }
  .acao-desc { font-size: clamp(12px, 1.4vw, 16px); color: #5a5a5a; max-width: 80ch; margin-top: 0.3vh; }
  .acao-chips { margin-top: 1vh; display: flex; flex-wrap: wrap; gap: 8px; }
  .acao-chips span {
    font-size: clamp(10px, 1vw, 12px); font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--laranja);
    border: 1.5px solid var(--laranja); border-radius: 999px; padding: 3px 12px;
  }

  /* Metas */
  .metas { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.8vw; max-height: 62vh; overflow: auto; padding: 4px; }
  .meta-card { background: #fff; border-radius: 10px; padding: 2.6vh 1.6vw; box-shadow: 0 10px 26px rgba(43, 42, 41, 0.08); }
  .meta-indicador { font-size: clamp(11px, 1.3vw, 14px); font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: var(--cinza); margin-bottom: 1vh; }
  .meta-valor { font-family: 'Montserrat', sans-serif; font-size: clamp(22px, 2.9vw, 38px); font-weight: 900; color: var(--laranja); line-height: 1.08; }
  .meta-base { font-size: clamp(10px, 1.2vw, 13px); color: var(--cinza); margin-top: 0.8vh; }

  /* Encerramento */
  .final h1 { max-width: 12ch; }
  .final .cliente-final { margin-top: 3vh; font-size: clamp(12px, 1.4vw, 17px); letter-spacing: 0.22em; text-transform: uppercase; color: var(--cinza); }

  #nav {
    position: fixed; bottom: 16px; right: 20px; z-index: 10;
    font-size: 12px; font-weight: 600; color: var(--cinza); letter-spacing: 0.12em;
    user-select: none;
  }
  @media print {
    body { overflow: visible; }
    .slide { display: flex; position: relative; inset: auto; height: 100vh; page-break-after: always; }
    #nav { display: none; }
  }
</style>
</head>
<body>

<section class="slide capa ativa">
  ${lateral}
  <div class="kicker">ESTRATÉGIA ${esc(nomePeriodo)} DE CAMPANHA</div>
  ${wordmark}
  <h1>PLANEJAMENTO<br>${esc(nomePeriodo)}</h1>
  ${clienteNaCapa}
  <div class="periodo-capa">${fmtData(plano.periodo_inicio)} — ${fmtData(plano.periodo_fim)} · ${esc(cliente.cidade)}</div>
  <div class="seta">→</div>
</section>

<section class="slide">
  <div class="kicker">PARA ONDE VAMOS</div>
  <h2>OBJETIVOS DO PERÍODO</h2>
  <div class="objetivos">
    ${cardObjetivo('Performance', objPerf?.descricao, objPerf?.meta, 'meta', AVALOON.laranja)}
    ${cardObjetivo('Marca', objMarca?.descricao, objMarca?.indicador, 'indicador', corCliente)}
  </div>
</section>

${resumo ? `
<section class="slide">
  <div class="kicker">RESUMO EXECUTIVO</div>
  <p class="resumo-txt">${esc(resumo)}</p>
</section>` : ''}

${slidesCamadas}

<section class="slide final">
  ${lateral}
  ${wordmark}
  <h1>CONECTANDO SOLUÇÕES CRIATIVAS AO MUNDO</h1>
  <div class="cliente-final">${esc(cliente.nome)} · PLANEJAMENTO ${esc(nomePeriodo)}</div>
</section>

<div id="nav">1 / 1</div>
<script>
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var i = 0;
  function go(n) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (s, j) { s.classList.toggle('ativa', j === i); });
    document.getElementById('nav').textContent = (i + 1) + ' / ' + slides.length;
  }
  document.addEventListener('keydown', function (e) {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].indexOf(e.key) >= 0) go(i + 1);
    if (['ArrowLeft', 'PageUp'].indexOf(e.key) >= 0) go(i - 1);
  });
  document.addEventListener('click', function (e) {
    go(e.clientX > window.innerWidth / 2 ? i + 1 : i - 1);
  });
  go(0);
</script>
</body>
</html>`
}

export function baixarHtml(nomeArquivo: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}
