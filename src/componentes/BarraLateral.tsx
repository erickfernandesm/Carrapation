/** Barra lateral: marca, acoes rapidas, arvore de paginas e cartao de perfil. */

import { useMemo, useState } from 'react'
import { useEspaco } from '../estado/espaco'
import { ItemArvore } from './ItemArvore'
import { Avatar } from './Avatar'
import { BotaoNovaPagina } from './BotaoNovaPagina'
import { useAvisos, BolinhaAviso } from './Avisos'

export function BarraLateral({
  recolhida,
  aoAbrirBusca,
  aoAbrirAvisos,
  aoAbrirSituacoes,
  aoAbrirCategorias,
  aoAbrirPerfil,
  aoAbrirConfiguracoes,
}: {
  recolhida: boolean
  aoAbrirBusca: () => void
  aoAbrirAvisos: () => void
  aoAbrirSituacoes: () => void
  aoAbrirCategorias: () => void
  aoAbrirPerfil: () => void
  aoAbrirConfiguracoes: () => void
}) {
  const { espaco, moverPagina } = useEspaco()
  const [soltaNaRaiz, definirSoltaNaRaiz] = useState(false)
  const avisos = useAvisos()

  const favoritas = useMemo(
    () => Object.values(espaco.pages).filter((p) => p.favorite),
    [espaco.pages],
  )

  // Para trocar a logo do topo, use reduzida.svg no lugar de logo.svg.
  const enderecoLogo = `${import.meta.env.BASE_URL}logo.svg`

  return (
    <aside className="lateral" data-recolhida={recolhida}>
      <div className="lateral-topo">
        <img src={enderecoLogo} alt="Carrapation" />
      </div>

      <button className="lateral-espaco" onClick={aoAbrirConfiguracoes} title="Configuracoes do espaco">
        <span className="icone">{espaco.icon}</span>
        <span className="nome">{espaco.name}</span>
      </button>

      <div className="lateral-acoes">
        <button className="lateral-acao" onClick={aoAbrirBusca}>
          <span className="glifo">🔍</span>
          <span>Buscar</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button className="lateral-acao" onClick={aoAbrirAvisos}>
          <span className="glifo">🔔</span>
          <span>Notificacoes</span>
          {/* So conta o que ainda nao foi lido, igual ao sininho do topo. */}
          {avisos.naoVistos > 0 && (
            <span className="lateral-conta">
              <BolinhaAviso vencida={avisos.vencidas.length > 0} naLinha />
              {avisos.naoVistos}
            </span>
          )}
        </button>
        <button className="lateral-acao" onClick={aoAbrirSituacoes}>
          <span className="glifo">🚦</span>
          <span>Situacoes</span>
        </button>
        <button className="lateral-acao" onClick={aoAbrirCategorias}>
          <span className="glifo">🏷️</span>
          <span>Categorias</span>
        </button>
        <BotaoNovaPagina className="lateral-acao">
          <span className="glifo">✚</span>
          <span>Nova pagina</span>
        </BotaoNovaPagina>
      </div>

      <div className="lateral-corpo">
        {favoritas.length > 0 && (
          <>
            <div className="lateral-secao">Favoritos</div>
            {favoritas.map((pagina) => (
              // mostrarFilhas fica desligado: aqui a pagina aparece sozinha,
              // a arvore completa dela fica na secao Paginas abaixo.
              <ItemArvore key={pagina.id} paginaId={pagina.id} nivel={0} mostrarFilhas={false} />
            ))}
          </>
        )}

        <div className="lateral-secao">
          <span>Paginas</span>
          <BotaoNovaPagina className="item-botao" titulo="Nova pagina">
            +
          </BotaoNovaPagina>
        </div>

        {espaco.rootIds.length === 0 && (
          <div className="lateral-vazio">Nenhuma pagina ainda. Clique no + acima.</div>
        )}

        {espaco.rootIds.map((id) => (
          <ItemArvore key={id} paginaId={id} nivel={0} />
        ))}

        {/* Area de solta para tirar uma pagina de dentro de outra. */}
        <div
          style={{
            minHeight: 60,
            marginTop: 6,
            borderRadius: 6,
            border: soltaNaRaiz ? '1.5px dashed var(--destaque)' : '1.5px dashed transparent',
          }}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes('carrapation/pagina')) return
            e.preventDefault()
            definirSoltaNaRaiz(true)
          }}
          onDragLeave={() => definirSoltaNaRaiz(false)}
          onDrop={(e) => {
            e.preventDefault()
            definirSoltaNaRaiz(false)
            const id = e.dataTransfer.getData('carrapation/pagina')
            if (id) moverPagina(id, null)
          }}
        />
      </div>

      <button className="perfil-cartao" onClick={aoAbrirPerfil} title="Editar perfil">
        <Avatar
          foto={espaco.profile.avatar}
          nome={espaco.profile.name}
          moldura={espaco.profile.moldura}
          tamanho={30}
        />
        <span className="perfil-dados">
          <span className="perfil-nome">{espaco.profile.name || 'Sem nome'}</span>
          <span className="perfil-email">{espaco.profile.email || 'Editar perfil'}</span>
        </span>
      </button>
    </aside>
  )
}
