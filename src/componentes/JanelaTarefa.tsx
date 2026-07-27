/**
 * Janela de uma tarefa do calendario.
 *
 * A tarefa e uma pagina de verdade. Esta janela e a mesma pagina aberta em
 * cima do calendario: icone, titulo e blocos sao os da pagina, e por isso ela
 * tambem aparece na barra lateral, pendurada na pagina do calendario.
 *
 * O que e so da tarefa, e nao da pagina, fica na faixa de propriedades: o dia,
 * o horario, a categoria, a situacao e o finalizada.
 *
 * Nada aqui tem botao de salvar. Toda mudanca vale na hora, igual ao resto do
 * sistema.
 */

import { useEffect, useRef, useState } from 'react'
import type { AnotacaoDia, CategoriaTarefa, Page, StatusTarefa } from '../types'
import { Janela } from './Janela'
import { Editor } from './Editor'
import { SeletorEmoji } from './SeletorEmoji'
import { useEspaco } from '../estado/espaco'
import { SeletorCategoria } from './SeletorCategoria'
import { estaAtrasada, STATUS_TAREFA } from '../calendario'

export function JanelaTarefa({
  tarefa,
  pagina,
  data,
  categorias,
  aoAlterarTarefa,
  aoMoverPara,
  aoCriarCategoria,
  aoEditarCategoria,
  aoRemoverCategoria,
  aoExcluir,
  aoAbrirEmTelaCheia,
  aoFechar,
}: {
  tarefa: AnotacaoDia
  /** A pagina da tarefa. Titulo, icone e conteudo moram nela. */
  pagina: Page
  /** Data atual da tarefa, no formato AAAA-MM-DD. */
  data: string
  categorias: CategoriaTarefa[]
  aoAlterarTarefa: (mudancas: Partial<AnotacaoDia>) => void
  aoMoverPara: (dataNova: string) => void
  aoCriarCategoria: (categoria: CategoriaTarefa) => void
  aoEditarCategoria: (categoria: CategoriaTarefa) => void
  /** Alem de sumir da lista, a categoria some das tarefas que a usavam. */
  aoRemoverCategoria: (id: string) => void
  aoExcluir: () => void
  aoAbrirEmTelaCheia: () => void
  aoFechar: () => void
}) {
  const { renomearPagina, definirIconePagina } = useEspaco()

  const [emoji, definirEmoji] = useState<{ x: number; y: number } | null>(null)
  const titulo = useRef<HTMLTextAreaElement>(null)

  // O campo de titulo cresce junto com o texto.
  useEffect(() => {
    const campo = titulo.current
    if (!campo) return
    campo.style.height = 'auto'
    campo.style.height = `${campo.scrollHeight}px`
  }, [pagina.title])

  // Tarefa recem criada ja abre com o cursor no titulo.
  useEffect(() => {
    if (pagina.title === '') titulo.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const atrasada = estaAtrasada(data, tarefa)

  return (
    <Janela aoFechar={aoFechar} largura={760}>
      <div className="tarefa-janela">
        <div className="tarefa-cabecalho">
          <button
            className="tarefa-icone"
            title="Trocar o icone"
            onClick={(e) => {
              const caixa = e.currentTarget.getBoundingClientRect()
              definirEmoji({ x: caixa.left, y: caixa.bottom + 6 })
            }}
          >
            {pagina.icon || '🗓️'}
          </button>

          <textarea
            ref={titulo}
            className="tarefa-titulo"
            value={pagina.title}
            rows={1}
            placeholder="Sem titulo"
            onChange={(e) => renomearPagina(pagina.id, e.target.value.replace(/\n/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                document.querySelector<HTMLElement>('.tarefa-corpo .texto')?.focus()
              }
            }}
          />

          <button className="btn-icone" title="Abrir em tela cheia" onClick={aoAbrirEmTelaCheia}>
            ⤢
          </button>
        </div>

        {/* Faixa de propriedades, no estilo de uma ficha. */}
        <div className="propriedades">
          <div className="propriedade">
            <label className="propriedade-nome" htmlFor="tarefa-data">
              📅 Dia
            </label>
            <input
              id="tarefa-data"
              className="propriedade-campo"
              type="date"
              value={data}
              onChange={(e) => e.target.value && aoMoverPara(e.target.value)}
            />
          </div>

          <div className="propriedade">
            <label className="propriedade-nome" htmlFor="tarefa-hora">
              🕐 Horario
            </label>
            <input
              id="tarefa-hora"
              className="propriedade-campo"
              type="time"
              value={tarefa.hora ?? ''}
              onChange={(e) => aoAlterarTarefa({ hora: e.target.value || undefined })}
            />
          </div>

          <div className="propriedade propriedade-larga">
            <span className="propriedade-nome">🏷️ Categoria</span>
            <SeletorCategoria
              categorias={categorias}
              selecionada={tarefa.categoriaId}
              aoSelecionar={(id) => aoAlterarTarefa({ categoriaId: id })}
              aoCriar={aoCriarCategoria}
              aoEditar={aoEditarCategoria}
              aoRemover={aoRemoverCategoria}
            />
          </div>

          <div className="propriedade propriedade-larga">
            <span className="propriedade-nome">🚦 Situacao</span>
            {atrasada && (
              <div className="aviso-atraso">
                Passou do prazo, entao a tarefa aparece como <strong>Atrasada</strong> sozinha. Mude o
                dia ou marque como finalizada para tirar o aviso.
              </div>
            )}
            <div className="etiquetas">
              <button
                className="etiqueta"
                data-ativa={!tarefa.status || undefined}
                onClick={() => aoAlterarTarefa({ status: undefined })}
              >
                Sem situacao
              </button>
              {STATUS_TAREFA.map((definicao) => (
                <button
                  key={definicao.id}
                  className="etiqueta"
                  data-ativa={tarefa.status === definicao.id || undefined}
                  style={{ borderColor: definicao.cor }}
                  onClick={() => aoAlterarTarefa({ status: definicao.id as StatusTarefa })}
                >
                  <span className="ponto" style={{ background: definicao.cor }} />
                  {definicao.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="propriedade propriedade-larga">
            <label className="linha-marcar">
              <input
                type="checkbox"
                checked={!!tarefa.feito}
                onChange={(e) =>
                  aoAlterarTarefa(
                    e.target.checked ? { checklist: true, feito: true } : { feito: false },
                  )
                }
              />
              <span>Finalizada</span>
              {tarefa.feito && <span className="propriedade-dica">Desmarque para reabrir</span>}
            </label>
          </div>
        </div>

        {/* O corpo e o editor da pagina, igual ao de qualquer outra pagina. */}
        <div className="tarefa-corpo">
          <Editor key={pagina.id} pagina={pagina} />
        </div>

        <div className="janela-rodape" style={{ margin: 0, padding: '14px 22px' }}>
          <button
            className="btn btn-perigo"
            onClick={() => {
              if (window.confirm('Excluir esta tarefa e a pagina dela?')) aoExcluir()
            }}
          >
            Excluir tarefa
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-contorno" onClick={aoAbrirEmTelaCheia}>
              Abrir em tela cheia
            </button>
            <button className="btn btn-primario" onClick={aoFechar}>
              Concluir
            </button>
          </div>
        </div>
      </div>

      {emoji && (
        <SeletorEmoji
          x={emoji.x}
          y={emoji.y}
          aoEscolher={(escolhido) => {
            definirIconePagina(pagina.id, escolhido)
            definirEmoji(null)
          }}
          aoFechar={() => definirEmoji(null)}
        />
      )}
    </Janela>
  )
}
