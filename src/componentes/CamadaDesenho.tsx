/**
 * Camada de desenho a mao, por cima da pagina inteira.
 *
 * Nao tem botao de ligar. A caneta de tablet, como a Apple Pencil no iPad,
 * sempre desenha, em qualquer ponto de qualquer pagina. Dedo e mouse continuam
 * funcionando normalmente para escrever, clicar e rolar.
 *
 * Como isso funciona:
 *   - a tela de desenho tem pointer-events none, entao nunca rouba clique
 *   - os eventos sao ouvidos no container da pagina, na fase de captura
 *   - so os eventos de caneta sao interceptados, o resto passa direto
 *
 * Os tracos ficam guardados como vetor na propria pagina, e nao como imagem.
 * Assim o desenho fica nitido em qualquer tela, pesa pouco no arquivo salvo,
 * e da para desfazer traco a traco.
 *
 * As posicoes sao proporcionais a largura da pagina, entao o rabisco acompanha
 * quando a janela muda de tamanho.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TracoDesenho } from '../types'
import { useEspaco } from '../estado/espaco'
import { CORES_CANETA, ESPESSURAS_CANETA } from '../config'

/** Alcance da borracha, em fracao da largura da pagina. */
const ALCANCE_BORRACHA = 0.009

export function CamadaDesenho({ paginaId }: { paginaId: string }) {
  const { espaco, definirDesenhoPagina, modoDesenho, definirModoDesenho } = useEspaco()
  const tracos = espaco.pages[paginaId]?.drawing ?? []

  const tela = useRef<HTMLCanvasElement>(null)
  const [cor, definirCor] = useState(CORES_CANETA[0].valor)
  const [espessura, definirEspessura] = useState(ESPESSURAS_CANETA[1].valor)
  const [borracha, definirBorracha] = useState(false)
  /** A barra de ferramentas so aparece depois que uma caneta e usada. */
  const [temCaneta, definirTemCaneta] = useState(false)

  /** Traco em andamento. Fica em ref para nao redesenhar a arvore a cada ponto. */
  const emCurso = useRef<TracoDesenho | null>(null)
  /** Copias para os ouvintes nativos, que nao enxergam o estado do React. */
  const tracosRef = useRef(tracos)
  tracosRef.current = tracos
  const ajustes = useRef({ cor, espessura, borracha, modoDesenho })
  ajustes.current = { cor, espessura, borracha, modoDesenho }

  /** Redesenha a camada inteira. */
  const redesenhar = useCallback(() => {
    const canvas = tela.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // O canvas precisa da resolucao real da tela, senao o traco sai serrilhado
    // em telas de alta densidade, que e o caso do iPad.
    const densidade = window.devicePixelRatio || 1
    const largura = canvas.clientWidth
    const altura = canvas.clientHeight
    if (largura === 0 || altura === 0) return

    if (canvas.width !== Math.round(largura * densidade)) canvas.width = Math.round(largura * densidade)
    if (canvas.height !== Math.round(altura * densidade)) canvas.height = Math.round(altura * densidade)

    ctx.setTransform(densidade, 0, 0, densidade, 0, 0)
    ctx.clearRect(0, 0, largura, altura)

    for (const traco of tracosRef.current) desenharTraco(ctx, traco, largura)
    if (emCurso.current) desenharTraco(ctx, emCurso.current, largura)
  }, [])

  useEffect(() => {
    redesenhar()
  }, [redesenhar, tracos])

  // Avisa o CSS qual ponteiro mostrar: mira para desenhar, circulo para apagar.
  useEffect(() => {
    const raiz = document.documentElement
    if (modoDesenho && borracha) raiz.dataset.ponteiro = 'borracha'
    else if (modoDesenho) raiz.dataset.ponteiro = 'caneta'
    else delete raiz.dataset.ponteiro

    return () => {
      delete document.documentElement.dataset.ponteiro
    }
  }, [modoDesenho, borracha])

  // A pagina cresce conforme se escreve, entao a camada acompanha o tamanho.
  useEffect(() => {
    const canvas = tela.current
    const container = canvas?.parentElement
    if (!canvas || !container) return

    const observador = new ResizeObserver(() => redesenhar())
    observador.observe(container)
    return () => observador.disconnect()
  }, [redesenhar])

  /**
   * Ouvintes na fase de captura do container da pagina.
   * Ficam em captura de proposito: assim o evento de caneta e interceptado
   * antes de chegar no texto, e a caneta nao vai posicionar o cursor de
   * escrita quando a intencao era rabiscar.
   */
  useEffect(() => {
    const canvas = tela.current
    const container = canvas?.parentElement
    if (!canvas || !container) return

    function posicao(evento: PointerEvent) {
      const caixa = canvas!.getBoundingClientRect()
      // Os dois eixos usam a largura de proposito: assim a proporcao do
      // desenho e mantida, e nao esticada junto com a altura da pagina.
      return {
        x: (evento.clientX - caixa.left) / caixa.width,
        y: (evento.clientY - caixa.top) / caixa.width,
        p: Math.max(0.12, evento.pressure || 0.5),
      }
    }

    /**
     * Quem pode desenhar agora.
     * A caneta de tablet sempre pode, em qualquer momento. Mouse e dedo so
     * quando o modo desenhar esta ligado, senao seria impossivel clicar em
     * qualquer coisa da pagina.
     */
    function aceitaDesenho(evento: PointerEvent): boolean {
      /*
       * A barrinha de ferramentas e os menus ficam dentro do mesmo container
       * que este ouvinte vigia. Sem esta saida, o clique neles era engolido
       * antes de chegar no botao, e desfazer, borracha e apagar nao
       * respondiam durante o desenho.
       */
      const alvo = evento.target as HTMLElement | null
      if (alvo?.closest?.('.caneta-barra, .menu, .cortina, .imagem-solta, .barra-formato')) {
        return false
      }

      if (evento.pointerType === 'pen') return true
      return ajustes.current.modoDesenho
    }

    function apagarPerto(x: number, y: number) {
      const restantes = apagarPedaco(tracosRef.current, x, y, ALCANCE_BORRACHA)
      if (restantes) definirDesenhoPagina(paginaId, restantes)
    }

    function aoEncostar(evento: PointerEvent) {
      if (!aceitaDesenho(evento)) return
      if (evento.pointerType === 'pen') definirTemCaneta(true)
      evento.preventDefault()
      evento.stopPropagation()

      const ponto = posicao(evento)

      if (ajustes.current.borracha) {
        document.body.classList.add('desenhando')
        apagarPerto(ponto.x, ponto.y)
        return
      }

      /*
       * Enquanto o botao esta segurado, o navegador troca o ponteiro pelo de
       * selecionar texto, porque entende que comecou um arrasto de selecao.
       * Marcar o corpo da pagina forca o ponteiro certo ate soltar.
       */
      document.body.classList.add('desenhando')

      emCurso.current = {
        cor: ajustes.current.cor,
        largura: ajustes.current.espessura,
        pontos: [ponto.x, ponto.y, ponto.p],
      }
      redesenhar()
    }

    function aoMover(evento: PointerEvent) {
      if (!aceitaDesenho(evento)) return

      const ponto = posicao(evento)

      if (ajustes.current.borracha) {
        // Apaga so com o botao ou a ponta encostados, nao ao passar por cima.
        if (evento.pressure > 0 || evento.buttons > 0) {
          evento.preventDefault()
          evento.stopPropagation()
          apagarPerto(ponto.x, ponto.y)
        }
        return
      }

      if (!emCurso.current) return
      evento.preventDefault()
      evento.stopPropagation()
      emCurso.current.pontos.push(ponto.x, ponto.y, ponto.p)
      redesenhar()
    }

    function aoSoltar(evento: PointerEvent) {
      document.body.classList.remove('desenhando')
      if (!aceitaDesenho(evento)) return

      const traco = emCurso.current
      emCurso.current = null
      if (!traco || traco.pontos.length < 3) return

      // So aqui o traco entra no espaco. Gravar a cada ponto seria escrita
      // demais, e o salvamento automatico dispararia sem parar.
      definirDesenhoPagina(paginaId, [...tracosRef.current, traco])
    }

    const opcoes = { capture: true, passive: false } as const
    container.addEventListener('pointerdown', aoEncostar, opcoes)
    container.addEventListener('pointermove', aoMover, opcoes)
    container.addEventListener('pointerup', aoSoltar, opcoes)
    container.addEventListener('pointercancel', aoSoltar, opcoes)

    return () => {
      container.removeEventListener('pointerdown', aoEncostar, opcoes)
      container.removeEventListener('pointermove', aoMover, opcoes)
      container.removeEventListener('pointerup', aoSoltar, opcoes)
      container.removeEventListener('pointercancel', aoSoltar, opcoes)
    }
  }, [paginaId, definirDesenhoPagina, redesenhar])

  return (
    <>
      <canvas ref={tela} className="camada-desenho" />

      {/* A barra so aparece depois do primeiro traco de caneta, ou quando a
          pagina ja tem rabiscos, para nao poluir a tela de quem usa mouse. */}
      {(temCaneta || modoDesenho || tracos.length > 0) && (
        <div className="caneta-barra" data-modo={modoDesenho || undefined}>
          {modoDesenho && (
            <>
              <button
                className="btn btn-primario"
                title="Sair do modo desenhar e voltar a escrever"
                onClick={() => definirModoDesenho(false)}
              >
                Concluir
              </button>
              <span className="caneta-divisor" />
            </>
          )}

          <button
            className="btn-icone caneta-borracha"
            data-ativo={borracha || undefined}
            title={
              borracha
                ? 'Borracha ligada. Passe a caneta por cima do traco para apaga lo'
                : 'Borracha. Ligue e passe a caneta por cima do que quer apagar'
            }
            aria-label="Borracha"
            aria-pressed={borracha}
            onClick={() => definirBorracha((v) => !v)}
          >
            🧽
          </button>

          <span className="caneta-divisor" />

          <div className="caneta-cores">
            {CORES_CANETA.map((opcao) => (
              <button
                key={opcao.valor}
                style={{ background: opcao.valor }}
                data-ativo={!borracha && cor === opcao.valor ? 'true' : undefined}
                title={opcao.nome}
                aria-label={`Cor ${opcao.nome}`}
                onClick={() => {
                  definirCor(opcao.valor)
                  definirBorracha(false)
                }}
              />
            ))}
          </div>

          <div className="segmentos">
            {ESPESSURAS_CANETA.map((opcao) => (
              <button
                key={opcao.valor}
                data-ativo={espessura === opcao.valor || undefined}
                title={`Espessura ${opcao.nome.toLowerCase()}`}
                onClick={() => definirEspessura(opcao.valor)}
              >
                <span className="amostra" style={{ height: opcao.valor + 1 }} />
              </button>
            ))}
          </div>

          <span className="caneta-divisor" />

          <button
            className="btn-icone"
            title="Desfazer o ultimo traco"
            aria-label="Desfazer o ultimo traco"
            disabled={tracos.length === 0}
            onClick={() => definirDesenhoPagina(paginaId, tracos.slice(0, -1))}
          >
            ↩
          </button>

          <button
            className="btn-icone"
            title="Apagar todos os rabiscos desta pagina"
            aria-label="Apagar todos os rabiscos"
            disabled={tracos.length === 0}
            onClick={() => {
              if (tracos.length && window.confirm('Apagar todos os rabiscos desta pagina?')) {
                definirDesenhoPagina(paginaId, [])
              }
            }}
          >
            🗑
          </button>
        </div>
      )}
    </>
  )
}

