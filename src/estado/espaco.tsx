/**
 * Estado central do Carrapation.
 *
 * Um unico lugar guarda o espaco de trabalho inteiro e oferece as acoes
 * para modifica lo. Qualquer componente chama useEspaco() e recebe os dados
 * mais as acoes. Nao existe estado espalhado pelo sistema.
 *
 * Toda alteracao passa por aqui, e toda alteracao dispara o salvamento
 * automatico depois de meio segundo parado.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AnotacaoDia,
  Block,
  BlockType,
  CategoriaTarefa,
  FontChoice,
  ImagemSolta,
  Page,
  Profile,
  StatusTarefa,
  TemaProprio,
  ThemeMode,
  TracoDesenho,
  Workspace,
} from '../types'
import { normalizarDia } from '../calendario'
import { CHAVE_AVISOS_VISTOS, espacoInicial } from '../config'
import { novoId } from '../lib/id'
import { armazenamento } from '../storage'
import { migrar } from '../storage/adaptadorLocal'
import { definicao } from '../blocos/registro'
import { aplicarModelo } from '../modelos'
import { indexarTarefas, type InfoTarefa } from '../lib/tarefas'

/** Atraso do salvamento automatico, em milissegundos. */
const ATRASO_SALVAR = 500

interface ValorContexto {
  espaco: Workspace
  carregando: boolean
  paginaAtualId: string | null
  statusSalvamento: 'salvo' | 'salvando' | 'erro'
  /**
   * Paginas que sao tarefas de calendario, indexadas por id.
   * Calculado uma vez aqui para a barra lateral e a lista de subpaginas nao
   * precisarem varrer os calendarios item por item.
   */
  tarefasPorPagina: Record<string, InfoTarefa>
  /** Avisos ja lidos neste navegador. Nao faz parte do espaco de trabalho. */
  avisosVistos: string[]
  /** Substitui a lista de avisos lidos. Passar as chaves visiveis no momento. */
  marcarAvisosComoVistos: (chaves: string[]) => void

  abrirPagina: (id: string | null) => void

  /**
   * modeloId escolhe com o que a pagina nasce. Sem ele, nasce em branco.
   * ajustes sobrescreve campos depois do modelo, para quem ja sabe o titulo,
   * o icone ou o conteudo que a pagina deve ter.
   * navegar em false cria a pagina sem sair da tela atual.
   */
  criarPagina: (
    paiId?: string | null,
    modeloId?: string,
    ajustes?: Partial<Page>,
    navegar?: boolean,
  ) => string
  renomearPagina: (id: string, titulo: string) => void
  definirIconePagina: (id: string, icone: string) => void
  definirCapaPagina: (id: string, capa: string | null) => void
  definirPosicaoCapa: (id: string, posicao: number) => void
  alternarFavorito: (id: string) => void
  /**
   * Marca ou desmarca como finalizada a tarefa de calendario ligada a esta
   * pagina. Procura em todos os calendarios, entao funciona de qualquer lugar
   * do sistema, sem precisar estar com o calendario aberto.
   */
  alternarTarefaFinalizada: (paginaId: string) => void
  /** Troca os calendarios desta pagina entre a grade do mes e a tabela. */
  alternarVisaoCalendario: (paginaId: string) => void
  definirCategoriaPagina: (id: string, categoriaId: string | undefined) => void
  definirStatusPagina: (id: string, status: StatusTarefa | undefined) => void
  /** Fonte so desta pagina. undefined volta a usar a do espaco. */
  definirFontePagina: (id: string, fonte: FontChoice | undefined) => void
  /** Tamanho do texto so desta pagina. undefined volta ao normal. */
  definirTamanhoTextoPagina: (id: string, escala: number | undefined) => void
  /** Guarda os rabiscos feitos a mao por cima da pagina. */
  definirDesenhoPagina: (id: string, tracos: TracoDesenho[]) => void
  /** Guarda as imagens soltas posicionadas por cima da pagina. */
  definirImagensPagina: (id: string, imagens: ImagemSolta[]) => void

