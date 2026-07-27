/**
 * Editor de blocos.
 *
 * Aqui moram as regras de teclado, o menu da barra, os atalhos de markdown e
 * o arrastar para reordenar. Cada linha da lista e desenhada por LinhaBloco.
 */

import { useMemo, useRef, useState, type KeyboardEvent as EventoTeclado } from 'react'
import type { Block, BlockType, Page } from '../types'
import { useEspaco } from '../estado/espaco'
import { atalhoMarkdown, buscarBlocos, definicao, BLOCOS, type DefinicaoBloco } from '../blocos/registro'
import { apenasTexto } from '../lib/sanitize'
import { novoId } from '../lib/id'
import { escolherArquivo, lerComoDataUrl, emMegabytes, reduzirImagem } from '../lib/arquivo'
import { LIMITE_IMAGEM_MB } from '../config'
import {
  apagarInicio,
  apagarTermoDaBarra,
  dividirNoCursor,
  posicaoDoCursor,
  retanguloDoCursor,
  tamanhoDoTexto,
  termoDaBarra,
} from '../lib/cursor'
import { LinhaBloco } from './LinhaBloco'
import { MenuBlocos } from './MenuBlocos'
import { SeletorEmoji } from './SeletorEmoji'
import { BarraFormato } from './BarraFormato'

/** Onde o cursor deve ir depois de uma acao. */
interface PedidoDeFoco {
  blocoId: string
  posicao: number | 'inicio' | 'fim'
}

/** Estado do menu de blocos, seja pela barra ou pela alcinha. */
interface EstadoMenu {
  blocoId: string
  origem: 'barra' | 'alca'
  termo: string
  x: number
  y: number
  marcado: number
}

