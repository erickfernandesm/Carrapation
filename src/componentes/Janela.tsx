/** Janela sobreposta usada pelo perfil, pelas configuracoes e pela busca. */

import { useEffect, type ReactNode } from 'react'

export function Janela({
  titulo,
  aoFechar,
  largura,
  children,
}: {
  titulo?: string
  aoFechar: () => void
  largura?: number
  children: ReactNode
}) {
  // Esc fecha a janela.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.stopPropagation()
        aoFechar()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aoFechar])

  return (
    <div className="cortina" onMouseDown={aoFechar} role="presentation">
      <div
        className="janela"
        style={largura ? { maxWidth: largura } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        {titulo && (
          <div className="janela-topo">
            <h2>{titulo}</h2>
            <button className="btn-icone" onClick={aoFechar} title="Fechar" aria-label="Fechar">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
