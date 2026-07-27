/**
 * Modelos de pagina.
 *
 * Sao as opcoes oferecidas ao criar uma pagina nova. Cada modelo diz com o que
 * a pagina ja nasce: icone, titulo, capa e os blocos iniciais.
 *
 * Para criar um modelo novo, adicione uma entrada na lista MODELOS. O menu de
 * nova pagina le tudo daqui, nao precisa mexer em mais nada.
 */

import type { Block, Page } from './types'
import { novoId } from './lib/id'
import { mesDeHoje } from './calendario'

/** O que um modelo entrega para a pagina nova. */
export interface ConteudoModelo {
  title: string
  icon: string
  cover: string | null
  blocks: Block[]
}

export interface Modelo {
  id: string
  nome: string
  descricao: string
  icone: string
  /** Montado na hora, para o calendario abrir sempre no mes corrente. */
  montar: () => ConteudoModelo
}

/** Atalho para escrever os blocos de forma curta nos modelos abaixo. */
function bloco(tipo: Block['type'], html = '', extras: Partial<Block> = {}): Block {
  return { id: novoId(), type: tipo, html, ...extras }
}

export const MODELOS: Modelo[] = [
  {
    id: 'branco',
    nome: 'Pagina em branco',
    descricao: 'Comece do zero, sem nada pronto',
    icone: '📄',
    montar: () => ({
      title: '',
      icon: '',
      cover: null,
      blocks: [bloco('paragraph')],
    }),
  },
  {
    id: 'checklist',
    nome: 'Checklist',
    descricao: 'Lista de tarefas com caixas para marcar',
    icone: '✅',
    montar: () => ({
      title: '',
      icon: '✅',
      cover: null,
      blocks: [
        bloco('callout', 'Marque as caixas conforme for concluindo. Enter cria a proxima tarefa.', {
          icon: '💡',
        }),
        bloco('heading2', 'A fazer'),
        bloco('todo', '', { checked: false }),
        bloco('todo', '', { checked: false }),
        bloco('todo', '', { checked: false }),
        bloco('heading2', 'Concluido'),
        bloco('todo', '', { checked: true }),
        bloco('paragraph'),
      ],
    }),
  },
  {
    id: 'calendario',
    nome: 'Calendario',
    descricao: 'Grade do mes, com anotacoes por dia',
    icone: '📅',
    montar: () => ({
      title: '',
      icon: '📅',
      cover: null,
      blocks: [
        bloco('calendar', '', { month: mesDeHoje(), events: {}, categories: [] }),
        bloco('heading2', 'Compromissos do mes'),
        bloco('todo', '', { checked: false }),
        bloco('paragraph'),
      ],
    }),
  },
]

/** Busca um modelo pelo id. Cai na pagina em branco se o id nao existir. */
export function modeloPorId(id: string | undefined): Modelo {
  return MODELOS.find((m) => m.id === id) ?? MODELOS[0]
}

/** Aplica um modelo aos campos de uma pagina recem criada. */
export function aplicarModelo(pagina: Page, modeloId: string | undefined): Page {
  const conteudo = modeloPorId(modeloId).montar()
  return { ...pagina, ...conteudo }
}
