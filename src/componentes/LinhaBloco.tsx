/**
 * Uma linha do editor: a alcinha de arrastar, o botao de menu e o bloco em si.
 *
 * A area de texto usa contentEditable. Por isso ela nunca e redesenhada pelo
 * React enquanto o usuario digita, senao o cursor pularia de lugar. O conteudo
 * so e escrito no elemento quando o bloco muda de tipo ou quando o foco esta
 * em outro lugar.
 */

import { useEffect, useRef, useState, type KeyboardEvent as EventoTeclado } from 'react'
import type { Block } from '../types'
import { definicao } from '../blocos/registro'
import { limparHtml } from '../lib/sanitize'
import { colocarCursor } from '../lib/cursor'
import { escolherArquivo, lerComoDataUrl, emMegabytes } from '../lib/arquivo'
import { LIMITE_IMAGEM_MB } from '../config'
import { BlocoCalendario } from './BlocoCalendario'

export interface AcoesLinha {
  aoDigitar: (html: string, elemento: HTMLDivElement) => void
  aoTeclar: (evento: EventoTeclado<HTMLDivElement>, elemento: HTMLDivElement) => void
  aoAlterar: (mudancas: Partial<Block>) => void
  aoAbrirMenuDeTransformar: (x: number, y: number) => void
  aoAbrirEmojiDoAviso: (x: number, y: number) => void
  /** Recebe a imagem colada, ja lida como data URL. */
  aoColarImagem: (dataUrl: string) => void
  aoRemover: () => void
}

