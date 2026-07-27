/**
 * Painel flutuante para escolher a categoria ou a situacao de uma pagina.
 * Abre ancorado na etiqueta que foi clicada, no topo da pagina.
 */

import { useEffect, useRef } from 'react'
import type { CategoriaTarefa, StatusTarefa } from '../types'
import { STATUS_TAREFA } from '../calendario'

export function PainelPropriedade({
  tipo,
  x,
  y,
  categorias,
  categoriaAtual,
  statusAtual,
  aoEscolherCategoria,
  aoEscolherStatus,
  aoGerenciarCategorias,
  aoFechar,
}: {
  tipo: 'categoria' | 'status'
  x: number
  y: number
  categorias: CategoriaTarefa[]
  categoriaAtual: string | undefined
  statusAtual: StatusTarefa | undefined
  aoEscolherCategoria: (id: string | undefined) => void
  aoEscolherStatus: (status: StatusTarefa | undefined) => void
  aoGerenciarCategorias: () => void
  aoFechar: () => void
}) {
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function aoClicar(evento: MouseEvent) {
      if (!caixa.current?.contains(evento.target as Node)) aoFechar()
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') aoFechar()
    }
    const t = window.setTimeout(() => document.addEventListener('mousedown', aoClicar))
    document.addEventListener('keydown', aoTeclar)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aoFechar])

  const topo = Math.max(8, Math.min(y, window.innerHeight - 330))
  const esquerda = Math.max(8, Math.min(x, window.innerWidth - 260))

  return (
    <div className="menu" ref={caixa} style={{ top: topo, left: esquerda, minWidth: 240 }}>
      {tipo === 'categoria' ? (
        <>
          <div className="menu-grupo">Categoria</div>

          <button className="menu-item" onClick={() => aoEscolherCategoria(undefined)}>
            <span className="glifo">○</span>
            <span className="rotulo">Sem categoria</span>
          </button>

          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              className="menu-item"
              data-marcado={categoriaAtual === categoria.id || undefined}
              onClick={() => aoEscolherCategoria(categoria.id)}
            >
              <span className="glifo" style={{ borderColor: categoria.cor }}>
                <span className="ponto" style={{ background: categoria.cor }} />
              </span>
              <span className="rotulo">{categoria.nome}</span>
            </button>
          ))}

          {categorias.length === 0 && (
            <div className="menu-vazio" style={{ padding: '14px 12px' }}>
              Nenhuma categoria criada ainda.
            </div>
          )}

          <div className="menu-separador" />

          <button className="menu-item" onClick={aoGerenciarCategorias}>
            <span className="glifo">⚙</span>
            <span className="rotulo">Gerenciar categorias</span>
          </button>
        </>
      ) : (
        <>
          <div className="menu-grupo">Situacao</div>

          <button className="menu-item" onClick={() => aoEscolherStatus(undefined)}>
            <span className="glifo">○</span>
            <span className="rotulo">Sem situacao</span>
          </button>

          {STATUS_TAREFA.map((definicao) => (
            <button
              key={definicao.id}
              className="menu-item"
              data-marcado={statusAtual === definicao.id || undefined}
              onClick={() => aoEscolherStatus(definicao.id)}
            >
              <span className="glifo" style={{ borderColor: definicao.cor }}>
                <span className="ponto" style={{ background: definicao.cor }} />
              </span>
              <span className="rotulo">{definicao.nome}</span>
            </button>
          ))}
        </>
      )}
    </div>
  )
}
