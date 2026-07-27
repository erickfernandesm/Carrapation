/** Menu que aparece ao digitar a barra, e tambem ao pedir para transformar um bloco. */

import { useEffect, useRef } from 'react'
import type { DefinicaoBloco } from '../blocos/registro'
import { ORDEM_GRUPOS } from '../blocos/registro'

export function MenuBlocos({
  itens,
  marcado,
  x,
  y,
  titulo,
  aoEscolher,
  aoFechar,
}: {
  itens: DefinicaoBloco[]
  marcado: number
  x: number
  y: number
  titulo?: string
  aoEscolher: (item: DefinicaoBloco) => void
  aoFechar: () => void
}) {
  const caixa = useRef<HTMLDivElement>(null)

  // Mantem o item marcado sempre visivel ao navegar pelo teclado.
  useEffect(() => {
    const alvo = caixa.current?.querySelector('[data-marcado="true"]')
    alvo?.scrollIntoView({ block: 'nearest' })
  }, [marcado])

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

  const topo = Math.min(y, window.innerHeight - 350)
  const esquerda = Math.min(x, window.innerWidth - 280)

  return (
    <div className="menu" ref={caixa} style={{ top: Math.max(8, topo), left: Math.max(8, esquerda) }}>
      {titulo && <div className="menu-grupo">{titulo}</div>}

      {itens.length === 0 && <div className="menu-vazio">Nenhum bloco com esse nome</div>}

      {ORDEM_GRUPOS.map((grupo) => {
        const doGrupo = itens.filter((i) => i.grupo === grupo)
        if (doGrupo.length === 0) return null

        return (
          <div key={grupo}>
            <div className="menu-grupo">{grupo}</div>
            {doGrupo.map((item) => {
              const indice = itens.indexOf(item)
              return (
                <button
                  key={item.tipo}
                  className="menu-item"
                  data-marcado={indice === marcado}
                  onClick={() => aoEscolher(item)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span className="glifo">{item.icone}</span>
                  <span>
                    <span className="rotulo">{item.rotulo}</span>
                    <br />
                    <span className="descricao">{item.descricao}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
