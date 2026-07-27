/**
 * Contas de acesso do Carrapation.
 *
 * Podem existir varias contas no mesmo navegador, e cada uma tem o seu proprio
 * espaco de trabalho, separado dos outros. Quem entra com o seu usuario ve so
 * as suas paginas.
 *
 * As contas ficam guardadas fora do espaco de trabalho, de proposito, por dois
 * motivos: sao de quem usa este navegador, e nao do conteudo, e assim elas
 * nunca vao junto no arquivo do Exportar. Mandar o espaco para alguem nao leva
 * senha nenhuma junto.
 *
 * Senha e numero nunca sao guardados em texto. Ficam como resumo (hash) feito
 * com PBKDF2, que e o recurso de criptografia do proprio navegador. Do resumo
 * nao da para voltar ao original.
 *
 * Limite honesto desta versao: o conteudo em si nao e embaralhado. A trava
 * impede quem senta no computador, mas quem souber abrir as ferramentas de
 * desenvolvedor ainda alcanca as paginas. Esconder de verdade so com o
 * adaptador de servidor, na v2.
 */

/** Onde a lista de contas fica guardada. */
export const CHAVE_CONTAS = 'carrapation:contas'

/** Onde fica quem esta com a sessao aberta. Some ao fechar a aba. */
export const CHAVE_SESSAO = 'carrapation:sessao'

/** Quantas voltas o calculo do resumo da. Mais voltas, mais lento de adivinhar. */
const VOLTAS = 150000

/** Um resumo guardado, com o tempero que foi usado para calcular. */
export interface Resumo {
  valor: string
  tempero: string
}

export interface Conta {
  /** Nome de usuario. E o que se digita para entrar, e nao muda depois. */
  usuario: string
  /** Nome de exibicao, o que aparece na barra lateral. */
  nome: string
  /** E-mail da conta. Junto com o numero, e o que recupera a senha. */
  email: string
  /** Resumo do numero de telefone, usado so na recuperacao de senha. */
  telefone: Resumo
  senha: Resumo
  criadaEm: number
}

/* ---------- Leitura e gravacao ---------- */

export function lerContas(): Conta[] {
  try {
    const cru = localStorage.getItem(CHAVE_CONTAS)
    const lista = cru ? (JSON.parse(cru) as Conta[]) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

export function buscarConta(usuario: string): Conta | null {
  const alvo = normalizarUsuario(usuario)
  return lerContas().find((c) => normalizarUsuario(c.usuario) === alvo) ?? null
}

/** Grava uma conta nova ou substitui a existente, pelo usuario. */
export function gravarConta(conta: Conta) {
  const contas = lerContas()
  const posicao = contas.findIndex(
    (c) => normalizarUsuario(c.usuario) === normalizarUsuario(conta.usuario),
  )

  if (posicao >= 0) contas[posicao] = conta
  else contas.push(conta)

  localStorage.setItem(CHAVE_CONTAS, JSON.stringify(contas))
}

/* ---------- Sessao ---------- */

/** Usa sessionStorage: recarregar mantem, fechar a aba encerra a sessao. */
export function usuarioDaSessao(): string | null {
  return sessionStorage.getItem(CHAVE_SESSAO)
}

export function abrirSessao(usuario: string) {
  sessionStorage.setItem(CHAVE_SESSAO, usuario)
}

export function fecharSessao() {
  sessionStorage.removeItem(CHAVE_SESSAO)
}

/* ---------- Resumos ---------- */

/** Calcula o resumo de um texto, gerando um tempero novo. */
export async function criarResumo(texto: string): Promise<Resumo> {
  const tempero = paraBase64(crypto.getRandomValues(new Uint8Array(16)))
  return { valor: await derivar(texto, tempero), tempero }
}

/** Confere se o texto informado corresponde ao resumo guardado. */
export async function conferirResumo(texto: string, resumo: Resumo | undefined): Promise<boolean> {
  if (!resumo) return false
  return (await derivar(texto, resumo.tempero)) === resumo.valor
}

async function derivar(texto: string, tempero: string): Promise<string> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(texto),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: deBase64(tempero), iterations: VOLTAS, hash: 'SHA-256' },
    material,
    256,
  )

  return paraBase64(new Uint8Array(bits))
}

function paraBase64(bytes: Uint8Array): string {
  let texto = ''
  for (const byte of bytes) texto += String.fromCharCode(byte)
  return btoa(texto)
}

/**
 * Devolve um ArrayBuffer, e nao um Uint8Array, porque e o que a API de
 * criptografia do navegador espera receber como tempero.
 */
function deBase64(texto: string): ArrayBuffer {
  const cru = atob(texto)
  const buffer = new ArrayBuffer(cru.length)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < cru.length; i++) bytes[i] = cru.charCodeAt(i)
  return buffer
}

/* ---------- Normalizacao ---------- */

/** Usuario e comparado sem espacos nas pontas e sem diferenca de maiuscula. */
export function normalizarUsuario(texto: string): string {
  return texto.trim().toLowerCase()
}

/** Deixa o usuario arrumado para gravar, mantendo as maiusculas escolhidas. */
export function arrumarUsuario(texto: string): string {
  return texto.trim()
}

/** Do numero so importam os digitos, entao pontuacao e espaco nao atrapalham. */
export function normalizarTelefone(texto: string): string {
  return texto.replace(/\D/g, '')
}

export function normalizarEmail(texto: string): string {
  return texto.trim().toLowerCase()
}

/* ---------- Conferencias de formulario ---------- */

/** Devolve o problema encontrado, ou null quando esta tudo certo. */
export function conferirUsuario(usuario: string): string | null {
  const limpo = arrumarUsuario(usuario)

  if (limpo.length < 3) return 'O usuario precisa ter pelo menos 3 caracteres.'

  // Sem espaco e sem acento de proposito: assim nao existe duvida na hora de
  // digitar para entrar, e a chave de armazenamento fica previsivel.
  if (!/^[a-zA-Z0-9._-]+$/.test(limpo)) {
    return 'O usuario nao aceita espaco nem acento. Use letras, numeros, ponto, hifen ou sublinhado.'
  }

  if (buscarConta(limpo)) return 'Ja existe uma conta com este usuario.'
  return null
}

export function conferirSenha(senha: string): string | null {
  if (senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.'
  return null
}

export function conferirTelefone(telefone: string): string | null {
  if (normalizarTelefone(telefone).length < 10) {
    return 'Informe o numero com DDD, no formato (32) XXXXX-XXXX.'
  }
  return null
}

export function conferirEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Informe um e-mail valido.'
  return null
}