export function Editor({ pagina }: { pagina: Page }) {
  const {
    atualizarBloco,
    inserirBloco,
    removerBloco,
    moverBloco,
    trocarTipoBloco,
    definirImagensPagina,
    definirModoDesenho,
  } = useEspaco()

  const [foco, definirFoco] = useState<PedidoDeFoco | null>(null)
  const [menu, definirMenu] = useState<EstadoMenu | null>(null)
  const [emojiAviso, definirEmojiAviso] = useState<{ blocoId: string; x: number; y: number } | null>(null)
  const [arrastandoId, definirArrastandoId] = useState<string | null>(null)
  const [alvoDeSolta, definirAlvoDeSolta] = useState<{ id: string; lado: 'acima' | 'abaixo' } | null>(null)

  // Guarda o elemento de texto em foco, para o menu da barra agir sobre ele.
  const elementoAtivo = useRef<HTMLDivElement | null>(null)

  const blocos = pagina.blocks
  const itensDoMenu = useMemo(
    () => (menu?.origem === 'alca' ? BLOCOS.filter((b) => b.noMenu) : buscarBlocos(menu?.termo ?? '')),
    [menu?.termo, menu?.origem],
  )

  /** Numero de cada item de lista numerada, reiniciando a contagem a cada quebra. */
  const numeros = useMemo(() => {
    const resultado: Record<string, number> = {}
    let contador = 0
    for (const bloco of blocos) {
      if (bloco.type === 'numbered') {
        contador += 1
        resultado[bloco.id] = contador
      } else {
        contador = 0
      }
    }
    return resultado
  }, [blocos])

  function pedirFoco(blocoId: string, posicao: PedidoDeFoco['posicao'] = 'fim') {
    definirFoco({ blocoId, posicao })
  }

  function fecharMenu() {
    definirMenu(null)
  }

  /**
   * Anexa uma imagem solta, posicionada por cima da pagina.
   * Ela nao vira bloco: entra na camada de imagens, fora do fluxo do texto.
   */
  async function anexarImagemSolta() {
    const arquivo = await escolherArquivo('image/*')
    if (!arquivo) return

    if (emMegabytes(arquivo.size) > LIMITE_IMAGEM_MB) {
      alert(`A imagem passa de ${LIMITE_IMAGEM_MB} MB. Escolha uma menor.`)
      return
    }

    const original = await lerComoDataUrl(arquivo)
    const reduzida = await reduzirImagem(original, 1200)

    // Entra no meio da largura, na altura em que a pagina esta sendo lida.
    const areaEditor = document.querySelector('.editor')?.getBoundingClientRect()
    const areaPagina = document.querySelector('.pagina')?.getBoundingClientRect()
    const y = areaEditor && areaPagina ? Math.max(20, areaEditor.top - areaPagina.top + 40) : 60

    definirImagensPagina(pagina.id, [
      ...(pagina.imagens ?? []),
      { id: novoId(), src: reduzida, x: 0.28, y, largura: 0.42 },
    ])
  }

  /** Aplica o bloco escolhido no menu. */
  function aplicarDoMenu(escolhido: DefinicaoBloco) {
    if (!menu) return
    const blocoId = menu.blocoId

    // Entradas com acao propria nao viram bloco.
    if (escolhido.acao) {
      if (menu.origem === 'barra' && elementoAtivo.current) {
        apagarTermoDaBarra(elementoAtivo.current)
        atualizarBloco(pagina.id, blocoId, { html: elementoAtivo.current.innerHTML })
      }
      fecharMenu()

      if (escolhido.acao === 'imagem-solta') anexarImagemSolta()
      if (escolhido.acao === 'desenhar') definirModoDesenho(true)
      return
    }

    if (menu.origem === 'barra' && elementoAtivo.current) {
      apagarTermoDaBarra(elementoAtivo.current)
      atualizarBloco(pagina.id, blocoId, { html: elementoAtivo.current.innerHTML })
    }

    trocarTipoBloco(pagina.id, blocoId, escolhido.tipo)
    fecharMenu()

    if (escolhido.editavel) {
      pedirFoco(blocoId, 'fim')
    } else {
      // Blocos sem texto ganham um paragrafo logo abaixo para continuar escrevendo.
      const novoId = inserirBloco(pagina.id, blocoId)
      pedirFoco(novoId, 'inicio')
    }
  }

  /** Teclas de navegacao enquanto o menu de blocos esta aberto. */
  function tratarTeclaDoMenu(evento: EventoTeclado<HTMLDivElement>): boolean {
    if (!menu) return false

    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      definirMenu({ ...menu, marcado: (menu.marcado + 1) % Math.max(1, itensDoMenu.length) })
      return true
    }
    if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      definirMenu({
        ...menu,
        marcado: (menu.marcado - 1 + itensDoMenu.length) % Math.max(1, itensDoMenu.length),
      })
      return true
    }
    if (evento.key === 'Enter' || evento.key === 'Tab') {
      const escolhido = itensDoMenu[menu.marcado]
      if (escolhido) {
        evento.preventDefault()
        aplicarDoMenu(escolhido)
        return true
      }
      fecharMenu()
      return false
    }
    if (evento.key === 'Escape') {
      evento.preventDefault()
      fecharMenu()
      return true
    }
    return false
  }

  /** Regras de teclado dentro de um bloco de texto. */
  function tratarTecla(bloco: Block, evento: EventoTeclado<HTMLDivElement>, elemento: HTMLDivElement) {
    elementoAtivo.current = elemento

    if (tratarTeclaDoMenu(evento)) return

    const def = definicao(bloco.type)
    const indice = blocos.findIndex((b) => b.id === bloco.id)
    const anterior = blocos[indice - 1]
    const proximo = blocos[indice + 1]
    const cursor = posicaoDoCursor(elemento)
    const tamanho = tamanhoDoTexto(elemento)
    const estaVazio = tamanho === 0

    // Negrito, italico e sublinhado.
    if ((evento.ctrlKey || evento.metaKey) && ['b', 'i', 'u'].includes(evento.key.toLowerCase())) {
      evento.preventDefault()
      const comando = { b: 'bold', i: 'italic', u: 'underline' }[evento.key.toLowerCase()]!
      document.execCommand(comando)
      atualizarBloco(pagina.id, bloco.id, { html: elemento.innerHTML })
      return
    }

    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault()

      // Enter numa linha vazia de lista devolve o bloco para paragrafo comum.
      if (estaVazio && def.continua) {
        trocarTipoBloco(pagina.id, bloco.id, 'paragraph')
        pedirFoco(bloco.id, 'inicio')
        return
      }

      const [antes, depois] = dividirNoCursor(elemento)
      if (antes !== bloco.html) {
        elemento.innerHTML = antes
        atualizarBloco(pagina.id, bloco.id, { html: antes })
      }

      const tipoNovo: BlockType = def.continua ? bloco.type : 'paragraph'
      const novoId = inserirBloco(pagina.id, bloco.id, {
        type: tipoNovo,
        html: depois,
        ...(tipoNovo === 'todo' ? { checked: false } : {}),
      })
      pedirFoco(novoId, 'inicio')
      return
    }

    if (evento.key === 'Backspace' && cursor === 0 && !evento.shiftKey) {
      // Primeiro tira a formatacao do bloco, so depois apaga.
      if (bloco.type !== 'paragraph') {
        evento.preventDefault()
        trocarTipoBloco(pagina.id, bloco.id, 'paragraph')
        pedirFoco(bloco.id, 'inicio')
        return
      }

      if (!anterior) return

      evento.preventDefault()
      const anteriorDef = definicao(anterior.type)

      if (!anteriorDef.editavel) {
        // Blocos sem texto, como o divisor, somem de uma vez.
        removerBloco(pagina.id, anterior.id)
        pedirFoco(bloco.id, 'inicio')
        return
      }

      const tamanhoAnterior = apenasTexto(anterior.html).length
      atualizarBloco(pagina.id, anterior.id, { html: anterior.html + bloco.html })
      removerBloco(pagina.id, bloco.id)
      pedirFoco(anterior.id, tamanhoAnterior)
      return
    }

    if (evento.key === 'ArrowUp' && cursor === 0 && anterior) {
      evento.preventDefault()
      pedirFoco(anterior.id, 'fim')
      return
    }

    if (evento.key === 'ArrowDown' && cursor === tamanho && proximo) {
      evento.preventDefault()
      pedirFoco(proximo.id, 'inicio')
      return
    }

    // Deletar para frente junta com o bloco seguinte.
    if (evento.key === 'Delete' && cursor === tamanho && proximo && definicao(proximo.type).editavel) {
      evento.preventDefault()
      atualizarBloco(pagina.id, bloco.id, { html: bloco.html + proximo.html })
      removerBloco(pagina.id, proximo.id)
      pedirFoco(bloco.id, tamanho)
    }
  }

  /** Chamado a cada tecla digitada dentro de um bloco. */
  function tratarDigitacao(bloco: Block, html: string, elemento: HTMLDivElement | null) {
    if (!elemento) return
    elementoAtivo.current = elemento

    const texto = elemento.textContent ?? ''

    // Atalhos de markdown, so em paragrafos, para nao atrapalhar quem edita.
    if (bloco.type === 'paragraph') {
      const casou = atalhoMarkdown(texto)
      if (casou?.markdown) {
        const gatilho = texto.match(casou.markdown)?.[0] ?? ''
        apagarInicio(elemento, gatilho.length)
        const restante = elemento.innerHTML
        atualizarBloco(pagina.id, bloco.id, {
          html: casou.editavel ? restante : '',
          ...(casou.tipo === 'todo' ? { checked: /^\[x\]/i.test(gatilho) } : {}),
        })
        trocarTipoBloco(pagina.id, bloco.id, casou.tipo)
        if (casou.editavel) {
          pedirFoco(bloco.id, 'inicio')
        } else {
          const novoId = inserirBloco(pagina.id, bloco.id)
          pedirFoco(novoId, 'inicio')
        }
        fecharMenu()
        return
      }
    }

    atualizarBloco(pagina.id, bloco.id, { html })

    // Abre, atualiza ou fecha o menu da barra conforme o que foi digitado.
    const termo = termoDaBarra(elemento)
    if (termo === null || termo.length > 22) {
      if (menu?.origem === 'barra') fecharMenu()
      return
    }

    const caixa = retanguloDoCursor(elemento)
    definirMenu((atual) => {
      if (atual?.origem === 'barra' && atual.blocoId === bloco.id) {
        return { ...atual, termo, marcado: 0 }
      }
      return { blocoId: bloco.id, origem: 'barra', termo, x: caixa.left, y: caixa.bottom + 8, marcado: 0 }
    })
  }

  /** Solta o bloco arrastado na posicao indicada. */
  function soltarBloco() {
    if (!arrastandoId || !alvoDeSolta) return

    const de = blocos.findIndex((b) => b.id === arrastandoId)
    let para = blocos.findIndex((b) => b.id === alvoDeSolta.id)
    if (de < 0 || para < 0) return

    if (alvoDeSolta.lado === 'abaixo') para += 1
    if (de < para) para -= 1

    moverBloco(pagina.id, arrastandoId, para)
    definirArrastandoId(null)
    definirAlvoDeSolta(null)
  }

  return (
    <div className="editor">
      {blocos.map((bloco) => (
        <LinhaBloco
          key={bloco.id}
          bloco={bloco}
          numero={numeros[bloco.id] ?? 1}
          unico={blocos.length === 1}
          focado={foco?.blocoId === bloco.id}
          posicaoDoFoco={foco?.posicao ?? 'fim'}
          arrastando={arrastandoId === bloco.id}
          indicadorDeSolta={alvoDeSolta?.id === bloco.id ? alvoDeSolta.lado : null}
          aoIniciarArrasto={() => definirArrastandoId(bloco.id)}
          aoTerminarArrasto={() => {
            definirArrastandoId(null)
            definirAlvoDeSolta(null)
          }}
          aoPassarArrastando={(evento) => {
            if (!arrastandoId || arrastandoId === bloco.id) return
            evento.preventDefault()
            const caixa = (evento.currentTarget as HTMLElement).getBoundingClientRect()
            const lado = evento.clientY < caixa.top + caixa.height / 2 ? 'acima' : 'abaixo'
            definirAlvoDeSolta((atual) =>
              atual?.id === bloco.id && atual.lado === lado ? atual : { id: bloco.id, lado },
            )
          }}
          aoSoltar={(evento) => {
            evento.preventDefault()
            soltarBloco()
          }}
          acoes={{
            aoDigitar: (html, elemento) => tratarDigitacao(bloco, html, elemento),
            aoTeclar: (evento, elemento) => tratarTecla(bloco, evento, elemento),
            aoAlterar: (mudancas) => atualizarBloco(pagina.id, bloco.id, mudancas),
            aoRemover: () => removerBloco(pagina.id, bloco.id),
            aoAbrirMenuDeTransformar: (x, y) =>
              definirMenu({ blocoId: bloco.id, origem: 'alca', termo: '', x, y, marcado: 0 }),
            aoAbrirEmojiDoAviso: (x, y) => definirEmojiAviso({ blocoId: bloco.id, x, y }),
            aoColarImagem: (dataUrl) => {
              // Bloco vazio vira a propria imagem. Bloco com texto ganha a
              // imagem logo abaixo, para nao perder o que estava escrito.
              const vazio = apenasTexto(bloco.html).trim() === ''

              if (vazio && definicao(bloco.type).editavel) {
                atualizarBloco(pagina.id, bloco.id, { src: dataUrl })
                trocarTipoBloco(pagina.id, bloco.id, 'image')
                pedirFoco(inserirBloco(pagina.id, bloco.id), 'inicio')
                return
              }

              const idImagem = inserirBloco(pagina.id, bloco.id, { type: 'image', src: dataUrl })
              pedirFoco(inserirBloco(pagina.id, idImagem), 'inicio')
            },
          }}
        />
      ))}

      {/* Area clicavel embaixo de tudo, para continuar escrevendo. */}
      <div
        style={{ minHeight: 140, cursor: 'text' }}
        onClick={() => {
          const ultimo = blocos[blocos.length - 1]
          if (ultimo && definicao(ultimo.type).editavel && apenasTexto(ultimo.html) === '') {
            pedirFoco(ultimo.id, 'fim')
            return
          }
          const novoId = inserirBloco(pagina.id, null)
          pedirFoco(novoId, 'inicio')
        }}
      />

      {menu && (
        <MenuBlocos
          itens={itensDoMenu}
          marcado={menu.marcado}
          x={menu.x}
          y={menu.y}
          titulo={menu.origem === 'alca' ? 'Transformar em' : undefined}
          aoEscolher={aplicarDoMenu}
          aoFechar={fecharMenu}
        />
      )}

      {/* Aparece sozinha quando ha texto selecionado dentro do editor. */}
      <BarraFormato />

      {emojiAviso && (
        <SeletorEmoji
          x={emojiAviso.x}
          y={emojiAviso.y}
          aoEscolher={(emoji) => {
            atualizarBloco(pagina.id, emojiAviso.blocoId, { icon: emoji })
            definirEmojiAviso(null)
          }}
          aoFechar={() => definirEmojiAviso(null)}
        />
      )}
    </div>
  )
}
