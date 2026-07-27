/**
 * Bloco de calendario: a grade de um mes, com as tarefas de cada dia.
 *
 * Cada tarefa e uma pagina de verdade, criada como subpagina da pagina onde o
 * calendario esta. E por isso que as tarefas aparecem na barra lateral. O
 * calendario guarda so o que e do calendario: em que dia a tarefa cai, o
 * horario, a categoria, a situacao e o finalizada. Titulo, icone e conteudo
 * ficam na pagina da tarefa.
 *
 * Clicar num dia cria uma tarefa nele. Clicar numa tarefa abre a pagina dela
 * numa janela em cima do calendario.
 */

import { useMemo, useRef, useState, useEffect } from 'react'
import type { AnotacaoDia, Block, CategoriaTarefa } from '../types'
import { JanelaTarefa } from './JanelaTarefa'
import { TabelaTarefas, type LinhaTarefa } from './TabelaTarefas'
import { useEspaco } from '../estado/espaco'
import { novoId } from '../lib/id'
import { apenasTexto, escaparTexto } from '../lib/sanitize'
import {
  categoriaPorId,
  chaveDeData,
  definicaoStatus,
  dois,
  lerDia,
  mesDaChave,
  mesDeHoje,
  resumoDaTarefa,
  statusEfetivo,
} from '../calendario'

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Qual tarefa esta com o menu de tres pontos aberto. */
interface MenuAberto {
  chave: string
  indice: number
  x: number
  y: number
}

/** Qual tarefa esta aberta na janela. */
interface EditorAberto {
  chave: string
  indice: number
}

