/**
 * Bolinhas de categoria e de situacao, ao lado do icone da pagina.
 *
 * Sao duas bolinhas separadas de proposito: a da categoria diz do que a pagina
 * trata, e a da situacao diz em que pe ela esta. Uma nao substitui a outra,
 * entao as duas aparecem juntas quando existem as duas.
 */

import { descricaoDaSituacao, type InfoTarefa } from '../lib/tarefas'
import { COR_FINALIZADA } from '../lib/tarefas'
import { definicaoStatus } from '../calendario'

export function PontoSituacao({ info }: { info: InfoTarefa | undefined }) {
  if (!info) return null

  const corDaSituacao = info.feito ? COR_FINALIZADA : definicaoStatus(info.status)?.cor
  const legenda = descricaoDaSituacao(info)

  if (!corDaSituacao && !info.categoria) return null

  return (
    <span className="pontos" title={legenda} aria-label={legenda}>
      {info.categoria && (
        <span
          className="ponto-situacao ponto-categoria"
          style={{ background: info.categoria.cor }}
        />
      )}
      {corDaSituacao && (
        <span
          className="ponto-situacao"
          data-feito={info.feito || undefined}
          style={{ background: corDaSituacao }}
        />
      )}
    </span>
  )
}
