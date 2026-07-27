/**
 * Contrato de armazenamento.
 *
 * Este arquivo e a fronteira entre a interface e o lugar onde os dados moram.
 * A interface nunca fala com o navegador nem com um servidor diretamente,
 * ela fala com um Adaptador.
 *
 * Para ligar o Carrapation a um servidor no futuro, basta escrever um novo
 * arquivo que cumpra este contrato e trocar a linha final de storage/index.ts.
 * Nenhum componente de tela precisa ser alterado.
 */

import type { Workspace } from '../types'

export interface Adaptador {
  /** Nome curto do adaptador, util para diagnostico. */
  nome: string
  /**
   * Diz de quem e o espaco que sera lido e gravado daqui para frente.
   * Precisa ser chamado antes de carregar. Cada conta tem o seu espaco, entao
   * e isto que mantem o conteudo de uma pessoa separado do da outra.
   */
  definirUsuario(usuario: string): void
  /** Carrega o espaco salvo. Devolve null quando nao existe nada ainda. */
  carregar(): Promise<Workspace | null>
  /** Grava o espaco por inteiro. */
  salvar(espaco: Workspace): Promise<void>
  /** Apaga tudo que estiver salvo. */
  limpar(): Promise<void>
}
