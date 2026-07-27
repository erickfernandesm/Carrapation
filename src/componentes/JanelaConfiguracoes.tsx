/** Configuracoes: aparencia, identidade do espaco, exportar, importar e recomecar. */

import { useState } from 'react'
import { useEspaco } from '../estado/espaco'
import { Janela } from './Janela'
import { SeletorEmoji } from './SeletorEmoji'
import { APP_NOME, CORES_DESTAQUE } from '../config'
import { baixarTexto, escolherArquivo, lerComoTexto } from '../lib/arquivo'
import type { Workspace } from '../types'

export function JanelaConfiguracoes({ aoFechar }: { aoFechar: () => void }) {
  const {
    espaco,
    definirTema,
    definirDestaque,
    definirFonte,
    definirLargura,
    renomearEspaco,
    definirIconeEspaco,
    substituirEspaco,
    recomecarDoZero,
  } = useEspaco()

  const [erro, definirErro] = useState<string | null>(null)
  const [emoji, definirEmoji] = useState<{ x: number; y: number } | null>(null)

  const quantasPaginas = Object.keys(espaco.pages).length

  function exportar() {
    const data = new Date()
    const carimbo = `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`
    const nome = `${limparNome(espaco.name)}-${carimbo}.carrapation.json`
    baixarTexto(nome, JSON.stringify(espaco, null, 2))
  }

  async function importar() {
    definirErro(null)
    const arquivo = await escolherArquivo('.json,application/json')
    if (!arquivo) return

    try {
      const conteudo = await lerComoTexto(arquivo)
      const dados = JSON.parse(conteudo) as Workspace

      if (!dados || typeof dados !== 'object' || !dados.pages || !Array.isArray(dados.rootIds)) {
        definirErro('Esse arquivo nao parece um espaco do Carrapation.')
        return
      }

      const total = Object.keys(dados.pages).length
      const confirmado = window.confirm(
        `Importar ${total} pagina(s)?\n\nO conteudo que esta aberto agora sera substituido. Exporte antes se quiser guardar.`,
      )
      if (confirmado) {
        substituirEspaco(dados)
        aoFechar()
      }
    } catch {
      definirErro('Nao consegui ler o arquivo. Ele pode estar corrompido.')
    }
  }

  return (
    <Janela titulo="Configuracoes" aoFechar={aoFechar} largura={560}>
      <div className="janela-corpo">
        {erro && <div className="aviso-erro">{erro}</div>}

        <div className="grupo">
          <h3>Este espaco</h3>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <button
              className="btn btn-contorno"
              style={{ fontSize: 22, padding: '6px 10px' }}
              title="Trocar o icone do espaco"
              onClick={(e) => {
                const caixa = (e.currentTarget as HTMLElement).getBoundingClientRect()
                definirEmoji({ x: caixa.left, y: caixa.bottom + 6 })
              }}
            >
              {espaco.icon}
            </button>
            <div style={{ flex: 1 }}>
              <label className="rotulo-campo" htmlFor="nome-espaco">
                Nome do espaco
              </label>
              <input
                id="nome-espaco"
                className="campo"
                value={espaco.name}
                onChange={(e) => renomearEspaco(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grupo">
          <h3>Aparencia</h3>

          <div className="linha-opcao">
            <div>
              <div className="rotulo">Tema</div>
              <div className="ajuda">Claro para o dia, escuro para a noite.</div>
            </div>
            <div className="segmentos">
              <button data-ativo={espaco.theme === 'light'} onClick={() => definirTema('light')}>
                Claro
              </button>
              <button data-ativo={espaco.theme === 'dark'} onClick={() => definirTema('dark')}>
                Escuro
              </button>
            </div>
          </div>

          <div className="linha-opcao">
            <div>
              <div className="rotulo">Cor de destaque</div>
              <div className="ajuda">Muda botoes, avisos e marcacoes do sistema inteiro.</div>
            </div>
            <div className="cores">
              {CORES_DESTAQUE.map((cor) => (
                <button
                  key={cor.valor}
                  style={{ background: cor.valor }}
                  data-ativo={espaco.accent === cor.valor}
                  title={cor.nome}
                  aria-label={`Cor ${cor.nome}`}
                  onClick={() => definirDestaque(cor.valor)}
                />
              ))}
            </div>
          </div>

          <div className="linha-opcao">
            <div>
              <div className="rotulo">Fonte do conteudo</div>
              <div className="ajuda">Vale para o texto das paginas.</div>
            </div>
            <div className="segmentos">
              <button data-ativo={espaco.font === 'sans'} onClick={() => definirFonte('sans')}>
                Padrao
              </button>
              <button data-ativo={espaco.font === 'serif'} onClick={() => definirFonte('serif')}>
                Serifada
              </button>
              <button data-ativo={espaco.font === 'mono'} onClick={() => definirFonte('mono')}>
                Fixa
              </button>
            </div>
          </div>

          <div className="linha-opcao">
            <div>
              <div className="rotulo">Largura da pagina</div>
              <div className="ajuda">Largo aproveita telas grandes.</div>
            </div>
            <div className="segmentos">
              <button data-ativo={!espaco.wide} onClick={() => definirLargura(false)}>
                Normal
              </button>
              <button data-ativo={espaco.wide} onClick={() => definirLargura(true)}>
                Largo
              </button>
            </div>
          </div>
        </div>

        <div className="grupo">
          <h3>Seus dados</h3>

          <div className="linha-opcao">
            <div>
              <div className="rotulo">Exportar</div>
              <div className="ajuda">
                Baixa {quantasPaginas} pagina(s) num arquivo unico. Serve de backup e serve para enviar o
                espaco pronto para outra pessoa.
              </div>
            </div>
            <button className="btn btn-contorno" onClick={exportar}>
              Baixar arquivo
            </button>
          </div>

          <div className="linha-opcao">
            <div>
              <div className="rotulo">Importar</div>
              <div className="ajuda">Abre um arquivo do Carrapation e substitui o conteudo atual.</div>
            </div>
            <button className="btn btn-contorno" onClick={importar}>
              Escolher arquivo
            </button>
          </div>

          <div className="linha-opcao">
            <div>
              <div className="rotulo">Recomecar do zero</div>
              <div className="ajuda">Apaga tudo e volta ao conteudo de boas vindas.</div>
            </div>
            <button
              className="btn btn-perigo"
              onClick={() => {
                if (window.confirm('Apagar todas as paginas e recomecar? Isso nao pode ser desfeito.')) {
                  recomecarDoZero()
                  aoFechar()
                }
              }}
            >
              Apagar tudo
            </button>
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--tinta-3)', textAlign: 'center', paddingTop: 6 }}>
          {APP_NOME} versao {espaco.version}. Tudo fica salvo neste navegador.
        </div>
      </div>

      {emoji && (
        <SeletorEmoji
          x={emoji.x}
          y={emoji.y}
          aoEscolher={(escolhido) => {
            definirIconeEspaco(escolhido)
            definirEmoji(null)
          }}
          aoFechar={() => definirEmoji(null)}
        />
      )}
    </Janela>
  )
}

function dois(numero: number): string {
  return String(numero).padStart(2, '0')
}

/** Transforma o nome do espaco em algo seguro para nome de arquivo. */
function limparNome(nome: string): string {
  const semAcento = nome.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  const enxuto = semAcento
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return enxuto || 'carrapation'
}
