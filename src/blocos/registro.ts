/**
 * Registro de blocos.
 *
 * Cada tipo de bloco do editor esta descrito aqui, em um objeto so.
 * Para criar um bloco novo:
 *   1. adicione o nome dele em BlockType, no arquivo src/types.ts
 *   2. adicione uma entrada nesta lista
 *   3. se ele tiver aparencia propria, crie a classe no arquivo src/styles/app.css
 *
 * Nao precisa mexer no editor. O menu da barra "/", os atalhos de markdown,
 * o menu de transformar bloco e a renderizacao leem tudo desta lista.
 */

import type { BlockType } from '../types'

export interface DefinicaoBloco {
  tipo: BlockType
  /** Nome que aparece no menu da barra "/". */
  rotulo: string
  /** Explicacao curta mostrada ao lado do nome no menu. */
  descricao: string
  /** Icone do menu. */
  icone: string
  /** Agrupamento no menu da barra "/". */
  grupo: 'Texto' | 'Listas' | 'Destaques' | 'Midia'
  /** Palavras que tambem encontram este bloco na busca do menu. */
  sinonimos: string[]
  /** Se o bloco tem uma area de texto editavel. */
  editavel: boolean
  /** Texto cinza mostrado quando o bloco esta vazio. */
  dica?: string
  /** Classe CSS aplicada na linha do bloco. */
  classe: string
  /**
   * Atalho de markdown. Quando o inicio do texto casa com este padrao,
   * o bloco se transforma sozinho e o gatilho e apagado.
   */
  markdown?: RegExp
  /** Se Enter dentro deste bloco cria outro bloco do mesmo tipo. */
  continua: boolean
  /** Se aparece no menu da barra "/". */
  noMenu: boolean
  /**
   * Quando preenchido, escolher no menu nao cria bloco nenhum: o editor executa
   * esta acao no lugar. Serve para o que vive fora do fluxo do texto, como a
   * imagem solta, que fica numa camada por cima da pagina.
   */
  acao?: 'imagem-solta' | 'desenhar'
}

