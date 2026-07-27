/**
 * Temas de fundo.
 *
 * Existem dois tipos, e o resto do sistema nao precisa saber a diferenca:
 *   - os que vem prontos, que sao arquivos na pasta assets
 *   - os que o usuario cria, com imagem do computador dele, guardada embutida
 *
 * As duas formas passam pelo mesmo desenho na tela, entao herdam o mesmo
 * tamanho e o mesmo esfumado nas laterais, que ficam no CSS.
 */

import type { Workspace } from '../types'
import { TEMAS_FUNDO } from '../config'

export interface TemaVisivel {
  id: string
  nome: string
  /** Endereco pronto para usar em background-image. */
  imagem: string
  /** Se foi criado pelo usuario, e portanto pode ser apagado. */
  proprio: boolean
}

/** Todos os temas disponiveis, os prontos primeiro e os do usuario depois. */
export function temasDisponiveis(espaco: Workspace): TemaVisivel[] {
  const prontos: TemaVisivel[] = TEMAS_FUNDO.map((tema) => ({
    id: tema.id,
    nome: tema.nome,
    imagem: `${import.meta.env.BASE_URL}${tema.arquivo}`,
    proprio: false,
  }))

  const meus: TemaVisivel[] = (espaco.temasProprios ?? []).map((tema) => ({
    id: tema.id,
    nome: tema.nome,
    imagem: tema.imagem,
    proprio: true,
  }))

  return [...prontos, ...meus]
}

/** O tema em uso agora, ou null quando nenhum foi escolhido. */
export function temaEscolhido(espaco: Workspace): TemaVisivel | null {
  if (!espaco.fundo) return null
  return temasDisponiveis(espaco).find((t) => t.id === espaco.fundo) ?? null
}
