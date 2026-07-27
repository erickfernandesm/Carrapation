/**
 * Botao de criar pagina, com o menu de modelos.
 *
 * Existe em varios lugares (barra lateral, arvore, tela vazia, fim da pagina),
 * entao ele carrega o proprio menu junto e cada lugar so escolhe a aparencia.
 * A lista de modelos vem de src/modelos.ts.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useEspaco } from '../estado/espaco'
import { MODELOS } from '../modelos'

export function BotaoNovaPagina({
  paiId = null,
  className = 'btn',
  titulo,
  children,
}: {
  /** null cria no primeiro nivel, um id cria como subpagina daquela pagina. */
  paiId?: string | null
  className?: string
  titulo?: string
  children: ReactNode
}) {
  const { criarPagina } = useEspaco()
  const [menu, definirMenu] = useState<{ x: number; y: number } | null>(null)

  return (
    <>
      <button
        className={className}
        title={titulo}
        onClick={(evento) => {
          evento.stopPropagation()
          const caixa = evento.currentTarget.getBoundingClientRect()
          definirMenu({ x: caixa.left, y: caixa.bottom + 6 })
        }}
      >
        {children}
      </button>

      {menu && (
        <MenuModelos
          x={menu.x}
          y={menu.y}
          aoEscolher={(modeloId) => {
            criarPagina(paiId, modeloId)
            definirMenu(null)
          }}
          aoFechar={() => definirMenu(null)}
        />
      )}
    </>
  )
}

/** O menu em si, com uma linha por modelo. */
export function MenuModelos({
  x,
  y,
  aoEscolher,
  aoFechar,
}: {
  x: number
  y: number
  aoEscolher: (modeloId: string) => void
  aoFechar: () => void
}) {
  const caixa = useRef<HTMLDivElement>(null)
  const [marcado, definirMarcado] = useState(0)

  useEffect(() => {
    function aoClicar(evento: MouseEvent) {
      if (!caixa.current?.contains(evento.target as Node)) aoFechar()
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        aoFechar()
      } else if (evento.key === 'ArrowDown') {
        evento.preventDefault()
        definirMarcado((i) => (i + 1) % MODELOS.length)
      } else if (evento.key === 'ArrowUp') {
        evento.preventDefault()
        definirMarcado((i) => (i - 1 + MODELOS.length) % MODELOS.length)
      } else if (evento.key === 'Enter') {
        evento.preventDefault()
        aoEscolher(MODELOS[marcado].id)
      }
    }
    const t = window.setTimeout(() => document.addEventListener('mousedown', aoClicar))
    document.addEventListener('keydown', aoTeclar)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aoFechar, aoEscolher, marcado])

  const altura = 70 + MODELOS.length * 48
  const topo = Math.max(8, Math.min(y, window.innerHeight - altura - 8))
  const esquerda = Math.max(8, Math.min(x, window.innerWidth - 290))

  return (
    <div className="menu" ref={caixa} style={{ top: topo, left: esquerda, minWidth: 272 }}>
      <div className="menu-grupo">Comecar com</div>
      {MODELOS.map((modelo, indice) => (
        <button
          key={modelo.id}
          className="menu-item"
          data-marcado={indice === marcado}
          onMouseEnter={() => definirMarcado(indice)}
          onClick={() => aoEscolher(modelo.id)}
        >
          <span className="glifo">{modelo.icone}</span>
          <span>
            <span className="rotulo">{modelo.nome}</span>
            <br />
            <span className="descricao">{modelo.descricao}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
