/**
 * Recorte da foto de perfil.
 *
 * Mostra a foto dentro de um circulo e deixa arrastar para escolher a parte
 * que aparece, e aproximar ou afastar. E o mesmo ajuste que os aplicativos
 * fazem ao trocar a foto.
 *
 * O resultado sai como um quadrado pequeno, e nao a foto original. Sem isso,
 * uma foto de celular sozinha ocuparia todo o espaco do navegador.
 */

import { useEffect, useRef, useState } from 'react'
import { Janela } from './Janela'

/** Lado do circulo de ajuste na tela, em pixels. */
const LADO_VISOR = 230

/** Lado do quadrado final que sera salvo, em pixels. */
const LADO_FINAL = 320

export function RecortadorFoto({
  arquivo,
  aoConfirmar,
  aoCancelar,
}: {
  /** Foto escolhida, como data URL. */
  arquivo: string
  aoConfirmar: (recortada: string) => void
  aoCancelar: () => void
}) {
  const imagem = useRef<HTMLImageElement | null>(null)
  const [pronta, definirPronta] = useState(false)
  const [zoom, definirZoom] = useState(1)
  const [deslocamento, definirDeslocamento] = useState({ x: 0, y: 0 })

  const arrasto = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  // Carrega a foto para saber o tamanho real dela.
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imagem.current = img
      definirZoom(1)
      definirDeslocamento({ x: 0, y: 0 })
      definirPronta(true)
    }
    img.src = arquivo
  }, [arquivo])

  const img = imagem.current

  /**
   * Escala em que a foto cobre o visor por inteiro.
   * A partir dela o zoom so aumenta, entao nunca sobra canto vazio.
   */
  const escalaBase = img ? Math.max(LADO_VISOR / img.width, LADO_VISOR / img.height) : 1
  const escala = escalaBase * zoom
  const larguraExibida = img ? img.width * escala : 0
  const alturaExibida = img ? img.height * escala : 0

  /** Impede arrastar a foto para dentro, o que deixaria borda vazia. */
  function limitar(x: number, y: number) {
    return {
      x: Math.min(0, Math.max(LADO_VISOR - larguraExibida, x)),
      y: Math.min(0, Math.max(LADO_VISOR - alturaExibida, y)),
    }
  }

  // Ao mudar o zoom, o deslocamento e reajustado para nao abrir buraco.
  useEffect(() => {
    if (!pronta) return
    definirDeslocamento((atual) => limitar(atual.x, atual.y))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, pronta])

  /** Centraliza a foto no visor. */
  function centralizar() {
    definirDeslocamento(
      limitar((LADO_VISOR - larguraExibida) / 2, (LADO_VISOR - alturaExibida) / 2),
    )
  }

  useEffect(() => {
    if (pronta) centralizar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronta])

  function confirmar() {
    if (!img) return

    const tela = document.createElement('canvas')
    tela.width = LADO_FINAL
    tela.height = LADO_FINAL

    const pincel = tela.getContext('2d')
    if (!pincel) return

    // O visor tem LADO_VISOR de lado e o resultado tem LADO_FINAL. Este fator
    // leva o que esta na tela para o tamanho final, mantendo o enquadramento.
    const fator = LADO_FINAL / LADO_VISOR

    pincel.fillStyle = '#ffffff'
    pincel.fillRect(0, 0, LADO_FINAL, LADO_FINAL)
    pincel.drawImage(
      img,
      deslocamento.x * fator,
      deslocamento.y * fator,
      larguraExibida * fator,
      alturaExibida * fator,
    )

    aoConfirmar(tela.toDataURL('image/jpeg', 0.85))
  }

  return (
    <Janela titulo="Ajustar a foto" largura={400} aoFechar={aoCancelar}>
      <div className="janela-corpo">
        <p className="recorte-ajuda">
          Arraste a foto para escolher a parte que aparece, e use a barra para aproximar.
        </p>

        <div
          className="recorte-visor"
          style={{ width: LADO_VISOR, height: LADO_VISOR }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            arrasto.current = {
              x: e.clientX,
              y: e.clientY,
              ox: deslocamento.x,
              oy: deslocamento.y,
            }
          }}
          onPointerMove={(e) => {
            const inicio = arrasto.current
            if (!inicio) return
            definirDeslocamento(
              limitar(inicio.ox + (e.clientX - inicio.x), inicio.oy + (e.clientY - inicio.y)),
            )
          }}
          onPointerUp={() => (arrasto.current = null)}
          onPointerCancel={() => (arrasto.current = null)}
        >
          {pronta && (
            <img
              src={arquivo}
              alt="Foto sendo ajustada"
              draggable={false}
              style={{
                width: larguraExibida,
                height: alturaExibida,
                transform: `translate(${deslocamento.x}px, ${deslocamento.y}px)`,
              }}
            />
          )}
        </div>

        <div className="recorte-zoom">
          <span aria-hidden="true">🔍</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            aria-label="Aproximar a foto"
            onChange={(e) => definirZoom(Number(e.target.value))}
          />
          <button className="btn" onClick={centralizar} title="Voltar ao enquadramento do meio">
            Centralizar
          </button>
        </div>

        <div className="janela-rodape">
          <span />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-contorno" onClick={aoCancelar}>
              Cancelar
            </button>
            <button className="btn btn-primario" onClick={confirmar} disabled={!pronta}>
              Usar esta foto
            </button>
          </div>
        </div>
      </div>
    </Janela>
  )
}
