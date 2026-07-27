/**
 * Montagem da tela.
 *
 * Junta a barra lateral, o topo e a pagina aberta. Cuida tambem dos atalhos
 * globais de teclado e de aplicar o tema escolhido no documento.
 */

import { useEffect, useState } from 'react'
import { caminhoDaPagina, useEspaco } from './estado/espaco'
import { APP_NOME, INTENSIDADE_FUNDO_PADRAO } from './config'
import { temaEscolhido } from './lib/temas'
import { iconeDaPagina } from './lib/pagina'
import { BarraLateral } from './componentes/BarraLateral'
import { Pagina } from './componentes/Pagina'
import { JanelaPerfil } from './componentes/JanelaPerfil'
import { JanelaConfiguracoes } from './componentes/JanelaConfiguracoes'
import { JanelaBusca } from './componentes/JanelaBusca'
import { BotaoNovaPagina } from './componentes/BotaoNovaPagina'
import { SinoAvisos, JanelaAvisos } from './componentes/Avisos'
import { JanelaSituacoes } from './componentes/JanelaSituacoes'
import { JanelaCategorias } from './componentes/JanelaCategorias'
import { CamadaDesenho } from './componentes/CamadaDesenho'
import { MenuAparenciaPagina } from './componentes/MenuAparenciaPagina'

type JanelaAberta =
  | 'perfil'
  | 'configuracoes'
  | 'busca'
  | 'avisos'
  | 'situacoes'
  | 'categorias'
  | null

