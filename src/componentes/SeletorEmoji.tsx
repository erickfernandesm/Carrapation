/**
 * Seletor de icones.
 *
 * Tem busca em portugues, atalhos por categoria e memoria dos ultimos usados.
 * O catalogo de icones fica em src/emojis.ts, e e la que se adiciona mais.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { buscarIcones, CATEGORIAS_ICONES, TOTAL_ICONES } from '../emojis'
import { CHAVE_RECENTES, QUANTIDADE_RECENTES } from '../config'

export function SeletorEmoji({
  x,
  y,
  aoEscolher,
  aoFechar,
  aoRemover,
}: {
  x: number
  y: number
  aoEscolher: (emoji: string) => void
  aoFechar: () => void
  /** Quando informado, aparece a opcao de tirar o icone. */
  aoRemover?: () => void
}) {
  const caixa = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const busca = useRef<HTMLInputElement>(null)

  const [termo, definirTermo] = useState('')
  const [recentes, definirRecentes] = useState<string[]>(() => lerRecentes())

  const categorias = useMemo(() => buscarIcones(termo), [termo])
  const totalEncontrado = categorias.reduce((soma, c) => soma + c.icones.length, 0)

  useEffect(() => {
    busca.current?.focus()
  }, [])

  useEffect(() => {
    function aoClicar(evento: MouseEvent) {
      if (!caixa.current?.contains(evento.target as Node)) aoFechar()
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.stopPropagation()
        aoFechar()
      }
    }
    // O tempo curto evita que o proprio clique de abertura feche o painel.
    const t = window.setTimeout(() => document.addEventListener('mousedown', aoClicar))
    document.addEventListener('keydown', aoTeclar)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aoFechar])

  function escolher(emoji: string) {
    definirRecentes(guardarRecente(emoji))
    aoEscolher(emoji)
  }

  /** Rola a lista ate a categoria clicada na barra de atalhos. */
  function irPara(indice: number) {
    const alvo = lista.current?.querySelector<HTMLElement>(`[data-categoria="${indice}"]`)
    alvo?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const largura = 356
  const altura = 420
  const topo = Math.max(8, Math.min(y, window.innerHeight - altura - 8))
  const esquerda = Math.max(8, Math.min(x, window.innerWidth - largura - 8))

  return (
    <div className="menu seletor-icones" ref={caixa} style={{ top: topo, left: esquerda, width: largura }}>
      <div className="icone-topo">
        <input
          ref={busca}
          className="icone-busca"
          value={termo}
          placeholder={`Buscar entre ${TOTAL_ICONES} icones...`}
          onChange={(e) => definirTermo(e.target.value)}
        />
        <button
          className="btn"
          title="Escolher um icone aleatorio"
          onClick={() => escolher(sortear())}
        >
          🎲
        </button>
        {aoRemover && (
          <button className="btn" title="Tirar o icone" onClick={aoRemover}>
            Remover
          </button>
        )}
      </div>

      {!termo && (
        <div className="icone-abas">
          {CATEGORIAS_ICONES.map((categoria, indice) => (
            <button key={categoria.nome} title={categoria.nome} onClick={() => irPara(indice)}>
              {categoria.aba}
            </button>
          ))}
        </div>
      )}

      <div className="icone-lista" ref={lista}>
        {!termo && recentes.length > 0 && (
          <>
            <div className="menu-grupo">Usados recentemente</div>
            <div className="emojis">
              {recentes.map((emoji) => (
                <button key={`recente-${emoji}`} onClick={() => escolher(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}

        {totalEncontrado === 0 && (
          <div className="menu-vazio">
            Nenhum icone para "{termo}".
            <br />
            Tente palavras como pasta, meta, equipe ou urgente.
          </div>
        )}

        {categorias.map((categoria) => {
          const indice = CATEGORIAS_ICONES.findIndex((c) => c.nome === categoria.nome)
          return (
            <div key={categoria.nome} data-categoria={indice}>
              <div className="menu-grupo">{categoria.nome}</div>
              <div className="emojis">
                {categoria.icones.map(([emoji, termos]) => (
                  <button key={emoji} title={termos} onClick={() => escolher(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Sorteia um icone qualquer do catalogo. */
function sortear(): string {
  const categoria = CATEGORIAS_ICONES[Math.floor(Math.random() * CATEGORIAS_ICONES.length)]
  return categoria.icones[Math.floor(Math.random() * categoria.icones.length)][0]
}

function lerRecentes(): string[] {
  try {
    const cru = localStorage.getItem(CHAVE_RECENTES)
    const lista = cru ? (JSON.parse(cru) as string[]) : []
    return Array.isArray(lista) ? lista.slice(0, QUANTIDADE_RECENTES) : []
  } catch {
    return []
  }
}

/** Coloca o icone escolhido na frente da lista de recentes e devolve a lista nova. */
function guardarRecente(emoji: string): string[] {
  const atual = lerRecentes().filter((e) => e !== emoji)
  const nova = [emoji, ...atual].slice(0, QUANTIDADE_RECENTES)
  try {
    localStorage.setItem(CHAVE_RECENTES, JSON.stringify(nova))
  } catch {
    // Sem espaco no navegador. A lista de recentes nao e essencial, entao segue.
  }
  return nova
}
