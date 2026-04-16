---
name: obsidian-memory-vault
description: >
  Persiste contexto de conversas, decisoes, aprendizados e conhecimento do projeto
  em um vault Obsidian como notas markdown interconectadas com frontmatter YAML, wikilinks
  e tags — criando uma memoria externa infinita, pesquisavel e navegavel em grafo.
  Use esta skill quando: o usuario disser "salvar no vault", "lembrar isso", "registrar decisao",
  "persistir memoria", "salvar contexto", "obsidian", "vault", ou ao FINAL de qualquer
  conversa significativa onde decisoes importantes, escolhas de arquitetura, solucoes de bugs
  ou aprendizados ocorreram. Tambem acione quando o usuario pedir para "consultar", "buscar memoria",
  "o que decidimos sobre X", ou quiser consultar conhecimento passado. Esta skill gerencia
  o ciclo completo: salvar, consultar, vincular, indexar e manter o vault.
---

# Obsidian Memory Vault — Skill do Claude Code

## Proposito

Esta skill transforma um vault Obsidian na **memoria externa infinita** do Claude. Cada conversa
significativa produz notas atomicas em markdown, ricamente vinculadas, que o Claude pode buscar
e consultar posteriormente para manter continuidade perfeita entre sessoes.

O vault funciona como um segundo cerebro: decisoes de arquitetura, aprendizados de debugging,
contexto de projeto, entidades e snippets de codigo ficam todos conectados em um grafo
navegavel — tanto no Obsidian Desktop (grafos 2D e 3D) quanto via busca textual.

---

## Inicio Rapido

Na primeira utilizacao, verificar se existe `.vault-config.json` na raiz do projeto.

**Comportamento padrao**: Se nenhuma config existir, usar `./.memory/<nome-projeto>/` (dentro
da raiz do repositorio atual) como caminho padrao do vault. Isso mantem a memoria co-localizada
com o projeto. Oferecer ao usuario estas opcoes em ordem:

1. **`./.memory/<nome-projeto>/`** (padrao, recomendado) — memoria local do projeto, ignorada pelo git automaticamente
2. **Vault Obsidian externo** — se o usuario ja tem um vault existente que deseja utilizar
3. **`~/.memory/<nome-projeto>/`** — memoria global compartilhada entre projetos

Quando usar `./.memory/` como caminho do vault, **adicionar automaticamente `/.memory` ao
`.gitignore`** do projeto se ainda nao estiver la.

```json
{
  "vault_path": "./.memory/<nome-projeto>",
  "project_name": "<nome-projeto>",
  "auto_save": false,
  "language": "pt-BR"
}
```

**Configuracao do gitignore** (automatica quando vault_path comeca com `./.memory`):
1. Verificar se `.gitignore` existe na raiz do projeto
2. Se existir, verificar se `/.memory` ou `.memory` ja esta listado
3. Se nao estiver, adicionar `/.memory` ao final do `.gitignore`
4. Se `.gitignore` nao existir, cria-lo com `/.memory` como primeira entrada

Apos definir o caminho do vault, criar o arquivo de configuracao.

---

## Conceitos Principais

### Tipos de Nota

Cada nota e UM destes tipos, armazenada em sua propria subpasta dentro do vault:

| Tipo | Subpasta | Finalidade | Nomenclatura |
|------|----------|------------|--------------|
| **decision** | `decisions/` | Escolhas de arquitetura, tecnologia ou design | `YYYY-MM-DD-slug.md` |
| **learning** | `learnings/` | Correcoes de bugs, armadilhas, descobertas | `YYYY-MM-DD-slug.md` |
| **context** | `contexts/` | Estado do projeto, ambiente, configuracao | `slug.md` (sem data, atualizado in-place) |
| **conversation** | `conversations/` | Resumos de sessao (o "cabecalho" de um chat) | `YYYY-MM-DD-HHmm-slug.md` |
| **entity** | `entities/` | Pessoas, ferramentas, bibliotecas, servicos | `slug.md` (evergreen) |
| **snippet** | `snippets/` | Codigo reutilizavel, queries, comandos | `slug.md` |
| **index** | `_indexes/` | MOCs gerados automaticamente (Mapas de Conteudo) | `index-slug.md` |

### Schema do Frontmatter

Toda nota DEVE ter este frontmatter YAML:

```yaml
---
type: decision | learning | context | conversation | entity | snippet
title: "Titulo legivel por humanos"
created: 2026-03-17T14:30:00-03:00
updated: 2026-03-17T14:30:00-03:00
tags:
  - claude-memory
  - project/nome-do-projeto   # namespace de projeto
  - topic/tratamento-erros     # namespace de topico
  - lang/csharp                # namespace de linguagem/tecnologia
  - status/active              # status: active | archived | superseded
aliases:
  - "nome alternativo"
related: []                    # populado por wikilinks no corpo
confidence: high               # high | medium | low — nivel de certeza
source: conversation           # conversation | manual | imported
---
```

