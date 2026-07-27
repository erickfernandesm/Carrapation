/**
 * Janela de situacoes.
 *
 * Mostra todas as tarefas de calendario do espaco separadas por situacao:
 * atrasadas, urgentes, em andamento, pendentes, sem situacao e finalizadas.
 * Clicar numa linha abre a pagina daquela tarefa.
 */

import { useMemo, useState } from 'react'
import { useEspaco } from '../estado/espaco'
import { Janela } from './Janela'
import { dataCurta } from '../lib/avisos'
import {
  contarPorGrupo,
  GRUPOS_SITUACAO,
  listarTarefas,
  type ChaveGrupo,
  type TarefaListada,
} from '../lib/situacoes'

export function JanelaSituacoes({ aoFechar }: { aoFechar: () => void }) {
  const { espaco, abrirPagina } = useEspaco()
  const [filtro, definirFiltro] = useState<ChaveGrupo | 'todas'>('todas')

  const tarefas = useMemo(() => listarTarefas(espaco), [espaco])
  const contas = useMemo(() => contarPorGrupo(tarefas), [tarefas])

  const visiveis = filtro === 'todas' ? tarefas : tarefas.filter((t) => t.grupo === filtro)

  function abrir(tarefa: TarefaListada) {
    // Tarefa antiga pode nao ter pagina propria. Nesse caso abre o calendario.
    abrirPagina(tarefa.paginaId ?? tarefa.calendarioId)
    aoFechar()
  }

  return (
    <Janela titulo="Situacoes" aoFechar={aoFechar} largura={560}>
      <div className="situacoes-filtros">
        <button
          className="etiqueta"
          data-ativa={filtro === 'todas' || undefined}
          onClick={() => definirFiltro('todas')}
        >
          Todas
          <span className="etiqueta-conta">{tarefas.length}</span>
        </button>

        {GRUPOS_SITUACAO.map((grupo) => (
          <button
            key={grupo.chave}
            className="etiqueta"
            data-ativa={filtro === grupo.chave || undefined}
            data-apagada={contas[grupo.chave] === 0 || undefined}
            style={{ borderColor: grupo.cor }}
            onClick={() => definirFiltro(grupo.chave)}
          >
            <span className="ponto" style={{ background: grupo.cor }} />
            {grupo.nome}
            <span className="etiqueta-conta">{contas[grupo.chave]}</span>
          </button>
        ))}
      </div>

      <div className="avisos-lista">
        {tarefas.length === 0 && (
          <div className="menu-vazio" style={{ padding: '34px 20px' }}>
            Nenhuma tarefa ainda.
            <br />
            Crie um calendario numa pagina e clique num dia.
          </div>
        )}

        {tarefas.length > 0 && visiveis.length === 0 && (
          <div className="menu-vazio" style={{ padding: '30px 20px' }}>
            Nenhuma tarefa nesta situacao.
          </div>
        )}

        {/* Sem filtro, a lista sai agrupada. Com filtro, sai corrida. */}
        {filtro === 'todas'
          ? GRUPOS_SITUACAO.map((grupo) => {
              const doGrupo = tarefas.filter((t) => t.grupo === grupo.chave)
              if (doGrupo.length === 0) return null

              return (
                <div key={grupo.chave}>
                  <div className="menu-grupo">
                    {grupo.nome} ({doGrupo.length})
                  </div>
                  {doGrupo.map((tarefa, indice) => (
                    <Linha
                      key={`${grupo.chave}-${indice}`}
                      tarefa={tarefa}
                      cor={grupo.cor}
                      aoAbrir={abrir}
                    />
                  ))}
                </div>
              )
            })
          : visiveis.map((tarefa, indice) => (
              <Linha
                key={indice}
                tarefa={tarefa}
                cor={GRUPOS_SITUACAO.find((g) => g.chave === tarefa.grupo)?.cor ?? '#9a9a95'}
                aoAbrir={abrir}
              />
            ))}
      </div>
    </Janela>
  )
}

function Linha({
  tarefa,
  cor,
  aoAbrir,
}: {
  tarefa: TarefaListada
  cor: string
  aoAbrir: (tarefa: TarefaListada) => void
}) {
  return (
    <button className="aviso-item" onClick={() => aoAbrir(tarefa)}>
      <span className="aviso-marca" style={{ background: cor }} />
      <span className="aviso-corpo">
        <span className="aviso-titulo" data-feito={tarefa.grupo === 'finalizada' || undefined}>
          {tarefa.icone} {tarefa.titulo}
        </span>
        <span className="aviso-detalhe">
          {/* Pagina comum nao tem prazo, entao a linha mostra so a categoria. */}
          {tarefa.data ? `prazo ${dataCurta(tarefa.data)}` : 'pagina, sem prazo'}
          {tarefa.hora ? ` as ${tarefa.hora}` : ''}
          {tarefa.categoria ? ` - ${tarefa.categoria.nome}` : ''}
        </span>
        {tarefa.data && <span className="aviso-pagina">em {tarefa.calendarioTitulo}</span>}
      </span>
    </button>
  )
}