export function LinhaBloco({
  bloco,
  numero,
  unico,
  focado,
  posicaoDoFoco,
  arrastando,
  indicadorDeSolta,
  acoes,
  aoIniciarArrasto,
  aoTerminarArrasto,
  aoPassarArrastando,
  aoSoltar,
}: {
  bloco: Block
  /** Numero mostrado na lista numerada. */
  numero: number
  /** Se e o unico bloco da pagina. Serve para mostrar a dica de escrita. */
  unico: boolean
  focado: boolean
  posicaoDoFoco: number | 'inicio' | 'fim'
  arrastando: boolean
  indicadorDeSolta: 'acima' | 'abaixo' | null
  acoes: AcoesLinha
  aoIniciarArrasto: () => void
  aoTerminarArrasto: () => void
  aoPassarArrastando: (evento: React.DragEvent) => void
  aoSoltar: (evento: React.DragEvent) => void
}) {
  const def = definicao(bloco.type)
  const texto = useRef<HTMLDivElement>(null)
  const tipoAnterior = useRef(bloco.type)

  // Escreve o conteudo no elemento sem atrapalhar quem esta digitando.
  useEffect(() => {
    const elemento = texto.current
    if (!elemento) return

    const trocouDeTipo = tipoAnterior.current !== bloco.type
    tipoAnterior.current = bloco.type

    const estaDigitando = document.activeElement === elemento
    if (estaDigitando && !trocouDeTipo) return
    if (elemento.innerHTML !== bloco.html) elemento.innerHTML = bloco.html
  }, [bloco.html, bloco.type])

  // Recebe o foco quando o editor manda.
  useEffect(() => {
    if (!focado) return
    const elemento = texto.current
    if (!elemento) return
    colocarCursor(elemento, posicaoDoFoco)
  }, [focado, posicaoDoFoco])

  const vazio = (bloco.html ?? '').replace(/<br\s*\/?>/gi, '').trim() === ''

  /** Area editavel compartilhada por todos os blocos de texto. */
  const areaEditavel = (
    <div
      ref={texto}
      className="texto"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      role="textbox"
      aria-multiline="true"
      data-vazio={vazio && (focado || unico) ? 'true' : undefined}
      data-dica={def.dica}
      onInput={() => {
        if (!texto.current) return
        acoes.aoDigitar(limparHtml(texto.current.innerHTML), texto.current)
      }}
      onKeyDown={(evento) => texto.current && acoes.aoTeclar(evento, texto.current)}
      onPaste={(evento) => {
        // Imagem na area de transferencia vira bloco de imagem na hora.
        // Serve tanto para print de tela quanto para foto copiada de um site.
        const imagem = Array.from(evento.clipboardData.files).find((arquivo) =>
          arquivo.type.startsWith('image/'),
        )

        if (imagem) {
          evento.preventDefault()
          if (emMegabytes(imagem.size) > LIMITE_IMAGEM_MB) {
            alert(`A imagem passa de ${LIMITE_IMAGEM_MB} MB. Reduza o tamanho antes de colar.`)
            return
          }
          lerComoDataUrl(imagem).then(acoes.aoColarImagem)
          return
        }

        // Texto cola sempre limpando o excesso de formatacao de outros programas.
        evento.preventDefault()
        const html = evento.clipboardData.getData('text/html')
        const puro = evento.clipboardData.getData('text/plain')
        const conteudo = html ? limparHtml(html) : puro.replace(/[<>&]/g, (c) =>
          c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;',
        )
        document.execCommand('insertHTML', false, conteudo)
      }}
    />
  )

  return (
    <div
      className="linha"
      data-tipo={bloco.type}
      data-arrastando={arrastando || undefined}
      data-solta={indicadorDeSolta ?? undefined}
      onDragOver={aoPassarArrastando}
      onDrop={aoSoltar}
      // Botao direito em qualquer ponto da linha abre o mesmo menu do + da
      // esquerda, no lugar do cursor.
      onContextMenu={(evento) => {
        evento.preventDefault()
        acoes.aoAbrirMenuDeTransformar(evento.clientX, evento.clientY + 4)
      }}
    >
      <div className="linha-alcas">
        <button
          className="alca"
          title="Opcoes do bloco (ou clique com o botao direito)"
          aria-label="Opcoes do bloco"
          onClick={(e) => {
            const caixa = (e.currentTarget as HTMLElement).getBoundingClientRect()
            acoes.aoAbrirMenuDeTransformar(caixa.right + 6, caixa.bottom + 6)
          }}
        >
          +
        </button>
        <button
          className="alca alca-mover"
          title="Arraste para mover, clique para as opcoes"
          aria-label="Mover ou abrir opcoes do bloco"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', bloco.id)
            e.dataTransfer.effectAllowed = 'move'
            aoIniciarArrasto()
          }}
          onDragEnd={aoTerminarArrasto}
          onClick={(e) => {
            const caixa = (e.currentTarget as HTMLElement).getBoundingClientRect()
            acoes.aoAbrirMenuDeTransformar(caixa.right + 6, caixa.bottom + 6)
          }}
        >
          ⠿
        </button>
      </div>

      <div
        className={`conteudo-bloco ${def.classe}`}
        data-marcada={bloco.checked || undefined}
        // Clicar em qualquer sobra da linha leva o cursor para o texto. Sem
        // isto, so a area exata das letras responderia ao mouse.
        onMouseDown={(evento) => {
          if (!def.editavel || !texto.current) return
          if (evento.target !== evento.currentTarget) return
          evento.preventDefault()
          colocarCursor(texto.current, 'fim')
        }}
      >
        {bloco.type === 'bulleted' && <span className="marca">•</span>}
        {bloco.type === 'numbered' && <span className="marca">{numero}.</span>}

        {bloco.type === 'todo' && (
          <button
            className="caixa"
            data-marcada={bloco.checked || undefined}
            role="checkbox"
            aria-checked={!!bloco.checked}
            aria-label="Marcar tarefa"
            onClick={() => acoes.aoAlterar({ checked: !bloco.checked })}
          >
            ✓
          </button>
        )}

        {bloco.type === 'callout' && (
          <button
            className="emoji"
            title="Trocar o icone do aviso"
            onClick={(e) => {
              const caixa = (e.currentTarget as HTMLElement).getBoundingClientRect()
              acoes.aoAbrirEmojiDoAviso(caixa.left, caixa.bottom + 6)
            }}
          >
            {bloco.icon ?? '💡'}
          </button>
        )}

        {bloco.type === 'divider' && <hr />}

        {bloco.type === 'image' && <BlocoImagem bloco={bloco} acoes={acoes} />}
        {bloco.type === 'calendar' && <BlocoCalendario bloco={bloco} aoAlterar={acoes.aoAlterar} />}
        {def.editavel && areaEditavel}
      </div>
    </div>
  )
}

/** Largura minima que uma imagem pode ter ao ser arrastada. */
const LARGURA_MINIMA_IMAGEM = 90

