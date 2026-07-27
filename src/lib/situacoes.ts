/**
 * Lista todas as tarefas de calendario do espaco, agrupadas por situacao.
 *
 * Diferente dos avisos, que olham so o que esta vencido ou e para hoje, aqui
 * entra tudo: qualquer tarefa, de qualquer calendario, de qualquer data.
 */

import type { CategoriaTarefa, StatusTarefa, Workspace } from '../types'
import { categoriaPorId, lerDia, statusEfetivo, STATUS_TAREFA } from '../calendario'
import { COR_FINALIZADA } from './tarefas'

/** Os grupos sao as situacoes, mais dois casos que nao sao situacao escolhida. */
export type ChaveGrupo = StatusTarefa | 'sem' | 'finalizada'

export interface GrupoSituacao {
  chave: ChaveGrupo
  nome: string
  cor: string
}

/**
 * Ordem dos grupos: do mais urgente para o menos.
 * Finalizadas no fim, porque e o que ja saiu da frente.
 */
export const GRUPOS_SITUACAO: GrupoSituacao[] = [
  ...(['atrasado', 'urgente', 'andamento', 'pendente'] as StatusTarefa[]).map((chave) => {
    const definicao = STATUS_TAREFA.find((s) => s.id === chave)!
    return { chave: chave as ChaveGrupo, nome: definicao.nome, cor: definicao.cor }
  }),
  { chave: 'sem', nome: 'Sem situacao', cor: '#9a9a95' },
  { chave: 'finalizada', nome: 'Finalizadas', cor: COR_FINALIZADA },
]

export interface TarefaListada {
  /** Pagina da tarefa. null em tarefas antigas, que ainda nao tinham pagina. */
  paginaId: string | null
  titulo: string
  icone: string
  data: string
  hora?: string
  grupo: ChaveGrupo
  categoria: CategoriaTarefa | null
  /** Pagina onde o calendario esta, para dar contexto na lista. */
  calendarioId: string
  calendarioTitulo: string
}

export function listarTarefas(espaco: Workspace): TarefaListada[] {
  const lista: TarefaListada[] = []
  const categorias = espaco.categories ?? []
  /** Paginas que ja entraram como tarefa de calendario, para nao duplicar. */
  const jaListadas = new Set<string>()

  for (const pagina of Object.values(espaco.pages)) {
    for (const bloco of pagina.blocks) {
      if (bloco.type !== 'calendar' || !bloco.events) continue

      for (const data of Object.keys(bloco.events)) {
        for (const tarefa of lerDia(bloco.events, data)) {
          const paginaDaTarefa = tarefa.paginaId ? espaco.pages[tarefa.paginaId] : null
          if (tarefa.paginaId) jaListadas.add(tarefa.paginaId)

          lista.push({
            paginaId: tarefa.paginaId ?? null,
            titulo: paginaDaTarefa?.title || tarefa.texto || 'Sem titulo',
            icone: paginaDaTarefa?.icon || '🗓️',
            data,
            hora: tarefa.hora,
            grupo: tarefa.feito ? 'finalizada' : (statusEfetivo(data, tarefa) ?? 'sem'),
            categoria: categoriaPorId(categorias, tarefa.categoriaId),
            calendarioId: pagina.id,
            calendarioTitulo: pagina.title || 'Sem titulo',
          })
        }
      }
    }
  }

  // Paginas comuns que receberam situacao ou categoria na mao tambem entram.
  // Elas nao tem prazo, entao ficam com a data vazia e vao para o fim.
  for (const pagina of Object.values(espaco.pages)) {
    if (jaListadas.has(pagina.id)) continue
    if (!pagina.status && !pagina.categoriaId) continue

    lista.push({
      paginaId: pagina.id,
      titulo: pagina.title || 'Sem titulo',
      icone: pagina.icon || '📄',
      data: '',
      grupo: pagina.status ?? 'sem',
      categoria: categoriaPorId(categorias, pagina.categoriaId),
      calendarioId: pagina.id,
      calendarioTitulo: pagina.title || 'Sem titulo',
    })
  }

  return lista.sort(porDataEHora)
}

/** Quantas tarefas em cada grupo, para o numero ao lado de cada filtro. */
export function contarPorGrupo(tarefas: TarefaListada[]): Record<ChaveGrupo, number> {
  const contas = {} as Record<ChaveGrupo, number>
  for (const grupo of GRUPOS_SITUACAO) contas[grupo.chave] = 0
  for (const tarefa of tarefas) contas[tarefa.grupo] += 1
  return contas
}

function porDataEHora(a: TarefaListada, b: TarefaListada): number {
  if (a.data !== b.data) return a.data.localeCompare(b.data)
  return (a.hora ?? '99:99').localeCompare(b.hora ?? '99:99')
}
