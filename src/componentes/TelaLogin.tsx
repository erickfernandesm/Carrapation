/**
 * Tela de entrada.
 *
 * Tem tres modos no mesmo lugar: entrar, criar conta e recuperar a senha.
 * O login e por nome de usuario, e nao por e-mail. O e-mail e o numero servem
 * para recuperar a senha, quando alguem esquece.
 */

import { useEffect, useRef, useState } from 'react'
import { useSessao } from '../estado/sessao'
import { APP_NOME } from '../config'
import { conferirEmail, conferirSenha, conferirTelefone, conferirUsuario, lerContas } from '../lib/conta'

type Modo = 'entrar' | 'criar' | 'recuperar'

export function TelaLogin() {
  const { entrar, criarConta, recuperarSenha } = useSessao()

  // Sem nenhuma conta no navegador, a tela ja abre no criar conta.
  const [modo, definirModo] = useState<Modo>(() => (lerContas().length === 0 ? 'criar' : 'entrar'))

  const [usuario, definirUsuario] = useState('')
  const [nome, definirNome] = useState('')
  const [email, definirEmail] = useState('')
  const [telefone, definirTelefone] = useState('')
  const [senha, definirSenha] = useState('')
  const [senhaRepetida, definirSenhaRepetida] = useState('')

  const [erro, definirErro] = useState<string | null>(null)
  const [recado, definirRecado] = useState<string | null>(null)
  const [ocupado, definirOcupado] = useState(false)

  const primeiro = useRef<HTMLInputElement>(null)

  useEffect(() => {
    primeiro.current?.focus()
    definirErro(null)
  }, [modo])

  function trocarModo(novo: Modo) {
    definirModo(novo)
    definirRecado(null)
    definirSenha('')
    definirSenhaRepetida('')
  }

  async function enviar() {
    definirErro(null)
    definirRecado(null)
    definirOcupado(true)

    try {
      if (modo === 'entrar') {
        const problema = await entrar(usuario, senha)
        if (problema) definirErro(problema)
        return
      }

      if (modo === 'criar') {
        // As conferencias sao feitas antes de calcular qualquer resumo, para
        // o erro aparecer na hora em vez de depois da espera.
        const problema =
          conferirUsuario(usuario) ??
          conferirEmail(email) ??
          conferirTelefone(telefone) ??
          conferirSenha(senha) ??
          (senha !== senhaRepetida ? 'A confirmacao nao bate com a senha.' : null)

        if (problema) {
          definirErro(problema)
          return
        }

        const falha = await criarConta({ usuario, nome, email, telefone, senha })
        if (falha) definirErro(falha)
        return
      }

      // Recuperar a senha.
      const problema =
        conferirSenha(senha) ??
        (senha !== senhaRepetida ? 'A confirmacao nao bate com a senha nova.' : null)

      if (problema) {
        definirErro(problema)
        return
      }

      const falha = await recuperarSenha(usuario, email, telefone, senha)
      if (falha) {
        definirErro(falha)
        return
      }

      definirRecado('Senha trocada. Pode entrar com a senha nova.')
      trocarModo('entrar')
    } finally {
      definirOcupado(false)
    }
  }

  return (
    <div className="login">
      <form
        className="login-cartao"
        onSubmit={(e) => {
          e.preventDefault()
          if (!ocupado) enviar()
        }}
      >
        <img className="login-logo" src={`${import.meta.env.BASE_URL}logo.svg`} alt={APP_NOME} />

        <h1 className="login-titulo">
          {modo === 'entrar' && 'Entrar'}
          {modo === 'criar' && 'Criar conta'}
          {modo === 'recuperar' && 'Recuperar a senha'}
        </h1>

        <p className="login-ajuda">
          {modo === 'entrar' && 'Use o seu nome de usuario e a sua senha.'}
          {modo === 'criar' && 'Cada conta tem o seu proprio espaco, separado das outras.'}
          {modo === 'recuperar' &&
            'Confirme o e-mail e o numero cadastrados nesta conta para escolher uma senha nova.'}
        </p>

        {erro && <div className="aviso-erro">{erro}</div>}
        {recado && <div className="aviso-bom">{recado}</div>}

        {/* No criar conta o Nome vem primeiro: e o campo solto, que aceita
            espaco e acento. O Usuario vem depois, com a regra dele. */}
        {modo === 'criar' && (
          <div className="campo-grupo">
            <label className="rotulo-campo" htmlFor="login-nome">
              Nome
            </label>
            <input
              id="login-nome"
              ref={primeiro}
              className="campo"
              value={nome}
              autoComplete="name"
              placeholder="Coloque seu nome, exemplo: Mariah Marçal"
              onChange={(e) => definirNome(e.target.value)}
            />
            <span className="campo-dica">Pode ter espaco e acento, escreva como preferir.</span>
          </div>
        )}

        <div className="campo-grupo">
          <label className="rotulo-campo" htmlFor="login-usuario">
            Usuario
          </label>
          <input
            id="login-usuario"
            ref={modo === 'criar' ? undefined : primeiro}
            className="campo"
            value={usuario}
            autoComplete="username"
            placeholder="carrapatinha.mariah"
            onChange={(e) => definirUsuario(e.target.value)}
          />
          {modo === 'criar' && (
            <span className="campo-dica">
              E o que voce digita para entrar. Sem espaco e sem acento.
            </span>
          )}
        </div>

        {(modo === 'criar' || modo === 'recuperar') && (
          <>
            <div className="campo-grupo">
              <label className="rotulo-campo" htmlFor="login-email">
                E-mail
              </label>
              <input
                id="login-email"
                className="campo"
                type="email"
                value={email}
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                onChange={(e) => definirEmail(e.target.value)}
              />
            </div>

            <div className="campo-grupo">
              <label className="rotulo-campo" htmlFor="login-telefone">
                Numero
              </label>
              <input
                id="login-telefone"
                className="campo"
                type="tel"
                value={telefone}
                autoComplete="tel"
                placeholder="(32) XXXXX-XXXX"
                onChange={(e) => definirTelefone(e.target.value)}
              />
              {modo === 'criar' && (
                <span className="campo-dica">
                  Guarde bem. E-mail e numero juntos sao a unica forma de recuperar a senha, porque
                  o sistema nao tem servidor para mandar aviso.
                </span>
              )}
            </div>
          </>
        )}

        <div className="campo-grupo">
          <label className="rotulo-campo" htmlFor="login-senha">
            {modo === 'recuperar' ? 'Senha nova' : 'Senha'}
          </label>
          <input
            id="login-senha"
            className="campo"
            type="password"
            value={senha}
            autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            placeholder={modo === 'entrar' ? 'Sua senha' : 'Pelo menos 6 caracteres'}
            onChange={(e) => definirSenha(e.target.value)}
          />
        </div>

        {modo !== 'entrar' && (
          <div className="campo-grupo">
            <label className="rotulo-campo" htmlFor="login-senha2">
              Repita a senha
            </label>
            <input
              id="login-senha2"
              className="campo"
              type="password"
              value={senhaRepetida}
              autoComplete="new-password"
              onChange={(e) => definirSenhaRepetida(e.target.value)}
            />
          </div>
        )}

        <button className="btn btn-primario login-botao" type="submit" disabled={ocupado}>
          {ocupado && 'Um momento...'}
          {!ocupado && modo === 'entrar' && 'Entrar'}
          {!ocupado && modo === 'criar' && 'Criar conta e entrar'}
          {!ocupado && modo === 'recuperar' && 'Trocar a senha'}
        </button>

        <div className="login-links">
          {modo === 'entrar' && (
            <>
              <button type="button" onClick={() => trocarModo('criar')}>
                Criar uma conta
              </button>
              <button type="button" onClick={() => trocarModo('recuperar')}>
                Esqueci a senha
              </button>
            </>
          )}
          {modo !== 'entrar' && (
            <button type="button" onClick={() => trocarModo('entrar')}>
              Voltar para entrar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
