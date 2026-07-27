/**
 * Adaptador que guarda tudo no proprio navegador.
 *
 * Vantagem: funciona sem servidor, sem login e sem internet.
 * Limite: os dados ficam so naquele navegador, naquele computador.
 * Por isso existe o Exportar e o Importar nas Configuracoes.
 */

import type { Adaptador } from './adaptador'
import type { CategoriaTarefa, Workspace } from '../types'
import { CHAVE_ARMAZENAMENTO, VERSAO_DADOS } from '../config'

/**
 * De quem e o espaco em uso agora.
 * Cada conta tem a sua chave no navegador, entao o conteudo de uma pessoa
 * nunca encosta no da outra.
 */
let usuarioAtual = ''

/** Chave do espaco da conta atual. */
function chaveDoEspaco(): string {
  return usuarioAtual ? `${CHAVE_ARMAZENAMENTO}:${usuarioAtual}` : CHAVE_ARMAZENAMENTO
}

export const adaptadorLocal: Adaptador = {
  nome: 'navegador',

  definirUsuario(usuario) {
    usuarioAtual = usuario

    // Quem ja usava o Carrapation antes das contas tem um espaco na chave
    // antiga, sem usuario. Na primeira vez que alguem entra, esse conteudo e
    // adotado, para ninguem perder o que ja tinha escrito.
    const antigo = localStorage.getItem(CHAVE_ARMAZENAMENTO)
    if (usuario && antigo && !localStorage.getItem(chaveDoEspaco())) {
      localStorage.setItem(chaveDoEspaco(), antigo)
      localStorage.removeItem(CHAVE_ARMAZENAMENTO)
    }
  },

  async carregar() {
    try {
      const cru = localStorage.getItem(chaveDoEspaco())
      if (!cru) return null
      const dados = JSON.parse(cru) as Workspace
      return migrar(dados)
    } catch (erro) {
      console.error('[Carrapation] Nao consegui ler os dados salvos.', erro)
      return null
    }
  },

  async salvar(espaco) {
    try {
      localStorage.setItem(chaveDoEspaco(), JSON.stringify(espaco))
    } catch (erro) {
      console.error('[Carrapation] Nao consegui salvar.', erro)
      throw new Error(
        'Nao foi possivel salvar. O armazenamento do navegador pode estar cheio. Tente remover imagens grandes das paginas.',
      )
    }
  },

  async limpar() {
    localStorage.removeItem(chaveDoEspaco())
  },
}

/**
 * Ajusta dados salvos por versoes anteriores do sistema.
 * Quando a estrutura de Workspace mudar, trate a conversao aqui.
 */
export function migrar(dados: Workspace): Workspace {
  const espaco = { ...dados }
  const versaoSalva = espaco.version ?? 1

  if (!espaco.profile) {
    espaco.profile = { name: 'Voce', email: '', avatar: null }
  }
  if (typeof espaco.wide !== 'boolean') espaco.wide = false
  if (!espaco.font) espaco.font = 'sans'
  if (!espaco.accent) espaco.accent = '#0f7a6c'
  if (!espaco.theme) espaco.theme = 'light'
  if (!espaco.icon) espaco.icon = '🗂️'

  /*
   * Versao 1 para 2: naquela epoca toda pagina nova nascia com o icone 📄
   * posto pelo sistema, e nao escolhido por ninguem. Agora pagina sem icone
   * fica com o campo vazio, e e isso que faz aparecer o botao "Adicionar
   * icone". Entao o 📄 automatico vira vazio, uma vez so.
   *
   * Quem escolheu 📄 de proposito depois desta versao nao e afetado, porque a
   * conversao so roda em dados gravados como versao 1.
   */
  if (versaoSalva < 2 && espaco.pages) {
    const paginas = { ...espaco.pages }
    for (const id of Object.keys(paginas)) {
      const pagina = paginas[id]
      paginas[id] = {
        ...pagina,
        icon: pagina.icon === '📄' ? '' : pagina.icon,
        cover: pagina.cover ?? null,
        coverPos: pagina.coverPos ?? 50,
      }
    }
    espaco.pages = paginas
  }

  /*
   * Versao 2 para 3: as categorias moravam dentro de cada bloco de calendario.
   * Agora elas sao do espaco inteiro, para poderem ser usadas tambem em
   * paginas comuns. Aqui as categorias espalhadas sao juntadas numa lista so.
   * Os ids nao mudam, entao as tarefas continuam apontando para as mesmas.
   */
  if (!Array.isArray(espaco.categories)) {
    const juntas = new Map<string, CategoriaTarefa>()

    for (const pagina of Object.values(espaco.pages ?? {})) {
      for (const bloco of pagina.blocks ?? []) {
        for (const categoria of bloco.categories ?? []) {
          if (!juntas.has(categoria.id)) juntas.set(categoria.id, categoria)
        }
      }
    }

    espaco.categories = Array.from(juntas.values())
  }

  /*
   * Versao 2 para 3: o bloco de codigo saiu do sistema. Os que ja existiam
   * viram paragrafo comum, preservando o texto que estava escrito neles.
   * Ninguem perde conteudo, so a aparencia de codigo e a linguagem.
   */
  if (versaoSalva < 3 && espaco.pages) {
    const paginas = { ...espaco.pages }

    for (const id of Object.keys(paginas)) {
      const pagina = paginas[id]
      const blocos = pagina.blocks.map((bloco) => {
        if ((bloco.type as string) !== 'code') return bloco
        const convertido = { ...bloco, type: 'paragraph' as const }
        delete (convertido as { language?: string }).language
        return convertido
      })
      paginas[id] = { ...pagina, blocks: blocos }
    }

    espaco.pages = paginas
  }

  espaco.version = VERSAO_DADOS
  return espaco
}
