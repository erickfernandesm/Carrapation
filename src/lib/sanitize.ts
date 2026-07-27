/**
 * Limpeza do conteudo digitado.
 *
 * O editor usa areas editaveis do proprio navegador, e ao colar de outro lugar
 * vem junto uma montanha de HTML. Aqui a gente mantem so o essencial e joga o
 * resto fora. Isso tambem impede que codigo estranho colado seja executado.
 */

import { CLASSES_TAMANHO, tamanhoValido } from './formatacao'

/** Etiquetas de formatacao que sobrevivem. Adicione outras se precisar. */
const ETIQUETAS_PERMITIDAS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'CODE', 'A', 'BR', 'SPAN',
])

/**
 * O span so sobrevive se carregar uma das classes de tamanho. Sem isso, todo
 * span colado de fora entraria, junto com o estilo que ele trouxesse.
 */
const CLASSES_PERMITIDAS = new Set<string>(CLASSES_TAMANHO)

/** Traducoes para deixar so uma etiqueta por efeito. */
const EQUIVALENTES: Record<string, string> = {
  STRONG: 'b',
  EM: 'i',
  STRIKE: 's',
}

export function limparHtml(sujo: string): string {
  const molde = document.createElement('div')
  molde.innerHTML = sujo

  const limpo = document.createElement('div')
  for (const filho of Array.from(molde.childNodes)) {
    const copia = copiarNo(filho)
    if (copia) limpo.appendChild(copia)
  }

  return limpo.innerHTML
}

function copiarNo(no: Node): Node | null {
  if (no.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(no.textContent ?? '')
  }

  if (no.nodeType !== Node.ELEMENT_NODE) return null

  const elemento = no as HTMLElement

  // Span so sobrevive se carregar tamanho, seja em porcentagem ou numa das
  // classes antigas. Sem isso a casca sai e o texto de dentro fica.
  const spanSemTamanho =
    elemento.tagName === 'SPAN' &&
    !tamanhoValido(elemento.style.fontSize ?? '') &&
    !Array.from(elemento.classList).some((c) => CLASSES_PERMITIDAS.has(c))

  if (!ETIQUETAS_PERMITIDAS.has(elemento.tagName) || spanSemTamanho) {
    // Etiqueta barrada: descarta a casca, mas preserva o texto de dentro.
    const fragmento = document.createDocumentFragment()
    for (const filho of Array.from(elemento.childNodes)) {
      const copia = copiarNo(filho)
      if (copia) fragmento.appendChild(copia)
    }
    return fragmento
  }

  const nome = EQUIVALENTES[elemento.tagName] ?? elemento.tagName.toLowerCase()
  const novo = document.createElement(nome)

  if (nome === 'span') {
    /*
     * Do span passa so o tamanho, e mais nada.
     *
     * A porcentagem e reescrita a partir do numero, e nao copiada como veio.
     * Assim nada que tenha vindo colado de um site entra junto, por mais
     * criativo que seja o estilo original.
     */
    if (tamanhoValido(elemento.style.fontSize ?? '')) {
      novo.style.fontSize = `${Math.round(Number(elemento.style.fontSize.replace('%', '')))}%`
    }

    const classe = Array.from(elemento.classList).find((c) => CLASSES_PERMITIDAS.has(c))
    if (classe) novo.className = classe
  }

  if (nome === 'a') {
    const destino = elemento.getAttribute('href') ?? ''
    if (/^(https?:|mailto:|#|\/)/i.test(destino)) {
      novo.setAttribute('href', destino)
      novo.setAttribute('target', '_blank')
      novo.setAttribute('rel', 'noreferrer noopener')
    }
  }

  for (const filho of Array.from(elemento.childNodes)) {
    const copia = copiarNo(filho)
    if (copia) novo.appendChild(copia)
  }

  return novo
}

/** Extrai apenas o texto puro de um trecho de HTML. */
export function apenasTexto(html: string): string {
  const molde = document.createElement('div')
  molde.innerHTML = html
  return molde.textContent ?? ''
}

/** Transforma texto puro em HTML seguro para exibicao. */
export function escaparTexto(texto: string): string {
  const molde = document.createElement('div')
  molde.textContent = texto
  return molde.innerHTML
}
