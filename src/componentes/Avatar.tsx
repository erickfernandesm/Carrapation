/**
 * Foto do perfil.
 *
 * Sem foto, mostra as iniciais do nome. Se houver moldura escolhida, ela e
 * desenhada por cima, um pouco maior que a foto, e nao recebe clique.
 */

import { MOLDURAS } from '../config'

export function Avatar({
  foto,
  nome,
  moldura,
  tamanho = 28,
}: {
  foto: string | null
  nome: string
  /** Id da moldura. Vazio quer dizer sem moldura. */
  moldura?: string
  tamanho?: number
}) {
  const escolhida = MOLDURAS.find((m) => m.id === moldura)

  const conteudo = foto ? (
    <img
      className="avatar"
      src={foto}
      alt={nome ? `Foto de ${nome}` : 'Foto de perfil'}
      style={{ width: tamanho, height: tamanho }}
    />
  ) : (
    <div
      className="avatar"
      style={{ width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.4) }}
      aria-hidden="true"
    >
      {extrairIniciais(nome)}
    </div>
  )

  if (!escolhida) return conteudo

  return (
    <span className="avatar-com-moldura" style={{ width: tamanho, height: tamanho }}>
      {conteudo}
      <img
        className="avatar-moldura"
        src={`${import.meta.env.BASE_URL}${escolhida.arquivo}`}
        alt=""
        aria-hidden="true"
        style={{ width: tamanho * escolhida.escala, height: tamanho * escolhida.escala }}
      />
    </span>
  )
}

function extrairIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}
