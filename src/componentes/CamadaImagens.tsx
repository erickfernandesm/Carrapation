/**
 * Imagens soltas por cima da pagina.
 *
 * Elas ficam numa camada propria, fora do fluxo do texto. Por isso nao
 * empurram paragrafo, nao quebram linha e nao atrapalham a escrita: da para
 * continuar digitando normalmente com a imagem por cima.
 *
 * A camada inteira nao recebe clique. Só as imagens recebem, e mesmo assim so
 * na hora de arrastar ou redimensionar. Assim clicar no texto que esta atras
 * continua funcionando em todo o resto da pagina.
 */

import { useEffect, useRef, useState } from 'react'
import type { ImagemSolta } from '../types'
import { useEspaco } from '../estado/espaco'

/** Largura minima de uma imagem, em fracao da largura da pagina. */
const LARGURA_MINIMA = 0.06

export function CamadaImagens({ paginaId }: { paginaId: string }) {
  const { espaco, definirImagensPagina } = useEspaco()
  const imagens = espaco.pages[paginaId]?.imagens ?? []

  const camada = useRef<HTMLDivElement>(null)
  const [selecionada, definirSelecionada] = useState<string | null>(null)
  /** Estado ao vivo do arrasto, para nao gravar no espaco a cada movimento. */
  const [previa, definirPrevia] = useState<ImagemSolta | null>(null)

  // Clicar fora tira a selecao, e com ela as alcinhas e a barra.
  useEffect(() => {
    if (!selecionada) return
    function aoClicar(evento: MouseEvent) {
      const alvo = evento.target as HTMLElement
      if (!alvo.closest('.imagem-solta')) definirSelecionada(null)
    }
    const t = window.setTimeout(() => document.addEventListener('mousedown', aoClicar))
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', aoClicar)
    }
  }, [selecionada])

  function gravar(nova: ImagemSolta) {
    definirImagensPagina(
      paginaId,
      imagens.map((i) => (i.id === nova.id ? nova : i)),
    )
  }

  function remover(id: string) {
    definirImagensPagina(paginaId, imagens.filter((i) => i.id !== id))
    definirSelecionada(null)
  }

  /** Arrastar move, e a alcinha do canto redimensiona. */
  function iniciar(evento: React.PointerEvent, imagem: ImagemSolta, modo: 'mover' | 'tamanho') {
    evento.preventDefault()
    evento.stopPropagation()
    definirSelecionada(imagem.id)

    const largura = camada.current?.getBoundingClientRect().width ?? 1
    const xInicial = evento.clientX
    const yInicial = evento.clientY
    let atual = imagem

    function aoMover(mover: PointerEvent) {
      const deltaX = (mover.clientX - xInicial) / largura
      const deltaY = mover.clientY - yInicial

      atual =
        modo === 'mover'
          ? { ...imagem, x: imagem.x + deltaX, y: imagem.y + deltaY }
          : { ...imagem, largura: Math.max(LARGURA_MINIMA, imagem.largura + deltaX) }

      definirPrevia(atual)
    }

    function aoSoltar() {
      window.removeEventListener('pointermove', aoMover)
      window.removeEventListener('pointerup', aoSoltar)
      document.body.classList.remove('arrastando-imagem')
      definirPrevia(null)
      // So aqui a posicao entra no espaco. Gravar a cada movimento do mouse
      // dispararia o salvamento automatico sem parar.
      gravar(atual)
    }

    document.body.classList.add('arrastando-imagem')
    window.addEventListener('pointermove', aoMover)
    window.addEventListener('pointerup', aoSoltar)
  }

  return (
    <div className="camada-imagens" ref={camada}>
      {imagens.map((guardada) => {
        // Enquanto arrasta, vale a previa; parado, vale o que esta guardado.
        const imagem = previa?.id === guardada.id ? previa : guardada
        const ativa = selecionada === imagem.id

        return (
          <div
            key={imagem.id}
            className="imagem-solta"
            data-ativa={ativa || undefined}
            style={{
              left: `${imagem.x * 100}%`,
              top: imagem.y,
              width: `${imagem.largura * 100}%`,
            }}
            onPointerDown={(e) => iniciar(e, imagem, 'mover')}
          >
            <img src={imagem.src} alt="" draggable={false} />

            {ativa && (
              <>
                <span
                  className="imagem-solta-canto"
                  title="Arraste para redimensionar"
                  onPointerDown={(e) => iniciar(e, imagem, 'tamanho')}
                />
                <button
                  className="imagem-solta-tirar"
                  title="Remover esta imagem"
                  aria-label="Remover imagem"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => remover(imagem.id)}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
