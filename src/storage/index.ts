/**
 * Escolha do adaptador de armazenamento.
 *
 * Esta e a unica linha que precisa mudar para o Carrapation passar a salvar
 * num servidor em vez de salvar no navegador.
 */

import { adaptadorLocal } from './adaptadorLocal'

export const armazenamento = adaptadorLocal

export type { Adaptador } from './adaptador'
