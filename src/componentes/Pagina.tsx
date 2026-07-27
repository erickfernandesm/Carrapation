/** Uma pagina aberta: capa, icone, titulo, blocos e a lista de subpaginas no fim. */

import { useEffect, useRef, useState } from 'react'
import { useEspaco } from '../estado/espaco'
import { Editor } from './Editor'
import { SeletorEmoji } from './SeletorEmoji'
import { CapaPagina } from './CapaPagina'
import { BotaoNovaPagina } from './BotaoNovaPagina'
import { PontoSituacao } from './PontoSituacao'
import { descricaoDaSituacao } from '../lib/tarefas'
import { PainelPropriedade } from './PainelPropriedade'
import { categoriaPorId, definicaoStatus } from '../calendario'
import { iconeDaPagina } from '../lib/pagina'
import { CAPAS_PRONTAS, FONTES } from '../config'

export function Pagina({
  paginaId,
  aoAbrirCategorias,
}: {
  paginaId: string
  aoAbrirCategorias: () => void
}) {
  const {
    espaco,
    abrirPagina,
    renomearPagina,
    definirIconePagina,
    definirCapaPagina,
    definirCategoriaPagina,
    definirStatusPagina,
    tarefasPorPagina,
  } = useEspaco()

  const pagina = espaco.pages[paginaId]

  const titulo = useRef<HTMLTextAreaElement>(null)
  const [emoji, definirEmoji] = useState<{ x: number; y: number } | null>(null)
  const [painel, definirPainel] = useState<{
    tipo: 'categoria' | 'status'
    x: number
    y: number
  } | null>(null)

  const categoriaDaPagina = categoriaPorId(espaco.categories ?? [], pagina?.categoriaId)
  const statusDaPagina = definicaoStatus(pagina?.status)

  // O campo de titulo cresce junto com o texto, sem barra de rolagem.
  useEffect(() => {
    const campo = titulo.current
    if (!campo) return
    campo.style.height = 'auto'
    campo.style.height = `${campo.scrollHeight}px`
  }, [pagina?.title, paginaId])

  // Paginas novas ja abrem com o cursor no titulo. A dependencia e so o id da
  // pagina de proposito: se dependesse do objeto inteiro, o titulo roubaria o
  // foco a cada tecla digitada nos blocos.
  useEffect(() => {
    const aberta = espaco.pages[paginaId]
    if (aberta && aberta.title === '') titulo.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaId])

  if (!pagina) return null

  const temIcone = pagina.icon !== ''
  const temCapa = !!pagina.cover

  /** Abre o seletor de icones ancorado no elemento clicado. */
  function abrirSeletor(evento: React.MouseEvent<HTMLElement>) {
    const caixa = evento.currentTarget.getBoundingClientRect()
    definirEmoji({ x: caixa.left, y: caixa.bottom + 6 })
  }

  /** Sorteia uma das capas prontas ao clicar em "Adicionar capa". */
  function adicionarCapa() {
    const escolhida = CAPAS_PRONTAS[Math.floor(Math.random() * CAPAS_PRONTAS.length)]
    definirCapaPagina(paginaId, escolhida.valor)
  }

  return (
    <>
      <CapaPagina pagina={pagina} />

      <div
        className="pagina"
        data-largo={espaco.wide || undefined}
        data-com-capa={temCapa || undefined}
        // A fonte e o tamanho sao desta pagina. Sem escolha propria, ela cai
        // na fonte definida nas Configuracoes do espaco.
        style={
          {
            '--fonte-pagina': familiaDaFonte(pagina.font ?? espaco.font),
            '--escala-texto': pagina.textScale ?? 1,
          } as React.CSSProperties
        }
      >
        {/* Cabecalho: icone, botoes de adicionar e titulo. Os botoes so acendem
            quando o mouse esta nesta area ou quando o titulo esta em edicao.
            Cada um some sozinho assim que aquele item passa a existir. */}
        <div className="pagina-cabecalho" data-escolhendo={emoji ? 'true' : undefined}>
          {temIcone && (
            <button className="pagina-icone" title="Trocar o icone da pagina" onClick={abrirSeletor}>
              {pagina.icon}
            </button>
          )}

          {(!temIcone || !temCapa) && (
            <div className="pagina-acoes">
              {!temIcone && (
                <button className="btn" onClick={abrirSeletor}>
                  <span style={{ fontSize: 15 }}>🙂</span> Adicionar icone
                </button>
              )}
              {!temCapa && (
                <button className="btn" onClick={adicionarCapa}>
                  <span style={{ fontSize: 15 }}>🖼️</span> Adicionar capa
                </button>
              )}
            </div>
          )}

          <textarea
            ref={titulo}
            className="pagina-titulo"
            value={pagina.title}
            rows={1}
            placeholder="Sem titulo"
            onChange={(e) => renomearPagina(paginaId, e.target.value.replace(/\n/g, ''))}
            onKeyDown={(e) => {
              // Enter no titulo pula direto para o texto.
              if (e.key === 'Enter') {
                e.preventDefault()
                const primeiro = document.querySelector<HTMLElement>('.editor .texto')
                primeiro?.focus()
              }
            }}
          />
        </div>

        {/* Propriedades da pagina. Valem para qualquer pagina, e nao so para
            as que sao tarefa de calendario. */}
        <div className="pagina-propriedades">
          <button
            className="etiqueta"
            data-ativa={!!categoriaDaPagina || undefined}
            style={categoriaDaPagina ? { borderColor: categoriaDaPagina.cor } : undefined}
            onClick={(e) => {
              const caixa = e.currentTarget.getBoundingClientRect()
              definirPainel({ tipo: 'categoria', x: caixa.left, y: caixa.bottom + 6 })
            }}
          >
            {categoriaDaPagina ? (
              <>
                <span className="ponto" style={{ background: categoriaDaPagina.cor }} />
                {categoriaDaPagina.nome}
              </>
            ) : (
              <>🏷️ Categoria</>
            )}
          </button>

          <button
            className="etiqueta"
            data-ativa={!!statusDaPagina || undefined}
            style={statusDaPagina ? { borderColor: statusDaPagina.cor } : undefined}
            onClick={(e) => {
              const caixa = e.currentTarget.getBoundingClientRect()
              definirPainel({ tipo: 'status', x: caixa.left, y: caixa.bottom + 6 })
            }}
          >
            {statusDaPagina ? (
              <>
                <span className="ponto" style={{ background: statusDaPagina.cor }} />
                {statusDaPagina.nome}
              </>
            ) : (
              <>🚦 Situacao</>
            )}
          </button>
        </div>

        <div className="pagina-meta">
          <span>Criada em {formatarData(pagina.createdAt)}</span>
          <span>Alterada em {formatarData(pagina.updatedAt)}</span>
        </div>

        <Editor key={paginaId} pagina={pagina} />

        <div className="subpaginas">
          {pagina.childIds.length > 0 && (
            <>
              <div className="subpaginas-titulo">Subpaginas</div>
              {pagina.childIds.map((filhaId) => {
                const filha = espaco.pages[filhaId]
                if (!filha) return null
                // Preenchido apenas quando a subpagina e uma tarefa de calendario.
                const tarefa = tarefasPorPagina[filhaId]

                return (
                  <button
                    key={filhaId}
                    className="subpagina-link"
                    title={tarefa ? descricaoDaSituacao(tarefa) : undefined}
                    onClick={() => abrirPagina(filhaId)}
                  >
                    <span style={{ fontSize: 17 }}>{iconeDaPagina(filha)}</span>
                    <PontoSituacao info={tarefa} />
                    <span className="nome" data-feito={tarefa?.feito || undefined}>
                      {filha.title || 'Sem titulo'}
                    </span>
                  </button>
                )
              })}
            </>
          )}
          <BotaoNovaPagina className="btn" paiId={paginaId}>
            ✚ Nova subpagina
          </BotaoNovaPagina>
        </div>

        {painel && (
          <PainelPropriedade
            tipo={painel.tipo}
            x={painel.x}
            y={painel.y}
            categorias={espaco.categories ?? []}
            categoriaAtual={pagina.categoriaId}
            statusAtual={pagina.status}
            aoEscolherCategoria={(id) => {
              definirCategoriaPagina(paginaId, id)
              definirPainel(null)
            }}
            aoEscolherStatus={(status) => {
              definirStatusPagina(paginaId, status)
              definirPainel(null)
            }}
            aoGerenciarCategorias={() => {
              definirPainel(null)
              aoAbrirCategorias()
            }}
            aoFechar={() => definirPainel(null)}
          />
        )}

        {emoji && (
          <SeletorEmoji
            x={emoji.x}
            y={emoji.y}
            aoEscolher={(escolhido) => {
              definirIconePagina(paginaId, escolhido)
              definirEmoji(null)
            }}
            aoRemover={
              temIcone
                ? () => {
                    definirIconePagina(paginaId, '')
                    definirEmoji(null)
                  }
                : undefined
            }
            aoFechar={() => definirEmoji(null)}
          />
        )}
      </div>
    </>
  )
}

/** Traduz a escolha de fonte para a familia que o CSS entende. */
function familiaDaFonte(fonte: string): string {
  return FONTES.find((f) => f.id === fonte)?.familia ?? 'var(--fonte-sans)'
}

function formatarData(carimbo: number): string {
  return new Date(carimbo).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
