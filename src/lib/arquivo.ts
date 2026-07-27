/** Funcoes de apoio para ler e gravar arquivos no navegador. */

/** Le um arquivo escolhido pelo usuario e devolve como data URL (serve para imagens). */
export function lerComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader()
    leitor.onload = () => resolver(String(leitor.result))
    leitor.onerror = () => rejeitar(new Error('Nao consegui ler o arquivo.'))
    leitor.readAsDataURL(arquivo)
  })
}

/** Le um arquivo de texto escolhido pelo usuario. */
export function lerComoTexto(arquivo: File): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader()
    leitor.onload = () => resolver(String(leitor.result))
    leitor.onerror = () => rejeitar(new Error('Nao consegui ler o arquivo.'))
    leitor.readAsText(arquivo)
  })
}

/** Dispara o download de um conteudo de texto com o nome informado. */
export function baixarTexto(nomeArquivo: string, conteudo: string, tipo = 'application/json') {
  const bolha = new Blob([conteudo], { type: tipo })
  const endereco = URL.createObjectURL(bolha)
  const link = document.createElement('a')
  link.href = endereco
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(endereco)
}

/** Abre o seletor de arquivos do sistema e devolve o arquivo escolhido. */
export function escolherArquivo(aceitar: string): Promise<File | null> {
  return new Promise((resolver) => {
    const campo = document.createElement('input')
    campo.type = 'file'
    campo.accept = aceitar
    campo.onchange = () => resolver(campo.files?.[0] ?? null)
    campo.click()
  })
}

/** Converte bytes em megabytes, para checar limites de tamanho. */
export function emMegabytes(bytes: number): number {
  return bytes / (1024 * 1024)
}