export function BlocoCalendario({
  bloco,
  aoAlterar,
}: {
  bloco: Block
  aoAlterar: (mudancas: Partial<Block>) => void
}) {
  // O calendario e desenhado dentro da pagina aberta, entao paginaAtualId e a
  // pagina onde ele mora. E dela que as paginas de tarefa ficam penduradas.
  const {
    espaco,
    paginaAtualId,
    criarPagina,
    abrirPagina,
    excluirPagina,
    criarCategoria,
    editarCategoria,
    removerCategoria,
  } = useEspaco()

  const mesAtual = bloco.month ?? mesDeHoje()
  const eventos = bloco.events ?? {}
  // As categorias sao do espaco inteiro, e nao mais deste bloco. Assim a mesma
  // categoria vale para tarefas e para paginas comuns.
  const categorias = espaco.categories ?? []
  const emTabela = bloco.view === 'tabela'

  const [menu, definirMenu] = useState<MenuAberto | null>(null)
  const [editor, definirEditor] = useState<EditorAberto | null>(null)

  const [ano, mes] = mesAtual.split('-').map(Number)
  const hoje = chaveDeData(new Date())

  /** Todos os dias mostrados na grade, incluindo os das bordas do mes vizinho. */
  const celulas = useMemo(() => {
    const primeiro = new Date(ano, mes - 1, 1)
    const inicio = new Date(primeiro)
    // Recua ate o domingo anterior, para a grade comecar alinhada.
    inicio.setDate(inicio.getDate() - primeiro.getDay())

    const lista: { data: Date; chave: string; doMes: boolean }[] = []
    for (let i = 0; i < 42; i++) {
      const data = new Date(inicio)
      data.setDate(inicio.getDate() + i)
      lista.push({ data, chave: chaveDeData(data), doMes: data.getMonth() === mes - 1 })
    }

    // A quinta e a sexta semana so aparecem se tiverem dias deste mes.
    const semanas = []
    for (let s = 0; s < 6; s++) {
      const semana = lista.slice(s * 7, s * 7 + 7)
      if (s >= 4 && semana.every((c) => !c.doMes)) break
      semanas.push(semana)
    }
    return semanas.flat()
  }, [ano, mes])

  /**
   * Todas as tarefas do calendario, em linhas, para a visao de tabela.
   * A tabela mostra o calendario inteiro, e nao so o mes aberto.
   */
  const linhasDaTabela = useMemo(() => {
    const linhas: LinhaTarefa[] = []
    for (const chave of Object.keys(eventos).sort()) {
      lerDia(eventos, chave).forEach((tarefa, indice) => {
        const paginaDaTarefa = tarefa.paginaId ? espaco.pages[tarefa.paginaId] : null
        linhas.push({
          chave,
          indice,
          tarefa,
          titulo: paginaDaTarefa?.title || tarefa.texto || 'Sem titulo',
          icone: paginaDaTarefa?.icon || '🗓️',
        })
      })
    }
    return linhas
  }, [eventos, espaco.pages])

  /** Categorias que aparecem neste mes, para a legenda do rodape. */
  const categoriasEmUso = useMemo(() => {
    const usadas = new Set<string>()
    for (const { chave } of celulas) {
      for (const tarefa of lerDia(eventos, chave)) {
        if (tarefa.categoriaId) usadas.add(tarefa.categoriaId)
      }
    }
    return categorias.filter((c) => usadas.has(c.id))
  }, [celulas, eventos, categorias])

  function trocarMes(passos: number) {
    const data = new Date(ano, mes - 1 + passos, 1)
    aoAlterar({ month: `${data.getFullYear()}-${dois(data.getMonth() + 1)}` })
    definirMenu(null)
  }

  function irParaHoje() {
    aoAlterar({ month: mesDeHoje() })
    definirMenu(null)
  }

  function alterarTarefa(chave: string, indice: number, mudancas: Partial<AnotacaoDia>) {
    const doDia = lerDia(eventos, chave)
    const nova = doDia.map((t, i) => (i === indice ? { ...t, ...mudancas } : t))
    aoAlterar({ events: { ...eventos, [chave]: nova } })
  }

  function removerTarefa(chave: string, indice: number) {
    const restante = lerDia(eventos, chave).filter((_, i) => i !== indice)
    const novos = { ...eventos }
    if (restante.length) novos[chave] = restante
    else delete novos[chave]
    aoAlterar({ events: novos })
  }

  /** Move a tarefa para outro dia, mantendo tudo o mais. */
  function moverTarefa(chave: string, indice: number, dataNova: string) {
    if (dataNova === chave) return

    const doDia = lerDia(eventos, chave)
    const tarefa = doDia[indice]
    if (!tarefa) return

    const novos = { ...eventos }
    const restante = doDia.filter((_, i) => i !== indice)
    if (restante.length) novos[chave] = restante
    else delete novos[chave]

    const destino = lerDia(novos, dataNova)
    novos[dataNova] = [...destino, tarefa]

    const mudancas: Partial<Block> = { events: novos }
    // Se a tarefa foi para outro mes, o calendario acompanha.
    const mesDestino = mesDaChave(dataNova)
    if (mesDestino !== mesAtual) mudancas.month = mesDestino

    aoAlterar(mudancas)
    // A janela segue a tarefa para o dia novo. A ordenacao por horario pode
    // mudar a posicao, entao o indice e recalculado.
    const ordenado = [...destino, tarefa].sort(
      (a, b) => (a.hora ?? '99:99').localeCompare(b.hora ?? '99:99'),
    )
    definirEditor({ chave: dataNova, indice: ordenado.indexOf(tarefa) })
  }

  /**
   * Cria uma tarefa no dia clicado.
   * Toda tarefa nasce com uma pagina propria, pendurada na pagina do
   * calendario. E por isso que ela aparece na barra lateral como subpagina.
   */
  function criarTarefa(chave: string) {
    // navegar em false: a pagina e criada sem sair do calendario.
    const novaPaginaId = criarPagina(paginaAtualId, 'branco', { title: '', icon: '🗓️' }, false)

    const doDia = lerDia(eventos, chave)
    aoAlterar({ events: { ...eventos, [chave]: [...doDia, { texto: '', paginaId: novaPaginaId }] } })
    definirEditor({ chave, indice: doDia.length })
  }

  /**
   * Abre a janela de uma tarefa.
   * Tarefas criadas antes desta versao nao tinham pagina, entao ganham uma
   * agora, com o titulo e a descricao que ja existiam.
   */
  function abrirTarefa(chave: string, indice: number) {
    const tarefa = lerDia(eventos, chave)[indice]
    if (!tarefa) return

    if (tarefa.paginaId && espaco.pages[tarefa.paginaId]) {
      definirEditor({ chave, indice })
      return
    }

    const novaPaginaId = criarPagina(
      paginaAtualId,
      'branco',
      {
        title: tarefa.texto,
        icon: '🗓️',
        blocks: [{ id: novoId(), type: 'paragraph', html: escaparTexto(tarefa.descricao ?? '') }],
      },
      false,
    )

    alterarTarefa(chave, indice, { paginaId: novaPaginaId })
    definirEditor({ chave, indice })
  }

  /** Exclui a tarefa e a pagina dela. */
  function excluirTarefa(chave: string, indice: number) {
    const tarefa = lerDia(eventos, chave)[indice]
    removerTarefa(chave, indice)
    if (tarefa?.paginaId && espaco.pages[tarefa.paginaId]) excluirPagina(tarefa.paginaId)
    definirEditor(null)
    definirMenu(null)
  }

  /**
   * Ao fechar, tarefa que ficou sem titulo e sem conteudo e descartada junto
   * com a pagina dela. Evita deixar lixo por clique acidental num dia.
   */
  function fecharEditor(aberto: EditorAberto) {
    const tarefa = lerDia(eventos, aberto.chave)[aberto.indice]
    const pagina = tarefa?.paginaId ? espaco.pages[tarefa.paginaId] : null

    const semTitulo = !pagina || pagina.title.trim() === ''
    const semConteudo =
      !pagina || pagina.blocks.every((b) => apenasTexto(b.html).trim() === '' && !b.src)

    if (semTitulo && semConteudo) {
      excluirTarefa(aberto.chave, aberto.indice)
      return
    }
    definirEditor(null)
  }

  const tarefaEmEdicao = editor ? lerDia(eventos, editor.chave)[editor.indice] ?? null : null
  const paginaEmEdicao = tarefaEmEdicao?.paginaId ? espaco.pages[tarefaEmEdicao.paginaId] : null

  return (
    <div className="calendario">
      <div className="calendario-topo">
        <strong>{emTabela ? 'Todas as tarefas' : `${MESES[mes - 1]} ${ano}`}</strong>

        <div className="calendario-navegacao">
          {!emTabela && (
            <>
              <button className="btn-icone" title="Mes anterior" onClick={() => trocarMes(-1)}>
                ‹
              </button>
              <button className="btn" onClick={irParaHoje}>
                Hoje
              </button>
              <button className="btn-icone" title="Proximo mes" onClick={() => trocarMes(1)}>
                ›
              </button>
            </>
          )}

          {/* Alterna entre a grade do mes e a tabela. Os dados sao os mesmos. */}
          <div className="segmentos" style={{ marginLeft: 6 }}>
            <button
              data-ativo={!emTabela || undefined}
              title="Ver como calendario"
              onClick={() => aoAlterar({ view: 'calendario' })}
            >
              📅 Calendario
            </button>
            <button
              data-ativo={emTabela || undefined}
              title="Ver como tabela"
              onClick={() => aoAlterar({ view: 'tabela' })}
            >
              ▦ Tabela
            </button>
          </div>
        </div>
      </div>

      {emTabela && (
        <TabelaTarefas
          linhas={linhasDaTabela}
          categorias={categorias}
          aoAbrir={abrirTarefa}
          aoAlternarFinalizada={(chave, indice) => {
            const tarefa = lerDia(eventos, chave)[indice]
            alterarTarefa(
              chave,
              indice,
              tarefa?.feito ? { feito: false } : { checklist: true, feito: true },
            )
          }}
          aoAbrirMenu={(chave, indice, x, y) => definirMenu({ chave, indice, x, y })}
          aoCriarTarefa={() => criarTarefa(hoje)}
        />
      )}

      {!emTabela && (
        <div className="calendario-semana">
          {DIAS_DA_SEMANA.map((dia) => (
            <span key={dia}>{dia}</span>
          ))}
        </div>
      )}

      {/* Renderiza de verdade so a visao escolhida. O atributo hidden nao
          serve aqui: a grade tem display grid no CSS, e regra de autor vence
          o hidden do navegador, entao ela continuaria aparecendo. */}
      {!emTabela && (
      <div className="calendario-grade">
        {celulas.map(({ data, chave, doMes }) => (
          <div
            key={chave}
            className="calendario-dia"
            data-fora={!doMes || undefined}
            data-hoje={chave === hoje || undefined}
            title="Clique para criar uma tarefa neste dia"
            onClick={() => criarTarefa(chave)}
          >
            <span className="numero">{data.getDate()}</span>

            {lerDia(eventos, chave).map((tarefa, indice) => (
              <Tarefa
                key={`${chave}-${indice}`}
                data={chave}
                tarefa={tarefa}
                titulo={
                  (tarefa.paginaId ? espaco.pages[tarefa.paginaId]?.title : '') ||
                  tarefa.texto ||
                  'Sem titulo'
                }
                categorias={categorias}
                aoAbrir={() => abrirTarefa(chave, indice)}
                aoMarcar={() =>
                  alterarTarefa(chave, indice, tarefa.feito ? { feito: false } : { checklist: true, feito: true })
                }
                aoAbrirMenu={(x, y) => definirMenu({ chave, indice, x, y })}
              />
            ))}
          </div>
        ))}
      </div>
      )}

      {!emTabela && categoriasEmUso.length > 0 && (
        <div className="calendario-legenda">
          {categoriasEmUso.map((categoria) => (
            <span key={categoria.id} className="legenda-item">
              <span className="ponto" style={{ background: categoria.cor }} />
              {categoria.nome}
            </span>
          ))}
        </div>
      )}

      {menu && (
        <MenuTarefa
          tarefa={lerDia(eventos, menu.chave)[menu.indice]}
          x={menu.x}
          y={menu.y}
          aoAlterar={(mudancas) => {
            alterarTarefa(menu.chave, menu.indice, mudancas)
            definirMenu(null)
          }}
          aoAbrirJanela={() => {
            abrirTarefa(menu.chave, menu.indice)
            definirMenu(null)
          }}
          aoAbrirEmTelaCheia={() => {
            const tarefa = lerDia(eventos, menu.chave)[menu.indice]
            if (tarefa?.paginaId) abrirPagina(tarefa.paginaId)
            definirMenu(null)
          }}
          aoRemover={() => excluirTarefa(menu.chave, menu.indice)}
          aoFechar={() => definirMenu(null)}
        />
      )}

      {editor && tarefaEmEdicao && paginaEmEdicao && (
        <JanelaTarefa
          tarefa={tarefaEmEdicao}
          pagina={paginaEmEdicao}
          data={editor.chave}
          categorias={categorias}
          aoAlterarTarefa={(mudancas) => alterarTarefa(editor.chave, editor.indice, mudancas)}
          aoMoverPara={(dataNova) => moverTarefa(editor.chave, editor.indice, dataNova)}
          aoCriarCategoria={criarCategoria}
          aoEditarCategoria={editarCategoria}
          aoRemoverCategoria={removerCategoria}
          aoExcluir={() => excluirTarefa(editor.chave, editor.indice)}
          aoAbrirEmTelaCheia={() => {
            abrirPagina(paginaEmEdicao.id)
            definirEditor(null)
          }}
          aoFechar={() => fecharEditor(editor)}
        />
      )}
    </div>
  )
}

