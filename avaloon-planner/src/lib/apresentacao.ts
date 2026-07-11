import type { CamadaConfig, Cliente, Plano, PlanoCamada } from './types'

// ------------------------------------------------------------
// Marca do cliente (bloco 'marca' do dossiê) aplicada ao deck.
// Campos ausentes caem no padrão Avaloon (laranja/preto).
// ------------------------------------------------------------
export interface MarcaCliente {
  logo_url?: string
  cor_primaria?: string
  cor_secundaria?: string
  cor_escura?: string
  tipografia?: string
}

const PADRAO = {
  primaria: '#FF5A00',
  secundaria: '#FFB380',
  escura: '#111111',
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

const NOME_PERIODO: Record<string, string> = {
  mensal: 'Plano mensal',
  trimestral: 'Plano trimestral',
  semestral: 'Plano semestral',
}

// ------------------------------------------------------------
// Renderização do conteúdo das camadas
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
      <div class="acao-meta">${[a.responsavel, a.cadencia].filter(Boolean).map(esc).join(' · ')}</div>
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

  const conceitoSlide = `
  <section class="slide">
    <div class="tag">Camada 0${numero}</div>
    <h2>${esc(titulo)}</h2>
    ${diagnostico ? `<p class="diagnostico">${esc(diagnostico)}</p>` : ''}
    ${conceito ? `<p class="conceito">${esc(conceito)}</p>` : ''}
  </section>`

  const acoesSlide =
    acoes.length > 0
      ? `
  <section class="slide">
    <div class="tag">Camada 0${numero} · ${esc(titulo)}</div>
    <h2>O que vamos fazer</h2>
    ${renderAcoes(acoes)}
    ${observacoes ? `<p class="obs">${esc(observacoes)}</p>` : ''}
  </section>`
      : ''

  const metasSlide =
    metas.length > 0
      ? `
  <section class="slide">
    <div class="tag">Camada 0${numero} · ${esc(titulo)}</div>
    <h2>Como vamos medir</h2>
    ${renderMetas(metas)}
  </section>`
      : ''

  return conceitoSlide + acoesSlide + metasSlide
}

