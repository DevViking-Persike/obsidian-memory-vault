Sincronizacao bidirecional entre `.memory/ia-config/` (Obsidian) e `.claude/` + `.codex/` + raiz (Claude Code + Codex).

## Sync bidirecional — edicao em cascata

Steps:

### 1. Detectar todas as pastas e arquivos
- Liste TODAS as pastas e arquivos em `.memory/ia-config/` (commands/, agents/, rules/, codex/, qualquer pasta nova)
- Liste TODAS as pastas e arquivos em `.claude/` e `.codex/`
- Compare `./CLAUDE.md` com `.memory/ia-config/CLAUDE.md`
- Compare `./AGENTS.md` com `.memory/ia-config/AGENTS.md`

### 2. Obsidian → Claude Code + Codex (ia-config → .claude + .codex + raiz)
- Para CADA arquivo em `.memory/ia-config/` (recursivo, todas as pastas), compare com o equivalente:
  - `ia-config/commands/` → `.claude/commands/`
  - `ia-config/agents/` → `.claude/agents/`
  - `ia-config/rules/` → `.claude/rules/`
  - `ia-config/codex/` → `.codex/`
  - `ia-config/CLAUDE.md` → `./CLAUDE.md`
  - `ia-config/AGENTS.md` → `./AGENTS.md`
  - `ia-config/settings.local.json` → `.claude/settings.local.json`
- Se diferente, copie de ia-config para o destino
- Se o arquivo nao existe no destino, crie a pasta e copie
- Se uma pasta inteira nao existe, crie e copie todo conteudo

### 3. Claude Code + Codex → Obsidian (.claude + .codex + raiz → ia-config)
- Para CADA arquivo em `.claude/` (recursivo, todas as pastas), compare com equivalente em ia-config
- Para CADA arquivo em `.codex/` (recursivo), compare com equivalente em `ia-config/codex/`
- Compare `./CLAUDE.md` com `ia-config/CLAUDE.md` — se diferente, copie
- Compare `./AGENTS.md` com `ia-config/AGENTS.md` — se diferente, copie
- Se arquivo nao existe em ia-config, crie a pasta e copie

### 4. Reporte
- Liste todos os arquivos sincronizados com direcao (Obsidian → Claude ou Claude → Obsidian)
- Se nada mudou, diga "Tudo sincronizado, nenhuma diferenca encontrada."
- Se houve conflito (arquivo mudou nos dois lados), pergunte ao usuario qual versao manter
