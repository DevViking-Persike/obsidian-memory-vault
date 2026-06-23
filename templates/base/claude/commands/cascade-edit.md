Edicao em cascata — detecta mudancas em qualquer arquivo do vault Obsidian (.memory/) e propaga para todos os arquivos relacionados.

## Escopo de varredura

Varrer TUDO dentro de `.memory/`:
1. **claude-memory/** — notas do vault (contexts, entities, decisions, learnings, conversations, snippets, indexes)
2. **ia-config/** — configuracoes do Claude Code e Codex (commands, agents, rules, skills, settings, CLAUDE.md, AGENTS.md)

## Steps

### 1. Detectar mudancas recentes
- Encontre todos os arquivos em `.memory/` modificados recentemente
- Para cada arquivo modificado, leia o conteudo atual

### 2. Propagar notas do vault (claude-memory/)
- Se uma nota foi editada, busque o termo ou conceito alterado em TODAS as outras notas
- Atualize todas as notas que referenciam o mesmo conceito com a informacao correta
- Exemplos: renomear tecnologia, mudar stack, atualizar status, corrigir info

### 3. Propagar config (ia-config/ ↔ .claude/ + .codex/)
- Para CADA arquivo em `.memory/ia-config/` (recursivo), compare com equivalente em `.claude/`, `.codex/` ou raiz
- Se diferente, copie de ia-config para o destino
- Se arquivo ou pasta nova em ia-config, crie no destino e copie
- Para CADA arquivo em `.claude/` e `.codex/` (recursivo), compare com equivalente em ia-config
- Se diferente ou novo, copie para ia-config

### 4. Reporte
- Liste todos os arquivos alterados com o que mudou
- Se nada mudou, diga "Tudo sincronizado, nenhuma diferenca encontrada."