### Estrategia de Vinculacao — O Grafo de Memoria

Links sao o que transformam isso em um **grafo de conhecimento** em vez de um despejo de arquivos.
Usar estes padroes de vinculacao religiosamente:

1. **Wikilinks para referencias internas**: `[[nome-da-nota]]` ou `[[nome-da-nota|texto exibido]]`
2. **Links com heading para precisao**: `[[nome-da-nota#Nome da Secao]]`
3. **Hierarquia de tags para busca facetada**: `#project/nome`, `#topic/area`, `#lang/tech`
4. **Backlinks sao automaticos** — o Obsidian os resolve. Basta vincular generosamente.

**Regras de vinculacao:**
- Toda nota DEVE vincular a pelo menos 2 outras notas (criar stubs se necessario)
- Toda decisao DEVE vincular ao contexto ou conversa que a produziu
- Todo aprendizado DEVE vincular a entidade relacionada (ferramenta, lib, linguagem)
- Todo resumo de conversa DEVE vincular a todas as decisoes e aprendizados produzidos
- Usar formato `[[entities/slug]]` para vinculacao entre pastas

### Nomenclatura de Arquivos

- Lowercase kebab-case: `operador-pipe-design.md`
- Prefixo de data para notas temporais: `2026-03-17-operador-pipe-design.md`
- Nunca espacos em nomes de arquivo (Obsidian os suporta mas causam problemas no CLI)
- Maximo 60 caracteres para a parte slug

---

## Operacoes

### 1. SALVAR — Persistir conversa no vault

Executar ao final de uma conversa significativa ou quando o usuario solicitar.

**Processo:**

1. **Ler config** — carregar `.vault-config.json` da raiz do projeto, fallback para `~/.vault-config.json`. Se nao existir config, usar `./.memory/<nome-projeto>/` como padrao e garantir que `/.memory` esta no `.gitignore`
2. **Analisar conversa** — identificar:
   - Decisoes tomadas (-> notas `decision`)
   - Coisas aprendidas, bugs corrigidos, armadilhas encontradas (-> notas `learning`)
   - Mudancas de estado do projeto (-> atualizar notas `context` existentes ou criar novas)
   - Novas ferramentas/libs/servicos discutidos (-> notas `entity`)
   - Codigo reutilizavel produzido (-> notas `snippet`)
3. **Gerar notas** — para cada item, criar o arquivo markdown com frontmatter adequado
4. **Criar resumo da conversa** — uma nota `conversation` que vincula a todas as notas geradas
5. **Atualizar indices** — regenerar MOCs (Mapas de Conteudo) afetados
6. **Reportar** — mostrar ao usuario o que foi salvo com caminhos clicaveis do vault

**Usar o script de salvamento:**

```bash
node .claude/scripts/vault-save.mjs \
  --config .vault-config.json \
  --type conversation \
  --title "Titulo do resumo da sessao" \
  --content-file /tmp/conteudo-nota.md \
  --tags "project/foo,topic/bar" \
  --links "decisions/alguma-decisao,entities/alguma-ferramenta"
```

Ou escrever arquivos diretamente se o script nao estiver disponivel — seguir os templates em
`.claude/scripts/references/note-templates.md`.

### 2. CONSULTAR — Buscar e recuperar do vault

Quando o usuario perguntar sobre decisoes passadas, contexto ou conhecimento:

1. **Buscar por tag**: procurar notas com tag especifica no frontmatter
2. **Buscar por conteudo**: pesquisa textual nas notas do vault
3. **Buscar por tipo**: listar notas de uma subpasta especifica (decisions/, learnings/, etc.)
4. **Ler frontmatter**: parsear YAML para filtrar por intervalo de datas, confianca, status
5. **Seguir links**: ao encontrar uma nota relevante, seguir seus wikilinks para reunir contexto completo
6. **Apresentar achados**: resumir o que foi encontrado com links para as notas relevantes

**Usar o script de consulta para busca estruturada:**

```bash
node .claude/scripts/vault-recall.mjs \
  --config .vault-config.json \
  --query "design do operador pipe" \
  --type decision \
  --project nome-do-projeto \
  --limit 10
```

### 3. ATUALIZAR — Modificar notas existentes

Para notas `context` e `entity` (notas evergreen que evoluem):

1. Ler a nota existente
2. Atualizar o campo `updated` no frontmatter
3. Adicionar ou modificar conteudo conforme necessario
4. Adicionar novos links se novas relacoes surgiram
5. Se uma decisao foi substituida, adicionar tag `status/superseded` e vincular a nova decisao

### 4. INDEXAR — Reconstruir Mapas de Conteudo

MOCs sao arquivos de indice gerados automaticamente que agrupam notas por projeto, topico ou tipo.
Reconstruir quando notas sao adicionadas ou modificadas.

**Formato do MOC** (`_indexes/index-nome-projeto.md`):

