# Carrapation

Espaco de trabalho e documentacao no estilo do Notion, feito para ser facil de abrir,
facil de usar e facil de modificar.

Roda no navegador. Nao precisa de servidor, nao precisa de login e nao precisa de internet
depois de aberto. Tudo fica salvo no proprio navegador de quem esta usando.

## Como rodar

```bash
npm install     # so na primeira vez
npm run dev     # abre em http://localhost:5173
```

Para gerar a versao final, que pode ser publicada num link ou copiada para um pendrive:

```bash
npm run build   # gera a pasta dist/
npm run preview # confere a versao final antes de publicar
```

A pasta `dist/` gerada e um site estatico completo. Da para publicar em qualquer
hospedagem de arquivos, ou compactar e enviar para alguem abrir localmente.

## Stacks usadas

| Peca | O que e | Por que esta aqui |
| --- | --- | --- |
| **React 18** | Biblioteca de interface | Componentes reutilizaveis, padrao de mercado |
| **TypeScript 5** | JavaScript com tipos | Avisa o erro antes de rodar, e documenta o codigo sozinho |
| **Vite 6** | Servidor de desenvolvimento e empacotador | Recarrega na hora ao salvar, build rapido |
| **CSS puro com variaveis** | Estilo | Sem Tailwind e sem biblioteca de componentes, entao da para ler e mudar qualquer linha |
| **contentEditable** | Recurso nativo do navegador | E o que permite escrever direto na pagina, sem editor externo |
| **localStorage** | Armazenamento nativo do navegador | Salva sem servidor, e da para inspecionar no F12 |
| **Canvas API** | Recurso nativo do navegador | Recorta e reduz a foto de perfil antes de salvar |

O que **nao** foi usado, de proposito: nenhuma biblioteca de estado (Redux, Zustand),
nenhuma de estilo (Tailwind, MUI), nenhuma de editor (Slate, TipTap, ProseMirror) e nenhum
backend. Tudo que o sistema faz esta no codigo deste repositorio, sem caixa preta.

Dependencias de producao: apenas `react` e `react-dom`.

## Onde mexer

Quatro arquivos resolvem a maior parte das personalizacoes:

| Quero mudar | Abra |
| --- | --- |
| Nome do app, cores da paleta, capas prontas, conteudo de boas vindas | `src/config.ts` |
| Cores, fontes, espacamentos, tamanho da logo e da capa, tema claro e escuro | `src/styles/tokens.css` |
| Adicionar icones ao seletor, ou mudar as palavras de busca deles | `src/emojis.ts` |
| Criar um modelo de pagina novo | `src/modelos.ts` |
| Criar um tipo de bloco novo | `src/blocos/registro.ts` |
| Trocar onde os dados sao salvos | `src/storage/index.ts` |

### Trocar um arquivo da marca

Os SVGs do CorelDRAW vem em UTF-16, e alguns navegadores nao leem esse formato.
Salve por cima do original em `assets/` mantendo o mesmo nome e rode:

```bash
npm run marca
```

O comando gera as copias em UTF-8 que o sistema usa (`logo.svg`, `icone.svg`,
`reduzida.svg`, `slogan.svg`) sem tocar nos originais.

### Adicionar um icone ao seletor

Em `src/emojis.ts`, cada icone e uma linha com o emoji e as palavras que o
encontram na busca:

```ts
['🦖', 'dinossauro rex jurassico'],
```

Escreva os sinonimos em portugues, sem acento. Quanto mais palavras, mais facil
de achar depois. Para criar uma categoria inteira, copie o formato de uma
existente na lista `CATEGORIAS_ICONES`.

### Criar um bloco novo

1. Adicione o nome dele em `BlockType`, em `src/types.ts`
2. Adicione uma entrada na lista `BLOCOS`, em `src/blocos/registro.ts`
3. Se ele tiver aparencia propria, crie a classe em `src/styles/app.css`

Pronto. O menu da barra `/`, os atalhos de markdown e o menu de transformar bloco
passam a conhecer o bloco novo sozinhos. O editor nao precisa ser tocado.