  criarCategoria: (categoria: CategoriaTarefa) => void
  editarCategoria: (categoria: CategoriaTarefa) => void
  /** Alem de sumir da lista, a categoria some das paginas e das tarefas. */
  removerCategoria: (id: string) => void
  excluirPagina: (id: string) => void
  duplicarPagina: (id: string) => string | null
  moverPagina: (id: string, novoPaiId: string | null, posicao?: number) => void

  atualizarBloco: (paginaId: string, blocoId: string, mudancas: Partial<Block>) => void
  inserirBloco: (paginaId: string, depoisDoId: string | null, bloco?: Partial<Block>) => string
  removerBloco: (paginaId: string, blocoId: string) => void
  moverBloco: (paginaId: string, blocoId: string, novaPosicao: number) => void
  trocarTipoBloco: (paginaId: string, blocoId: string, tipo: BlockType) => void

  atualizarPerfil: (mudancas: Partial<Profile>) => void
  definirTema: (tema: ThemeMode) => void
  definirDestaque: (cor: string) => void
  definirFonte: (fonte: FontChoice) => void
  definirLargura: (largo: boolean) => void
  /** Escolhe o tema de fundo. Vazio tira a imagem. */
  definirFundo: (fundo: string) => void
  /** O quanto a imagem de fundo aparece, de 0 a 1. */
  definirIntensidadeFundo: (intensidade: number) => void
  /** Guarda um tema com imagem do computador e ja o deixa escolhido. */
  criarTemaProprio: (tema: TemaProprio) => void
  /** Apaga um tema proprio. Se ele estiver em uso, o fundo volta a nenhum. */
  removerTemaProprio: (id: string) => void
  renomearEspaco: (nome: string) => void
  definirIconeEspaco: (icone: string) => void

  substituirEspaco: (novo: Workspace) => void
  recomecarDoZero: () => void
}

const Contexto = createContext<ValorContexto | null>(null)

