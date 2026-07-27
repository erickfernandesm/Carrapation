/**
 * Visao de tabela do calendario.
 *
 * Mostra as mesmas tarefas da grade do mes, so que em linhas, com as colunas
 * de dia, horario, categoria e situacao. Nao existe dado separado: as duas
 * visoes leem e escrevem no mesmo lugar.
 */

import type { AnotacaoDia, CategoriaTarefa } from '../types'
import { categoriaPorId, definicaoStatus, statusEfetivo } from '../calendario'

/** Uma linha da tabela, ja com o que veio da pagina da tarefa. */
export interface LinhaTarefa {
  chave: string
  indice: number
  tarefa: AnotacaoDia
  titulo: string
  icone: string
}

export function TabelaTarefas({
  linhas,
  categorias,
  aoAbrir,
  aoAlternarFinalizada,
  aoAbrirMenu,
  aoCriarTarefa,
}: {
  linhas: LinhaTarefa[]
  categorias: CategoriaTarefa[]
  aoAbrir: (chave: string, indice: number) => void
  aoAlternarFinalizada: (chave: string, indice: number) => void
  aoAbrirMenu: (chave: string, indice: number, x: number, y: number) => void
  aoCriarTarefa: () => void
}) {
  if (linhas.length === 0) {
    return (
      <div className="tabela-vazia">
        <p>Nenhuma tarefa ainda.</p>
        <button className="btn btn-primario" onClick={aoCriarTarefa}>
          ✚ Criar a primeira tarefa
        </button>
      </div>
    )
  }

  return (
    <div className="tabela-rolagem">
      <table className="tabela-tarefas">
        <thead>
          <tr>
            <th className="col-caixa" aria-label="Finalizada" />
            <th>Tarefa</th>
            <th className="col-dia">Dia</th>
            <th className="col-hora">Horario</th>
            <th className="col-categoria">Categoria</th>
            <th className="col-situacao">Situacao</th>
            <th className="col-menu" aria-label="Opcoes" />
          </tr>
        </thead>

        <tbody>
          {linhas.map(({ chave, indice, tarefa, titulo, icone }) => {
            const categoria = categoriaPorId(categorias, tarefa.categoriaId)
            // A situacao vem calculada, entao o que passou do prazo aparece
            // como atrasado mesmo sem ninguem ter marcado na mao.
            const status = definicaoStatus(statusEfetivo(chave, tarefa))

            return (
              <tr
                key={`${chave}-${indice}`}
                data-feito={tarefa.feito || undefined}
                onClick={() => aoAbrir(chave, indice)}
              >
                <td className="col-caixa">
                  <button
                    className="caixa-tabela"
                    data-marcada={tarefa.feito || undefined}
                    role="checkbox"
                    aria-checked={!!tarefa.feito}
                    title={tarefa.feito ? 'Reabrir' : 'Marcar como finalizada'}
                    onClick={(e) => {
                      e.stopPropagation()
                      aoAlternarFinalizada(chave, indice)
                    }}
                  >
                    ✓
                  </button>
                </td>

                <td className="celula-titulo">
                  <span className="tabela-icone">{icone}</span>
                  <span className="tabela-nome">{titulo}</span>
                </td>

                <td className="col-dia">{formatarDia(chave)}</td>

                <td className="col-hora">{tarefa.hora ?? <span className="vazio">sem hora</span>}</td>

                <td className="col-categoria">
                  {categoria ? (
                    <span className="etiqueta-tabela" style={{ borderColor: categoria.cor }}>
                      <span className="ponto" style={{ background: categoria.cor }} />
                      {categoria.nome}
                    </span>
                  ) : (
                    <span className="vazio">sem categoria</span>
                  )}
                </td>

                <td className="col-situacao">
                  {tarefa.feito ? (
                    <span className="etiqueta-tabela" style={{ borderColor: '#0f7a6c' }}>
                      <span className="ponto" style={{ background: '#0f7a6c' }} />
                      Finalizada
                    </span>
                  ) : status ? (
                    <span className="etiqueta-tabela" style={{ borderColor: status.cor }}>
                      <span className="ponto" style={{ background: status.cor }} />
                      {status.nome}
                    </span>
                  ) : (
                    <span className="vazio">sem situacao</span>
                  )}
                </td>

                <td className="col-menu">
                  <button
                    className="btn-icone"
                    title="Opcoes da tarefa"
                    aria-label="Opcoes da tarefa"
                    onClick={(e) => {
                      e.stopPropagation()
                      const caixa = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      aoAbrirMenu(chave, indice, caixa.left - 180, caixa.bottom + 6)
                    }}
                  >
                    ⋯
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <button className="tabela-nova" onClick={aoCriarTarefa}>
        ✚ Nova tarefa
      </button>
    </div>
  )
}

/** Data no formato curto usado na coluna Dia. */
function formatarDia(chave: string): string {
  const [ano, mes, dia] = chave.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
