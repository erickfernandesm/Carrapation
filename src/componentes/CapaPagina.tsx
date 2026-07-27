/**
 * Capa da pagina: a faixa larga acima do titulo.
 *
 * A capa aceita tres formas, guardadas todas no mesmo campo:
 *   - um degrade em CSS, escolhido entre as capas prontas
 *   - uma imagem enviada do computador, embutida como data URL
 *   - um endereco de imagem da internet
 *
 * Enquanto o modo de reposicionar esta ligado, arrastar para cima e para baixo
 * muda qual parte da foto fica visivel.
 */

import { useEffect, useRef, useState } from 'react'
import type { Page } from '../types'
import { useEspaco } from '../estado/espaco'
import { capaEhDegrade } from '../lib/pagina'
import { escolherArquivo, lerComoDataUrl, emMegabytes } from '../lib/arquivo'
import { CAPAS_PRONTAS, LIMITE_CAPA_MB } from '../config'

export function CapaPagina({ pagina }: { pagina: Page }) {
  const { definirCapaPagina, definirPosicaoCapa } = useEspaco()

  const [menuAberto, definirMenuAberto] = useState(false)
  const [reposicionando, definirReposicionando] = useState(false)
  const [erro, definirErro] = useState<string | null>(null)

  const posicaoOriginal = useRef(pagina.coverPos ?? 50)
  const arrasto = useRef<{ yInicial: number; posInicial: number } | null>(null)

  const capa = pagina.cover
  const posicao = pagina.coverPos ?? 50

  // Enquanto reposiciona, o mouse e acompanhado na janela inteira.
  useEffect(() => {
    if (!reposicionando) return

    function aoMover(evento: MouseEvent) {
      if (!arrasto.current) return
      const deslocamento = evento.clientY - arrasto.current.yInicial
      // Cada 3 pixels de arrasto muda 1 ponto da posicao. Fica mais controlavel.
      definirPosicaoCapa(pagina.id, arrasto.current.posInicial - deslocamento / 3)
    }
    function aoSoltar() {
      arrasto.current = null
    }

    window.addEventListener('mousemove', aoMover)
    window.addEventListener('mouseup', aoSoltar)
    return () => {
      window.removeEventListener('mousemove', aoMover)
      window.removeEventListener('mouseup', aoSoltar)
    }
  }, [reposicionando, pagina.id, definirPosicaoCapa])

  if (!capa) return null

  async function enviarDoComputador() {
    definirErro(null)
    const arquivo = await escolherArquivo('image/*')
    if (!arquivo) return

    if (emMegabytes(arquivo.size) > LIMITE_CAPA_MB) {
      definirErro(`A imagem tem ${emMegabytes(arquivo.size).toFixed(1)} MB. O limite e ${LIMITE_CAPA_MB} MB.`)
      return
    }

    definirCapaPagina(pagina.id, await lerComoDataUrl(arquivo))
    definirMenuAberto(false)
  }

  function usarEndereco() {
    const endereco = window.prompt('Cole o endereco da imagem:')
    if (endereco) {
      definirCapaPagina(pagina.id, endereco.trim())
      definirMenuAberto(false)
    }
  }

  const estilo = capaEhDegrade(capa)
    ? { background: capa }
    : {
        backgroundImage: `url(${JSON.stringify(capa)})`,
        backgroundSize: 'cover',
        backgroundPosition: `center ${posicao}%`,
      }

  return (
    <div className="capa" data-reposicionando={reposicionando || undefined}>
      <div
        className="capa-imagem"
        style={estilo}
        onMouseDown={(evento) => {
          if (!reposicionando) return
          arrasto.current = { yInicial: evento.clientY, posInicial: posicao }
        }}
      />

      {reposicionando ? (
        <div className="capa-acoes" data-sempre="true">
          <span className="capa-dica">Arraste a imagem para cima ou para baixo</span>
          <button
            className="btn btn-contorno"
            onClick={() => {
              definirPosicaoCapa(pagina.id, posicaoOriginal.current)
              definirReposicionando(false)
            }}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primario"
            onClick={() => {
              posicaoOriginal.current = posicao
              definirReposicionando(false)
            }}
          >
            Salvar posicao
          </button>
        </div>
      ) : (
        <div className="capa-acoes">
          <div style={{ position: 'relative' }}>
            <button className="btn btn-capa" onClick={() => definirMenuAberto((v) => !v)}>
              Trocar capa
            </button>

            {menuAberto && (
              <div className="capa-menu">
                {erro && <div className="aviso-erro">{erro}</div>}

                <div className="menu-grupo">Capas prontas</div>
                <div className="capa-opcoes">
                  {CAPAS_PRONTAS.map((opcao) => (
                    <button
                      key={opcao.nome}
                      style={{ background: opcao.valor }}
                      title={opcao.nome}
                      aria-label={`Capa ${opcao.nome}`}
                      data-ativa={capa === opcao.valor || undefined}
                      onClick={() => {
                        definirCapaPagina(pagina.id, opcao.valor)
                        definirMenuAberto(false)
                      }}
                    />
                  ))}
                </div>

                <div className="menu-separador" />

                <button className="menu-item" onClick={enviarDoComputador}>
                  <span className="glifo">⬆</span>
                  <span className="rotulo">Enviar do computador</span>
                </button>
                <button className="menu-item" onClick={usarEndereco}>
                  <span className="glifo">🔗</span>
                  <span className="rotulo">Usar um endereco</span>
                </button>
              </div>
            )}
          </div>

          {!capaEhDegrade(capa) && (
            <button
              className="btn btn-capa"
              onClick={() => {
                posicaoOriginal.current = posicao
                definirReposicionando(true)
                definirMenuAberto(false)
              }}
            >
              Reposicionar
            </button>
          )}

          <button
            className="btn btn-capa"
            onClick={() => {
              definirCapaPagina(pagina.id, null)
              definirMenuAberto(false)
            }}
          >
            Remover
          </button>
        </div>
      )}
    </div>
  )
}
