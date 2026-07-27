/**
 * Perfil de quem esta usando o sistema.
 *
 * Reune a foto (com ajuste de enquadramento e moldura), o nome, o e-mail e a
 * troca de senha da conta. O usuario em si nao muda depois de criado.
 */

import { useState } from 'react'
import { useEspaco } from '../estado/espaco'
import { useSessao } from '../estado/sessao'
import { Janela } from './Janela'
import { Avatar } from './Avatar'
import { RecortadorFoto } from './RecortadorFoto'
import { escolherArquivo, lerComoDataUrl, emMegabytes } from '../lib/arquivo'
import { INTENSIDADE_FUNDO_PADRAO, LIMITE_FOTO_MB, MOLDURAS, TEMAS_FUNDO } from '../config'
import { conferirSenha } from '../lib/conta'

export function JanelaPerfil({ aoFechar }: { aoFechar: () => void }) {
  const { espaco, atualizarPerfil, definirFundo, definirIntensidadeFundo } = useEspaco()
  const { conta, trocarSenha, sair } = useSessao()

  const perfil = espaco.profile
  const [erro, definirErro] = useState<string | null>(null)
  const [paraRecortar, definirParaRecortar] = useState<string | null>(null)

  // Troca de senha.
  const [trocando, definirTrocando] = useState(false)
  const [senhaAtual, definirSenhaAtual] = useState('')
  const [senhaNova, definirSenhaNova] = useState('')
  const [senhaRepetida, definirSenhaRepetida] = useState('')
  const [aviso, definirAviso] = useState<string | null>(null)
  const [salvandoSenha, definirSalvandoSenha] = useState(false)

  async function escolherFoto() {
    definirErro(null)
    const arquivo = await escolherArquivo('image/*')
    if (!arquivo) return

    if (emMegabytes(arquivo.size) > LIMITE_FOTO_MB) {
      definirErro(`A foto tem ${emMegabytes(arquivo.size).toFixed(1)} MB. O limite e ${LIMITE_FOTO_MB} MB.`)
      return
    }

    try {
      definirParaRecortar(await lerComoDataUrl(arquivo))
    } catch {
      definirErro('Nao consegui ler essa imagem. Tente um arquivo JPG ou PNG.')
    }
  }

  async function confirmarTrocaDeSenha() {
    definirAviso(null)

    const problema = conferirSenha(senhaNova)
    if (problema) {
      definirAviso(problema)
      return
    }
    if (senhaNova !== senhaRepetida) {
      definirAviso('A confirmacao nao bate com a senha nova.')
      return
    }

    definirSalvandoSenha(true)
    const deuCerto = await trocarSenha(senhaAtual, senhaNova)
    definirSalvandoSenha(false)

    if (!deuCerto) {
      definirAviso('A senha atual esta errada.')
      return
    }

    definirTrocando(false)
    definirSenhaAtual('')
    definirSenhaNova('')
    definirSenhaRepetida('')
  }

  return (
    <>
      <Janela titulo="Meu perfil" aoFechar={aoFechar} largura={520}>
        <div className="janela-corpo">
          {erro && <div className="aviso-erro">{erro}</div>}

          <div className="perfil-editor">
            <div className="perfil-foto">
              <Avatar
                foto={perfil.avatar}
                nome={perfil.name}
                moldura={perfil.moldura}
                tamanho={84}
              />
            </div>

            <div className="perfil-foto-acoes">
              <button className="btn btn-contorno" onClick={escolherFoto}>
                {perfil.avatar ? 'Trocar foto' : 'Anexar foto'}
              </button>
              {perfil.avatar && (
                <>
                  <button
                    className="btn btn-contorno"
                    onClick={() => definirParaRecortar(perfil.avatar)}
                  >
                    Reenquadrar
                  </button>
                  <button className="btn btn-perigo" onClick={() => atualizarPerfil({ avatar: null })}>
                    Remover foto
                  </button>
                </>
              )}
              <span className="perfil-dica">
                JPG ou PNG, ate {LIMITE_FOTO_MB} MB. Voce escolhe o enquadramento, e a foto fica
                salva aqui no seu navegador.
              </span>
            </div>
          </div>

          <div className="grupo">
            <h3>Tema</h3>
            <p className="perfil-dica" style={{ marginBottom: 10, display: 'block' }}>
              Poe uma imagem bem apagada por tras do sistema inteiro.
            </p>
            <div className="temas">
              <button
                className="tema-opcao"
                data-ativo={!espaco.fundo || undefined}
                onClick={() => definirFundo('')}
              >
                <span className="tema-amostra tema-vazio">Aa</span>
                <span className="tema-nome">Nenhum</span>
              </button>

              {TEMAS_FUNDO.map((tema) => (
                <button
                  key={tema.id}
                  className="tema-opcao"
                  data-ativo={espaco.fundo === tema.id || undefined}
                  onClick={() => definirFundo(tema.id)}
                >
                  <span
                    className="tema-amostra"
                    style={{ backgroundImage: `url(${import.meta.env.BASE_URL}${tema.arquivo})` }}
                  />
                  <span className="tema-nome">{tema.nome}</span>
                </button>
              ))}
            </div>

            {/* So faz sentido ajustar quando existe imagem escolhida. */}
            {espaco.fundo && (
              <div className="fundo-forca">
                <span className="rotulo-campo" style={{ marginBottom: 0 }}>
                  Quanto a imagem aparece
                </span>
                <div className="fundo-barra">
                  <span>Apagada</span>
                  <input
                    type="range"
                    min={0.02}
                    max={0.4}
                    step={0.01}
                    value={espaco.fundoIntensidade ?? INTENSIDADE_FUNDO_PADRAO}
                    aria-label="Quanto a imagem de fundo aparece"
                    onChange={(e) => definirIntensidadeFundo(Number(e.target.value))}
                  />
                  <span>Forte</span>
                </div>
              </div>
            )}
          </div>

          <div className="grupo">
            <h3>Molduras</h3>
            <div className="molduras">
              <button
                className="moldura-opcao"
                data-ativa={!perfil.moldura || undefined}
                title="Sem moldura"
                onClick={() => atualizarPerfil({ moldura: '' })}
              >
                <Avatar foto={perfil.avatar} nome={perfil.name} tamanho={44} />
                <span className="moldura-nome">Nenhuma</span>
              </button>

              {MOLDURAS.map((opcao) => (
                <button
                  key={opcao.id}
                  className="moldura-opcao"
                  data-ativa={perfil.moldura === opcao.id || undefined}
                  title={opcao.nome}
                  onClick={() => atualizarPerfil({ moldura: opcao.id })}
                >
                  <Avatar
                    foto={perfil.avatar}
                    nome={perfil.name}
                    moldura={opcao.id}
                    tamanho={44}
                  />
                  <span className="moldura-nome">{opcao.nome}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="campo-grupo">
            <label className="rotulo-campo" htmlFor="perfil-nome">
              Nome
            </label>
            <input
              id="perfil-nome"
              className="campo"
              value={perfil.name}
              placeholder="Como voce quer ser chamado"
              onChange={(e) => atualizarPerfil({ name: e.target.value })}
            />
          </div>

          <div className="campo-grupo">
            <label className="rotulo-campo" htmlFor="perfil-email">
              E-mail
            </label>
            <input
              id="perfil-email"
              className="campo"
              type="email"
              value={perfil.email}
              placeholder="voce@empresa.com.br"
              onChange={(e) => atualizarPerfil({ email: e.target.value })}
            />
          </div>

          {conta && (
            <div className="grupo" style={{ marginTop: 22 }}>
              <h3>Conta</h3>

              <div className="linha-opcao">
                <div>
                  <div className="rotulo">Usuario</div>
                  <div className="ajuda">
                    E o nome que voce digita para entrar. Nao muda depois de criado.
                  </div>
                </div>
                <code className="usuario-fixo">{conta.usuario}</code>
              </div>

              <div className="linha-opcao">
                <div>
                  <div className="rotulo">Senha</div>
                  <div className="ajuda">Guardada como resumo, nunca em texto.</div>
                </div>
                {!trocando && (
                  <button className="btn btn-contorno" onClick={() => definirTrocando(true)}>
                    Trocar senha
                  </button>
                )}
              </div>

              {trocando && (
                <div className="categoria-nova">
                  {aviso && <div className="aviso-erro">{aviso}</div>}

                  <input
                    className="campo"
                    type="password"
                    autoFocus
                    value={senhaAtual}
                    placeholder="Senha atual"
                    onChange={(e) => definirSenhaAtual(e.target.value)}
                  />
                  <input
                    className="campo"
                    type="password"
                    value={senhaNova}
                    placeholder="Senha nova"
                    onChange={(e) => definirSenhaNova(e.target.value)}
                  />
                  <input
                    className="campo"
                    type="password"
                    value={senhaRepetida}
                    placeholder="Repita a senha nova"
                    onChange={(e) => definirSenhaRepetida(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmarTrocaDeSenha()
                    }}
                  />

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-primario"
                      disabled={salvandoSenha}
                      onClick={confirmarTrocaDeSenha}
                    >
                      {salvandoSenha ? 'Salvando...' : 'Salvar senha'}
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        definirTrocando(false)
                        definirAviso(null)
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="janela-rodape">
            {conta ? (
              <button className="btn btn-perigo" onClick={sair}>
                Sair da conta
              </button>
            ) : (
              <span />
            )}
            <button className="btn btn-primario" onClick={aoFechar}>
              Concluir
            </button>
          </div>
        </div>
      </Janela>

      {paraRecortar && (
        <RecortadorFoto
          arquivo={paraRecortar}
          aoConfirmar={(recortada) => {
            atualizarPerfil({ avatar: recortada })
            definirParaRecortar(null)
          }}
          aoCancelar={() => definirParaRecortar(null)}
        />
      )}
    </>
  )
}
