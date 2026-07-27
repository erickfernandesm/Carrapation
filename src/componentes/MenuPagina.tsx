/** Menu de opcoes de uma pagina: favoritar, duplicar, mover para a raiz e excluir. */

import { useEffect, useRef } from 'react'
import { useEspaco } from '../estado/espaco'
import { descricaoDaSituacao } from '../lib/tarefas'

export function MenuPagina({
  paginaId,
  x,
  y,
  aoFechar,
}: {
  paginaId: string
  x: number
  y: number
  aoFechar: () => void
}) {
  const {
    espaco,
    alternarFavorito,
    alternarTarefaFinalizada,
    duplicarPagina,
    excluirPagina,
    moverPagina,
    tarefasPorPagina,
  } = useEspaco()

  const pagina = espaco.pages[paginaId]
  // Preenchido apenas quando esta pagina e uma tarefa de algum calendario.
  const tarefa = tarefasPorPagina[paginaId]
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function aoClicar(evento: MouseEvent) {
      if (!caixa.current?.contains(evento.target as Node)) aoFechar()
    }
    const t = window.setTimeout(() => document.addEventListener('mousedown', aoClicar))
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', aoClicar)
    }
  }, [aoFechar])

  if (!pagina) return null

  const topo = Math.min(y, window.innerHeight - (tarefa ? 300 : 230))

  return (
    <div className="menu" ref={caixa} style={{ top: Math.max(8, topo), left: Math.max(8, x), minWidth: 210 }}>
      {/* Paginas que sao tarefa de calendario podem ser finalizadas daqui,
          sem precisar abrir o calendario. */}
      {tarefa && (
        <>
          <button
            className="menu-item"
            onClick={() => {
              alternarTarefaFinalizada(paginaId)
              aoFechar()
            }}
          >
            <span className="glifo">{tarefa.feito ? '↺' : '✓'}</span>
            <span>
              <span className="rotulo">
                {tarefa.feito ? 'Desmarcar finalizada' : 'Marcar como finalizada'}
              </span>
              <br />
              <span className="descricao">{descricaoDaSituacao(tarefa)}</span>
            </span>
          </button>
          <div className="menu-separador" />
        </>
      )}

      <button
        className="menu-item"
        onClick={() => {
          alternarFavorito(paginaId)
          aoFechar()
        }}
      >
        <span className="glifo">{pagina.favorite ? '☆' : '★'}</span>
        <span className="rotulo">{pagina.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</span>
      </button>

      <button
        className="menu-item"
        onClick={() => {
          duplicarPagina(paginaId)
          aoFechar()
        }}
      >
        <span className="glifo">⧉</span>
        <span className="rotulo">Duplicar</span>
      </button>

      {pagina.parentId && (
        <button
          className="menu-item"
          onClick={() => {
            moverPagina(paginaId, null)
            aoFechar()
          }}
        >
          <span className="glifo">↥</span>
          <span className="rotulo">Mover para o primeiro nivel</span>
        </button>
      )}

      <div className="menu-separador" />

      <button
        className="menu-item"
        onClick={() => {
          const quantasFilhas = pagina.childIds.length
          const aviso = quantasFilhas
            ? `Excluir "${pagina.title || 'Sem titulo'}" e as ${quantasFilhas} subpaginas dela?`
            : `Excluir "${pagina.title || 'Sem titulo'}"?`
          if (window.confirm(aviso)) excluirPagina(paginaId)
          aoFechar()
        }}
      >
        <span className="glifo" style={{ color: '#d4443a' }}>
          🗑
        </span>
        <span className="rotulo" style={{ color: '#d4443a' }}>
          Excluir
        </span>
      </button>
    </div>
  )
}
