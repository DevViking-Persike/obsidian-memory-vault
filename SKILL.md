---
name: obsidian-memory-vault
description: >
  Persists Claude Code conversation context, decisions, learnings, and project knowledge
  into an Obsidian vault as interconnected markdown notes with YAML frontmatter, wikilinks,
  and tags — creating an infinite, searchable, graph-navigable external memory.
  Use this skill whenever: the user says "save to vault", "remember this", "log this decision",
  "persist memory", "save context", "obsidian", "vault", or at the END of any significant
  conversation where important decisions, architecture choices, debugging breakthroughs,
  or learnings occurred. Also trigger when the user asks to "recall", "search memory",
  "what did we decide about X", or wants to consult past knowledge. This skill manages
  the full lifecycle: saving, recalling, linking, indexing, and maintaining the vault.
  If the user mentions Obsidian, vault, memory, or knowledge base in the context of
  persisting conversation knowledge, use this skill.
---

# Obsidian Memory Vault — Claude Code Skill

## Purpose

This skill turns an Obsidian vault into Claude's **infinite external memory**. Every significant
conversation produces atomic, richly-linked markdown notes that Claude can later search and
consult to maintain perfect continuity across sessions.

## Quick Start

On first use, check for a `.vault-config.json` in the project root, then fallback to home directory.

**Default behavior**: If no config exists, use `./.memory` (inside the current repository root)
as the default vault path. This keeps memory co-located with the project and avoids requiring
an external Obsidian vault. Offer the user these options in order:

1. **`./.memory`** (default, recommended) — project-local memory, git-ignored automatically
2. **External Obsidian vault** — if the user has an existing vault they want to use
3. **`~/.memory`** — global memory shared across all projects

When using `./.memory` as the vault path, **automatically add `/.memory` to the project's
`.gitignore`** if it's not already there. This prevents memory files from being committed.

```json
{
  "vault_path": "./.memory",
  "memory_folder": "claude-memory",
  "auto_save": false,
  "language": "pt-BR"
}
```

**Gitignore setup** (automatic when vault_path is `./.memory`):
1. Check if `.gitignore` exists in the project root
2. If it exists, check if `/.memory` or `.memory` is already listed
3. If not listed, append `/.memory` to the end of `.gitignore`
4. If `.gitignore` doesn't exist, create it with `/.memory` as the first entry

After setting the vault path, create the config file.

---

## Core Concepts

### Note Types

Every note is ONE of these types, stored in its own subfolder under the memory folder:

| Type | Subfolder | Purpose | Naming |
|------|-----------|---------|--------|
| **decision** | `decisions/` | Architecture, tech, or design choices | `YYYY-MM-DD-slug.md` |
| **learning** | `learnings/` | Bug fixes, gotchas, discoveries | `YYYY-MM-DD-slug.md` |
| **context** | `contexts/` | Project state, environment, setup | `slug.md` (no date, updated in-place) |
| **conversation** | `conversations/` | Session summaries (the "head" of a chat) | `YYYY-MM-DD-HHmm-slug.md` |
| **entity** | `entities/` | People, tools, libs, services | `slug.md` (evergreen) |
| **snippet** | `snippets/` | Reusable code, queries, commands | `slug.md` |
| **index** | `_indexes/` | Auto-generated MOCs (Maps of Content) | `index-slug.md` |

### Frontmatter Schema

Every note MUST have this YAML frontmatter:

```yaml
---
type: decision | learning | context | conversation | entity | snippet
title: "Human-readable title"
created: 2026-03-17T14:30:00-03:00
updated: 2026-03-17T14:30:00-03:00
tags:
  - claude-memory
  - project/zolo-lang        # project namespace
  - topic/error-handling      # topic namespace
  - lang/rust                 # language/tech namespace
  - status/active             # status: active | archived | superseded
aliases:
  - "alternative name"
related: []                   # populated by wikilinks in body
confidence: high              # high | medium | low — how certain is this info
source: conversation          # conversation | manual | imported
---
```

### Linking Strategy — The Memory Graph

Links are what make this a **knowledge graph** instead of a flat file dump.
Use these linking patterns religiously:

