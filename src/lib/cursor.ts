/**
 * Funcoes de cursor para as areas editaveis.
 *
 * O editor usa contentEditable do proprio navegador, entao precisamos de
 * ajuda para saber onde o cursor esta e para coloca lo onde queremos.
 */

/** Posicao do cursor contada em caracteres de texto puro. */
export function posicaoDoCursor(elemento: HTMLElement): number {
  const selecao = window.getSelection()
  if (!selecao || selecao.rangeCount === 0) return 0

  const intervalo = selecao.getRangeAt(0)
  const ateOCursor = intervalo.cloneRange()
  ateOCursor.selectNodeContents(elemento)
  ateOCursor.setEnd(intervalo.endContainer, intervalo.endOffset)
  return ateOCursor.toString().length
}

/** Quantidade de caracteres de texto puro dentro do elemento. */
export function tamanhoDoTexto(elemento: HTMLElement): number {
  return (elemento.textContent ?? '').length
}

/** Coloca o cursor no inicio, no fim ou numa posicao especifica. */
export function colocarCursor(elemento: HTMLElement, onde: number | 'inicio' | 'fim') {
  elemento.focus()

  const selecao = window.getSelection()
  if (!selecao) return

  const intervalo = document.createRange()

  if (onde === 'inicio') {
    intervalo.selectNodeContents(elemento)
    intervalo.collapse(true)
  } else if (onde === 'fim') {
    intervalo.selectNodeContents(elemento)
    intervalo.collapse(false)
  } else {
    const alvo = localizarNoTexto(elemento, onde)
    if (alvo) {
      intervalo.setStart(alvo.no, alvo.posicao)
      intervalo.collapse(true)
    } else {
      intervalo.selectNodeContents(elemento)
      intervalo.collapse(false)
    }
  }

  selecao.removeAllRanges()
  selecao.addRange(intervalo)
}

/** Encontra em qual no de texto cai a posicao pedida. */
function localizarNoTexto(elemento: HTMLElement, alvo: number): { no: Node; posicao: number } | null {
  const caminhador = document.createTreeWalker(elemento, NodeFilter.SHOW_TEXT)
  let percorrido = 0
  let no = caminhador.nextNode()

  while (no) {
    const tamanho = no.textContent?.length ?? 0
    if (percorrido + tamanho >= alvo) {
      return { no, posicao: alvo - percorrido }
    }
    percorrido += tamanho
    no = caminhador.nextNode()
  }
  return null
}

/** Divide o conteudo do elemento em duas partes, no ponto do cursor. */
export function dividirNoCursor(elemento: HTMLElement): [string, string] {
  const selecao = window.getSelection()
  if (!selecao || selecao.rangeCount === 0) return [elemento.innerHTML, '']

  const intervalo = selecao.getRangeAt(0)

  const parteA = intervalo.cloneRange()
  parteA.selectNodeContents(elemento)
  parteA.setEnd(intervalo.startContainer, intervalo.startOffset)

  const parteB = intervalo.cloneRange()
  parteB.selectNodeContents(elemento)
  parteB.setStart(intervalo.endContainer, intervalo.endOffset)

  const caixaA = document.createElement('div')
  caixaA.appendChild(parteA.cloneContents())
  const caixaB = document.createElement('div')
  caixaB.appendChild(parteB.cloneContents())

  return [caixaA.innerHTML, caixaB.innerHTML]
}

/** Retangulo do cursor na tela, usado para posicionar menus flutuantes. */
export function retanguloDoCursor(elemento: HTMLElement): DOMRect {
  const selecao = window.getSelection()
  if (selecao && selecao.rangeCount > 0) {
    const caixa = selecao.getRangeAt(0).getBoundingClientRect()
    if (caixa.width > 0 || caixa.height > 0) return caixa
  }
  return elemento.getBoundingClientRect()
}

/**
 * Descobre o termo digitado depois da ultima barra antes do cursor.
 * Devolve null quando nao ha barra ativa.
 */
export function termoDaBarra(elemento: HTMLElement): string | null {
  const texto = elemento.textContent ?? ''
  const cursor = posicaoDoCursor(elemento)
  const anterior = texto.slice(0, cursor)
  const barra = anterior.lastIndexOf('/')

  if (barra < 0) return null
  // A barra so vale se estiver no comeco da linha ou logo depois de um espaco.
  if (barra > 0 && !/\s/.test(anterior[barra - 1])) return null

  const termo = anterior.slice(barra + 1)
  if (termo.includes('\n')) return null
  return termo
}

/** Apaga a barra e o termo digitado depois dela, antes de aplicar o bloco. */
export function apagarTermoDaBarra(elemento: HTMLElement) {
  const texto = elemento.textContent ?? ''
  const cursor = posicaoDoCursor(elemento)
  const barra = texto.slice(0, cursor).lastIndexOf('/')
  if (barra < 0) return

  const inicio = localizarNoTexto(elemento, barra)
  const fim = localizarNoTexto(elemento, cursor)
  if (!inicio) return

  const intervalo = document.createRange()
  intervalo.setStart(inicio.no, inicio.posicao)
  if (fim) {
    intervalo.setEnd(fim.no, fim.posicao)
  } else {
    intervalo.setEndAfter(elemento.lastChild ?? elemento)
  }
  intervalo.deleteContents()

  const selecao = window.getSelection()
  selecao?.removeAllRanges()
  intervalo.collapse(true)
  selecao?.addRange(intervalo)
}

/** Apaga os primeiros caracteres do elemento, usado pelos atalhos de markdown. */
export function apagarInicio(elemento: HTMLElement, quantidade: number) {
  const inicio = localizarNoTexto(elemento, 0)
  const fim = localizarNoTexto(elemento, quantidade)
  if (!inicio || !fim) return

  const intervalo = document.createRange()
  intervalo.setStart(inicio.no, inicio.posicao)
  intervalo.setEnd(fim.no, fim.posicao)
  intervalo.deleteContents()

  colocarCursor(elemento, 'inicio')
}
