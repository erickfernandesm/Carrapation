/**
 * Aparencia de uma pagina: fonte e tamanho do texto.
 *
 * Cada pagina guarda a sua escolha. Sem escolha, ela segue a fonte definida
 * nas Configuracoes do espaco, entao mexer aqui vale so para esta pagina.
 */

import { useEffect, useRef } from 'react'
import type { FontChoice } from '../types'
import { useEspaco } from '../estado/espaco'
import { FONTES, TAMANHOS_TEXTO } from '../config'

export function MenuAparenciaPagina({
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
  const { espaco, definirFontePagina, definirTamanhoTextoPagina } = useEspaco()
  const caixa = useRef<HTMLDivElement>(null)

  const pagina = espaco.pages[paginaId]

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

  if (!pagina) return null

  // Sem fonte propria, a pagina mostra marcada a que vem das Configuracoes.
  const fonteAtual = pagina.font ?? espaco.font
  const tamanhoAtual = pagina.textScale ?? 1

  const topo = Math.max(8, Math.min(y, window.innerHeight - 250))
  const esquerda = Math.max(8, Math.min(x, window.innerWidth - 290))

  return (
    <div className="menu" ref={caixa} style={{ top: topo, left: esquerda, minWidth: 274 }}>
      <div className="menu-grupo">Fonte desta pagina</div>

      <div className="fontes">
        {FONTES.map((fonte) => (
          <button
            key={fonte.id}
            className="fonte-opcao"
            data-ativa={fonteAtual === fonte.id || undefined}
            title={fonte.nome}
            onClick={() => definirFontePagina(paginaId, fonte.id as FontChoice)}
          >
            <span className="fonte-amostra" style={{ fontFamily: fonte.familia }}>
              Ag
            </span>
            <span className="fonte-nome">{fonte.nome}</span>
          </button>
        ))}
      </div>

      <div className="menu-separador" />
      <div className="menu-grupo">Tamanho do texto</div>

      <div className="segmentos" style={{ margin: '0 8px 8px' }}>
        {TAMANHOS_TEXTO.map((tamanho) => (
          <button
            key={tamanho.valor}
            data-ativo={Math.abs(tamanhoAtual - tamanho.valor) < 0.01 || undefined}
            title={tamanho.nome}
            onClick={() => definirTamanhoTextoPagina(paginaId, tamanho.valor)}
          >
            {tamanho.nome}
          </button>
        ))}
      </div>

      {(pagina.font || pagina.textScale) && (
        <>
          <div className="menu-separador" />
          <button
            className="menu-item"
            onClick={() => {
              definirFontePagina(paginaId, undefined)
              definirTamanhoTextoPagina(paginaId, undefined)
            }}
          >
            <span className="glifo">↺</span>
            <span>
              <span className="rotulo">Voltar ao padrao</span>
              <br />
              <span className="descricao">Usa a fonte e o tamanho das Configuracoes</span>
            </span>
          </button>
        </>
      )}
    </div>
  )
}