/** Desenha um traco no canvas. */
function desenharTraco(ctx: CanvasRenderingContext2D, traco: TracoDesenho, largura: number) {
  const p = traco.pontos
  ctx.strokeStyle = traco.cor
  ctx.fillStyle = traco.cor
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Toque unico vira um pingo redondo, senao nao apareceria nada.
  if (p.length <= 3) {
    ctx.beginPath()
    ctx.arc(p[0] * largura, p[1] * largura, (traco.largura * (p[2] || 0.5)) / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  // Cada trecho usa a pressao daquele ponto. E isso que da o efeito de escrita
  // a mao, mais fino no comeco e no fim do traco.
  for (let i = 3; i < p.length; i += 3) {
    ctx.beginPath()
    ctx.lineWidth = traco.largura * (p[i + 2] || 0.5) * 2
    ctx.moveTo(p[i - 3] * largura, p[i - 2] * largura)
    ctx.lineTo(p[i] * largura, p[i + 1] * largura)
    ctx.stroke()
  }
}

/**
 * Apaga so o pedaco que a borracha encostou, e nao o traco inteiro.
 *
 * Cada traco e percorrido ponto a ponto. Os pontos dentro do alcance somem, e
 * o que sobra de cada lado vira um traco separado. E por isso que apagar o
 * meio de uma linha deixa as duas pontas no lugar.
 *
 * Devolve a lista nova, ou null quando a borracha nao encostou em nada, para
 * nao gravar a toa.
 */
function apagarPedaco(
  tracos: TracoDesenho[],
  x: number,
  y: number,
  alcance: number,
): TracoDesenho[] | null {
  const alcanceAoQuadrado = alcance * alcance
  const saida: TracoDesenho[] = []
  let encostou = false

  for (const traco of tracos) {
    const pontos = traco.pontos
    const pedacos: number[][] = []
    let atual: number[] = []

    for (let i = 0; i < pontos.length; i += 3) {
      const dx = pontos[i] - x
      const dy = pontos[i + 1] - y

      if (dx * dx + dy * dy <= alcanceAoQuadrado) {
        encostou = true
        // Um ponto sozinho nao desenha linha, entao pedaco curto e descartado.
        if (atual.length >= 6) pedacos.push(atual)
        atual = []
      } else {
        atual.push(pontos[i], pontos[i + 1], pontos[i + 2])
      }
    }

    if (atual.length >= 6) pedacos.push(atual)

    // Traco intocado entra inteiro, sem virar copia.
    if (pedacos.length === 1 && pedacos[0].length === pontos.length) saida.push(traco)
    else for (const pedaco of pedacos) saida.push({ ...traco, pontos: pedaco })
  }

  return encostou ? saida : null
}
