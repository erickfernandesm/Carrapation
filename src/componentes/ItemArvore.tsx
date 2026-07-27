/** Uma pagina na arvore da barra lateral, junto com as filhas dela. */

import { useState } from 'react'
import { useEspaco } from '../estado/espaco'
import { MenuPagina } from './MenuPagina'
import { iconeDaPagina } from '../lib/pagina'
import { BotaoNovaPagina } from './BotaoNovaPagina'
import { PontoSituacao } from './PontoSituacao'
import { descricaoDaSituacao } from '../lib/tarefas'

export function ItemArvore({
  paginaId,
  nivel,
  mostrarFilhas = true,
}: {
  paginaId: string
  nivel: number
  /** A lista de favoritos mostra a pagina sozinha, sem a descendencia dela. */
  mostrarFilhas?: boolean
}) {
  const {
    espaco,
    paginaAtualId,
    abrirPagina,
    moverPagina,
    tarefasPorPagina,
    alternarVisaoCalendario,
  } = useEspaco()

  const pagina = espaco.pages[paginaId]
  // Preenchido apenas quando esta pagina e uma tarefa de algum calendario.
  const tarefa = tarefasPorPagina[paginaId]
  // Preenchido quando esta pagina contem um calendario.
  const calendario = pagina?.blocks.find((b) => b.type === 'calendar')

  const [aberta, definirAberta] = useState(false)
  const [menu, definirMenu] = useState<{ x: number; y: number } | null>(null)
  const [alvoDeSolta, definirAlvoDeSolta] = useState(false)

  if (!pagina) return null

  const temFilhas = mostrarFilhas && pagina.childIds.length > 0

  return (
    <>
      <div
        className="item"
        style={{ paddingLeft: 4 + nivel * 15 }}
        data-ativa={paginaAtualId === paginaId}
        data-alvo={alvoDeSolta || undefined}
        title={tarefa ? descricaoDaSituacao(tarefa) : undefined}
        onClick={() => abrirPagina(paginaId)}
        // Botao direito abre o mesmo menu do botao de tres pontos.
        onContextMenu={(e) => {
          e.preventDefault()
          definirMenu({ x: e.clientX, y: e.clientY })
        }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('carrapation/pagina', paginaId)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes('carrapation/pagina')) return
          e.preventDefault()
          definirAlvoDeSolta(true)
        }}
        onDragLeave={() => definirAlvoDeSolta(false)}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          definirAlvoDeSolta(false)
          const arrastadaId = e.dataTransfer.getData('carrapation/pagina')
          if (arrastadaId && arrastadaId !== paginaId) {
            moverPagina(arrastadaId, paginaId)
            definirAberta(true)
          }
        }}
      >
        <button
          className="item-seta"
          data-aberta={aberta}
          onClick={(e) => {
            e.stopPropagation()
            definirAberta((v) => !v)
          }}
          title={temFilhas ? 'Mostrar subpaginas' : 'Sem subpaginas'}
          style={{ visibility: temFilhas ? 'visible' : 'hidden' }}
          aria-label="Mostrar subpaginas"
        >
          ▶
        </button>

        <span className="item-icone">{iconeDaPagina(pagina)}</span>
        <PontoSituacao info={tarefa} />
        <span
          className="item-titulo"
          data-vazio={!pagina.title || undefined}
          data-feito={tarefa?.feito || undefined}
        >
          {pagina.title || 'Sem titulo'}
        </span>

        {pagina.favorite && (
          <span className="item-estrela" title="Nos favoritos">
            ★
          </span>
        )}

        <span className="item-botoes">
          {/* So paginas que tem calendario ganham o botao de trocar a visao. */}
          {calendario && (
            <button
              className="item-botao"
              title={
                calendario.view === 'tabela'
                  ? 'Ver as tarefas como calendario'
                  : 'Ver as tarefas como tabela'
              }
              aria-label="Alternar entre calendario e tabela"
              onClick={(e) => {
                e.stopPropagation()
                alternarVisaoCalendario(paginaId)
                abrirPagina(paginaId)
              }}
            >
              {calendario.view === 'tabela' ? '📅' : '▦'}
            </button>
          )}
          <button
            className="item-botao"
            title="Mais opcoes (ou clique com o botao direito)"
            aria-label="Mais opcoes da pagina"
            onClick={(e) => {
              e.stopPropagation()
              const caixa = (e.currentTarget as HTMLElement).getBoundingClientRect()
              definirMenu({ x: caixa.left - 60, y: caixa.bottom + 5 })
            }}
          >
            ⋯
          </button>
          <BotaoNovaPagina className="item-botao" titulo="Criar subpagina" paiId={paginaId}>
            +
          </BotaoNovaPagina>
        </span>
      </div>

      {temFilhas &&
        aberta &&
        pagina.childIds.map((filhaId) => (
          <ItemArvore key={filhaId} paginaId={filhaId} nivel={nivel + 1} />
        ))}

      {menu && (
        <MenuPagina paginaId={paginaId} x={menu.x} y={menu.y} aoFechar={() => definirMenu(null)} />
      )}
    </>
  )
}
