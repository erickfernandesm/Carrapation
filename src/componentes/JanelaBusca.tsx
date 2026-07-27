/** Busca por titulo e por conteudo, em todas as paginas do espaco. */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useEspaco } from '../estado/espaco'
import { Janela } from './Janela'
import { apenasTexto } from '../lib/sanitize'
import { iconeDaPagina } from '../lib/pagina'
import type { Page } from '../types'

interface Achado {
  pagina: Page
  trecho: string | null
}

export function JanelaBusca({ aoFechar }: { aoFechar: () => void }) {
  const { espaco, abrirPagina } = useEspaco()
  const [termo, definirTermo] = useState('')
  const [marcado, definirMarcado] = useState(0)
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    campo.current?.focus()
  }, [])

  const achados = useMemo<Achado[]>(() => {
    const paginas = Object.values(espaco.pages)
    const alvo = termo.trim().toLowerCase()

    if (!alvo) {
      return paginas
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 12)
        .map((pagina) => ({ pagina, trecho: null }))
    }

    const resultado: Achado[] = []
    for (const pagina of paginas) {
      const noTitulo = pagina.title.toLowerCase().includes(alvo)
      const corpo = pagina.blocks.map((b) => apenasTexto(b.html)).join(' ')
      const posicao = corpo.toLowerCase().indexOf(alvo)

      if (!noTitulo && posicao < 0) continue

      resultado.push({
        pagina,
        trecho: posicao >= 0 ? recortarAoRedor(corpo, posicao, alvo.length) : null,
      })
    }

    return resultado.sort((a, b) => b.pagina.updatedAt - a.pagina.updatedAt).slice(0, 40)
  }, [espaco.pages, termo])

  function abrir(paginaId: string) {
    abrirPagina(paginaId)
    aoFechar()
  }

  return (
    <Janela aoFechar={aoFechar} largura={600}>
      <input
        ref={campo}
        className="busca-campo"
        value={termo}
        placeholder="Buscar por titulo ou conteudo..."
        onChange={(e) => {
          definirTermo(e.target.value)
          definirMarcado(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            definirMarcado((i) => Math.min(i + 1, achados.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            definirMarcado((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            const escolhido = achados[marcado]
            if (escolhido) abrir(escolhido.pagina.id)
          }
        }}
      />

      <div className="busca-lista">
        {achados.length === 0 && (
          <div className="menu-vazio">
            {termo ? `Nada encontrado para "${termo}"` : 'Nenhuma pagina ainda'}
          </div>
        )}

        {!termo && achados.length > 0 && <div className="menu-grupo">Abertas recentemente</div>}

        {achados.map((achado, indice) => (
          <button
            key={achado.pagina.id}
            className="menu-item"
            data-marcado={indice === marcado}
            onMouseEnter={() => definirMarcado(indice)}
            onClick={() => abrir(achado.pagina.id)}
          >
            <span className="glifo">{iconeDaPagina(achado.pagina)}</span>
            <span style={{ minWidth: 0 }}>
              <span className="rotulo">{achado.pagina.title || 'Sem titulo'}</span>
              {achado.trecho && (
                <>
                  <br />
                  <span className="busca-trecho">{achado.trecho}</span>
                </>
              )}
            </span>
          </button>
        ))}
      </div>
    </Janela>
  )
}

/** Devolve um pedaco do texto ao redor do que foi encontrado. */
function recortarAoRedor(texto: string, posicao: number, tamanho: number): string {
  const inicio = Math.max(0, posicao - 40)
  const fim = Math.min(texto.length, posicao + tamanho + 60)
  const prefixo = inicio > 0 ? '...' : ''
  const sufixo = fim < texto.length ? '...' : ''
  return `${prefixo}${texto.slice(inicio, fim).trim()}${sufixo}`
}
