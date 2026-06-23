#!/usr/bin/env node

/**
 * project-init.mjs — Scaffold a new project with full Claude Code + Codex structure
 *
 * Usage:
 *   node project-init.mjs --path /path/to/project --name "My Project" --stack go-blazor
 *   node project-init.mjs --path ./new-project --name "API" --stack nextjs --figma-key ABC123
 *   node project-init.mjs --path ./ml --name "Pipeline" --stack python-fastapi --language en
 *   node project-init.mjs --list-stacks
 *
 * Options:
 *   --path          Target project directory (required)
 *   --name          Project name (required)
 *   --stack         Tech stack preset (required, use --list-stacks to see options)
 *   --figma-key     Figma file key for design sync (optional)
 *   --language      Language for docs: pt-BR (default) or en
 *   --with-vault    Also initialize Obsidian memory vault (default: true)
 *   --vault-path    Custom vault path (default: ./.memory)
 *   --dry-run       Show what would be created without writing files
 *   --list-stacks   List available stack presets
 *
 * Creates:
 *   .claude/commands/     — Slash commands for Claude Code
 *   .claude/agents/       — Sub-agent definitions
 *   .claude/rules/        — Auto-applied rules by glob
 *   .claude/settings.local.json — Hooks, permissions, MCP
 *   .codex/config.toml    — Codex main config
 *   .codex/agents/        — Codex agent definitions (.toml)
 *   .codex/skills/        — Codex skills with checklists
 *   .codex/docs/          — Architecture, conventions, commands
 *   CLAUDE.md             — Root instructions for Claude Code
 *   AGENTS.md             — Root instructions for Codex
 *   .memory/ia-config/    — Mirror of all configs for Obsidian sync
 *   tools/                — Generators, diagnostics, scripts
 *   docs/                 — Architecture, ADRs, runbooks
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync } from "fs";
import { join, resolve, dirname, basename } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Arg parsing ─────────────────────────────────────────────────────────────

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
      parsed[key] = val;
    }
  }
  return parsed;
}

const args = parseArgs(process.argv.slice(2));

// ─── List stacks ─────────────────────────────────────────────────────────────

const STACKS_DIR = join(__dirname, "templates", "stacks");

if (args["list-stacks"]) {
  const stacks = readdirSync(STACKS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const data = JSON.parse(readFileSync(join(STACKS_DIR, f), "utf-8"));
      return { id: f.replace(".json", ""), name: data.display_name, description: data.description };
    });
  console.log("\nAvailable stacks:\n");
  for (const s of stacks) {
    console.log(`  ${s.id.padEnd(20)} ${s.name} — ${s.description}`);
  }
  console.log("\nUsage: node project-init.mjs --path ./my-project --name \"Project\" --stack <stack-id>\n");
  process.exit(0);
}

// ─── Validate args ───────────────────────────────────────────────────────────

if (!args.path) {
  console.error("ERROR: --path is required (target project directory)");
  console.error("Usage: node project-init.mjs --path ./project --name \"Name\" --stack go-blazor");
  console.error("       node project-init.mjs --list-stacks");
  process.exit(1);
}

if (!args.name) {
  console.error("ERROR: --name is required (project name)");
  process.exit(1);
}

if (!args.stack) {
  console.error("ERROR: --stack is required. Use --list-stacks to see available presets.");
  process.exit(1);
}

const PROJECT_PATH = resolve(args.path);
const PROJECT_NAME = args.name;
const STACK_ID = args.stack;
const FIGMA_KEY = args["figma-key"] || "";
const LANGUAGE = args.language || "pt-BR";
const WITH_VAULT = args["with-vault"] !== "false";
const VAULT_PATH = args["vault-path"] || "./.memory";
const DRY_RUN = args["dry-run"] === true;
const SKILL_DIR = __dirname;

// ─── Load stack preset ───────────────────────────────────────────────────────

const stackFile = join(STACKS_DIR, `${STACK_ID}.json`);
if (!existsSync(stackFile)) {
  console.error(`ERROR: Stack "${STACK_ID}" not found at ${stackFile}`);
  console.error("Use --list-stacks to see available presets.");
  process.exit(1);
}

const stack = JSON.parse(readFileSync(stackFile, "utf-8"));

// ─── Template engine ─────────────────────────────────────────────────────────

const vars = {
  PROJECT_NAME,
  PROJECT_PATH,
  PROJECT_SLUG: slugify(PROJECT_NAME),
  STACK_ID,
  STACK_DISPLAY: stack.display_name,
  FIGMA_KEY,
  LANGUAGE,
  VAULT_PATH,
  // Stack-specific vars
  ...stack.variables,
};

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function interpolate(text, variables) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

function renderTemplate(templatePath, variables) {
  const raw = readFileSync(templatePath, "utf-8");
  return interpolate(raw, variables);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const created = [];

function ensureDir(dir) {
  if (!DRY_RUN) {
    mkdirSync(dir, { recursive: true });
  }
}

function writeFile(filePath, content) {
  const rel = filePath.replace(PROJECT_PATH + "/", "");
  created.push(rel);
  if (DRY_RUN) {
    return;
  }
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, "utf-8");
}

function renderAndWrite(templateRelPath, outputRelPath, extraVars = {}) {
  const templatePath = join(__dirname, "templates", templateRelPath);
  if (!existsSync(templatePath)) {
    console.error(`  WARN: Template not found: ${templateRelPath}`);
    return;
  }
  const content = renderTemplate(templatePath, { ...vars, ...extraVars });
  writeFile(join(PROJECT_PATH, outputRelPath), content);
}

// ─── Main scaffold ──────────────────────────────────────────────────────────

console.log(`\n🔧 Initializing project: ${PROJECT_NAME}`);
console.log(`   Path:  ${PROJECT_PATH}`);
console.log(`   Stack: ${stack.display_name}`);
console.log(`   Lang:  ${LANGUAGE}`);
if (FIGMA_KEY) console.log(`   Figma: ${FIGMA_KEY}`);
if (DRY_RUN) console.log(`   Mode:  DRY RUN (no files will be written)\n`);
console.log("");

// Ensure project dir exists
ensureDir(PROJECT_PATH);

// ─── 1. CLAUDE.md (root) ────────────────────────────────────────────────────

renderAndWrite("base/CLAUDE.md", "CLAUDE.md");

// ─── 2. AGENTS.md (root) ────────────────────────────────────────────────────

renderAndWrite("base/AGENTS.md", "AGENTS.md");

// ─── 3. .claude/commands/ ────────────────────────────────────────────────────

const baseCommands = ["review.md", "quality.md", "test.md", "security-audit.md", "perf-check.md", "sync-config.md", "cascade-edit.md"];
for (const cmd of baseCommands) {
  renderAndWrite(`base/claude/commands/${cmd}`, `.claude/commands/${cmd}`);
}

// Stack-specific commands
if (stack.extra_commands) {
  for (const cmd of stack.extra_commands) {
    renderAndWrite(`stacks/${STACK_ID}/commands/${cmd}`, `.claude/commands/${cmd}`);
  }
}

// Figma command (only if figma key provided and not already added by stack)
const hasStackFigma = stack.extra_commands && stack.extra_commands.includes("figma-sync.md");
if (FIGMA_KEY && !hasStackFigma) {
  renderAndWrite("base/claude/commands/figma-sync.md", ".claude/commands/figma-sync.md");
}

// ─── 4. .claude/agents/ ─────────────────────────────────────────────────────

renderAndWrite("base/claude/agents/reviewer.md", ".claude/agents/reviewer.md");
renderAndWrite("base/claude/agents/architect.md", ".claude/agents/architect.md");

// Stack-specific agents
if (stack.agents) {
  for (const agent of stack.agents) {
    renderAndWrite(`stacks/${STACK_ID}/agents/${agent}`, `.claude/agents/${agent}`);
  }
}

// ─── 5. .claude/rules/ ──────────────────────────────────────────────────────

renderAndWrite("base/claude/rules/architecture.md", ".claude/rules/architecture.md");
renderAndWrite("base/claude/rules/coding-style.md", ".claude/rules/coding-style.md");
renderAndWrite("base/claude/rules/testing.md", ".claude/rules/testing.md");
renderAndWrite("base/claude/rules/security.md", ".claude/rules/security.md");

// Stack-specific rules
if (stack.extra_rules) {
  for (const rule of stack.extra_rules) {
    renderAndWrite(`stacks/${STACK_ID}/rules/${rule}`, `.claude/rules/${rule}`);
  }
}

// ─── 6. .claude/settings.local.json ─────────────────────────────────────────

renderAndWrite("base/claude/settings.local.json", ".claude/settings.local.json");

// ─── 7. .codex/ ─────────────────────────────────────────────────────────────

renderAndWrite("base/codex/config.toml", ".codex/config.toml");

// Codex agents
const baseCodexAgents = ["reviewer.toml", "explorer.toml", "architect.toml", "docs-researcher.toml"];
for (const agent of baseCodexAgents) {
  renderAndWrite(`base/codex/agents/${agent}`, `.codex/agents/${agent}`);
}

// Codex skills
const baseSkills = [
  "bugfix/SKILL.md",
  "bugfix/flow.md",
];
for (const skill of baseSkills) {
  renderAndWrite(`base/codex/skills/${skill}`, `.codex/skills/${skill}`);
}

// Stack-specific skills
if (stack.codex_skills) {
  for (const skill of stack.codex_skills) {
    renderAndWrite(`stacks/${STACK_ID}/codex/skills/${skill}`, `.codex/skills/${skill}`);
  }
}

// Codex docs
renderAndWrite("base/codex/docs/architecture.md", ".codex/docs/architecture.md");
renderAndWrite("base/codex/docs/conventions.md", ".codex/docs/conventions.md");
renderAndWrite("base/codex/docs/commands.md", ".codex/docs/commands.md");

// ─── 8. Auxiliary directories ────────────────────────────────────────────────

const auxDirs = [
  "tools/generators",
  "tools/diagnostics",
  "tools/scripts",
  "docs/architecture",
  "docs/adr",
  "docs/runbooks",
];
for (const dir of auxDirs) {
  ensureDir(join(PROJECT_PATH, dir));
  // Create .gitkeep so empty dirs are tracked
  writeFile(join(PROJECT_PATH, dir, ".gitkeep"), "");
}

// ─── 9. .memory/ia-config mirror ────────────────────────────────────────────

if (WITH_VAULT) {
  console.log("📦 Creating ia-config mirror in .memory/ ...");

  // Mirror .claude/ to ia-config
  const iaConfig = join(PROJECT_PATH, ".memory", "ia-config");
  for (const file of created) {
    let mirrorPath = null;

    if (file === "CLAUDE.md") {
      mirrorPath = join(iaConfig, "CLAUDE.md");
    } else if (file === "AGENTS.md") {
      mirrorPath = join(iaConfig, "AGENTS.md");
    } else if (file.startsWith(".claude/")) {
      mirrorPath = join(iaConfig, file.replace(".claude/", ""));
    } else if (file.startsWith(".codex/")) {
      mirrorPath = join(iaConfig, "codex", file.replace(".codex/", ""));
    }

    if (mirrorPath && !DRY_RUN) {
      const srcPath = join(PROJECT_PATH, file);
      if (existsSync(srcPath)) {
        ensureDir(dirname(mirrorPath));
        const content = readFileSync(srcPath, "utf-8");
        writeFileSync(mirrorPath, content, "utf-8");
      }
    }
  }

  // Initialize vault structure
  console.log("🧠 Initializing memory vault ...");
  if (!DRY_RUN) {
    try {
      const vaultInitPath = join(SKILL_DIR, "vault-init.mjs");
      const resolvedVault = VAULT_PATH.startsWith(".")
        ? join(PROJECT_PATH, VAULT_PATH)
        : resolve(VAULT_PATH);
      execSync(
        `node "${vaultInitPath}" --vault-path "${resolvedVault}" --language "${LANGUAGE}"`,
        { cwd: PROJECT_PATH, stdio: "pipe" }
      );
    } catch (e) {
      console.error(`  WARN: vault-init failed: ${e.message}`);
    }
  }
}

// ─── 10. .gitignore additions ────────────────────────────────────────────────

const gitignoreEntries = ["/.memory", ".vault-config.json"];
const gitignorePath = join(PROJECT_PATH, ".gitignore");

if (!DRY_RUN) {
  let existing = "";
  if (existsSync(gitignorePath)) {
    existing = readFileSync(gitignorePath, "utf-8");
  }
  const toAdd = gitignoreEntries.filter((e) => !existing.includes(e));
  if (toAdd.length > 0) {
    const addition = "\n# Memory Vault\n" + toAdd.join("\n") + "\n";
    writeFileSync(gitignorePath, existing + addition, "utf-8");
    created.push(".gitignore (updated)");
  }
}

// ─── Output ──────────────────────────────────────────────────────────────────

console.log(`\n✅ Project scaffolded: ${created.length} files created\n`);
console.log("Files created:");
for (const f of created.sort()) {
  console.log(`  ${f}`);
}

console.log(`
Next steps:
  1. cd ${PROJECT_PATH}
  2. Review CLAUDE.md and AGENTS.md — customize for your project
  3. Review .claude/settings.local.json — adjust hooks and permissions
  4. ${FIGMA_KEY ? "Figma sync ready: use /figma-sync <page>" : "Add --figma-key <key> later for Figma integration"}
  5. Use /sync-config to keep Obsidian and Claude Code in sync
`);

if (DRY_RUN) {
  console.log("  ⚠️  DRY RUN — no files were actually written.\n");
}

// JSON output for programmatic use
const result = {
  action: "project_initialized",
  project_path: PROJECT_PATH,
  project_name: PROJECT_NAME,
  stack: STACK_ID,
  files_created: created.length,
  with_vault: WITH_VAULT,
  figma: FIGMA_KEY || null,
  language: LANGUAGE,
};

// Write a manifest for the project
if (!DRY_RUN) {
  writeFileSync(
    join(PROJECT_PATH, ".project-init.json"),
    JSON.stringify(result, null, 2),
    "utf-8"
  );
}
