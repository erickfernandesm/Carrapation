/**
 * Barrinha de formatacao que aparece ao selecionar texto no editor.
 *
 * Os atalhos de teclado ja existiam, mas ninguem descobre atalho sozinho.
 * Aqui os mesmos comandos ficam a vista, logo acima do trecho selecionado.
 *
 * O ponto delicado deste componente e nao sumir na hora errada. Aplicar um
 * formato mexe no HTML, e durante essa mexida a selecao fica vazia por um
 * instante. Se a barra reagisse a isso, ela se desmontaria no meio do proprio
 * clique. Por isso existem as duas protecoes comentadas abaixo.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  aplicarTamanhoNaSelecao,
  proximoTamanho,
  tamanhoDaSelecao,
  TAMANHO_NORMAL,
} from '../lib/formatacao'

interface Estado {
  x: number
  y: number
  tamanho: number
}

export function BarraFormato() {
  const [estado, definirEstado] = useState<Estado | null>(null)

  /** Ligado enquanto um formato esta sendo aplicado. Ver conferirSelecao. */
  const aplicando = useRef(false)
  /** Agendamento da conferencia, para nao rodar varias vezes no mesmo quadro. */
  const agendado = useRef(0)

  /** Le a selecao e decide se a barra aparece, some ou muda de lugar. */
  const conferirSelecao = useCallback(() => {
    // Protecao 1: durante a aplicacao de um formato, a selecao passa por
    // estados intermediarios que nao valem nada. Ignorar e o certo.
    if (aplicando.current) return

    const selecao = window.getSelection()

    if (!selecao || selecao.isCollapsed || selecao.rangeCount === 0) {
      definirEstado(null)
      return
    }

    // So dentro de um bloco de texto do editor. Em campo comum ou em outra
    // parte da tela, a barra nao aparece.
    let no: Node | null = selecao.anchorNode
    while (no && no.nodeType !== Node.ELEMENT_NODE) no = no.parentNode
    if (!(no as HTMLElement | null)?.closest?.('.editor .texto')) {
      definirEstado(null)
      return
    }

    const caixa = selecao.getRangeAt(0).getBoundingClientRect()
    if (caixa.width === 0 && caixa.height === 0) {
      definirEstado(null)
      return
    }

    definirEstado({
      x: caixa.left + caixa.width / 2,
      y: caixa.top,
      tamanho: tamanhoDaSelecao(),
    })
  }, [])

  useEffect(() => {
    function aoMudar() {
      // Protecao 2: a conferencia espera o quadro seguinte. Assim os estados
      // intermediarios de uma mesma acao viram uma leitura so, ja estavel.
      cancelAnimationFrame(agendado.current)
      agendado.current = requestAnimationFrame(conferirSelecao)
    }

    document.addEventListener('selectionchange', aoMudar)
    return () => {
      cancelAnimationFrame(agendado.current)
      document.removeEventListener('selectionchange', aoMudar)
    }
  }, [conferirSelecao])

  if (!estado) return null

  /** Aplica um comando do proprio navegador, como negrito e italico. */
  function comando(nome: string) {
    aplicando.current = true
    document.execCommand(nome)
    // Solta a protecao so depois do quadro, quando a selecao ja assentou.
    requestAnimationFrame(() => {
      aplicando.current = false
      conferirSelecao()
    })
  }

  /**
   * Aplica um tamanho ao trecho.
   *
   * O tamanho de partida e lido do texto na hora, e nao do estado da tela.
   * Estado guardado fica defasado entre um clique e outro, e era isso que
   * fazia o botao de diminuir parecer morto.
   */
  function aplicarTamanho(porcentagem: number) {
    aplicando.current = true
    aplicarTamanhoNaSelecao(porcentagem)

    // O numero na tela e atualizado na hora, sem esperar a releitura.
    definirEstado((atual) => (atual ? { ...atual, tamanho: porcentagem } : atual))

    requestAnimationFrame(() => {
      aplicando.current = false
      conferirSelecao()
    })
  }

  function passo(direcao: 1 | -1) {
    aplicarTamanho(proximoTamanho(tamanhoDaSelecao(), direcao))
  }

  const largura = 188
  const esquerda = Math.max(8, Math.min(estado.x - largura / 2, window.innerWidth - largura - 8))
  const topo = Math.max(8, estado.y - 42)

  return (
    <div
      className="barra-formato"
      style={{ left: esquerda, top: topo }}
      // Segurar o clique na barra nunca pode tirar o foco do texto, senao a
      // selecao se perde antes do comando rodar.
      onMouseDown={(e) => e.preventDefault()}
    >
      <button className="negrito" title="Negrito (Ctrl B)" onClick={() => comando('bold')}>
        N
      </button>
      <button className="italico" title="Italico (Ctrl I)" onClick={() => comando('italic')}>
        I
      </button>
      <button className="sublinhado" title="Sublinhado (Ctrl U)" onClick={() => comando('underline')}>
        S
      </button>
      <button className="riscado" title="Riscado" onClick={() => comando('strikeThrough')}>
        R
      </button>

      <span className="divisor" />

      <button title="Diminuir o tamanho deste trecho" onClick={() => passo(-1)}>
        −
      </button>
      <button
        className="tamanho-valor"
        data-alterado={estado.tamanho !== TAMANHO_NORMAL || undefined}
        title="Voltar ao tamanho normal"
        onClick={() => aplicarTamanho(TAMANHO_NORMAL)}
      >
        {estado.tamanho}%
      </button>
      <button title="Aumentar o tamanho deste trecho" onClick={() => passo(1)}>
        +
      </button>

      <span className="divisor" />

      <button title="Tirar toda a formatacao" onClick={() => comando('removeFormat')}>
        ⌫
      </button>
    </div>
  )
}
