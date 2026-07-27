/**
 * Barrinha de formatacao que aparece ao selecionar texto no editor.
 *
 * Os atalhos de teclado ja existiam, mas ninguem descobre atalho sozinho.
 * Aqui os mesmos comandos ficam a vista, logo acima do trecho selecionado.
 */

import { useEffect, useState } from 'react'
import {
  aplicarTamanhoNaSelecao,
  tamanhoDaSelecao,
  TAMANHOS_PALAVRA,
  type ClasseTamanho,
} from '../lib/formatacao'

interface Posicao {
  x: number
  y: number
}

export function BarraFormato() {
  const [posicao, definirPosicao] = useState<Posicao | null>(null)
  const [tamanhoAtual, definirTamanhoAtual] = useState<ClasseTamanho | null>(null)

  useEffect(() => {
    function aoMudarSelecao() {
      const selecao = window.getSelection()

      // Sem selecao, ou selecao vazia, a barra some.
      if (!selecao || selecao.isCollapsed || selecao.rangeCount === 0) {
        definirPosicao(null)
        return
      }

      // So dentro de um bloco de texto do editor. Em campo comum ou em outra
      // parte da tela, a barra nao aparece.
      const dentro = selecao.anchorNode?.parentElement?.closest('.editor .texto')
      if (!dentro) {
        definirPosicao(null)
        return
      }

      const caixa = selecao.getRangeAt(0).getBoundingClientRect()
      if (caixa.width === 0 && caixa.height === 0) {
        definirPosicao(null)
        return
      }

      definirPosicao({ x: caixa.left + caixa.width / 2, y: caixa.top - 8 })
      definirTamanhoAtual(tamanhoDaSelecao())
    }

    document.addEventListener('selectionchange', aoMudarSelecao)
    return () => document.removeEventListener('selectionchange', aoMudarSelecao)
  }, [])

  if (!posicao) return null

  /**
   * Aplica o comando na selecao.
   * O onMouseDown com preventDefault e essencial: sem ele o clique tira o foco
   * do texto e a selecao se perde antes do comando rodar.
   */
  function aplicar(comando: string) {
    document.execCommand(comando)
    // O bloco grava sozinho, porque execCommand dispara o evento de digitacao.
  }

  const largura = 172
  const esquerda = Math.max(8, Math.min(posicao.x - largura / 2, window.innerWidth - largura - 8))
  const topo = Math.max(8, posicao.y - 34)

  return (
    <div className="barra-formato" style={{ left: esquerda, top: topo }}>
      <button
        className="negrito"
        title="Negrito (Ctrl B)"
        aria-label="Negrito"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => aplicar('bold')}
      >
        N
      </button>
      <button
        className="italico"
        title="Italico (Ctrl I)"
        aria-label="Italico"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => aplicar('italic')}
      >
        I
      </button>
      <button
        className="sublinhado"
        title="Sublinhado (Ctrl U)"
        aria-label="Sublinhado"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => aplicar('underline')}
      >
        S
      </button>
      <button
        className="riscado"
        title="Riscado"
        aria-label="Riscado"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => aplicar('strikeThrough')}
      >
        R
      </button>

      <span className="divisor" />

      {/* Tamanho de trecho solto, para aumentar uma palavra sozinha sem mexer
          no tamanho da pagina. */}
      {TAMANHOS_PALAVRA.map((tamanho) => (
        <button
          key={tamanho.nome}
          className="tamanho-palavra"
          data-ativo={tamanhoAtual === tamanho.classe || undefined}
          title={`Tamanho ${tamanho.nome.toLowerCase()}`}
          aria-label={`Tamanho ${tamanho.nome}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            aplicarTamanhoNaSelecao(tamanho.classe)
            definirTamanhoAtual(tamanho.classe)
          }}
        >
          <span style={{ fontSize: tamanho.amostra, lineHeight: 1 }}>A</span>
        </button>
      ))}

      <span className="divisor" />

      <button
        title="Tirar toda a formatacao"
        aria-label="Tirar a formatacao"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => aplicar('removeFormat')}
      >
        ⌫
      </button>
    </div>
  )
}
