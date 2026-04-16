# Obsidian Memory Vault — Claude Code Skill

Skill para o Claude Code que transforma um vault Obsidian em **memoria externa infinita**. Cada conversa significativa produz notas atomicas e interconectadas com frontmatter YAML, wikilinks e tags — criando um grafo de conhecimento pesquisavel e navegavel em 2D e 3D.

## Funcionalidades

- **Salvar** — persiste decisoes, aprendizados, contextos e entidades como notas Obsidian
- **Consultar** — busca por texto, tags, tipo, projeto ou data
- **Indexar** — gera MOCs (Maps of Content) automaticamente
- **Grafo 2D** — nos coloridos por categoria no Graph View nativo
- **Grafo 3D** — plugin New 3D Graph v2.4.1 com esferas coloridas
- **Tema Glassmorphism** — visual vitrificado com transparencias e glow

## Estrutura do Vault

```
.memory/
  <nome-projeto>/              # Vault Obsidian
    .obsidian/                 # Config + plugins + tema
    contexts/                  # Estado de projetos (evergreen)
    decisions/                 # Decisoes de arquitetura
    entities/                  # Ferramentas, libs, servicos
    learnings/                 # Bugs resolvidos, descobertas
    conversations/             # Resumos de sessoes
    snippets/                  # Codigo reutilizavel
    _indexes/                  # MOCs auto-gerados
```

## Instalacao

### 1. Copiar arquivos para o projeto

```bash
# Copiar skill command
cp SKILL.md <projeto>/.claude/commands/obsidian-memory-vault.md

# Copiar scripts
mkdir -p <projeto>/.claude/scripts/references
cp vault-*.mjs <projeto>/.claude/scripts/
cp note-templates.md obsidian-syntax.md <projeto>/.claude/scripts/references/
```

### 2. Inicializar o vault

```bash
cd <projeto>
node .claude/scripts/vault-init.mjs \
  --vault-path ./.memory \
  --project-name <nome-projeto>
```

### 3. Adicionar ao .gitignore

```
.memory/
.vault-config.json
```

### 4. Abrir no Obsidian

Abra o Obsidian > **Open folder as vault** > selecione `.memory/<nome-projeto>/`

## Uso com Claude Code

```
"salvar no vault"              # Persiste a conversa
"o que decidimos sobre X?"     # Busca decisoes
"lembrar isso"                 # Salva item especifico
"stats do vault"               # Estatisticas
"reindexar vault"              # Reconstroi MOCs
/obsidian-memory-vault         # Aciona a skill
```

## Cores dos Nos

| Cor | Categoria |
|-----|-----------|
| Verde | Contexts |
| Azul | Decisions |
| Roxo | Entities |
| Laranja | Learnings |
| Cinza | Indexes |
| Amarelo | Conversations |
| Verde-neon | Snippets |

## Requisitos

- Node.js 18+ (para `fetch()` nativo)
- Obsidian 1.5+
- Claude Code

## Licenca

MIT
