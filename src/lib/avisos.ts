/**
 * Coleta as tarefas de calendario que merecem aviso.
 *
 * Percorre todas as paginas do espaco atras de blocos de calendario e separa
 * o que esta vencido, o que e para hoje e o que vem nos proximos dias.
 * Tarefas finalizadas ficam de fora.
 */

import type { AnotacaoDia, CategoriaTarefa, StatusTarefa, Workspace } from '../types'
import { categoriaPorId, chaveDeData, lerDia, statusEfetivo } from '../calendario'

/** Quantos dias para frente entram em "Proximas". */
const JANELA_PROXIMAS = 7

export interface Aviso {
  paginaId: string
  paginaTitulo: string
  paginaIcone: string
  /** Data no formato AAAA-MM-DD. */
  data: string
  tarefa: AnotacaoDia
  /** Situacao ja calculada, incluindo o atraso automatico. */
  status: StatusTarefa | undefined
  categoria: CategoriaTarefa | null
}

export interface Avisos {
  vencidas: Aviso[]
  hoje: Aviso[]
  proximas: Aviso[]
  /** Soma de vencidas e de hoje, que e o que acende o sininho. */
  total: number
}

export function coletarAvisos(espaco: Workspace): Avisos {
  const hoje = chaveDeData(new Date())
  const limite = chaveDeData(somarDias(new Date(), JANELA_PROXIMAS))

  const vencidas: Aviso[] = []
  const paraHoje: Aviso[] = []
  const proximas: Aviso[] = []

  for (const pagina of Object.values(espaco.pages)) {
    for (const bloco of pagina.blocks) {
      if (bloco.type !== 'calendar' || !bloco.events) continue

      const categorias = bloco.categories ?? []

      for (const data of Object.keys(bloco.events)) {
        for (const tarefa of lerDia(bloco.events, data)) {
          if (tarefa.feito) continue

          const aviso: Aviso = {
            paginaId: pagina.id,
            paginaTitulo: pagina.title || 'Sem titulo',
            paginaIcone: pagina.icon,
            data,
            tarefa,
            // A situacao ja vem calculada, entao o que passou do prazo aparece
            // como atrasado mesmo sem ninguem ter marcado na mao.
            status: statusEfetivo(data, tarefa),
            categoria: categoriaPorId(categorias, tarefa.categoriaId),
          }

          // As datas estao em AAAA-MM-DD, entao a comparacao de texto ja
          // funciona como comparacao de calendario.
          if (data < hoje) vencidas.push(aviso)
          else if (data === hoje) paraHoje.push(aviso)
          else if (data <= limite) proximas.push(aviso)
        }
      }
    }
  }

  vencidas.sort(porDataEHora)
  paraHoje.sort(porDataEHora)
  proximas.sort(porDataEHora)

  return {
    vencidas,
    hoje: paraHoje,
    proximas,
    total: vencidas.length + paraHoje.length,
  }
}

/**
 * Identificacao de um aviso, usada para lembrar o que ja foi visto.
 * Inclui a data, entao adiar uma tarefa faz o aviso voltar a ser novidade.
 */
export function chaveDoAviso(aviso: Aviso): string {
  return `${aviso.paginaId}|${aviso.data}`
}

function porDataEHora(a: Aviso, b: Aviso): number {
  if (a.data !== b.data) return a.data.localeCompare(b.data)
  return (a.tarefa.hora ?? '99:99').localeCompare(b.tarefa.hora ?? '99:99')
}

function somarDias(data: Date, dias: number): Date {
  const nova = new Date(data)
  nova.setDate(nova.getDate() + dias)
  return nova
}

/** Data em formato curto, para as linhas do painel de avisos. */
export function dataCurta(chave: string): string {
  const [ano, mes, dia] = chave.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

/** Quantos dias a tarefa esta atrasada. */
export function diasDeAtraso(chave: string): number {
  const [ano, mes, dia] = chave.split('-').map(Number)
  const alvo = new Date(ano, mes - 1, dia)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.round((hoje.getTime() - alvo.getTime()) / 86400000)
}