1. **Wikilinks for internal references**: `[[note-name]]` or `[[note-name|display text]]`
2. **Heading links for precision**: `[[note-name#Section Name]]`
3. **Tag hierarchy for faceted search**: `#project/name`, `#topic/area`, `#lang/tech`
4. **Backlinks are automatic** — Obsidian resolves them. Just link forward generously.

**Linking rules:**
- Every note MUST link to at least 2 other notes (create stubs if needed)
- Every decision MUST link to the context or conversation that produced it
- Every learning MUST link to the related entity (tool, lib, language)
- Every conversation summary MUST link to all decisions and learnings it produced
- Use `[[entities/slug]]` format for cross-folder linking

### File Naming

- Lowercase kebab-case: `pipe-operator-design.md`
- Date prefix for temporal notes: `2026-03-17-pipe-operator-design.md`
- Never spaces in filenames (Obsidian handles them but they cause issues in CLI)
- Max 60 chars for the slug portion

---

## Operations

### 1. SAVE — Persist conversation to vault

Run at the end of a significant conversation or when the user requests it.

**Process:**

1. **Read config** — load `.vault-config.json` from project root, fallback to `~/.vault-config.json`. If no config exists, use `./.memory` as default and ensure `/.memory` is in `.gitignore`
2. **Analyze conversation** — identify:
   - Key decisions made (→ `decision` notes)
   - Things learned, bugs fixed, gotchas found (→ `learning` notes)
   - Project state changes (→ update existing `context` notes or create new ones)
   - New tools/libs/services discussed (→ `entity` notes)
   - Reusable code produced (→ `snippet` notes)
3. **Generate notes** — for each item, create the markdown file with proper frontmatter
4. **Create conversation summary** — a `conversation` note that links to all generated notes
5. **Update indexes** — regenerate affected MOC (Map of Content) files
6. **Report** — show the user what was saved with clickable vault paths

**Use the save script:**

```bash
# The script handles all file I/O, frontmatter generation, and index updates
node /path/to/skill/scripts/vault-save.mjs \
  --config /path/to/.vault-config.json \
  --type conversation \
  --title "Session summary title" \
  --content-file /tmp/note-content.md \
  --tags "project/foo,topic/bar" \
  --links "decisions/some-decision,entities/some-tool"
```

Or write files directly if the script isn't available — follow the templates in
`references/note-templates.md`.

### 2. RECALL — Search and retrieve from vault

When the user asks about past decisions, context, or knowledge:

1. **Search by tag**: `grep -rl "tags:.*project/zolo-lang" "$VAULT_PATH/claude-memory/"`
2. **Search by content**: `grep -rl "keyword" "$VAULT_PATH/claude-memory/" --include="*.md"`
3. **Search by type**: `find "$VAULT_PATH/claude-memory/decisions/" -name "*.md" | head -20`
4. **Read frontmatter**: Parse YAML to filter by date range, confidence, status
5. **Follow links**: When you find a relevant note, follow its wikilinks to gather full context
6. **Present findings**: Summarize what you found with links to the relevant notes

**Use the recall script for structured search:**

```bash
node /path/to/skill/scripts/vault-recall.mjs \
  --config /path/to/.vault-config.json \
  --query "pipe operator design" \
  --type decision \
  --project zolo-lang \
  --limit 10
```

### 3. UPDATE — Modify existing notes

For `context` and `entity` notes (evergreen notes that evolve):

1. Read the existing note
2. Update the `updated` field in frontmatter
3. Append or modify content as needed
4. Add new links if new relationships emerged
5. If a decision is superseded, add `status/superseded` tag and link to the new decision

### 4. INDEX — Rebuild Maps of Content

MOCs are auto-generated index files that group notes by project, topic, or type.
Rebuild when notes are added or modified.

**MOC format example** (`_indexes/index-zolo-lang.md`):

