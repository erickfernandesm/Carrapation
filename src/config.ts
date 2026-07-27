/**
 * Painel de controle do Carrapation.
 *
 * Quase toda personalizacao rapida do sistema esta neste arquivo.
 * Mudou aqui, mudou no app inteiro. Nao precisa caçar codigo espalhado.
 */

import type { Workspace } from './types'
import { novoId } from './lib/id'

/** Nome que aparece no topo, no titulo da aba e nos arquivos exportados. */
export const APP_NOME = 'Carrapation'

/** Chave usada para salvar no navegador. Trocar isto cria um espaco novo em branco. */
export const CHAVE_ARMAZENAMENTO = 'carrapation:workspace:v1'

/** Versao do formato de dados. Suba quando mudar a estrutura de Workspace. */
export const VERSAO_DADOS = 3

/** Cores de destaque oferecidas nas Configuracoes. Adicione as suas a vontade. */
export const CORES_DESTAQUE = [
  { nome: 'Grafite', valor: '#3f3f46' },
  { nome: 'Verde', valor: '#0f7a6c' },
  { nome: 'Azul', valor: '#2563eb' },
  { nome: 'Roxo', valor: '#7c3aed' },
  { nome: 'Vinho', valor: '#a3204f' },
  { nome: 'Laranja', valor: '#c2560c' },
] as const

/** Icone usado quando a pagina nao tem um escolhido. */
export const ICONE_PADRAO = '📄'

/** Onde ficam guardados os ultimos icones usados. */
export const CHAVE_RECENTES = 'carrapation:icones-recentes'

/**
 * Onde fica guardado quais avisos ja foram vistos.
 * Fica fora do espaco de trabalho de proposito: o que ja foi lido e de quem
 * esta usando este navegador, e nao do conteudo. Por isso nao vai no Exportar.
 */
export const CHAVE_AVISOS_VISTOS = 'carrapation:avisos-vistos'

/** Quantos icones recentes o seletor lembra. */
export const QUANTIDADE_RECENTES = 20

/**
 * Capas prontas, para quem nao quer subir uma imagem.
 * Sao degrades em CSS, entao nao pesam nada no arquivo salvo.
 * Adicione as suas a vontade, qualquer valor valido de background serve.
 */
export const CAPAS_PRONTAS = [
  { nome: 'Grafite', valor: 'linear-gradient(120deg, #3f3f46 0%, #18181b 100%)' },
  { nome: 'Verde', valor: 'linear-gradient(120deg, #0f7a6c 0%, #064e42 100%)' },
  { nome: 'Oceano', valor: 'linear-gradient(120deg, #2563eb 0%, #0f172a 100%)' },
  { nome: 'Uva', valor: 'linear-gradient(120deg, #7c3aed 0%, #4c1d95 100%)' },
  { nome: 'Poente', valor: 'linear-gradient(120deg, #f97316 0%, #a3204f 100%)' },
  { nome: 'Areia', valor: 'linear-gradient(120deg, #e7d7c1 0%, #c2a887 100%)' },
  { nome: 'Menta', valor: 'linear-gradient(120deg, #a7f3d0 0%, #5eead4 100%)' },
  { nome: 'Papel', valor: 'linear-gradient(120deg, #f4f4f2 0%, #d5d5d1 100%)' },
]

/**
 * Temas de fundo.
 *
 * Cada tema poe uma imagem por tras do sistema inteiro, bem apagada, para nao
 * atrapalhar a leitura. O arquivo fica na pasta assets, que e servida na raiz.
 *
 * Para criar um tema novo: jogue a imagem em assets e acrescente uma linha
 * aqui. opacidade vai de 0 a 1, e quanto menor, mais discreto fica.
 */
export const TEMAS_FUNDO = [
  { id: 'cbjr', nome: 'Charlie Brown Jr', arquivo: 'capacbjr.webp' },
  { id: 'taylor', nome: 'Taylor Swift', arquivo: 'capataylor.jpeg' },
]

/**
 * O quanto a imagem de fundo aparece, de 0 a 1, quando o tema e escolhido.
 * Comeca bem baixo de proposito: o fundo e um detalhe, e nao pode competir
 * com o texto. Quem quiser mais forte sobe na barra dentro do perfil.
 */
export const INTENSIDADE_FUNDO_PADRAO = 0.05

/**
 * Molduras da foto de perfil.
 *
 * O arquivo fica na pasta assets, que e servida na raiz do site. Para incluir
 * uma moldura nova: salve o SVG em assets, rode "npm run marca" se ele vier do
 * CorelDRAW, e acrescente uma linha aqui.
 *
 * escala diz o quanto a moldura passa do tamanho da foto. 1 e do mesmo
 * tamanho, 1.4 e quarenta por cento maior. Ajuste conforme o desenho da sua.
 */
export const MOLDURAS = [
  { id: 'rosa', nome: 'Calanga', arquivo: 'moldura-rosa.svg', escala: 1.42 },
  { id: 'dourada', nome: 'Dourada', arquivo: 'moldura-dourada.svg', escala: 1.3 },
  { id: 'neon', nome: 'Neon', arquivo: 'moldura-neon.svg', escala: 1.3 },
  { id: 'folhas', nome: 'Folhas', arquivo: 'moldura-folhas.svg', escala: 1.34 },
  { id: 'estrelas', nome: 'Estrelas', arquivo: 'moldura-estrelas.svg', escala: 1.32 },
  { id: 'coracoes', nome: 'Coracoes', arquivo: 'moldura-coracoes.svg', escala: 1.34 },
  { id: 'pontilhada', nome: 'Pontilhada', arquivo: 'moldura-pontilhada.svg', escala: 1.3 },
]

