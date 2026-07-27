/**
 * Janela de categorias.
 *
 * Mostra as categorias do espaco, quantas paginas usam cada uma, e permite
 * criar, renomear, trocar a cor e excluir. Clicar numa categoria lista as
 * paginas dela, e clicar numa pagina abre.
 */

import { useMemo, useState } from 'react'
import { useEspaco } from '../estado/espaco'
import { Janela } from './Janela'
import { SeletorCategoria } from './SeletorCategoria'
import { iconeDaPagina } from '../lib/pagina'
import { descricaoDaSituacao } from '../lib/tarefas'
import { PontoSituacao } from './PontoSituacao'

export function JanelaCategorias({ aoFechar }: { aoFechar: () => void }) {
  const {
    espaco,
    abrirPagina,
    criarCategoria,
    editarCategoria,
    removerCategoria,
    tarefasPorPagina,
  } = useEspaco()

  const categorias = espaco.categories ?? []
  const [selecionada, definirSelecionada] = useState<string | undefined>(categorias[0]?.id)

  /** Paginas de cada categoria, para o numero e para a lista. */
  const porCategoria = useMemo(() => {
    const mapa: Record<string, string[]> = {}
    for (const categoria of categorias) mapa[categoria.id] = []

    for (const pagina of Object.values(espaco.pages)) {
      // A categoria pode vir da propria pagina ou da tarefa de calendario
      // ligada a ela. As duas contam.
      const id = pagina.categoriaId ?? tarefasPorPagina[pagina.id]?.categoria?.id
      if (id && mapa[id]) mapa[id].push(pagina.id)
    }

    return mapa
  }, [espaco.pages, categorias, tarefasPorPagina])

  const daSelecionada = selecionada ? (porCategoria[selecionada] ?? []) : []

  return (
    <Janela titulo="Categorias" aoFechar={aoFechar} largura={540}>
      <div className="janela-corpo">
        <p className="categorias-explicacao">
          As categorias valem para o espaco inteiro. Da para usar tanto numa pagina comum quanto
          numa tarefa de calendario.
        </p>

        <SeletorCategoria
          categorias={categorias}
          selecionada={selecionada}
          aoSelecionar={definirSelecionada}
          aoCriar={(categoria) => {
            criarCategoria(categoria)
            definirSelecionada(categoria.id)
          }}
          aoEditar={editarCategoria}
          aoRemover={(id) => {
            removerCategoria(id)
            definirSelecionada(undefined)
          }}
          rotuloVazio="Nenhuma"
          contagens={Object.fromEntries(
            Object.entries(porCategoria).map(([id, lista]) => [id, lista.length]),
          )}
        />
      </div>

      {selecionada && (
        <div className="avisos-lista" style={{ borderTop: '1px solid var(--borda)' }}>
          <div className="menu-grupo">
            Paginas nesta categoria ({daSelecionada.length})
          </div>

          {daSelecionada.length === 0 && (
            <div className="menu-vazio" style={{ padding: '22px 20px' }}>
              Nenhuma pagina usa esta categoria ainda.
            </div>
          )}

          {daSelecionada.map((paginaId) => {
            const pagina = espaco.pages[paginaId]
            if (!pagina) return null
            const info = tarefasPorPagina[paginaId]

            return (
              <button
                key={paginaId}
                className="aviso-item"
                title={info ? descricaoDaSituacao(info) : undefined}
                onClick={() => {
                  abrirPagina(paginaId)
                  aoFechar()
                }}
              >
                <span className="aviso-corpo">
                  <span className="aviso-titulo">
                    {iconeDaPagina(pagina)} {pagina.title || 'Sem titulo'}
                  </span>
                  {info && <span className="aviso-detalhe">{descricaoDaSituacao(info)}</span>}
                </span>
                <PontoSituacao info={info} />
              </button>
            )
          })}
        </div>
      )}
    </Janela>
  )
}
