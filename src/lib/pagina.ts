/** Funcoes de apoio para exibir paginas. */

import { ICONE_PADRAO } from '../config'
import type { Page } from '../types'

/**
 * Icone a mostrar na barra lateral, na trilha e nos links.
 * Paginas sem icone escolhido caem no padrao, para a lista nao ficar desalinhada.
 */
export function iconeDaPagina(pagina: Page): string {
  return pagina.icon || ICONE_PADRAO
}

/** Descobre se a capa e um degrade em CSS ou uma imagem. */
export function capaEhDegrade(capa: string): boolean {
  return capa.startsWith('linear-gradient') || capa.startsWith('radial-gradient')
}