// ------------------------------------------------------------
// Deck completo: HTML autocontido, navegável por teclado/clique,
// imprimível (cada slide = uma página). Estrutura padrão Avaloon,
// cores e logo do cliente quando existem no dossiê.
// ------------------------------------------------------------
export function gerarApresentacao(
  cliente: Cliente,
  plano: Plano,
  camadas: PlanoCamada[],
  configs: CamadaConfig[],
  marca: Record<string, unknown>,
): string {
  const primaria = hexValido(marca.cor_primaria) ?? PADRAO.primaria
  const secundaria = hexValido(marca.cor_secundaria) ?? PADRAO.secundaria
  const escura = hexValido(marca.cor_escura) ?? PADRAO.escura
  const logoUrl = urlSegura(marca.logo_url)

  const configPorCodigo = Object.fromEntries(configs.map((c) => [c.codigo, c]))
  const objPerf = plano.objetivo_performance as Record<string, unknown>
  const objMarca = plano.objetivo_marca as Record<string, unknown>
  const resumo = typeof objMarca?.resumo_executivo === 'string' ? objMarca.resumo_executivo : ''

  const marcaVisual = logoUrl
    ? `<img class="logo-cliente" src="${esc(logoUrl)}" alt="${esc(cliente.nome)}" onerror="this.outerHTML='<div class=nome-cliente>${esc(cliente.nome)}</div>'">`
    : `<div class="nome-cliente">${esc(cliente.nome)}</div>`

  const cardObjetivo = (
    rotulo: string,
    descricao: unknown,
    destaque: unknown,
    destaqueRotulo: string,
  ) =>
    descricao || destaque
      ? `
    <div class="obj-card">
      <div class="obj-tipo">${rotulo}</div>
      <div class="obj-desc">${esc(descricao)}</div>
      ${destaque ? `<div class="obj-meta"><span>${destaqueRotulo}</span>${esc(destaque)}</div>` : ''}
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
<title>${esc(cliente.nome)} — ${NOME_PERIODO[plano.periodo_tipo] ?? 'Plano'} | Avaloon</title>
<style>
  :root {
    --primaria: ${primaria};
    --secundaria: ${secundaria};
    --escura: ${escura};
    --branco: #ffffff;
    --cinza: #8a8a8a;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: #000; color: var(--branco); overflow: hidden;
  }
  .slide {
    display: none; position: fixed; inset: 0;
    flex-direction: column; justify-content: center;
    padding: 7vh 8vw; background: var(--escura);
  }
  .slide.ativa { display: flex; }
  .tag {
    color: var(--primaria); font-size: clamp(11px, 1.4vw, 14px); font-weight: 800;
    letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 2vh;
  }
  h1 { font-size: clamp(34px, 6.5vw, 88px); font-weight: 800; line-height: 1.04; }
  h2 { font-size: clamp(26px, 4.2vw, 56px); font-weight: 800; line-height: 1.08; margin-bottom: 3.5vh; }
  .diagnostico {
    font-size: clamp(15px, 1.8vw, 22px); color: #c9c9c9;
    max-width: 62ch; margin-bottom: 3vh;
  }
  .conceito {
    font-size: clamp(20px, 2.8vw, 36px); font-weight: 700; line-height: 1.25;
    max-width: 50ch; border-left: 6px solid var(--primaria); padding-left: 24px;
  }
  .obs { margin-top: 3vh; font-size: clamp(12px, 1.4vw, 15px); color: var(--cinza); max-width: 70ch; }

  /* Capa */
  .capa { background: var(--escura); }
  .capa .barra { width: 110px; height: 8px; background: var(--primaria); margin-bottom: 4vh; }
  .logo-cliente { max-height: 11vh; max-width: 40vw; object-fit: contain; align-self: flex-start; margin-bottom: 4vh; }
  .nome-cliente { font-size: clamp(20px, 2.6vw, 32px); font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--secundaria); margin-bottom: 4vh; }
  .capa .periodo { font-size: clamp(15px, 2vw, 24px); color: #bdbdbd; margin-top: 1.5vh; }
  .assinatura { position: absolute; bottom: 6vh; left: 8vw; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--cinza); }
  .assinatura b { color: var(--primaria); }

  /* Objetivos */
  .objetivos { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2.5vw; }
  .obj-card { background: rgba(255,255,255,0.05); border-top: 6px solid var(--primaria); padding: 3.2vh 2.2vw; border-radius: 6px; }
  .obj-card:nth-child(2) { border-top-color: var(--secundaria); }
  .obj-tipo { font-size: 12px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; color: var(--cinza); margin-bottom: 1.4vh; }
  .obj-desc { font-size: clamp(16px, 2vw, 24px); font-weight: 600; line-height: 1.3; margin-bottom: 2.2vh; }
  .obj-meta { font-size: clamp(24px, 3.4vw, 46px); font-weight: 800; color: var(--primaria); line-height: 1.1; }
  .obj-meta span { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--cinza); margin-bottom: 0.6vh; }

  /* Resumo */
  .resumo-txt { font-size: clamp(19px, 2.6vw, 34px); font-weight: 600; line-height: 1.35; max-width: 55ch; }

  /* Ações */
  .acoes { display: flex; flex-direction: column; gap: 1.6vh; max-height: 62vh; overflow: auto; }
  .acao { border-left: 4px solid var(--primaria); padding: 0.6vh 0 0.6vh 1.6vw; }
  .acao-titulo { font-size: clamp(15px, 1.9vw, 23px); font-weight: 700; }
  .acao-desc { font-size: clamp(13px, 1.5vw, 17px); color: #c9c9c9; max-width: 75ch; }
  .acao-meta { font-size: clamp(11px, 1.2vw, 13px); color: var(--secundaria); font-weight: 600; margin-top: 0.4vh; text-transform: uppercase; letter-spacing: 0.08em; }

  /* Metas */
  .metas { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.8vw; max-height: 62vh; overflow: auto; }
  .meta-card { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 2.4vh 1.6vw; }
  .meta-indicador { font-size: clamp(12px, 1.4vw, 15px); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--cinza); margin-bottom: 1vh; }
  .meta-valor { font-size: clamp(22px, 3vw, 40px); font-weight: 800; color: var(--primaria); line-height: 1.1; }
  .meta-base { font-size: clamp(11px, 1.2vw, 13px); color: var(--cinza); margin-top: 0.8vh; }

  /* Encerramento */
  .final { background: var(--primaria); }
  .final h1 { color: var(--branco); }
  .final .assinatura, .final .tag { color: rgba(255,255,255,0.75); }
  .final .assinatura b { color: var(--branco); }

  /* Navegação */
  #nav {
    position: fixed; bottom: 18px; right: 22px; z-index: 10;
    font-size: 12px; font-weight: 700; color: var(--cinza); letter-spacing: 0.1em;
    user-select: none;
  }
  @media print {
    body { overflow: visible; background: var(--escura); }
    .slide { display: flex; position: relative; inset: auto; height: 100vh; page-break-after: always; }
    #nav { display: none; }
  }
</style>
</head>
<body>

<section class="slide capa ativa">
  <div class="barra"></div>
  ${marcaVisual}
  <h1>${esc(NOME_PERIODO[plano.periodo_tipo] ?? 'Plano de campanha')}</h1>
  <div class="periodo">${fmtData(plano.periodo_inicio)} — ${fmtData(plano.periodo_fim)} · ${esc(cliente.cidade)}</div>
  <div class="assinatura">planejamento <b>Avaloon</b> Marketing</div>
</section>

<section class="slide">
  <div class="tag">Para onde vamos</div>
  <h2>Objetivos do período</h2>
  <div class="objetivos">
    ${cardObjetivo('Performance', objPerf?.descricao, objPerf?.meta, 'meta')}
    ${cardObjetivo('Marca', objMarca?.descricao, objMarca?.indicador, 'indicador')}
  </div>
</section>

${resumo ? `
<section class="slide">
  <div class="tag">Resumo executivo</div>
  <p class="resumo-txt">${esc(resumo)}</p>
</section>` : ''}

${slidesCamadas}

<section class="slide final">
  <div class="tag">Próximo passo</div>
  <h1>Vamos executar.</h1>
  <div class="assinatura">planejamento <b>Avaloon</b> Marketing · Montes Claros/MG</div>
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
