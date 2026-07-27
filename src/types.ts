/**
 * Tipos centrais do Carrapation.
 *
 * Se voce quer entender o sistema inteiro, comece por aqui.
 * Tudo que o app guarda cabe na interface Workspace la embaixo.
 */

/** Todos os tipos de bloco que o editor conhece. */
export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulleted'
  | 'numbered'
  | 'todo'
  | 'quote'
  | 'callout'
  | 'divider'
  | 'image'
  | 'calendar'

/** Um bloco e a menor unidade de conteudo de uma pagina. */
export interface Block {
  id: string
  type: BlockType
  /** Conteudo do bloco. Aceita formatacao inline simples (negrito, italico, link). */
  html: string
  /** Usado pelo bloco "todo": tarefa marcada ou nao. */
  checked?: boolean
  /** Usado pelo bloco "callout": o emoji que aparece na lateral. */
  icon?: string
  /** Usado pelo bloco "image": a imagem em si (data URL ou endereco externo). */
  src?: string
  /** Usado pelo bloco "image": legenda embaixo da foto. */
  caption?: string
  /**
   * Usado pelo bloco "image": largura em pixels, definida arrastando a borda.
   * Sem valor, a imagem ocupa a largura toda disponivel.
   */
  width?: number
  /** Usado pelo bloco "calendar": mes exibido, no formato AAAA-MM. */
  month?: string
  /**
   * Usado pelo bloco "calendar": como as tarefas sao mostradas.
   * As duas visoes leem os mesmos dados, muda so a forma de exibir.
   */
  view?: 'calendario' | 'tabela'
  /**
   * Usado pelo bloco "calendar": as anotacoes de cada dia.
   * A chave e a data no formato AAAA-MM-DD e o valor e a lista de anotacoes.
   */
  events?: Record<string, AnotacaoDia[]>
  /**
   * Usado pelo bloco "calendar": as categorias criadas pelo usuario.
   * Ficam guardadas no proprio bloco, entao viajam junto com a pagina.
   */
  categories?: CategoriaTarefa[]
}

/**
 * Um traco de desenho.
 *
 * Os pontos sao guardados em sequencia, tres numeros por ponto: x, y e
 * pressao. Guardar assim, num vetor unico de numeros, deixa o arquivo bem
 * menor do que uma lista de objetos.
 *
 * As posicoes sao proporcionais a largura da area de desenho, e nao em pixels.
 * Por isso o desenho continua igual em qualquer tamanho de tela.
 */
export interface TracoDesenho {
  cor: string
  largura: number
  pontos: number[]
}

/** Situacao de uma tarefa do calendario. */
export type StatusTarefa = 'pendente' | 'andamento' | 'urgente' | 'atrasado'

/** Uma categoria de tarefa, criada por quem usa o sistema. */
export interface CategoriaTarefa {
  id: string
  nome: string
  /** Cor em hexadecimal, usada na tarja lateral e na etiqueta. */
  cor: string
}

/** Uma tarefa dentro de um dia do calendario. */
export interface AnotacaoDia {
  /** Titulo da tarefa, o que aparece na grade do mes. */
  texto: string
  /** Descricao longa, so aparece ao abrir a tarefa. Opcional. */
  descricao?: string
  /** Horario no formato HH:MM. Opcional. */
  hora?: string
  /** Id de uma categoria criada pelo usuario. Opcional. */
  categoriaId?: string
  /** Situacao da tarefa. Opcional. */
  status?: StatusTarefa
  /** Quando ligado, a tarefa vira item de checklist e ganha caixa de marcar. */
  checklist?: boolean
  /** Vale so para tarefa em modo checklist: finalizada ou nao. */
  feito?: boolean
  /**
   * Id da pagina criada para detalhar esta tarefa.
   * Quando existe, a tarefa tem uma pagina propria na barra lateral.
   */
  paginaId?: string
}

/** Uma pagina do espaco de trabalho. Paginas podem ter paginas dentro. */
export interface Page {
  id: string
  title: string
  /** Emoji que aparece na barra lateral e no topo da pagina. Vazio quer dizer sem icone. */
  icon: string
  /**
   * Capa da pagina, a faixa larga que aparece acima do titulo.
   * Aceita tres formas: um endereco de imagem, uma imagem embutida em data URL,
   * ou um degrade em CSS comecando com "linear-gradient". null quer dizer sem capa.
   */
  cover?: string | null
  /** Altura visivel da capa, de 0 a 100. Serve para reposicionar a foto. */
  coverPos?: number
  /** null quando a pagina esta no primeiro nivel. */
  parentId: string | null
  /** Ordem das subpaginas. A ordem aqui e a ordem que aparece na lateral. */
  childIds: string[]
  blocks: Block[]
  favorite: boolean
  /** Categoria da pagina. Vale para qualquer pagina, nao so para tarefas. */
  categoriaId?: string
  /** Situacao da pagina. Vale para qualquer pagina, nao so para tarefas. */
  status?: StatusTarefa
  /**
   * Rabiscos feitos a mao por cima da pagina, com caneta de tablet.
   * E uma camada que cobre a pagina inteira, independente dos blocos.
   */
  drawing?: TracoDesenho[]
  createdAt: number
  updatedAt: number
}

/** Perfil de quem esta usando o sistema. */
export interface Profile {
  name: string
  email: string
  /** Foto do perfil guardada como data URL. null quando nao ha foto. */
  avatar: string | null
  /** Id da moldura aplicada na foto. Vazio quer dizer sem moldura. */
  moldura?: string
}

/**
 * Um tema de fundo criado pelo usuario.
 * A imagem vem do computador dele, entao fica embutida como data URL e viaja
 * junto no Exportar.
 */
export interface TemaProprio {
  id: string
  nome: string
  imagem: string
}

export type ThemeMode = 'light' | 'dark'
export type FontChoice = 'sans' | 'serif' | 'mono'

/**
 * O espaco de trabalho inteiro.
 * Isto e exatamente o que vai para o arquivo quando voce clica em Exportar.
 */
export interface Workspace {
  /** Versao do formato. Serve para migrar dados antigos no futuro. */
  version: number
  name: string
  icon: string
  profile: Profile
  /**
   * Categorias do espaco inteiro.
   * Ficam aqui, e nao dentro de cada calendario, porque valem tanto para as
   * tarefas quanto para paginas comuns.
   */
  categories: CategoriaTarefa[]
  /** Todas as paginas indexadas por id, para busca instantanea. */
  pages: Record<string, Page>
  /** Ordem das paginas de primeiro nivel. */
  rootIds: string[]
  theme: ThemeMode
  /** Cor de destaque em hexadecimal. Muda a cara do sistema inteiro. */
  accent: string
  font: FontChoice
  /** Largura do texto da pagina: normal ou largo. */
  wide: boolean
  /** Id do tema de fundo. Vazio quer dizer sem imagem de fundo. */
  fundo?: string
  /** O quanto a imagem de fundo aparece, de 0 a 1. */
  fundoIntensidade?: number
  /** Temas de fundo criados pelo usuario, com imagem do proprio computador. */
  temasProprios?: TemaProprio[]
  updatedAt: number
}