export function ProvedorEspaco({
  children,
  perfilInicial,
}: {
  children: ReactNode
  /**
   * Nome e e-mail da conta que entrou.
   * Servem para o perfil do espaco ja nascer preenchido, em vez de mostrar o
   * "Voce" generico. Ver aplicarPerfilDaConta la embaixo.
   */
  perfilInicial?: { name: string; email: string }
}) {
  const [espaco, definirEspaco] = useState<Workspace>(() => espacoInicial())
  const [carregando, definirCarregando] = useState(true)
  const [paginaAtualId, definirPaginaAtualId] = useState<string | null>(null)
  const [statusSalvamento, definirStatus] = useState<'salvo' | 'salvando' | 'erro'>('salvo')

  const primeiraRenderizacao = useRef(true)
  const temporizador = useRef<number | null>(null)

  // Carrega o que estava salvo assim que o app abre.
  useEffect(() => {
    let ativo = true
    armazenamento.carregar().then((salvo) => {
      if (!ativo) return
      const dados = aplicarPerfilDaConta(salvo ?? espacoInicial(), perfilInicial)
      definirEspaco(dados)
      definirPaginaAtualId(dados.rootIds[0] ?? null)
      definirCarregando(false)
    })
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Salvamento automatico com pequena espera, para nao gravar a cada tecla.
  useEffect(() => {
    if (carregando) return
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }

    definirStatus('salvando')
    if (temporizador.current) window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => {
      armazenamento
        .salvar(espaco)
        .then(() => definirStatus('salvo'))
        .catch(() => definirStatus('erro'))
    }, ATRASO_SALVAR)

    return () => {
      if (temporizador.current) window.clearTimeout(temporizador.current)
    }
  }, [espaco, carregando])

  /** Aplica uma mudanca no espaco e carimba a data de atualizacao. */
  const mudar = useCallback((receita: (atual: Workspace) => Workspace) => {
    definirEspaco((atual) => ({ ...receita(atual), updatedAt: Date.now() }))
  }, [])

  /** Aplica uma mudanca em uma pagina especifica. */
  const mudarPagina = useCallback(
    (paginaId: string, receita: (pagina: Page) => Page) => {
      mudar((atual) => {
        const pagina = atual.pages[paginaId]
        if (!pagina) return atual
        return {
          ...atual,
          pages: { ...atual.pages, [paginaId]: { ...receita(pagina), updatedAt: Date.now() } },
        }
      })
    },
    [mudar],
  )

  const abrirPagina = useCallback((id: string | null) => {
    definirPaginaAtualId(id)
  }, [])

  const criarPagina = useCallback(
    (paiId: string | null = null, modeloId?: string, ajustes?: Partial<Page>, navegar = true) => {
      const id = novoId()
      const agora = Date.now()
      const base: Page = {
        id,
        title: '',
        // Vazio de proposito: assim a pagina nova oferece "Adicionar icone",
        // em vez de ja vir com um icone que ninguem escolheu.
        icon: '',
        cover: null,
        coverPos: 50,
        parentId: paiId,
        childIds: [],
        blocks: [{ id: novoId(), type: 'paragraph', html: '' }],
        favorite: false,
        createdAt: agora,
        updatedAt: agora,
      }
      // O id, o pai e as datas sao do sistema, entao ficam por ultimo e nao
      // podem ser sobrescritos pelos ajustes.
      const nova: Page = {
        ...aplicarModelo(base, modeloId),
        ...ajustes,
        id,
        parentId: paiId,
        childIds: [],
        createdAt: agora,
        updatedAt: agora,
      }

      mudar((atual) => {
        const paginas = { ...atual.pages, [id]: nova }
        if (paiId && paginas[paiId]) {
          paginas[paiId] = { ...paginas[paiId], childIds: [...paginas[paiId].childIds, id] }
          return { ...atual, pages: paginas }
        }
        return { ...atual, pages: paginas, rootIds: [...atual.rootIds, id] }
      })

      if (navegar) definirPaginaAtualId(id)
      return id
    },
    [mudar],
  )

  const renomearPagina = useCallback(
    (id: string, titulo: string) => mudarPagina(id, (p) => ({ ...p, title: titulo })),
    [mudarPagina],
  )

  const definirIconePagina = useCallback(
    (id: string, icone: string) => mudarPagina(id, (p) => ({ ...p, icon: icone })),
    [mudarPagina],
  )

  const definirCapaPagina = useCallback(
    (id: string, capa: string | null) =>
      mudarPagina(id, (p) => ({ ...p, cover: capa, coverPos: capa ? (p.coverPos ?? 50) : 50 })),
    [mudarPagina],
  )

  const definirPosicaoCapa = useCallback(
    (id: string, posicao: number) =>
      mudarPagina(id, (p) => ({ ...p, coverPos: Math.max(0, Math.min(100, posicao)) })),
    [mudarPagina],
  )

  const alternarFavorito = useCallback(
    (id: string) => mudarPagina(id, (p) => ({ ...p, favorite: !p.favorite })),
    [mudarPagina],
  )

  const alternarTarefaFinalizada = useCallback(
    (paginaId: string) => {
      mudar((atual) => {
        // Procura em todas as paginas qual calendario tem a tarefa ligada a
        // esta pagina. Para na primeira que encontrar.
        for (const pagina of Object.values(atual.pages)) {
          let achou = false

          const blocos = pagina.blocks.map((bloco) => {
            if (bloco.type !== 'calendar' || !bloco.events) return bloco

            let mudouBloco = false
            const eventos: Record<string, AnotacaoDia[]> = {}

            for (const data of Object.keys(bloco.events)) {
              eventos[data] = normalizarDia(bloco.events, data).map((tarefa) => {
                if (tarefa.paginaId !== paginaId) return tarefa
                mudouBloco = true
                // Marcar como finalizada liga o modo checklist junto, para a
                // caixa aparecer na grade do calendario.
                return tarefa.feito
                  ? { ...tarefa, feito: false }
                  : { ...tarefa, checklist: true, feito: true }
              })
            }

            if (!mudouBloco) return bloco
            achou = true
            return { ...bloco, events: eventos }
          })

          if (achou) {
            return {
              ...atual,
              pages: {
                ...atual.pages,
                [pagina.id]: { ...pagina, blocks: blocos, updatedAt: Date.now() },
              },
            }
          }
        }

        return atual
      })
    },
    [mudar],
  )

  const alternarVisaoCalendario = useCallback(
    (paginaId: string) => {
      mudarPagina(paginaId, (p) => ({
        ...p,
        blocks: p.blocks.map((bloco) =>
          bloco.type === 'calendar'
            ? { ...bloco, view: bloco.view === 'tabela' ? 'calendario' : 'tabela' }
            : bloco,
        ),
      }))
    },
    [mudarPagina],
  )

  const definirCategoriaPagina = useCallback(
    (id: string, categoriaId: string | undefined) => mudarPagina(id, (p) => ({ ...p, categoriaId })),
    [mudarPagina],
  )

  const definirStatusPagina = useCallback(
    (id: string, status: StatusTarefa | undefined) => mudarPagina(id, (p) => ({ ...p, status })),
    [mudarPagina],
  )

  const definirFontePagina = useCallback(
    (id: string, fonte: FontChoice | undefined) => mudarPagina(id, (p) => ({ ...p, font: fonte })),
    [mudarPagina],
  )

  const definirTamanhoTextoPagina = useCallback(
    (id: string, escala: number | undefined) => mudarPagina(id, (p) => ({ ...p, textScale: escala })),
    [mudarPagina],
  )

  const definirDesenhoPagina = useCallback(
    (id: string, tracos: TracoDesenho[]) => mudarPagina(id, (p) => ({ ...p, drawing: tracos })),
    [mudarPagina],
  )

  const definirImagensPagina = useCallback(
    (id: string, imagens: ImagemSolta[]) => mudarPagina(id, (p) => ({ ...p, imagens })),
    [mudarPagina],
  )

  const criarCategoria = useCallback(
    (categoria: CategoriaTarefa) =>
      mudar((a) => ({ ...a, categories: [...(a.categories ?? []), categoria] })),
    [mudar],
  )

  const editarCategoria = useCallback(
    (categoria: CategoriaTarefa) =>
      mudar((a) => ({
        ...a,
        categories: (a.categories ?? []).map((c) => (c.id === categoria.id ? categoria : c)),
      })),
    [mudar],
  )

  const removerCategoria = useCallback(
    (id: string) => {
      mudar((atual) => {
        const paginas: Record<string, Page> = {}

        for (const pagina of Object.values(atual.pages)) {
          // Tira a categoria da pagina e tambem das tarefas dos calendarios
          // dela. Sem isso ficariam referencias apontando para o nada.
          const blocos = pagina.blocks.map((bloco) => {
            if (bloco.type !== 'calendar' || !bloco.events) return bloco

            const eventos: Record<string, AnotacaoDia[]> = {}
            for (const chave of Object.keys(bloco.events)) {
              eventos[chave] = normalizarDia(bloco.events, chave).map((tarefa) =>
                tarefa.categoriaId === id ? { ...tarefa, categoriaId: undefined } : tarefa,
              )
            }
            return { ...bloco, events: eventos }
          })

          paginas[pagina.id] = {
            ...pagina,
            blocks: blocos,
            categoriaId: pagina.categoriaId === id ? undefined : pagina.categoriaId,
          }
        }

        return {
          ...atual,
          pages: paginas,
          categories: (atual.categories ?? []).filter((c) => c.id !== id),
        }
      })
    },
    [mudar],
  )

  const excluirPagina = useCallback(
    (id: string) => {
      mudar((atual) => {
        const paginas = { ...atual.pages }
        const alvo = paginas[id]
        if (!alvo) return atual

        // Remove a pagina e toda a descendencia dela.
        const paraRemover: string[] = []
        const fila = [id]
        while (fila.length) {
          const atualId = fila.shift()!
          paraRemover.push(atualId)
          const p = paginas[atualId]
          if (p) fila.push(...p.childIds)
        }
        for (const removidoId of paraRemover) delete paginas[removidoId]

        // Tira a referencia de quem apontava para ela.
        if (alvo.parentId && paginas[alvo.parentId]) {
          paginas[alvo.parentId] = {
            ...paginas[alvo.parentId],
            childIds: paginas[alvo.parentId].childIds.filter((c) => c !== id),
          }
        }

        return { ...atual, pages: paginas, rootIds: atual.rootIds.filter((r) => r !== id) }
      })

      definirPaginaAtualId((atualId) => (atualId === id ? null : atualId))
    },
    [mudar],
  )

  const duplicarPagina = useCallback(
    (id: string) => {
      const original = espaco.pages[id]
      if (!original) return null

      const novoIdPagina = novoId()
      const agora = Date.now()
      const copia: Page = {
        ...original,
        id: novoIdPagina,
        title: original.title ? `${original.title} (copia)` : 'Sem titulo (copia)',
        childIds: [],
        blocks: original.blocks.map((b) => ({ ...b, id: novoId() })),
        createdAt: agora,
        updatedAt: agora,
      }

      mudar((atual) => {
        const paginas = { ...atual.pages, [novoIdPagina]: copia }
        if (original.parentId && paginas[original.parentId]) {
          const irmaos = [...paginas[original.parentId].childIds]
          irmaos.splice(irmaos.indexOf(id) + 1, 0, novoIdPagina)
          paginas[original.parentId] = { ...paginas[original.parentId], childIds: irmaos }
          return { ...atual, pages: paginas }
        }
        const raiz = [...atual.rootIds]
        raiz.splice(raiz.indexOf(id) + 1, 0, novoIdPagina)
        return { ...atual, pages: paginas, rootIds: raiz }
      })

      definirPaginaAtualId(novoIdPagina)
      return novoIdPagina
    },
    [espaco.pages, mudar],
  )

  const moverPagina = useCallback(
    (id: string, novoPaiId: string | null, posicao?: number) => {
      mudar((atual) => {
        const paginas = { ...atual.pages }
        const alvo = paginas[id]
        if (!alvo) return atual
        if (novoPaiId === id) return atual

        // Impede jogar uma pagina para dentro da propria descendencia.
        if (novoPaiId) {
          let cursor: string | null = novoPaiId
          while (cursor) {
            if (cursor === id) return atual
            cursor = paginas[cursor]?.parentId ?? null
          }
        }

        let raiz = [...atual.rootIds]

        // Tira do lugar antigo.
        if (alvo.parentId && paginas[alvo.parentId]) {
          paginas[alvo.parentId] = {
            ...paginas[alvo.parentId],
            childIds: paginas[alvo.parentId].childIds.filter((c) => c !== id),
          }
        } else {
          raiz = raiz.filter((r) => r !== id)
        }

        // Coloca no lugar novo.
        paginas[id] = { ...alvo, parentId: novoPaiId }
        if (novoPaiId && paginas[novoPaiId]) {
          const filhos = [...paginas[novoPaiId].childIds]
          filhos.splice(posicao ?? filhos.length, 0, id)
          paginas[novoPaiId] = { ...paginas[novoPaiId], childIds: filhos }
        } else {
          raiz.splice(posicao ?? raiz.length, 0, id)
        }

        return { ...atual, pages: paginas, rootIds: raiz }
      })
    },
    [mudar],
  )

  const atualizarBloco = useCallback(
    (paginaId: string, blocoId: string, mudancas: Partial<Block>) => {
      mudarPagina(paginaId, (p) => ({
        ...p,
        blocks: p.blocks.map((b) => (b.id === blocoId ? { ...b, ...mudancas } : b)),
      }))
    },
    [mudarPagina],
  )

  const inserirBloco = useCallback(
    (paginaId: string, depoisDoId: string | null, bloco: Partial<Block> = {}) => {
      const id = novoId()
      mudarPagina(paginaId, (p) => {
        const novo: Block = { id, type: 'paragraph', html: '', ...bloco }
        const blocos = [...p.blocks]
        const posicao = depoisDoId ? blocos.findIndex((b) => b.id === depoisDoId) + 1 : blocos.length
        blocos.splice(posicao, 0, novo)
        return { ...p, blocks: blocos }
      })
      return id
    },
    [mudarPagina],
  )

  const removerBloco = useCallback(
    (paginaId: string, blocoId: string) => {
      mudarPagina(paginaId, (p) => {
        // A pagina nunca fica sem nenhum bloco.
        if (p.blocks.length <= 1) {
          return { ...p, blocks: [{ id: novoId(), type: 'paragraph', html: '' }] }
        }
        return { ...p, blocks: p.blocks.filter((b) => b.id !== blocoId) }
      })
    },
    [mudarPagina],
  )

  const moverBloco = useCallback(
    (paginaId: string, blocoId: string, novaPosicao: number) => {
      mudarPagina(paginaId, (p) => {
        const blocos = [...p.blocks]
        const de = blocos.findIndex((b) => b.id === blocoId)
        if (de < 0) return p
        const [movido] = blocos.splice(de, 1)
        const para = Math.max(0, Math.min(blocos.length, novaPosicao))
        blocos.splice(para, 0, movido)
        return { ...p, blocks: blocos }
      })
    },
    [mudarPagina],
  )

  const trocarTipoBloco = useCallback(
    (paginaId: string, blocoId: string, tipo: BlockType) => {
      mudarPagina(paginaId, (p) => ({
        ...p,
        blocks: p.blocks.map((b) => {
          if (b.id !== blocoId) return b
          const def = definicao(tipo)
          const convertido: Block = { ...b, type: tipo }
          if (tipo === 'callout' && !convertido.icon) convertido.icon = '💡'
          if (tipo === 'todo' && convertido.checked === undefined) convertido.checked = false
          if (!def.editavel) convertido.html = ''
          return convertido
        }),
      }))
    },
    [mudarPagina],
  )

  const atualizarPerfil = useCallback(
    (mudancas: Partial<Profile>) => mudar((a) => ({ ...a, profile: { ...a.profile, ...mudancas } })),
    [mudar],
  )

  const definirTema = useCallback((tema: ThemeMode) => mudar((a) => ({ ...a, theme: tema })), [mudar])
  const definirDestaque = useCallback((cor: string) => mudar((a) => ({ ...a, accent: cor })), [mudar])
  const definirFonte = useCallback((fonte: FontChoice) => mudar((a) => ({ ...a, font: fonte })), [mudar])
  const definirLargura = useCallback((largo: boolean) => mudar((a) => ({ ...a, wide: largo })), [mudar])
  const definirFundo = useCallback((fundo: string) => mudar((a) => ({ ...a, fundo })), [mudar])

  const definirIntensidadeFundo = useCallback(
    (intensidade: number) =>
      mudar((a) => ({ ...a, fundoIntensidade: Math.max(0.02, Math.min(0.4, intensidade)) })),
    [mudar],
  )
  const criarTemaProprio = useCallback(
    (tema: TemaProprio) =>
      mudar((a) => ({
        ...a,
        temasProprios: [...(a.temasProprios ?? []), tema],
        fundo: tema.id,
      })),
    [mudar],
  )

  const removerTemaProprio = useCallback(
    (id: string) =>
      mudar((a) => ({
        ...a,
        temasProprios: (a.temasProprios ?? []).filter((t) => t.id !== id),
        // Se o tema apagado era o que estava em uso, o fundo sai junto.
        fundo: a.fundo === id ? '' : a.fundo,
      })),
    [mudar],
  )

  const renomearEspaco = useCallback((nome: string) => mudar((a) => ({ ...a, name: nome })), [mudar])
  const definirIconeEspaco = useCallback((icone: string) => mudar((a) => ({ ...a, icon: icone })), [mudar])

  const substituirEspaco = useCallback((novo: Workspace) => {
    // Passa os dados crus para migrar: e ele que le a versao de origem e
    // decide as conversoes. Carimbar a versao antes puliria as migracoes.
    const validado = migrar(novo)
    definirEspaco(validado)
    definirPaginaAtualId(validado.rootIds[0] ?? null)
  }, [])

  const recomecarDoZero = useCallback(() => {
    const novo = espacoInicial()
    definirEspaco(novo)
    definirPaginaAtualId(novo.rootIds[0] ?? null)
  }, [])

  const tarefasPorPagina = useMemo(() => indexarTarefas(espaco), [espaco])

  // Avisos ja lidos. Ficam no navegador, separados do espaco de trabalho.
  const [avisosVistos, definirAvisosVistos] = useState<string[]>(lerAvisosVistos)

  const marcarAvisosComoVistos = useCallback((chaves: string[]) => {
    // Substitui a lista inteira em vez de somar. Assim ela nunca cresce sem
    // limite: aviso que deixou de existir some da lista sozinho.
    definirAvisosVistos(chaves)
    try {
      localStorage.setItem(CHAVE_AVISOS_VISTOS, JSON.stringify(chaves))
    } catch {
      // Sem espaco no navegador. Marcar como lido nao e essencial, entao segue.
    }
  }, [])

  const valor = useMemo<ValorContexto>(
    () => ({
      espaco,
      carregando,
      paginaAtualId,
      statusSalvamento,
      tarefasPorPagina,
      avisosVistos,
      marcarAvisosComoVistos,
      abrirPagina,
      criarPagina,
      renomearPagina,
      definirIconePagina,
      definirCapaPagina,
      definirPosicaoCapa,
      alternarFavorito,
      alternarTarefaFinalizada,
      alternarVisaoCalendario,
      definirCategoriaPagina,
      definirStatusPagina,
      definirFontePagina,
      definirTamanhoTextoPagina,
      definirDesenhoPagina,
      definirImagensPagina,
      criarCategoria,
      editarCategoria,
      removerCategoria,
      excluirPagina,
      duplicarPagina,
      moverPagina,
      atualizarBloco,
      inserirBloco,
      removerBloco,
      moverBloco,
      trocarTipoBloco,
      atualizarPerfil,
      definirTema,
      definirDestaque,
      definirFonte,
      definirLargura,
      definirFundo,
      definirIntensidadeFundo,
      criarTemaProprio,
      removerTemaProprio,
      renomearEspaco,
      definirIconeEspaco,
      substituirEspaco,
      recomecarDoZero,
    }),
    [
      espaco,
      carregando,
      paginaAtualId,
      statusSalvamento,
      tarefasPorPagina,
      avisosVistos,
      marcarAvisosComoVistos,
      abrirPagina,
      criarPagina,
      renomearPagina,
      definirIconePagina,
      definirCapaPagina,
      definirPosicaoCapa,
      alternarFavorito,
      alternarTarefaFinalizada,
      alternarVisaoCalendario,
      definirCategoriaPagina,
      definirStatusPagina,
      definirFontePagina,
      definirTamanhoTextoPagina,
      definirDesenhoPagina,
      definirImagensPagina,
      criarCategoria,
      editarCategoria,
      removerCategoria,
      excluirPagina,
      duplicarPagina,
      moverPagina,
      atualizarBloco,
      inserirBloco,
      removerBloco,
      moverBloco,
      trocarTipoBloco,
      atualizarPerfil,
      definirTema,
      definirDestaque,
      definirFonte,
      definirLargura,
      definirFundo,
      definirIntensidadeFundo,
      criarTemaProprio,
      removerTemaProprio,
      renomearEspaco,
      definirIconeEspaco,
      substituirEspaco,
      recomecarDoZero,
    ],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

/** Acesso ao espaco de trabalho e a todas as acoes, de qualquer componente. */
export function useEspaco(): ValorContexto {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('useEspaco precisa estar dentro de ProvedorEspaco.')
  return valor
}

/**
 * Leva o nome e o e-mail da conta para o perfil do espaco.
 *
 * So preenche o que ainda esta vazio ou no valor generico que vem de fabrica.
 * Quem ja escreveu o proprio nome no perfil nao tem ele sobrescrito na proxima
 * vez que entrar.
 */
function aplicarPerfilDaConta(
  espaco: Workspace,
  perfil: { name: string; email: string } | undefined,
): Workspace {
  if (!perfil) return espaco

  const atual = espaco.profile
  const nomeGenerico = !atual?.name || atual.name === 'Voce'
  const semEmail = !atual?.email

  if (!nomeGenerico && !semEmail) return espaco

  return {
    ...espaco,
    profile: {
      ...atual,
      name: nomeGenerico && perfil.name ? perfil.name : atual.name,
      email: semEmail && perfil.email ? perfil.email : atual.email,
    },
  }
}

/** Le do navegador quais avisos ja tinham sido lidos. */
function lerAvisosVistos(): string[] {
  try {
    const cru = localStorage.getItem(CHAVE_AVISOS_VISTOS)
    const lista = cru ? (JSON.parse(cru) as string[]) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

/** Monta o caminho de paginas ate a pagina informada, para a trilha do topo. */
export function caminhoDaPagina(espaco: Workspace, paginaId: string | null): Page[] {
  const caminho: Page[] = []
  let cursor = paginaId
  while (cursor) {
    const pagina = espaco.pages[cursor]
    if (!pagina) break
    caminho.unshift(pagina)
    cursor = pagina.parentId
  }
  return caminho
}