```markdown
---
type: index
title: "Zolo Lang — Map of Content"
created: 2026-03-17T14:30:00-03:00
updated: 2026-03-17T14:30:00-03:00
tags:
  - claude-memory
  - index
  - project/zolo-lang
---

# Zolo Lang — Map of Content

## Decisions
- [[decisions/2026-03-17-pipe-operator-design|Pipe operator: hybrid Elixir-style with $ topic token]]
- [[decisions/2026-03-15-coroutine-model|Coroutine model: bidirectional yield, Lua-style resume]]

## Learnings
- [[learnings/2026-03-16-fast-doubling-fibonacci|Fast doubling for Fibonacci is 10x faster than naive]]

## Context
- [[contexts/zolo-lang-architecture|Current architecture overview]]

## Entities
- [[entities/lua-vm|Lua VM (Zolo runtime target)]]
- [[entities/rust-traits|Rust-style trait system]]

## Recent Conversations
- [[conversations/2026-03-17-1430-pipe-operator-session|Pipe operator design session]]
```

---

## Auto-Save Behavior

When `auto_save` is `true` in config, Claude should automatically save at the end of
conversations that contain any of:
- Architecture or design decisions
- Bug resolutions or debugging breakthroughs
- New project setup or configuration
- Tool/library evaluation and selection
- Code patterns worth reusing

When `auto_save` is `false`, only save when the user explicitly requests it.

---

## Performance Considerations

- **Atomic notes**: One concept per note. Split large topics into multiple notes.
- **Lazy indexing**: Only rebuild MOCs that are affected by new notes.
- **grep over parsing**: For search, `grep`/`ripgrep` is faster than loading all files into memory.
- **Date-based pruning**: For recall, start with the most recent notes and expand if needed.
- **Frontmatter-only scan**: For filtering, read only the YAML frontmatter (up to the second `---`).

---

## Language

During initial setup (when creating `.vault-config.json`), ask the user which language
they want for their memory notes. Present these options:

1. **English** (recommended) — universal, easier to search and share
2. **User's detected language** (based on conversation language, e.g. "Português (BR)") — more natural for the user
3. **Other** — let the user specify

The `language` field in config controls note titles, content, and descriptions.
Tag namespaces (`project/`, `topic/`, `lang/`, `status/`) always stay in English
for consistency. Technical terms also stay in English regardless of the chosen language.

---

## Important Notes

- Never delete notes. Mark them `status/archived` or `status/superseded` instead.
- Every note must be valid Obsidian-flavored markdown.
- Wikilinks use shortest-path matching — `[[pipe-operator-design]]` will resolve
  to `decisions/2026-03-17-pipe-operator-design.md` automatically in Obsidian.
- If a linked note doesn't exist yet, create it as a stub with minimal frontmatter.
  Obsidian will show it as a valid link and the user can flesh it out later.
- Always use `claude-memory` as the first tag on every note for easy vault-wide filtering.

## Project Scaffolding

This skill can also scaffold a new project with full Claude Code + Codex structure.

**Use the project-init script:**

```bash
# List available stack presets
node /path/to/skill/project-init.mjs --list-stacks

# Scaffold a new project
node /path/to/skill/project-init.mjs \
  --path /path/to/new-project \
  --name "My Project" \
  --stack go-blazor \
  --figma-key ABC123 \
  --language pt-BR

# Dry run (preview without writing)
node /path/to/skill/project-init.mjs \
  --path /path/to/new-project \
  --name "My Project" \
  --stack nextjs \
  --dry-run
```

**Available stacks:**
- `go-blazor` — Go hexagonal + .NET MAUI Hybrid Blazor + AWS Lambda
- `nextjs` — Next.js 15 App Router + TypeScript + Tailwind + Prisma
- `python-fastapi` — FastAPI + SQLAlchemy + Alembic + pytest

**What gets created:**
- `.claude/` — commands, agents, rules, settings.local.json
- `.codex/` — config.toml, agents, skills, docs
- `CLAUDE.md` + `AGENTS.md` — root instructions
- `.memory/ia-config/` — mirror for Obsidian sync
- `.memory/claude-memory/` — vault structure (via vault-init)
- `tools/`, `docs/` — auxiliary directories

---

## Reference Files

- `note-templates.md` — Full templates for each note type
- `obsidian-syntax.md` — Obsidian-flavored markdown reference
- `vault-save.mjs` — Node.js script for saving notes to vault
- `vault-recall.mjs` — Node.js script for searching and recalling notes
- `vault-index.mjs` — Node.js script for rebuilding MOC indexes
- `project-init.mjs` — Node.js script for scaffolding new projects
- `templates/` — Template files for project scaffolding
