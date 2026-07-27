/**
 * Avisos de tarefas vencidas.
 *
 * Sao dois pontos de entrada para a mesma janela: o sininho do topo e o item
 * Notificacoes da barra lateral. Os dois mostram a bolinha da marca quando ha
 * tarefa vencida ou tarefa para hoje em qualquer calendario do espaco.
 */

import { useEffect, useMemo } from 'react'
import { useEspaco } from '../estado/espaco'
import { Janela } from './Janela'
import {
  chaveDoAviso,
  coletarAvisos,
  dataCurta,
  diasDeAtraso,
  type Aviso,
  type Avisos as ListaAvisos,
} from '../lib/avisos'
import { definicaoStatus } from '../calendario'

/** Os avisos do espaco, mais quantos ainda nao foram lidos. */
export interface AvisosComLeitura extends ListaAvisos {
  /** Quantos avisos de hoje ou vencidos ainda nao foram vistos. */
  naoVistos: number
  /** Chaves de tudo que esta na janela agora, para marcar como lido. */
  chavesVisiveis: string[]
}

/** Calcula os avisos do espaco inteiro. Usado pelo sino e pela barra lateral. */
export function useAvisos(): AvisosComLeitura {
  const { espaco, avisosVistos } = useEspaco()
  const avisos = useMemo(() => coletarAvisos(espaco), [espaco])

  return useMemo(() => {
    const vistos = new Set(avisosVistos)
    const acionaveis = [...avisos.vencidas, ...avisos.hoje]

    return {
      ...avisos,
      naoVistos: acionaveis.filter((a) => !vistos.has(chaveDoAviso(a))).length,
      chavesVisiveis: acionaveis.map(chaveDoAviso),
    }
  }, [avisos, avisosVistos])
}

/**
 * A bolinha que marca que existe aviso.
 * E o icone da marca dentro de um circulo, e nao um ponto qualquer.
 */
export function BolinhaAviso({
  vencida,
  /** No sino ela fica presa no canto. Na barra lateral ela entra na linha. */
  naLinha,
}: {
  vencida: boolean
  naLinha?: boolean
}) {
  return (
    <span
      className="avisos-bolinha"
      data-vencida={vencida || undefined}
      data-na-linha={naLinha || undefined}
      aria-hidden="true"
    >
      <img src={`${import.meta.env.BASE_URL}icone.svg`} alt="" />
    </span>
  )
}

/** Sininho do topo da tela. */
export function SinoAvisos({ aoAbrir }: { aoAbrir: () => void }) {
  const avisos = useAvisos()

  const titulo =
    avisos.naoVistos > 0
      ? `${avisos.naoVistos} aviso(s) novo(s)`
      : avisos.total > 0
        ? `${avisos.total} tarefa(s) em aberto, ja vistas`
        : 'Nenhum aviso'

  return (
    <button className="btn-icone avisos-sino" title={titulo} aria-label={titulo} onClick={aoAbrir}>
      🔔
      {/* A bolinha marca so o que ainda nao foi lido. */}
      {avisos.naoVistos > 0 && <BolinhaAviso vencida={avisos.vencidas.length > 0} />}
    </button>
  )
}

/** Janela com a lista de avisos. */
export function JanelaAvisos({ aoFechar }: { aoFechar: () => void }) {
  const { abrirPagina, marcarAvisosComoVistos } = useEspaco()
  const avisos = useAvisos()

  // Abriu a janela, os avisos passam a contar como lidos e a bolinha some.
  // Ela volta sozinha quando aparecer tarefa nova vencida ou para hoje.
  const chaves = avisos.chavesVisiveis
  useEffect(() => {
    marcarAvisosComoVistos(chaves)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function irPara(aviso: Aviso) {
    abrirPagina(aviso.paginaId)
    aoFechar()
  }

  const vazio = avisos.total === 0 && avisos.proximas.length === 0

  return (
    <Janela titulo="Notificacoes" aoFechar={aoFechar} largura={480}>
      <div className="avisos-lista">
        {vazio && (
          <div className="menu-vazio" style={{ padding: '34px 20px' }}>
            Nada vencido e nada para hoje.
            <br />
            Tudo em dia.
          </div>
        )}

        <Grupo titulo="Vencidas" itens={avisos.vencidas} atrasadas aoAbrir={irPara} />
        <Grupo titulo="Para hoje" itens={avisos.hoje} aoAbrir={irPara} />
        <Grupo titulo="Proximos dias" itens={avisos.proximas} aoAbrir={irPara} />
      </div>
    </Janela>
  )
}

function Grupo({
  titulo,
  itens,
  atrasadas,
  aoAbrir,
}: {
  titulo: string
  itens: Aviso[]
  atrasadas?: boolean
  aoAbrir: (aviso: Aviso) => void
}) {
  if (itens.length === 0) return null

  return (
    <>
      <div className="menu-grupo">
        {titulo} ({itens.length})
      </div>
      {itens.map((aviso, indice) => {
        const status = definicaoStatus(aviso.status)
        const atraso = atrasadas ? diasDeAtraso(aviso.data) : 0

        return (
          <button
            key={`${aviso.paginaId}-${aviso.data}-${indice}`}
            className="aviso-item"
            onClick={() => aoAbrir(aviso)}
          >
            <span
              className="aviso-marca"
              data-atrasada={atrasadas || undefined}
              style={aviso.categoria ? { background: aviso.categoria.cor } : undefined}
            />
            <span className="aviso-corpo">
              <span className="aviso-titulo">{aviso.tarefa.texto}</span>
              <span className="aviso-detalhe">
                {dataCurta(aviso.data)}
                {aviso.tarefa.hora ? ` as ${aviso.tarefa.hora}` : ''}
                {atrasadas ? ` (${atraso} dia${atraso === 1 ? '' : 's'} de atraso)` : ''}
                {status ? ` - ${status.nome}` : ''}
              </span>
              <span className="aviso-pagina">
                {aviso.paginaIcone} {aviso.paginaTitulo}
              </span>
            </span>
          </button>
        )
      })}
    </>
  )
}
