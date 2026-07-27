/**
 * Ajustes e apoio do calendario.
 *
 * Os status das tarefas e as cores oferecidas para categorias estao aqui.
 * Para acrescentar um status novo, adicione o id em StatusTarefa (em
 * src/types.ts) e uma entrada na lista STATUS_TAREFA abaixo. O resto do
 * calendario le tudo desta lista.
 */

import type { AnotacaoDia, CategoriaTarefa, StatusTarefa } from './types'

export interface DefinicaoStatus {
  id: StatusTarefa
  nome: string
  cor: string
}

export const STATUS_TAREFA: DefinicaoStatus[] = [
  { id: 'pendente', nome: 'Pendente', cor: '#8a8a85' },
  { id: 'andamento', nome: 'Em andamento', cor: '#2563eb' },
  { id: 'urgente', nome: 'Urgente', cor: '#d4443a' },
  { id: 'atrasado', nome: 'Atrasado', cor: '#c2560c' },
]

/** Cores oferecidas ao criar uma categoria. */
export const CORES_CATEGORIA = [
  '#0f7a6c', '#2563eb', '#7c3aed', '#a3204f',
  '#c2560c', '#b45309', '#4d7c0f', '#3f3f46',
]

export function definicaoStatus(id: StatusTarefa | undefined): DefinicaoStatus | null {
  if (!id) return null
  return STATUS_TAREFA.find((s) => s.id === id) ?? null
}

export function categoriaPorId(
  categorias: CategoriaTarefa[],
  id: string | undefined,
): CategoriaTarefa | null {
  if (!id) return null
  return categorias.find((c) => c.id === id) ?? null
}

/** Mes de hoje no formato AAAA-MM. */
export function mesDeHoje(): string {
  const agora = new Date()
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}`
}

/** Data no formato AAAA-MM-DD, que e a chave usada nas tarefas. */
export function chaveDeData(data: Date): string {
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`
}

/** O mes AAAA-MM ao qual uma data AAAA-MM-DD pertence. */
export function mesDaChave(chave: string): string {
  return chave.slice(0, 7)
}

export function dois(numero: number): string {
  return String(numero).padStart(2, '0')
}

/**
 * Le as tarefas de um dia no formato atual, sem mexer na ordem.
 * Calendarios gravados antes guardavam texto puro, entao o formato antigo
 * ainda e aceito e convertido aqui na leitura.
 */
export function normalizarDia(
  eventos: Record<string, AnotacaoDia[]> | undefined,
  chave: string,
): AnotacaoDia[] {
  const lista = eventos?.[chave] as (AnotacaoDia | string)[] | undefined
  if (!lista) return []
  return lista.map((item) => (typeof item === 'string' ? { texto: item } : item))
}

/**
 * Le as tarefas de um dia ja ordenadas por horario.
 * Use esta para exibir. Para gravar, use normalizarDia, que preserva a ordem
 * guardada e nao embaralha os indices de quem esta editando.
 */
export function lerDia(
  eventos: Record<string, AnotacaoDia[]> | undefined,
  chave: string,
): AnotacaoDia[] {
  return normalizarDia(eventos, chave).sort(porHorario)
}

/** Tarefas com horario vem primeiro, em ordem. As sem horario ficam no fim. */
function porHorario(a: AnotacaoDia, b: AnotacaoDia): number {
  if (a.hora && b.hora) return a.hora.localeCompare(b.hora)
  if (a.hora) return -1
  if (b.hora) return 1
  return 0
}

/**
 * A tarefa passou do prazo?
 * Vale para tarefa nao finalizada com data anterior a hoje. Como as datas
 * estao no formato AAAA-MM-DD, comparar como texto ja funciona.
 */
export function estaAtrasada(data: string, tarefa: AnotacaoDia): boolean {
  if (tarefa.feito) return false
  return data < chaveDeData(new Date())
}

/**
 * Situacao que a tarefa mostra na tela.
 *
 * Passou do prazo e nao foi finalizada, ela aparece como atrasada sozinha.
 * Isso e calculado na hora de exibir, e nao gravado no dado. Assim a tarefa
 * se corrige sozinha quando o prazo muda ou quando e finalizada, e a situacao
 * que a pessoa escolheu na mao nunca e apagada.
 */
export function statusEfetivo(data: string, tarefa: AnotacaoDia): StatusTarefa | undefined {
  if (estaAtrasada(data, tarefa)) return 'atrasado'
  return tarefa.status
}

/** Texto completo da tarefa, usado no titulo que aparece ao passar o mouse. */
export function resumoDaTarefa(
  data: string,
  tarefa: AnotacaoDia,
  categorias: CategoriaTarefa[],
): string {
  const partes: string[] = []
  if (tarefa.hora) partes.push(tarefa.hora)
  partes.push(tarefa.texto)

  const categoria = categoriaPorId(categorias, tarefa.categoriaId)
  if (categoria) partes.push(`[${categoria.nome}]`)

  const status = definicaoStatus(statusEfetivo(data, tarefa))
  if (status) partes.push(`- ${status.nome}`)
  if (tarefa.feito) partes.push('- Finalizada')

  return partes.join(' ')
}

/** Data escrita por extenso, usada no cabecalho da pagina de uma tarefa. */
export function dataPorExtenso(chave: string): string {
  const [ano, mes, dia] = chave.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
