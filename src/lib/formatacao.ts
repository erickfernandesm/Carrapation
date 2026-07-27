/**
 * Tamanho de texto em trechos soltos, palavra por palavra.
 *
 * Diferente do tamanho da pagina, que muda tudo junto, aqui o efeito vale so
 * no pedaco selecionado.
 *
 *
 * Por que o navegador marca a selecao, e nao nos
 * -------------------------------------------------------------------------
 * Recortar e recolar o HTML na mao quebra em selecao que atravessa negrito,
 * italico, varias linhas ou trechos ja redimensionados. Sao muitos casos de
 * borda, e cada um deles some com a selecao no meio do caminho.
 *
 * Entao quem marca o trecho e o proprio navegador, com o comando de tamanho
 * de fonte que ele ja tem pronto. Ele resolve todos esses casos, mantem a
 * selecao e avisa a pagina que o texto mudou. Depois disso a marca dele e
 * trocada pela nossa, que e so um tamanho em porcentagem.
 *
 *
 * Por que porcentagem, e como os trechos aninhados se resolvem
 * -------------------------------------------------------------------------
 * A porcentagem e relativa ao texto da pagina, entao uma palavra aumentada
 * continua proporcional quando o tamanho geral muda no botao Aa.
 *
 * Porcentagens aninhadas se multiplicam: 150 por cento dentro de 150 por
 * cento daria 225. Para o numero na tela ser sempre o tamanho de verdade, o
 * que ja vem de fora e descontado na hora de gravar.
 */

/** Passos oferecidos pelos botoes de menos e mais, em porcentagem. */
export const PASSOS_TAMANHO = [50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300]

/** Tamanho normal, o que nao precisa de marcacao nenhuma. */
export const TAMANHO_NORMAL = 100

/**
 * Classes antigas de tamanho, de antes do sistema de porcentagem.
 * Continuam sendo lidas e desenhadas para nao quebrar o que ja foi escrito.
 */
export const CLASSES_TAMANHO = ['txt-p', 'txt-g', 'txt-gg'] as const

/** Quanto cada classe antiga vale, em fator. */
const FATOR_DAS_CLASSES: Record<string, number> = {
  'txt-p': 0.82,
  'txt-g': 1.3,
  'txt-gg': 1.7,
}

/** Confere se o valor de font-size e uma porcentagem aceitavel. */
export function tamanhoValido(valor: string): boolean {
  const texto = valor.trim()
  if (!texto.endsWith('%')) return false
  const numero = Number(texto.slice(0, -1))
  return Number.isFinite(numero) && numero >= 20 && numero <= 500
}

/* ---------- Leitura ---------- */

/** O tamanho que vale de verdade na selecao, ja contando o que vem de fora. */
export function tamanhoDaSelecao(): number {
  const selecao = window.getSelection()
  if (!selecao || selecao.rangeCount === 0) return TAMANHO_NORMAL

  const intervalo = selecao.getRangeAt(0)
  const area = areaEditavel(intervalo.commonAncestorContainer)
  if (!area) return TAMANHO_NORMAL

  return Math.round(fatorAcumulado(noDoInicio(intervalo), area) * 100)
}

/**
 * O no onde a selecao realmente comeca.
 *
 * Quando a selecao envolve um elemento por fora, o inicio dela aponta para o
 * pai, com a posicao do filho. Ler dali erra o alvo: a marca de tamanho que
 * acabou de ser criada ficaria de fora da conta, e o numero na tela travava
 * em 100 por cento. Aqui a busca desce ate o filho certo.
 */
function noDoInicio(intervalo: Range): Node {
  const inicio = intervalo.startContainer
  if (inicio.nodeType !== Node.ELEMENT_NODE) return inicio
  return inicio.childNodes[intervalo.startOffset] ?? inicio
}

/** O passo seguinte, para cima ou para baixo, a partir do tamanho atual. */
export function proximoTamanho(atual: number, direcao: 1 | -1): number {
  if (direcao === 1) {
    return PASSOS_TAMANHO.find((p) => p > atual) ?? PASSOS_TAMANHO[PASSOS_TAMANHO.length - 1]
  }
  const menores = PASSOS_TAMANHO.filter((p) => p < atual)
  return menores.length ? menores[menores.length - 1] : PASSOS_TAMANHO[0]
}

/* ---------- Aplicacao ---------- */

/**
 * Aplica o tamanho ao trecho selecionado.
 * Passar 100 tira a marcacao e devolve o trecho ao normal.
 */
