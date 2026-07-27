/**
 * Escolha de categoria da tarefa.
 *
 * Alem de escolher, permite criar, renomear, trocar a cor e excluir uma
 * categoria. As categorias pertencem ao calendario, entao valem para todas as
 * tarefas dele.
 */

import { useState } from 'react'
import type { CategoriaTarefa } from '../types'
import { CORES_CATEGORIA } from '../calendario'
import { novoId } from '../lib/id'
import { Janela } from './Janela'

export function SeletorCategoria({
  categorias,
  selecionada,
  aoSelecionar,
  aoCriar,
  aoEditar,
  aoRemover,
  rotuloVazio = 'Sem categoria',
  contagens,
}: {
  categorias: CategoriaTarefa[]
  selecionada: string | undefined
  aoSelecionar: (id: string | undefined) => void
  aoCriar: (categoria: CategoriaTarefa) => void
  aoEditar: (categoria: CategoriaTarefa) => void
  /** Alem de sumir da lista, some das paginas e das tarefas que a usavam. */
  aoRemover: (id: string) => void
  /** Texto da primeira etiqueta, a que representa nenhuma categoria. */
  rotuloVazio?: string
  /** Quantas paginas usam cada categoria. Opcional. */
  contagens?: Record<string, number>
}) {
  // null quer dizer nenhum formulario aberto, 'nova' quer dizer criando,
  // qualquer outro valor e o id da categoria sendo editada.
  const [formulario, definirFormulario] = useState<string | null>(null)
  const [nome, definirNome] = useState('')
  const [cor, definirCor] = useState(CORES_CATEGORIA[0])

  function abrirNova() {
    definirFormulario('nova')
    definirNome('')
    definirCor(CORES_CATEGORIA[0])
  }

  function abrirEdicao(categoria: CategoriaTarefa) {
    definirFormulario(categoria.id)
    definirNome(categoria.nome)
    definirCor(categoria.cor)
  }

  function confirmar() {
    const limpo = nome.trim()
    if (!limpo) return

    if (formulario === 'nova') {
      const nova: CategoriaTarefa = { id: novoId(), nome: limpo, cor }
      aoCriar(nova)
      aoSelecionar(nova.id)
    } else if (formulario) {
      aoEditar({ id: formulario, nome: limpo, cor })
    }

    definirFormulario(null)
  }

  function remover() {
    if (!formulario || formulario === 'nova') return
    const alvo = categorias.find((c) => c.id === formulario)

    const aviso = `Excluir a categoria "${alvo?.nome ?? ''}"?\n\nAs tarefas que usam ela ficam sem categoria. As tarefas em si nao sao apagadas.`
    if (!window.confirm(aviso)) return

    aoRemover(formulario)
    definirFormulario(null)
  }

  return (
    <>
      <div className="etiquetas">
        <button
          className="etiqueta"
          data-ativa={!selecionada || undefined}
          onClick={() => aoSelecionar(undefined)}
        >
          {rotuloVazio}
        </button>

        {categorias.map((categoria) => (
          <span key={categoria.id} className="etiqueta-com-menu">
            <button
              className="etiqueta"
              data-ativa={selecionada === categoria.id || undefined}
              style={{ borderColor: categoria.cor }}
              onClick={() => aoSelecionar(categoria.id)}
            >
              <span className="ponto" style={{ background: categoria.cor }} />
              {categoria.nome}
              {contagens && <span className="etiqueta-conta">{contagens[categoria.id] ?? 0}</span>}
            </button>
            <button
              className="etiqueta-editar"
              title={`Editar ou excluir a categoria ${categoria.nome}`}
              aria-label={`Editar a categoria ${categoria.nome}`}
              onClick={() => abrirEdicao(categoria)}
            >
              ⋯
            </button>
          </span>
        ))}

        {!formulario && (
          <button className="etiqueta etiqueta-nova" onClick={abrirNova}>
            ✚ Nova categoria
          </button>
        )}
      </div>

      {formulario && (
        <Janela
          titulo={formulario === 'nova' ? 'Nova categoria' : 'Editar categoria'}
          largura={420}
          aoFechar={() => definirFormulario(null)}
        >
          <div className="janela-corpo">
            <div className="campo-grupo">
              <label className="rotulo-campo" htmlFor="categoria-nome">
                Nome
              </label>
              <input
                id="categoria-nome"
                className="campo"
                autoFocus
                value={nome}
                placeholder="Por exemplo Reuniao, Financeiro, Pessoal"
                onChange={(e) => definirNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmar()
                  }
                }}
              />
            </div>

            <div className="campo-grupo">
              <span className="rotulo-campo">Cor</span>
              <div className="cores">
                {CORES_CATEGORIA.map((opcao) => (
                  <button
                    key={opcao}
                    style={{ background: opcao }}
                    data-ativo={cor === opcao || undefined}
                    aria-label={`Cor ${opcao}`}
                    onClick={() => definirCor(opcao)}
                  />
                ))}
              </div>
            </div>

            <div className="campo-grupo">
              <span className="rotulo-campo">Como vai aparecer</span>
              <span className="etiqueta" style={{ borderColor: cor }}>
                <span className="ponto" style={{ background: cor }} />
                {nome.trim() || 'Sem nome'}
              </span>
            </div>

            <div className="janela-rodape">
              {formulario !== 'nova' ? (
                <button className="btn btn-perigo" onClick={remover}>
                  Excluir categoria
                </button>
              ) : (
                <span />
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-contorno" onClick={() => definirFormulario(null)}>
                  Cancelar
                </button>
                <button className="btn btn-primario" onClick={confirmar}>
                  {formulario === 'nova' ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </Janela>
      )}
    </>
  )
}