```markdown
---
type: index
title: "Nome do Projeto — Mapa de Conteudo"
created: 2026-03-17T14:30:00-03:00
updated: 2026-03-17T14:30:00-03:00
tags:
  - claude-memory
  - index
  - project/nome-do-projeto
---

# Nome do Projeto — Mapa de Conteudo

## Decisoes
- [[decisions/2026-03-17-design-operador-pipe|Operador pipe: hibrido estilo Elixir com token $ topico]]
- [[decisions/2026-03-15-modelo-coroutine|Modelo de coroutine: yield bidirecional, estilo Lua]]

## Aprendizados
- [[learnings/2026-03-16-fibonacci-fast-doubling|Fast doubling para Fibonacci e 10x mais rapido que naive]]

## Contexto
- [[contexts/arquitetura-projeto|Visao geral da arquitetura atual]]

## Entidades
- [[entities/lua-vm|Lua VM (runtime alvo)]]
- [[entities/rust-traits|Sistema de traits estilo Rust]]

## Conversas Recentes
- [[conversations/2026-03-17-1430-sessao-operador-pipe|Sessao de design do operador pipe]]
```

**Usar o script de indexacao:**

```bash
node .claude/scripts/vault-index.mjs \
  --config .vault-config.json
```

---

## Visualizacao

### Grafo 2D

- **Ctrl+G** para abrir o grafo nativo do Obsidian
- Nos coloridos por categoria:
  - Verde = `contexts/`
  - Azul = `decisions/`
  - Roxo = `entities/`
  - Laranja = `learnings/`
  - Cinza = `_indexes/`
  - Amarelo = `conversations/`
  - Verde-neon = `snippets/`

### Grafo 3D

- **Ctrl+P** > digitar "3D Graph: Open 3D Graph"
- Plugin **New 3D Graph v2.4.1** instalado automaticamente pelo `vault-init.mjs`
- Mesmas cores do grafo 2D aplicadas aos nos
- Controles:
  - **Scroll** = zoom
  - **Botao esquerdo** = rotacionar
  - **Botao direito** = pan
  - **WASD** = mover
  - **Q/E** = subir/descer

### Tema Glassmorphism

O vault utiliza um tema visual glassmorphism customizado com:
- Paineis translucidos com efeito blur
- Headers com efeito glow
- Tags renderizadas como pills vitrificadas
- Fundo com gradiente escuro

---

## Comportamento de Auto-Save

Quando `auto_save` e `true` na config, o Claude deve salvar automaticamente ao final de
conversas que contenham qualquer um destes:
- Decisoes de arquitetura ou design
- Resolucoes de bugs ou avancos em debugging
- Configuracao ou setup de novo projeto
- Avaliacao e selecao de ferramentas/bibliotecas
- Padroes de codigo que valem ser reutilizados

Quando `auto_save` e `false`, salvar apenas quando o usuario solicitar explicitamente.

---

## Consideracoes de Performance

- **Notas atomicas**: Um conceito por nota. Dividir topicos grandes em multiplas notas.
- **Indexacao preguicosa**: Reconstruir apenas MOCs afetados pelas novas notas.
- **grep ao inves de parsing**: Para busca, `grep`/`ripgrep` e mais rapido que carregar todos os arquivos em memoria.
- **Poda por data**: Para consulta, comecar pelas notas mais recentes e expandir se necessario.
- **Scan somente do frontmatter**: Para filtragem, ler apenas o YAML frontmatter (ate o segundo `---`).

---

## Notas Importantes

- Nunca deletar notas. Marca-las com `status/archived` ou `status/superseded`.
- Toda nota deve ser markdown valido compativel com Obsidian (Obsidian-flavored markdown).
- Wikilinks usam correspondencia por caminho mais curto — `[[design-operador-pipe]]` resolve
  automaticamente para `decisions/2026-03-17-design-operador-pipe.md` no Obsidian.
- Se uma nota vinculada ainda nao existir, cria-la como stub com frontmatter minimo.
  O Obsidian a mostrara como um link valido e o usuario pode preenche-la depois.
- Sempre usar `claude-memory` como primeira tag em toda nota para filtragem global no vault.
- Namespaces de tags (`project/`, `topic/`, `lang/`, `status/`) permanecem em ingles
  para consistencia. Termos tecnicos tambem ficam em ingles independente do idioma escolhido.

---

## Arquivos de Referencia

- `.claude/scripts/references/note-templates.md` — Templates completos para cada tipo de nota
- `.claude/scripts/references/obsidian-syntax.md` — Referencia de markdown compativel com Obsidian
- `.claude/scripts/vault-save.mjs` — Script Node.js para salvar notas no vault
- `.claude/scripts/vault-recall.mjs` — Script Node.js para buscar e consultar notas
- `.claude/scripts/vault-index.mjs` — Script Node.js para reconstruir indices MOC
- `.claude/scripts/vault-init.mjs` — Script Node.js para inicializar o vault e plugins
