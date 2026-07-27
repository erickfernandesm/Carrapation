/**
 * Tamanho de texto em trechos soltos, palavra por palavra.
 *
 * Diferente do tamanho da pagina, que muda tudo junto, aqui o efeito vale so
 * no pedaco selecionado.
 *
 * O tamanho e aplicado por classe, e nao por estilo escrito na mao. Assim a
 * limpeza de conteudo colado sabe exatamente o que aceitar, e ninguem
 * consegue injetar CSS qualquer colando de outro lugar.
 */

/** As classes de tamanho aceitas. A limpeza de HTML usa esta mesma lista. */
export const CLASSES_TAMANHO = ['txt-p', 'txt-g', 'txt-gg'] as const

export type ClasseTamanho = (typeof CLASSES_TAMANHO)[number]

export const TAMANHOS_PALAVRA: { classe: ClasseTamanho | null; nome: string; amostra: number }[] = [
  { classe: 'txt-p', nome: 'Pequeno', amostra: 11 },
  { classe: null, nome: 'Normal', amostra: 14 },
  { classe: 'txt-g', nome: 'Grande', amostra: 17 },
  { classe: 'txt-gg', nome: 'Maior', amostra: 21 },
]

/**
 * Aplica o tamanho ao trecho selecionado.
 * Passar null tira o tamanho e devolve o trecho ao normal.
 */
export function aplicarTamanhoNaSelecao(classe: ClasseTamanho | null) {
  const selecao = window.getSelection()
  if (!selecao || selecao.isCollapsed || selecao.rangeCount === 0) return

  const intervalo = selecao.getRangeAt(0)
  const area = encontrarAreaEditavel(intervalo.commonAncestorContainer)
  if (!area) return

  // Tira o trecho da pagina, limpa tamanhos que ja existiam dentro dele e
  // devolve embrulhado no tamanho novo.
  const conteudo = intervalo.extractContents()
  desembrulharTamanhos(conteudo)

  if (classe) {
    const embrulho = document.createElement('span')
    embrulho.className = classe
    embrulho.appendChild(conteudo)
    intervalo.insertNode(embrulho)
    selecionar(embrulho)
  } else {
    const marcador = document.createElement('span')
    marcador.appendChild(conteudo)
    intervalo.insertNode(marcador)
    // O span sem classe some, deixando so o conteudo no lugar.
    const pai = marcador.parentNode
    while (marcador.firstChild) pai?.insertBefore(marcador.firstChild, marcador)
    pai?.removeChild(marcador)
  }

  area.normalize()

  // extractContents e insertNode nao avisam o React que o texto mudou, entao
  // o aviso e dado na mao. Sem isto, a alteracao apareceria na tela mas nao
  // seria gravada.
  area.dispatchEvent(new Event('input', { bubbles: true }))
}

/** Descobre qual das classes de tamanho vale para a selecao atual. */
export function tamanhoDaSelecao(): ClasseTamanho | null {
  const selecao = window.getSelection()
  if (!selecao || selecao.rangeCount === 0) return null

  let no: Node | null = selecao.anchorNode
  while (no && no.nodeType !== Node.ELEMENT_NODE) no = no.parentNode

  const elemento = (no as HTMLElement | null)?.closest?.(
    CLASSES_TAMANHO.map((c) => `.${c}`).join(','),
  )
  if (!elemento) return null

  return (CLASSES_TAMANHO.find((c) => elemento.classList.contains(c)) ?? null) as ClasseTamanho | null
}

/** Sobe ate a area editavel de um bloco, ou devolve null se estiver fora. */
function encontrarAreaEditavel(no: Node): HTMLElement | null {
  let atual: Node | null = no
  while (atual && atual.nodeType !== Node.ELEMENT_NODE) atual = atual.parentNode
  return (atual as HTMLElement | null)?.closest('.texto') ?? null
}

/** Tira as marcas de tamanho que ja existiam dentro do trecho. */
function desembrulharTamanhos(raiz: DocumentFragment) {
  for (const classe of CLASSES_TAMANHO) {
    for (const marcado of Array.from(raiz.querySelectorAll(`span.${classe}`))) {
      const pai = marcado.parentNode
      while (marcado.firstChild) pai?.insertBefore(marcado.firstChild, marcado)
      pai?.removeChild(marcado)
    }
  }
}

/** Deixa o trecho selecionado depois da mudanca, para dar para repetir. */
function selecionar(elemento: HTMLElement) {
  const selecao = window.getSelection()
  if (!selecao) return

  const intervalo = document.createRange()
  intervalo.selectNodeContents(elemento)
  selecao.removeAllRanges()
  selecao.addRange(intervalo)
}