/**
 * Bloco de imagem.
 *
 * A imagem entra por tres caminhos: colada com Ctrl V, enviada do computador
 * ou por endereco. Depois disso da para arrastar as bordas para redimensionar,
 * igual ao Notion. A largura escolhida fica guardada no bloco.
 */
function BlocoImagem({ bloco, acoes }: { bloco: Block; acoes: AcoesLinha }) {
  const moldura = useRef<HTMLElement>(null)
  const [larguraAoVivo, definirLarguraAoVivo] = useState<number | null>(null)

  async function enviarDoComputador() {
    const arquivo = await escolherArquivo('image/*')
    if (!arquivo) return
    if (emMegabytes(arquivo.size) > LIMITE_IMAGEM_MB) {
      alert(`A imagem passa de ${LIMITE_IMAGEM_MB} MB. Escolha uma menor.`)
      return
    }
    acoes.aoAlterar({ src: await lerComoDataUrl(arquivo) })
  }

  function usarEndereco() {
    const endereco = window.prompt('Cole o endereco da imagem:')
    if (endereco) acoes.aoAlterar({ src: endereco.trim() })
  }

  /**
   * Arrasta uma das bordas para mudar a largura.
   * Enquanto arrasta, a largura fica so na tela. So no soltar ela e gravada,
   * para nao escrever no espaco a cada movimento do mouse.
   */
  function iniciarArrasto(evento: React.MouseEvent, lado: 'esquerda' | 'direita') {
    evento.preventDefault()
    evento.stopPropagation()

    const elemento = moldura.current
    if (!elemento) return

    const xInicial = evento.clientX
    const larguraInicial = elemento.getBoundingClientRect().width
    const larguraMaxima = elemento.parentElement?.getBoundingClientRect().width ?? larguraInicial

    let ultima = larguraInicial

    function aoMover(mover: MouseEvent) {
      const deslocamento = lado === 'direita' ? mover.clientX - xInicial : xInicial - mover.clientX
      ultima = Math.round(
        Math.max(LARGURA_MINIMA_IMAGEM, Math.min(larguraMaxima, larguraInicial + deslocamento)),
      )
      definirLarguraAoVivo(ultima)
    }

    function aoSoltar() {
      window.removeEventListener('mousemove', aoMover)
      window.removeEventListener('mouseup', aoSoltar)
      document.body.classList.remove('redimensionando')
      definirLarguraAoVivo(null)
      acoes.aoAlterar({ width: ultima })
    }

    document.body.classList.add('redimensionando')
    window.addEventListener('mousemove', aoMover)
    window.addEventListener('mouseup', aoSoltar)
  }

  if (!bloco.src) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="imagem-vazia" onClick={enviarDoComputador}>
          <span style={{ fontSize: 17 }}>🖼️</span>
          <span>Enviar do computador, ou cole com Ctrl V</span>
        </button>
        <button className="btn btn-contorno" onClick={usarEndereco}>
          Usar endereco
        </button>
      </div>
    )
  }

  const largura = larguraAoVivo ?? bloco.width

  return (
    <figure
      ref={moldura}
      className="imagem-moldura"
      data-arrastando={larguraAoVivo !== null || undefined}
      style={largura ? { width: largura } : undefined}
    >
      <img src={bloco.src} alt={bloco.caption ?? ''} draggable={false} />

      <span
        className="imagem-alca imagem-alca-esquerda"
        title="Arraste para redimensionar"
        onMouseDown={(e) => iniciarArrasto(e, 'esquerda')}
      />
      <span
        className="imagem-alca imagem-alca-direita"
        title="Arraste para redimensionar"
        onMouseDown={(e) => iniciarArrasto(e, 'direita')}
      />

      {larguraAoVivo !== null && <span className="imagem-medida">{larguraAoVivo} px</span>}

      {bloco.width && (
        <button
          className="imagem-restaurar"
          title="Voltar ao tamanho original"
          onClick={() => acoes.aoAlterar({ width: undefined })}
        >
          ⤢
        </button>
      )}

      <input
        className="legenda"
        value={bloco.caption ?? ''}
        placeholder="Escreva uma legenda"
        onChange={(e) => acoes.aoAlterar({ caption: e.target.value })}
      />
    </figure>
  )
}