/** Cores da caneta do bloco de desenho. */
export const CORES_CANETA = [
  { nome: 'Tinta', valor: '#2b2b28' },
  { nome: 'Azul', valor: '#2563eb' },
  { nome: 'Vermelho', valor: '#d4443a' },
  { nome: 'Verde', valor: '#0f7a6c' },
  { nome: 'Roxo', valor: '#7c3aed' },
  { nome: 'Laranja', valor: '#c2560c' },
]

/** Espessuras da caneta, em pixels. */
export const ESPESSURAS_CANETA = [
  { nome: 'Fina', valor: 1.5 },
  { nome: 'Media', valor: 3 },
  { nome: 'Grossa', valor: 6 },
]

/** Altura inicial da area de desenho, em pixels. */
export const ALTURA_DESENHO = 340

/** Tamanho maximo aceito para a foto de perfil, em megabytes. */
export const LIMITE_FOTO_MB = 3

/** Tamanho maximo aceito para imagens dentro das paginas, em megabytes. */
export const LIMITE_IMAGEM_MB = 5

/** Tamanho maximo aceito para a capa de uma pagina, em megabytes. */
export const LIMITE_CAPA_MB = 5

/**
 * Conteudo inicial de quem abre o sistema pela primeira vez.
 * E tambem a pagina de boas vindas que explica como usar.
 */
export function espacoInicial(): Workspace {
  const inicio = novoId()
  const guia = novoId()
  const agora = Date.now()

  return {
    version: VERSAO_DADOS,
    name: 'Meu espaco',
    icon: '🗂️',
    profile: {
      name: 'Voce',
      email: '',
      avatar: null,
    },
    categories: [],
    rootIds: [inicio, guia],
    theme: 'light',
    accent: '#0f7a6c',
    font: 'sans',
    wide: false,
    updatedAt: agora,
    pages: {
      [inicio]: {
        id: inicio,
        title: 'Comece por aqui',
        icon: '👋',
        cover: 'linear-gradient(120deg, #0f7a6c 0%, #064e42 100%)',
        coverPos: 50,
        parentId: null,
        childIds: [],
        favorite: true,
        createdAt: agora,
        updatedAt: agora,
        blocks: [
          {
            id: novoId(),
            type: 'paragraph',
            html: 'Este e o seu espaco. Escreva o que quiser nesta linha e aperte Enter para criar a proxima.',
          },
          {
            id: novoId(),
            type: 'callout',
            icon: '💡',
            html: 'Digite <b>/</b> em qualquer linha vazia para ver a lista de blocos disponiveis.',
          },
          { id: novoId(), type: 'heading2', html: 'Tres atalhos que resolvem quase tudo' },
          { id: novoId(), type: 'bulleted', html: '<b>/</b> abre o menu de blocos' },
          { id: novoId(), type: 'bulleted', html: '<b>#</b> seguido de espaco vira titulo. Use ## e ### para titulos menores' },
          { id: novoId(), type: 'bulleted', html: '<b>-</b> seguido de espaco vira lista. E <b>[]</b> vira tarefa' },
          { id: novoId(), type: 'heading2', html: 'Experimente marcar estas tarefas' },
          { id: novoId(), type: 'todo', checked: true, html: 'Abrir o Carrapation' },
          { id: novoId(), type: 'todo', checked: false, html: 'Criar a minha primeira pagina na barra lateral' },
          { id: novoId(), type: 'todo', checked: false, html: 'Colocar a minha foto no perfil, ali embaixo a esquerda' },
        ],
      },
      [guia]: {
        id: guia,
        title: 'Guia rapido',
        icon: '🧭',
        parentId: null,
        childIds: [],
        favorite: false,
        createdAt: agora,
        updatedAt: agora,
        blocks: [
          { id: novoId(), type: 'heading1', html: 'Guia rapido' },
          { id: novoId(), type: 'paragraph', html: 'Tudo que da para fazer, em uma pagina so.' },
          { id: novoId(), type: 'heading2', html: 'Paginas' },
          { id: novoId(), type: 'bulleted', html: 'O botao <b>Nova pagina</b> cria no primeiro nivel' },
          { id: novoId(), type: 'bulleted', html: 'O <b>+</b> que aparece ao passar o mouse cria uma subpagina dentro daquela' },
          { id: novoId(), type: 'bulleted', html: 'O <b>...</b> renomeia, favorita, duplica ou exclui' },
          { id: novoId(), type: 'heading2', html: 'Escrevendo' },
          { id: novoId(), type: 'bulleted', html: 'Selecione um texto e use <b>Ctrl+B</b>, <b>Ctrl+I</b> ou <b>Ctrl+U</b>' },
          { id: novoId(), type: 'bulleted', html: 'Arraste pela alcinha a esquerda do bloco para reordenar' },
          { id: novoId(), type: 'bulleted', html: 'Backspace numa linha vazia apaga o bloco e volta para o anterior' },
          { id: novoId(), type: 'heading2', html: 'Levando o seu conteudo embora' },
          {
            id: novoId(),
            type: 'paragraph',
            html: 'Em <b>Configuracoes</b> voce exporta tudo num arquivo unico e importa de volta em qualquer computador. Serve de backup e serve para mandar o espaco pronto para outra pessoa.',
          },
          {
            id: novoId(),
            type: 'quote',
            html: 'Seus dados ficam no seu navegador. Nada e enviado para lugar nenhum.',
          },
        ],
      },
    },
  }
}