/** Uma tarefa dentro da celula do dia. */
function Tarefa({
  data,
  tarefa,
  titulo,
  categorias,
  aoAbrir,
  aoMarcar,
  aoAbrirMenu,
}: {
  data: string
  tarefa: AnotacaoDia
  /** Titulo vem da pagina da tarefa, que e onde ele mora. */
  titulo: string
  categorias: CategoriaTarefa[]
  aoAbrir: () => void
  aoMarcar: () => void
  aoAbrirMenu: (x: number, y: number) => void
}) {
  const categoria = categoriaPorId(categorias, tarefa.categoriaId)
  // A situacao vem calculada: passou do prazo sem finalizar, aparece atrasada.
  const status = definicaoStatus(statusEfetivo(data, tarefa))

  return (
    <span
      className="anotacao"
      data-feito={tarefa.feito || undefined}
      data-com-categoria={categoria ? 'true' : undefined}
      title={resumoDaTarefa(data, { ...tarefa, texto: titulo }, categorias)}
      style={categoria ? { borderLeftColor: categoria.cor } : undefined}
      onClick={(e) => {
        e.stopPropagation()
        aoAbrir()
      }}
    >
      {tarefa.checklist && (
        <button
          className="anotacao-caixa"
          role="checkbox"
          aria-checked={!!tarefa.feito}
          title={tarefa.feito ? 'Reabrir' : 'Marcar como finalizada'}
          onClick={(e) => {
            e.stopPropagation()
            aoMarcar()
          }}
        >
          ✓
        </button>
      )}

      {status && <span className="anotacao-status" style={{ background: status.cor }} />}

      {tarefa.hora && <span className="anotacao-hora">{tarefa.hora}</span>}

      <span className="anotacao-texto">{titulo}</span>

      <button
        className="anotacao-menu"
        title="Opcoes da tarefa"
        aria-label="Opcoes da tarefa"
        onClick={(e) => {
          e.stopPropagation()
          const caixa = (e.currentTarget as HTMLElement).getBoundingClientRect()
          aoAbrirMenu(caixa.left - 150, caixa.bottom + 6)
        }}
      >
        ⋯
      </button>
    </span>
  )
}

