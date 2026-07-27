/**
 * Indice de situacao das paginas.
 *
 * Uma pagina pode ter situacao por dois caminhos:
 *   1. ela e uma tarefa de calendario, e a situacao vem da tarefa
 *   2. ela e uma pagina comum com categoria e situacao escolhidas na mao
 *
 * A barra lateral e as listas precisam disso a todo momento. Percorrer os
 * calendarios a cada item sairia caro, entao o indice e montado uma vez so no
 * estado central e todo mundo le dele.
 */

import type { CategoriaTarefa, StatusTarefa, Workspace } from '../types'
import { categoriaPorId, definicaoStatus, lerDia, statusEfetivo } from '../calendario'

export interface InfoTarefa {
  /** Data da tarefa. Vazio em pagina comum, que nao tem prazo. */
  data?: string
  /** Situacao ja calculada, incluindo o atraso automatico das tarefas. */
  status: StatusTarefa | undefined
  feito: boolean
  hora?: string
  categoria: CategoriaTarefa | null
  /** true quando veio de um calendario, false quando e pagina comum. */
  ehTarefa: boolean
}

/** Monta o indice paginaId para informacoes de situacao. */
export function indexarTarefas(espaco: Workspace): Record<string, InfoTarefa> {
  const indice: Record<string, InfoTarefa> = {}
  const categorias = espaco.categories ?? []

  // Primeiro as paginas comuns, com o que foi escolhido na propria pagina.
  for (const pagina of Object.values(espaco.pages)) {
    if (!pagina.categoriaId && !pagina.status) continue

    indice[pagina.id] = {
      status: pagina.status,
      feito: false,
      categoria: categoriaPorId(categorias, pagina.categoriaId),
      ehTarefa: false,
    }
  }

  // Depois as tarefas de calendario, que tem prioridade: se a pagina e uma
  // tarefa, e a tarefa que manda no prazo e no finalizada.
  for (const pagina of Object.values(espaco.pages)) {
    for (const bloco of pagina.blocks) {
      if (bloco.type !== 'calendar' || !bloco.events) continue

      for (const data of Object.keys(bloco.events)) {
        for (const tarefa of lerDia(bloco.events, data)) {
          if (!tarefa.paginaId) continue

          indice[tarefa.paginaId] = {
            data,
            status: statusEfetivo(data, tarefa),
            feito: !!tarefa.feito,
            hora: tarefa.hora,
            categoria: categoriaPorId(categorias, tarefa.categoriaId),
            ehTarefa: true,
          }
        }
      }
    }
  }

  return indice
}

/** Verde de finalizada. Fixo de proposito, para nao mudar junto com o destaque. */
export const COR_FINALIZADA = '#0f7a6c'

/**
 * Texto mostrado ao passar o mouse.
 * Em tarefa fica "Em andamento, prazo 27/07/2026 as 14:30, Reuniao".
 * Em pagina comum fica so a situacao e a categoria, que e o que existe.
 */
export function descricaoDaSituacao(info: InfoTarefa): string {
  const partes: string[] = []

  if (info.feito) partes.push('Finalizada')
  else if (info.status) partes.push(definicaoStatus(info.status)?.nome ?? '')

  if (info.data) {
    const [ano, mes, dia] = info.data.split('-')
    partes.push(`prazo ${dia}/${mes}/${ano}${info.hora ? ` as ${info.hora}` : ''}`)
  }

  if (info.categoria) partes.push(info.categoria.nome)

  return partes.filter(Boolean).join(', ') || 'Sem situacao'
}