### Trocar o armazenamento por um servidor

`src/storage/adaptador.ts` define um contrato com quatro metodos. Escreva um arquivo
novo que cumpra esse contrato falando com a sua API e troque a linha de
`src/storage/index.ts`. Nenhum componente de tela precisa mudar.

## Estrutura das pastas

```
assets/                marca (a pasta e servida na raiz do site)
src/
  config.ts            painel de controle das personalizacoes rapidas
  types.ts             formato dos dados, comece a leitura por aqui
  emojis.ts            catalogo de icones com as palavras de busca
  blocos/registro.ts   catalogo de todos os tipos de bloco
  estado/espaco.tsx    estado central e todas as acoes do sistema
  storage/             fronteira entre a interface e onde os dados moram
  lib/                 funcoes de apoio (cursor, limpeza de HTML, arquivos)
  componentes/         as telas
  styles/              tokens.css (paleta) e app.css (aparencia)
```

## O que ja funciona

**Paginas**
- Tres modelos ao criar: pagina em branco, checklist e calendario
- Arvore de paginas com subpaginas em qualquer profundidade
- Favoritos, pela estrela do topo ou pelo menu da pagina
- Botao direito em qualquer pagina da lateral abre o menu de opcoes
- Arrastar uma pagina para dentro de outra, ou para fora
- Capa da pagina: degrade pronto, imagem do computador ou endereco da internet,
  com reposicionar arrastando
- Icone da pagina, escolhido num seletor com busca em portugues, categorias
  e memoria dos ultimos usados
- Duplicar, renomear, excluir
- Trilha de navegacao no topo
- Busca por titulo e por conteudo, com `Ctrl K`

**Editor**
- Doze tipos de bloco: texto, tres niveis de titulo, lista com marcadores,
  lista numerada, tarefa, citacao, aviso, codigo, divisor, imagem e calendario
- Calendario com grade do mes, navegacao entre meses e anotacoes por dia.
  Cada anotacao tem menu de tres pontos para virar checklist, ganhar caixa de
  marcar, ser dada como finalizada ou excluida
- Botao direito em qualquer bloco abre o menu de tipos, igual ao + da esquerda
- Menu de blocos com `/`
- Atalhos de markdown: `#`, `##`, `###`, `-`, `1.`, `[]`, `>`, ` ``` `, `---`
- Negrito, italico e sublinhado com `Ctrl B`, `Ctrl I` e `Ctrl U`
- Arrastar blocos pela alcinha para reordenar
- Enter divide o bloco no cursor, Backspace junta com o anterior
- Colar de outros programas limpando o excesso de formatacao

**Perfil**
- Nome, cargo e e-mail
- Foto anexada do computador, recortada em quadrado e reduzida automaticamente

**Aparencia**
- Tema claro e escuro
- Seis cores de destaque
- Tres opcoes de fonte para o conteudo
- Largura normal ou larga

**Dados**
- Salvamento automatico com indicador no topo
- Exportar o espaco inteiro num arquivo `.carrapation.json`
- Importar de volta em qualquer computador

## Atalhos de teclado

| Atalho | Acao |
| --- | --- |
| `Ctrl K` | Buscar |
| `Ctrl Shift N` | Nova pagina |
| `Ctrl \` | Mostrar ou esconder a barra lateral |
| `/` | Menu de blocos |
| `Ctrl B` / `Ctrl I` / `Ctrl U` | Negrito, italico, sublinhado |

## Limites conhecidos desta versao

- Os dados ficam em um navegador so. Para levar para outro computador, use Exportar e Importar.
- Nao existe edicao simultanea entre duas pessoas. Isso depende do adaptador de servidor.
- Nao existe desfazer com `Ctrl Z` no nivel do documento. O desfazer e o do proprio
  campo de texto, dentro de um bloco.
- Imagens sao guardadas dentro do proprio arquivo do espaco, entao convem manter as fotos leves.
