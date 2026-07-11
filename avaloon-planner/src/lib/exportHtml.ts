import type { CamadaConfig, Cliente, Plano, PlanoCamada } from './types'

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

function renderValor(v: unknown): string {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return `<p class="txt">${esc(v)}</p>`
  }
  if (Array.isArray(v)) {
    return v
      .map((item) =>
        typeof item === 'object' && item !== null
          ? `<div class="item">${renderObjeto(item as Record<string, unknown>)}</div>`
          : `<p class="txt">• ${esc(item)}</p>`,
      )
      .join('')
  }
  return renderObjeto(v as Record<string, unknown>)
}

function renderObjeto(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(
      ([k, v]) =>
        `<div class="campo"><span class="chave">${esc(k.replace(/_/g, ' '))}</span>${renderValor(v)}</div>`,
    )
    .join('')
}

/**
 * Gera um HTML autocontido (zero dependências externas) no padrão
 * visual Avaloon para apresentação ao vivo ao cliente.
 */
export function gerarHtmlApresentacao(
  cliente: Cliente,
  plano: Plano,
  camadas: PlanoCamada[],
  configs: CamadaConfig[],
): string {
  const configPorCodigo = Object.fromEntries(configs.map((c) => [c.codigo, c]))
  const resumo = (plano.objetivo_marca as Record<string, unknown>)?.resumo_executivo

  const secoes = [...camadas]
    .sort((a, b) => a.ordem - b.ordem)
    .map((camada, i) => {
      const cfg = configPorCodigo[camada.camada_codigo]
      const titulo = cfg?.titulo ?? camada.camada_codigo
      const conteudo = camada.conteudo as Record<string, unknown> | null
      const corpo =
        !conteudo || conteudo.conteudo === null
          ? `<p class="txt vazio">Camada não aplicável neste período.${
              conteudo?.justificativa ? ` ${esc(conteudo.justificativa)}` : ''
            }</p>`
          : renderObjeto(conteudo)
      return `
      <section class="camada">
        <div class="camada-num">0${i + 1}</div>
        <h2>${esc(titulo)}</h2>
        ${corpo}
      </section>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(cliente.nome)} — Plano ${esc(plano.periodo_tipo)} | Avaloon</title>
<style>
  :root { --laranja: #FF5A00; --preto: #111; --cinza: #666; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: var(--preto); background: #fff; line-height: 1.6; }
  .capa { min-height: 100vh; background: var(--preto); color: #fff; display: flex; flex-direction: column; justify-content: center; padding: 8vw; }
  .capa .marca { color: var(--laranja); font-weight: 800; letter-spacing: 0.3em; font-size: 14px; text-transform: uppercase; }
  .capa h1 { font-size: clamp(36px, 7vw, 84px); font-weight: 800; line-height: 1.05; margin: 24px 0 8px; }
  .capa .periodo { font-size: clamp(16px, 2.5vw, 24px); color: #bbb; }
  .capa .barra { width: 120px; height: 8px; background: var(--laranja); margin-top: 40px; }
  .resumo { padding: 8vw; background: var(--laranja); color: #fff; }
  .resumo h2 { font-size: 13px; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 16px; }
  .resumo p { font-size: clamp(20px, 3vw, 32px); font-weight: 600; line-height: 1.35; max-width: 900px; }
  .camada { padding: 6vw 8vw; border-bottom: 1px solid #e5e5e5; }
  .camada-num { color: var(--laranja); font-weight: 800; font-size: 15px; letter-spacing: 0.2em; }
  .camada h2 { font-size: clamp(26px, 4vw, 44px); font-weight: 800; margin: 4px 0 24px; }
  .campo { margin-bottom: 20px; }
  .chave { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: var(--laranja); margin-bottom: 4px; }
  .txt { font-size: 17px; color: #222; max-width: 820px; }
  .txt.vazio { color: var(--cinza); font-style: italic; }
  .item { border-left: 3px solid var(--laranja); padding: 12px 0 4px 16px; margin: 12px 0; }
  .rodape { padding: 6vw 8vw; background: var(--preto); color: #999; font-size: 13px; }
  .rodape strong { color: var(--laranja); }
  @media print { .capa { min-height: auto; padding: 60px; } }
</style>
</head>
<body>
  <div class="capa">
    <div class="marca">Avaloon Marketing</div>
    <h1>${esc(cliente.nome)}</h1>
    <div class="periodo">Plano ${esc(plano.periodo_tipo)} · ${fmtData(plano.periodo_inicio)} a ${fmtData(plano.periodo_fim)}</div>
    <div class="barra"></div>
  </div>
  ${resumo ? `<div class="resumo"><h2>Resumo executivo</h2><p>${esc(resumo)}</p></div>` : ''}
  ${secoes}
  <div class="rodape">
    Plano de campanha elaborado por <strong>Avaloon Marketing</strong> · Montes Claros/MG · ${esc(cliente.segmento)}
  </div>
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
