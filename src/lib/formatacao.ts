/**
 * Tamanho de texto em trechos soltos, palavra por palavra.
 *
 * Diferente do tamanho da pagina, que muda tudo junto, aqui o efeito vale so
 * no pedaco selecionado.
 *
 * O tamanho e guardado em porcentagem do texto da pagina, e nao em pixels.
 * Assim uma palavra aumentada continua proporcional quando voce muda o tamanho
 * geral da pagina no botao Aa.
 */

/** Passos oferecidos pelos botoes de menos e mais, em porcentagem. */
export const PASSOS_TAMANHO = [50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300]

/** Tamanho normal, o que nao precisa de marcacao nenhuma. */
export const TAMANHO_NORMAL = 100

/**
 * Classes antigas de tamanho, de antes do sistema de porcentagem.
 * Continuam sendo aceitas e desenhadas para nao quebrar o que ja foi escrito.
 */
export const CLASSES_TAMANHO = ['txt-p', 'txt-g', 'txt-gg'] as const

/** Confere se o valor de font-size e uma porcentagem aceitavel. */
export function tamanhoValido(valor: string): boolean {
  const numero = Number(valor.replace('%', '').trim())
  return valor.trim().endsWith('%') && numero >= 30 && numero <= 400
}

/** O tamanho que vale para a selecao atual, em porcentagem. */
export function tamanhoDaSelecao(): number {
  const marcado = spanDeTamanhoDaSelecao()
  if (!marcado) return TAMANHO_NORMAL

  const declarado = marcado.style.fontSize
  if (declarado.endsWith('%')) return Math.round(Number(declarado.replace('%', '')))

  // Conteudo escrito antes, que usava classe em vez de porcentagem.
  if (marcado.classList.contains('txt-p')) return 82
  if (marcado.classList.contains('txt-g')) return 130
  if (marcado.classList.contains('txt-gg')) return 170
  return TAMANHO_NORMAL
}

/** O passo seguinte, para cima ou para baixo, a partir do tamanho atual. */
export function proximoTamanho(atual: number, direcao: 1 | -1): number {
  const posicao = PASSOS_TAMANHO.findIndex((p) => p >= atual)
  const indice = posicao < 0 ? PASSOS_TAMANHO.length - 1 : posicao
  const alvo = indice + direcao
  return PASSOS_TAMANHO[Math.max(0, Math.min(PASSOS_TAMANHO.length - 1, alvo))]
}

/**
 * Aplica o tamanho ao trecho selecionado.
 * Passar 100 tira a marcacao e devolve o trecho ao normal.
 */
export function aplicarTamanhoNaSelecao(porcentagem: number) {
  const selecao = window.getSelection()
  if (!selecao || selecao.isCollapsed || selecao.rangeCount === 0) return

  const intervalo = selecao.getRangeAt(0)
  const area = areaEditavel(intervalo.commonAncestorContainer)
  if (!area) return

  // Tira o trecho da pagina, limpa marcacoes de tamanho que ja existiam
  // dentro dele e devolve com o tamanho novo.
  const conteudo = intervalo.extractContents()
  limparTamanhos(conteudo)

  const embrulho = document.createElement('span')
  if (porcentagem !== TAMANHO_NORMAL) embrulho.style.fontSize = `${porcentagem}%`
  embrulho.appendChild(conteudo)
  intervalo.insertNode(embrulho)

  /*
   * A ordem daqui ate o fim importa, e e o que conserta o travamento.
   *
   * Primeiro o foco, depois a selecao. Nunca o contrario: dar foco num campo
   * editavel joga o cursor para o comeco, entao selecionar antes seria perder
   * a selecao logo em seguida, e a barrinha sumiria a cada clique.
   *
   * E o foco precisa vir antes de avisar da mudanca porque o bloco so evita
   * reescrever o proprio HTML enquanto esta em foco.
   */
  if (document.activeElement !== area) area.focus()

  // Sem marcacao, o span some e deixa so o conteudo no lugar.
  if (porcentagem === TAMANHO_NORMAL) {
    const pai = embrulho.parentNode
    const primeiro = embrulho.firstChild
    const ultimo = embrulho.lastChild
    while (embrulho.firstChild) pai?.insertBefore(embrulho.firstChild, embrulho)
    pai?.removeChild(embrulho)
    area.normalize()
    if (primeiro && ultimo) selecionarEntre(primeiro, ultimo)
  } else {
    selecionarConteudo(embrulho)
  }

  // extractContents e insertNode nao avisam o React que o texto mudou, entao
  // o aviso e dado na mao. Sem isto a alteracao apareceria mas nao gravaria.
  area.dispatchEvent(new Event('input', { bubbles: true }))
}

/** O span de tamanho que envolve a selecao, se houver. */
function spanDeTamanhoDaSelecao(): HTMLElement | null {
  const selecao = window.getSelection()
  if (!selecao || selecao.rangeCount === 0) return null

  let no: Node | null = selecao.anchorNode
  while (no && no.nodeType !== Node.ELEMENT_NODE) no = no.parentNode

  const elemento = no as HTMLElement | null
  if (!elemento?.closest) return null

  return elemento.closest<HTMLElement>('span[style*="font-size"], span.txt-p, span.txt-g, span.txt-gg')
}

/** Sobe ate a area editavel de um bloco, ou devolve null se estiver fora. */
function areaEditavel(no: Node): HTMLElement | null {
  let atual: Node | null = no
  while (atual && atual.nodeType !== Node.ELEMENT_NODE) atual = atual.parentNode
  return (atual as HTMLElement | null)?.closest('.texto') ?? null
}

/** Tira as marcacoes de tamanho que ja existiam dentro do trecho. */
function limparTamanhos(raiz: DocumentFragment) {
  const marcados = raiz.querySelectorAll<HTMLElement>(
    'span[style*="font-size"], span.txt-p, span.txt-g, span.txt-gg',
  )

  for (const marcado of Array.from(marcados)) {
    const pai = marcado.parentNode
    while (marcado.firstChild) pai?.insertBefore(marcado.firstChild, marcado)
    pai?.removeChild(marcado)
  }
}

/** Deixa o trecho selecionado, para dar para clicar de novo e continuar. */
function selecionarConteudo(elemento: HTMLElement) {
  const selecao = window.getSelection()
  if (!selecao) return

  const intervalo = document.createRange()
  intervalo.selectNodeContents(elemento)
  selecao.removeAllRanges()
  selecao.addRange(intervalo)
}

function selecionarEntre(primeiro: Node, ultimo: Node) {
  const selecao = window.getSelection()
  if (!selecao) return

  const intervalo = document.createRange()
  intervalo.setStartBefore(primeiro)
  intervalo.setEndAfter(ultimo)
  selecao.removeAllRanges()
  selecao.addRange(intervalo)
}