/** Menu de tres pontos de uma tarefa. */
function MenuTarefa({
  tarefa,
  x,
  y,
  aoAlterar,
  aoAbrirJanela,
  aoAbrirEmTelaCheia,
  aoRemover,
  aoFechar,
}: {
  tarefa: AnotacaoDia | undefined
  x: number
  y: number
  aoAlterar: (mudancas: Partial<AnotacaoDia>) => void
  aoAbrirJanela: () => void
  aoAbrirEmTelaCheia: () => void
  aoRemover: () => void
  aoFechar: () => void
}) {
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function aoClicar(evento: MouseEvent) {
      if (!caixa.current?.contains(evento.target as Node)) aoFechar()
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') aoFechar()
    }
    const t = window.setTimeout(() => document.addEventListener('mousedown', aoClicar))
    document.addEventListener('keydown', aoTeclar)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aoFechar])

  if (!tarefa) return null

  const topo = Math.max(8, Math.min(y, window.innerHeight - 300))
  const esquerda = Math.max(8, Math.min(x, window.innerWidth - 240))

  return (
    <div className="menu" ref={caixa} style={{ top: topo, left: esquerda, minWidth: 220 }}>
      <button className="menu-item" onClick={aoAbrirJanela}>
        <span className="glifo">✎</span>
        <span className="rotulo">Abrir tarefa</span>
      </button>
      <button className="menu-item" onClick={aoAbrirEmTelaCheia}>
        <span className="glifo">⤢</span>
        <span className="rotulo">Abrir em tela cheia</span>
      </button>

      <div className="menu-separador" />

      {/* Finalizar e desmarcar estao sempre disponiveis. */}
      <button
        className="menu-item"
        onClick={() =>
          tarefa.feito ? aoAlterar({ feito: false }) : aoAlterar({ checklist: true, feito: true })
        }
      >
        <span className="glifo">{tarefa.feito ? '↺' : '✓'}</span>
        <span className="rotulo">{tarefa.feito ? 'Desmarcar finalizada' : 'Finalizada'}</span>
      </button>

      {!tarefa.checklist ? (
        <>
          <div className="menu-grupo">Tornar essa tarefa...</div>
          <button className="menu-item" onClick={() => aoAlterar({ checklist: true, feito: false })}>
            <span className="glifo">☑</span>
            <span>
              <span className="rotulo">Um checklist</span>
              <br />
              <span className="descricao">Ganha caixa para marcar quando terminar</span>
            </span>
          </button>
        </>
      ) : (
        <button className="menu-item" onClick={() => aoAlterar({ checklist: false, feito: false })}>
          <span className="glifo">≡</span>
          <span className="rotulo">Voltar a ser anotacao</span>
        </button>
      )}

      <div className="menu-separador" />

      <button className="menu-item" onClick={aoRemover}>
        <span className="glifo" style={{ color: '#d4443a' }}>
          🗑
        </span>
        <span className="rotulo" style={{ color: '#d4443a' }}>
          Excluir
        </span>
      </button>
    </div>
  )
}
