/**
 * Converte os arquivos de marca do CorelDRAW para UTF-8.
 *
 * O CorelDRAW salva SVG em UTF-16, e alguns navegadores nao leem esse formato.
 * Este script le os originais da pasta assets e gera as copias em UTF-8 que o
 * sistema usa. Os originais nunca sao alterados.
 *
 * Rode com:  npm run marca
 *
 * Trocou um logo no CorelDRAW? Salve por cima do arquivo original com o mesmo
 * nome e rode o comando de novo.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const pastaAssets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets')

/** Original do CorelDRAW  ->  copia em UTF-8 usada pelo sistema. */
const ARQUIVOS = {
  'LogoSVGBlack.svg': 'logo.svg',
  'IconeSVGBlack.svg': 'icone.svg',
  'ReduzidaSVGBlack.svg': 'reduzida.svg',
  'SloganSVGBlack.svg': 'slogan.svg',
  'TextoSVGBlack.svg': 'texto.svg',
  'MolduraRosaSVG.svg': 'moldura-rosa.svg',
}

let convertidos = 0

for (const [origem, destino] of Object.entries(ARQUIVOS)) {
  const caminhoOrigem = join(pastaAssets, origem)

  if (!existsSync(caminhoOrigem)) {
    console.log(`  pulado   ${origem} (nao encontrado)`)
    continue
  }

  const bytes = readFileSync(caminhoOrigem)
  // Marca de UTF-16 little endian no comeco do arquivo.
  const ehUtf16 = bytes[0] === 0xff && bytes[1] === 0xfe

  const texto = bytes.toString(ehUtf16 ? 'utf16le' : 'utf8').replace('encoding="UTF-16"', 'encoding="UTF-8"')

  writeFileSync(join(pastaAssets, destino), texto, 'utf8')
  console.log(`  ok       ${origem} -> ${destino}`)
  convertidos++
}

console.log(`\n${convertidos} arquivo(s) de marca atualizado(s).`)
