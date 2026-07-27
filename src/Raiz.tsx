/**
 * Raiz do sistema.
 *
 * Decide entre a tela de entrada e o sistema em si. A ordem aqui importa: o
 * espaco de trabalho so e montado depois que se sabe quem entrou, porque cada
 * conta tem o seu proprio espaco guardado numa chave diferente.
 *
 * A chave no ProvedorEspaco faz o espaco ser recarregado do zero ao trocar de
 * conta, sem sobra do conteudo de quem estava antes.
 */

import { useSessao } from './estado/sessao'
import { ProvedorEspaco } from './estado/espaco'
import { armazenamento } from './storage'
import { TelaLogin } from './componentes/TelaLogin'
import { App } from './App'

export function Raiz() {
  const { conta } = useSessao()

  if (!conta) return <TelaLogin />

  // Aponta o armazenamento para o espaco desta conta antes de montar o
  // provedor, que carrega os dados assim que aparece na tela.
  armazenamento.definirUsuario(conta.usuario.toLowerCase())

  return (
    <ProvedorEspaco
      key={conta.usuario}
      perfilInicial={{ name: conta.nome, email: conta.email }}
    >
      <App />
    </ProvedorEspaco>
  )
}