export const BLOCOS: DefinicaoBloco[] = [
  {
    tipo: 'paragraph',
    rotulo: 'Texto',
    descricao: 'Um paragrafo comum',
    icone: '¶',
    grupo: 'Texto',
    sinonimos: ['paragrafo', 'texto', 'p'],
    editavel: true,
    dica: 'Escreva algo, ou digite / para os blocos',
    classe: 'bl-paragrafo',
    continua: false,
    noMenu: true,
  },
  {
    tipo: 'heading1',
    rotulo: 'Titulo grande',
    descricao: 'Titulo de secao principal',
    icone: 'H1',
    grupo: 'Texto',
    sinonimos: ['titulo', 'h1', 'cabecalho'],
    editavel: true,
    dica: 'Titulo grande',
    classe: 'bl-titulo1',
    markdown: /^#\s/,
    continua: false,
    noMenu: true,
  },
  {
    tipo: 'heading2',
    rotulo: 'Titulo medio',
    descricao: 'Titulo de subsecao',
    icone: 'H2',
    grupo: 'Texto',
    sinonimos: ['titulo', 'h2', 'subtitulo'],
    editavel: true,
    dica: 'Titulo medio',
    classe: 'bl-titulo2',
    markdown: /^##\s/,
    continua: false,
    noMenu: true,
  },
  {
    tipo: 'heading3',
    rotulo: 'Titulo pequeno',
    descricao: 'Titulo de terceiro nivel',
    icone: 'H3',
    grupo: 'Texto',
    sinonimos: ['titulo', 'h3'],
    editavel: true,
    dica: 'Titulo pequeno',
    classe: 'bl-titulo3',
    markdown: /^###\s/,
    continua: false,
    noMenu: true,
  },
  {
    tipo: 'bulleted',
    rotulo: 'Lista com marcadores',
    descricao: 'Itens soltos, sem ordem',
    icone: '-',
    grupo: 'Listas',
    sinonimos: ['lista', 'bullet', 'marcador', 'topico'],
    editavel: true,
    dica: 'Item da lista',
    classe: 'bl-lista',
    markdown: /^[-*]\s/,
    continua: true,
    noMenu: true,
  },
  {
    tipo: 'numbered',
    rotulo: 'Lista numerada',
    descricao: 'Itens em sequencia, no formato 1 -',
    icone: '1 -',
    grupo: 'Listas',
    sinonimos: ['lista', 'numero', 'ordenada', 'passo'],
    editavel: true,
    dica: 'Item da lista',
    classe: 'bl-numerada',
    /*
     * Aceita "1 ", "1. ", "1) " e "1- ".
     * Numero de dois ou tres digitos exige a pontuacao de proposito: sem isso,
     * escrever "2026 foi" viraria lista sem querer. Com um digito so o risco e
     * pequeno, entao "1 " sozinho ja vale.
     */
    markdown: /^(\d{1,3}[.)-]|\d)\s/,
    continua: true,
    noMenu: true,
  },
  {
    tipo: 'todo',
    rotulo: 'Tarefa',
    descricao: 'Item com caixa para marcar',
    icone: '☑',
    grupo: 'Listas',
    sinonimos: ['tarefa', 'todo', 'checklist', 'caixa', 'afazer'],
    editavel: true,
    dica: 'O que precisa ser feito',
    classe: 'bl-tarefa',
    markdown: /^\[[ x]?\]\s/,
    continua: true,
    noMenu: true,
  },
  {
    tipo: 'quote',
    rotulo: 'Citacao',
    descricao: 'Trecho destacado por uma barra',
    icone: '❝',
    grupo: 'Destaques',
    sinonimos: ['citacao', 'quote', 'frase'],
    editavel: true,
    dica: 'Citacao',
    classe: 'bl-citacao',
    markdown: /^>\s/,
    continua: false,
    noMenu: true,
  },
  {
    tipo: 'callout',
    rotulo: 'Aviso',
    descricao: 'Caixa colorida com um emoji',
    icone: '💡',
    grupo: 'Destaques',
    sinonimos: ['aviso', 'callout', 'destaque', 'nota', 'atencao'],
    editavel: true,
    dica: 'Escreva o aviso',
    classe: 'bl-aviso',
    continua: false,
    noMenu: true,
  },
  {
    tipo: 'divider',
    rotulo: 'Divisor',
    descricao: 'Linha horizontal separando trechos',
    icone: '─',
    grupo: 'Destaques',
    sinonimos: ['divisor', 'linha', 'separador', 'hr'],
    editavel: false,
    classe: 'bl-divisor',
    markdown: /^---\s?/,
    continua: false,
    noMenu: true,
  },
  {
    // O tipo aqui nao e usado: esta entrada tem acao propria e nao vira bloco.
    tipo: 'image',
    acao: 'desenhar',
    rotulo: 'Desenhar',
    descricao: 'Rabisque com o mouse por cima da pagina, como com caneta',
    icone: '✍️',
    grupo: 'Midia',
    sinonimos: ['desenhar', 'desenho', 'rabisco', 'caneta', 'escrever a mao', 'mouse'],
    editavel: false,
    classe: '',
    continua: false,
    noMenu: true,
  },
  {
    // O tipo aqui nao e usado: esta entrada tem acao propria e nao vira bloco.
    tipo: 'image',
    acao: 'imagem-solta',
    rotulo: 'Imagem solta',
    descricao: 'Foto que voce arrasta e posiciona onde quiser na pagina',
    icone: '📌',
    grupo: 'Midia',
    sinonimos: ['imagem solta', 'foto solta', 'flutuante', 'mover', 'arrastar', 'adesivo', 'sticker'],
    editavel: false,
    classe: '',
    continua: false,
    noMenu: true,
  },
  {
    tipo: 'calendar',
    rotulo: 'Calendario',
    descricao: 'Grade de um mes, com anotacoes por dia',
    icone: '📅',
    grupo: 'Midia',
    sinonimos: ['calendario', 'mes', 'agenda', 'data', 'planner', 'cronograma'],
    editavel: false,
    classe: 'bl-calendario',
    continua: false,
    noMenu: true,
  },
  {
    tipo: 'image',
    rotulo: 'Imagem',
    descricao: 'Foto do computador ou de um endereco',
    icone: '🖼️',
    grupo: 'Midia',
    sinonimos: ['imagem', 'foto', 'figura', 'print'],
    editavel: false,
    classe: 'bl-imagem',
    continua: false,
    noMenu: true,
  },
]

/** Busca a definicao de um tipo. Cai no paragrafo se o tipo for desconhecido. */
export function definicao(tipo: BlockType): DefinicaoBloco {
  return BLOCOS.find((b) => b.tipo === tipo) ?? BLOCOS[0]
}

/** Ordem em que os grupos aparecem no menu da barra "/". */
export const ORDEM_GRUPOS: DefinicaoBloco['grupo'][] = ['Texto', 'Listas', 'Destaques', 'Midia']

/** Filtra os blocos do menu pelo que o usuario digitou depois da barra. */
export function buscarBlocos(termo: string): DefinicaoBloco[] {
  const alvo = termo.trim().toLowerCase()
  const candidatos = BLOCOS.filter((b) => b.noMenu)
  if (!alvo) return candidatos

  return candidatos.filter((b) => {
    const campos = [b.rotulo, b.descricao, ...b.sinonimos].join(' ').toLowerCase()
    return campos.includes(alvo)
  })
}

/** Descobre se o texto digitado aciona algum atalho de markdown. */
export function atalhoMarkdown(texto: string): DefinicaoBloco | null {
  for (const bloco of BLOCOS) {
    if (bloco.markdown && bloco.markdown.test(texto)) return bloco
  }
  return null
}