export function App() {
  const {
    espaco,
    carregando,
    paginaAtualId,
    abrirPagina,
    criarPagina,
    alternarFavorito,
    statusSalvamento,
  } = useEspaco()

  const [janela, definirJanela] = useState<JanelaAberta>(null)
  const [lateralRecolhida, definirLateralRecolhida] = useState(false)
  const [rolou, definirRolou] = useState(false)
  const [aparencia, definirAparencia] = useState<{ x: number; y: number } | null>(null)

  // Aplica tema, cor de destaque e fonte no documento inteiro.
  useEffect(() => {
    const raiz = document.documentElement
    raiz.dataset.tema = espaco.theme
    raiz.dataset.fonte = espaco.font
    raiz.style.setProperty('--destaque', espaco.accent)

    // Com tema de fundo, as superficies do sistema ficam translucidas para a
    // imagem aparecer por tras. Sem tema, tudo volta a ser opaco.
    if (espaco.fundo) raiz.dataset.fundo = espaco.fundo
    else delete raiz.dataset.fundo
  }, [espaco.theme, espaco.font, espaco.accent, espaco.fundo])

  // O titulo da aba acompanha a pagina aberta.
  useEffect(() => {
    const pagina = paginaAtualId ? espaco.pages[paginaAtualId] : null
    document.title = pagina ? `${pagina.title || 'Sem titulo'} | ${APP_NOME}` : APP_NOME
  }, [paginaAtualId, espaco.pages])

  // Atalhos globais.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      const comControle = evento.ctrlKey || evento.metaKey

      if (comControle && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        definirJanela('busca')
      }
      if (comControle && evento.key === '\\') {
        evento.preventDefault()
        definirLateralRecolhida((v) => !v)
      }
      if (comControle && evento.shiftKey && evento.key.toLowerCase() === 'n') {
        evento.preventDefault()
        criarPagina(null)
      }
    }

    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [criarPagina])

  if (carregando) {
    return (
      <div className="carregando">
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt={APP_NOME} />
        <span>Abrindo o seu espaco...</span>
      </div>
    )
  }

  const trilha = caminhoDaPagina(espaco, paginaAtualId)
  const paginaAberta = paginaAtualId ? espaco.pages[paginaAtualId] : null

  // Serve tanto para os temas prontos quanto para os que voce mesmo anexou.
  const temaDeFundo = temaEscolhido(espaco)

  return (
    <>
      {/* Imagem do tema, atras de tudo. Fica bem apagada para nao competir
          com o texto, e nao recebe clique. */}
      {temaDeFundo && (
        <div
          className="fundo-tema"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${JSON.stringify(temaDeFundo.imagem)})`,
            opacity: espaco.fundoIntensidade ?? INTENSIDADE_FUNDO_PADRAO,
          }}
        />
      )}

    <div className="app">
      <BarraLateral
        recolhida={lateralRecolhida}
        aoAbrirBusca={() => definirJanela('busca')}
        aoAbrirAvisos={() => definirJanela('avisos')}
        aoAbrirSituacoes={() => definirJanela('situacoes')}
        aoAbrirCategorias={() => definirJanela('categorias')}
        aoAbrirPerfil={() => definirJanela('perfil')}
        aoAbrirConfiguracoes={() => definirJanela('configuracoes')}
      />

      <main className="principal">
        <header className="topo" data-rolou={rolou || undefined}>
          <button
            className="btn-icone"
            title={lateralRecolhida ? 'Mostrar barra lateral (Ctrl \\)' : 'Esconder barra lateral (Ctrl \\)'}
            aria-label="Mostrar ou esconder a barra lateral"
            onClick={() => definirLateralRecolhida((v) => !v)}
          >
            ☰
          </button>

          <nav className="trilha" aria-label="Caminho da pagina">
            {trilha.length === 0 && <span className="trilha-item">{espaco.name}</span>}
            {trilha.map((pagina, indice) => (
              <span key={pagina.id} style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                {indice > 0 && <span className="trilha-separador">/</span>}
                <button className="trilha-item" onClick={() => abrirPagina(pagina.id)}>
                  <span>{iconeDaPagina(pagina)}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pagina.title || 'Sem titulo'}
                  </span>
                </button>
              </span>
            ))}
          </nav>

          <div className="topo-direita">
            {paginaAberta && (
              <button
                className="btn-icone"
                data-favorita={paginaAberta.favorite || undefined}
                title={paginaAberta.favorite ? 'Tirar dos favoritos' : 'Adicionar aos favoritos'}
                aria-label="Adicionar aos favoritos"
                onClick={() => alternarFavorito(paginaAberta.id)}
              >
                {paginaAberta.favorite ? '★' : '☆'}
              </button>
            )}
            <span className="status-salvo" data-estado={statusSalvamento}>
              {statusSalvamento === 'salvando' && 'Salvando...'}
              {statusSalvamento === 'salvo' && 'Salvo'}
              {statusSalvamento === 'erro' && 'Falha ao salvar'}
            </span>
            {paginaAberta && (
              <button
                className="btn-icone"
                title="Fonte e tamanho do texto desta pagina"
                aria-label="Aparencia da pagina"
                style={{ fontWeight: 600, fontSize: 13 }}
                onClick={(e) => {
                  const caixa = e.currentTarget.getBoundingClientRect()
                  definirAparencia(aparencia ? null : { x: caixa.right - 274, y: caixa.bottom + 8 })
                }}
              >
                Aa
              </button>
            )}
            <SinoAvisos aoAbrir={() => definirJanela('avisos')} />
            <button className="btn-icone" title="Buscar (Ctrl K)" onClick={() => definirJanela('busca')}>
              🔍
            </button>
            <button
              className="btn-icone"
              title="Configuracoes"
              onClick={() => definirJanela('configuracoes')}
            >
              ⚙
            </button>
          </div>
        </header>

        <div className="rolagem" onScroll={(e) => definirRolou(e.currentTarget.scrollTop > 4)}>
          {paginaAtualId && espaco.pages[paginaAtualId] ? (
            // A camada de desenho fica dentro deste container, cobrindo a
            // pagina inteira. E aqui que os eventos de caneta sao ouvidos.
            <div className="rolagem-conteudo">
              <Pagina
                paginaId={paginaAtualId}
                aoAbrirCategorias={() => definirJanela('categorias')}
              />
              <CamadaDesenho key={paginaAtualId} paginaId={paginaAtualId} />
            </div>
          ) : (
            <div className="tela-vazia">
              <div>
                {/* Marca com o slogan, so nesta tela. Para trocar, use outro
                    arquivo da pasta assets, por exemplo logo.svg. */}
                <img src={`${import.meta.env.BASE_URL}slogan.svg`} alt={APP_NOME} />
                <h2>Nenhuma pagina aberta</h2>
                <p>Escolha uma pagina na barra lateral ou comece uma nova agora.</p>
                <BotaoNovaPagina className="btn btn-primario">✚ Criar pagina</BotaoNovaPagina>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Marca d'agua fixa no canto inferior direito, presente em toda a tela.
          Nao recebe clique, entao nunca atrapalha o que esta embaixo dela. */}
      <img
        className="marca-dagua"
        src={`${import.meta.env.BASE_URL}texto.svg`}
        alt=""
        aria-hidden="true"
      />

      {janela === 'perfil' && <JanelaPerfil aoFechar={() => definirJanela(null)} />}
      {janela === 'configuracoes' && <JanelaConfiguracoes aoFechar={() => definirJanela(null)} />}
      {janela === 'busca' && <JanelaBusca aoFechar={() => definirJanela(null)} />}
      {janela === 'avisos' && <JanelaAvisos aoFechar={() => definirJanela(null)} />}
      {janela === 'situacoes' && <JanelaSituacoes aoFechar={() => definirJanela(null)} />}
      {janela === 'categorias' && <JanelaCategorias aoFechar={() => definirJanela(null)} />}

      {aparencia && paginaAberta && (
        <MenuAparenciaPagina
          paginaId={paginaAberta.id}
          x={aparencia.x}
          y={aparencia.y}
          aoFechar={() => definirAparencia(null)}
        />
      )}
    </div>
    </>
  )
}