export function aplicarTamanhoNaSelecao(porcentagem: number) {
  const selecao = window.getSelection()
  if (!selecao || selecao.isCollapsed || selecao.rangeCount === 0) return

  const area = areaEditavel(selecao.getRangeAt(0).commonAncestorContainer)
  if (!area) return

  // Limpa marca temporaria que tenha sobrado de uma tentativa anterior. Sem
  // isto, um bloco que deu errado uma vez ficaria emperrado para sempre.
  for (const restante of Array.from(
    area.querySelectorAll<HTMLElement>('font[size="7"], [style*="xxx-large"]'),
  )) {
    restante.replaceWith(...Array.from(restante.childNodes))
  }

  /*
   * O tamanho 7 e so uma marca temporaria, escolhida por ser um valor que
   * ninguem usaria de proposito. Ela some logo abaixo, trocada pela nossa.
   *
   * O navegador tem duas formas de marcar, e nao da para confiar em qual ele
   * vai usar: a etiqueta font ou um estilo xxx-large. Procurar so uma delas
   * era o que fazia a acao nao surtir efeito e ainda deixar marca solta no
   * texto, que era gravada sem parar. Aqui as duas sao procuradas.
   */
  document.execCommand('styleWithCSS', false, 'false')
  document.execCommand('fontSize', false, '7')

  let marcados = Array.from(
    area.querySelectorAll<HTMLElement>('font[size="7"], [style*="xxx-large"]'),
  )

  // Se mesmo assim nao marcou nada, o trecho e embrulhado na mao. E o caminho
  // mais simples, e da conta da selecao de uma palavra dentro de uma linha.
  if (marcados.length === 0) {
    const embrulhado = embrulharNaMao(selecao)
    if (!embrulhado) return
    marcados = [embrulhado]
  }

  const trocados: Node[] = []

  for (const marcado of marcados) {
    // Tamanhos dentro do trecho somem: quem manda e o que esta sendo aplicado.
    limparTamanhosDentro(marcado)

    if (porcentagem === TAMANHO_NORMAL) {
      // Sem marcacao: o conteudo volta direto para o lugar.
      const filhos = Array.from(marcado.childNodes)
      marcado.replaceWith(...filhos)
      trocados.push(...filhos)
      continue
    }

    /*
     * Desconta o que ja vem de fora. Sem isto, aplicar 150 dentro de um
     * trecho que ja esta em 150 daria 225 na tela, e o numero mentiria.
     */
    const herdado = fatorAcumulado(marcado.parentNode, area)
    const relativo = Math.round((porcentagem / 100 / herdado) * 100)

    const novo = document.createElement('span')
    novo.style.fontSize = `${relativo}%`
    while (marcado.firstChild) novo.appendChild(marcado.firstChild)

    marcado.replaceWith(novo)
    trocados.push(novo)
  }

  area.normalize()
  selecionarEntre(trocados)

  // O comando do navegador ja avisou a pagina, mas a troca da marca foi feita
  // por fora dele. Sem este segundo aviso, ela nao seria gravada.
  area.dispatchEvent(new Event('input', { bubbles: true }))
}

/* ---------- Apoio ---------- */

/**
 * Embrulha o trecho selecionado na mao, quando o navegador nao marcou nada.
 * Devolve o elemento criado, ou null se nem assim der.
 */
function embrulharNaMao(selecao: Selection): HTMLElement | null {
  const intervalo = selecao.getRangeAt(0)
  const embrulho = document.createElement('font')
  embrulho.setAttribute('size', '7')

  try {
    // Caminho limpo, funciona quando a selecao cabe num trecho so.
    intervalo.surroundContents(embrulho)
    return embrulho
  } catch {
    // Selecao atravessando etiquetas: recorta e recola.
    try {
      embrulho.appendChild(intervalo.extractContents())
      intervalo.insertNode(embrulho)
      return embrulho
    } catch {
      return null
    }
  }
}

/**
 * Quanto o texto naquele ponto esta ampliado, contando todas as marcas de
 * tamanho ate a borda do bloco. 1 quer dizer tamanho normal.
 */
function fatorAcumulado(no: Node | null, area: HTMLElement): number {
  let fator = 1
  let atual: HTMLElement | null =
    no && no.nodeType === Node.ELEMENT_NODE ? (no as HTMLElement) : (no?.parentElement ?? null)

  while (atual && atual !== area && area.contains(atual)) {
    const declarado = atual.style?.fontSize
    if (declarado && tamanhoValido(declarado)) {
      fator *= Number(declarado.slice(0, -1)) / 100
    }

    for (const classe of CLASSES_TAMANHO) {
      if (atual.classList?.contains(classe)) fator *= FATOR_DAS_CLASSES[classe]
    }

    atual = atual.parentElement
  }

  return fator
}

/** Sobe ate a area editavel de um bloco, ou devolve null se estiver fora. */
function areaEditavel(no: Node): HTMLElement | null {
  const elemento = no.nodeType === Node.ELEMENT_NODE ? (no as HTMLElement) : no.parentElement
  return elemento?.closest('.texto') ?? null
}

/** Tira as marcas de tamanho que existirem dentro do trecho. */
function limparTamanhosDentro(raiz: HTMLElement) {
  const alvos = raiz.querySelectorAll<HTMLElement>(
    'span[style*="font-size"], span.txt-p, span.txt-g, span.txt-gg, font[size]',
  )

  for (const alvo of Array.from(alvos)) {
    alvo.replaceWith(...Array.from(alvo.childNodes))
  }
}

/**
 * Deixa o trecho selecionado, para dar para clicar de novo e continuar.
 *
 * Sendo um elemento so, a selecao fica por dentro dele, e nao em volta. E o
 * que permite o proximo clique enxergar o tamanho que acabou de ser aplicado.
 */
function selecionarEntre(nos: Node[]) {
  const selecao = window.getSelection()
  if (!selecao || nos.length === 0) return

  const intervalo = document.createRange()

  if (nos.length === 1 && nos[0].nodeType === Node.ELEMENT_NODE) {
    intervalo.selectNodeContents(nos[0])
  } else {
    intervalo.setStartBefore(nos[0])
    intervalo.setEndAfter(nos[nos.length - 1])
  }

  selecao.removeAllRanges()
  selecao.addRange(intervalo)
}
