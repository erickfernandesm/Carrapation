/**
 * Sessao: quem esta usando o sistema agora.
 *
 * Fica separado do espaco de trabalho porque e ele que decide qual espaco
 * carregar. Cada conta tem o seu, entao a ordem importa: primeiro se sabe quem
 * entrou, depois o espaco daquela pessoa e aberto.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  abrirSessao,
  arrumarUsuario,
  buscarConta,
  conferirResumo,
  criarResumo,
  fecharSessao,
  gravarConta,
  normalizarEmail,
  normalizarTelefone,
  normalizarUsuario,
  usuarioDaSessao,
  type Conta,
} from '../lib/conta'

interface ValorSessao {
  conta: Conta | null
  /** Entra na conta. Devolve o problema encontrado, ou null se deu certo. */
  entrar: (usuario: string, senha: string) => Promise<string | null>
  /** Cria a conta e ja entra nela. Devolve o problema, ou null se deu certo. */
  criarConta: (dados: {
    usuario: string
    nome: string
    email: string
    telefone: string
    senha: string
  }) => Promise<string | null>
  /** Confere e-mail e numero e troca a senha. Devolve o problema, ou null. */
  recuperarSenha: (
    usuario: string,
    email: string,
    telefone: string,
    senhaNova: string,
  ) => Promise<string | null>
  /** Troca a senha de quem esta logado. Devolve true se a senha atual bateu. */
  trocarSenha: (atual: string, nova: string) => Promise<boolean>
  sair: () => void
}

const Contexto = createContext<ValorSessao | null>(null)

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [conta, definirConta] = useState<Conta | null>(() => {
    const usuario = usuarioDaSessao()
    return usuario ? buscarConta(usuario) : null
  })

  const entrar = useCallback(async (usuario: string, senha: string) => {
    const achada = buscarConta(usuario)
    // A mensagem e a mesma para usuario inexistente e senha errada, de
    // proposito: assim ninguem descobre quais usuarios existem por tentativa.
    if (!achada) return 'Usuario ou senha incorretos.'
    if (!(await conferirResumo(senha, achada.senha))) return 'Usuario ou senha incorretos.'

    abrirSessao(achada.usuario)
    definirConta(achada)
    return null
  }, [])

  const criarConta = useCallback<ValorSessao['criarConta']>(async (dados) => {
    if (buscarConta(dados.usuario)) return 'Ja existe uma conta com este usuario.'

    const nova: Conta = {
      usuario: arrumarUsuario(dados.usuario),
      nome: dados.nome.trim() || arrumarUsuario(dados.usuario),
      email: normalizarEmail(dados.email),
      telefone: await criarResumo(normalizarTelefone(dados.telefone)),
      senha: await criarResumo(dados.senha),
      criadaEm: Date.now(),
    }

    gravarConta(nova)
    abrirSessao(nova.usuario)
    definirConta(nova)
    return null
  }, [])

  const recuperarSenha = useCallback<ValorSessao['recuperarSenha']>(
    async (usuario, email, telefone, senhaNova) => {
      const achada = buscarConta(usuario)
      if (!achada) return 'Nao encontrei uma conta com este usuario.'

      if (normalizarEmail(email) !== achada.email) {
        return 'O e-mail ou o numero nao conferem com os desta conta.'
      }
      if (!(await conferirResumo(normalizarTelefone(telefone), achada.telefone))) {
        return 'O e-mail ou o numero nao conferem com os desta conta.'
      }

      const atualizada: Conta = { ...achada, senha: await criarResumo(senhaNova) }
      gravarConta(atualizada)
      return null
    },
    [],
  )

  const trocarSenha = useCallback(
    async (atual: string, nova: string) => {
      if (!conta) return false
      if (!(await conferirResumo(atual, conta.senha))) return false

      const atualizada: Conta = { ...conta, senha: await criarResumo(nova) }
      gravarConta(atualizada)
      definirConta(atualizada)
      return true
    },
    [conta],
  )

  const sair = useCallback(() => {
    fecharSessao()
    definirConta(null)
  }, [])

  const valor = useMemo<ValorSessao>(
    () => ({ conta, entrar, criarConta, recuperarSenha, trocarSenha, sair }),
    [conta, entrar, criarConta, recuperarSenha, trocarSenha, sair],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSessao(): ValorSessao {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('useSessao precisa estar dentro de ProvedorSessao.')
  return valor
}

/** Nome da chave onde o espaco daquela conta e guardado. */
export function chaveDoUsuario(usuario: string): string {
  return normalizarUsuario(usuario)
}
