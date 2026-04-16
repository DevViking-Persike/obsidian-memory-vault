#!/usr/bin/env node

/**
 * vault-init.mjs — Initialize an Obsidian memory vault for the Claude Code memory skill
 *
 * Usage:
 *   node vault-init.mjs --vault-path .memory --project-name sga-cancelamento
 *   node vault-init.mjs --vault-path .memory --project-name my-project --language en --auto-save true
 *
 * Parameters:
 *   --vault-path    (required) Path to .memory/ directory
 *   --project-name  (required) Project name used as vault folder name
 *   --language      (optional, default: pt-BR)
 *   --auto-save     (optional, default: false)
 *
 * Creates:
 *   .memory/
 *     <project-name>/              <- Obsidian vault root
 *       .obsidian/
 *         app.json
 *         appearance.json
 *         core-plugins.json
 *         community-plugins.json
 *         graph.json
 *         plugins/
 *           3d-graph/
 *             manifest.json
 *             data.json
 *             main.js              <- downloaded from GitHub
 *             styles.css           <- downloaded from GitHub
 *         snippets/
 *           glassmorphism.css
 *       contexts/
 *       decisions/
 *       entities/
 *       learnings/
 *       conversations/
 *       snippets/
 *       _indexes/
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

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

if (!args["vault-path"]) {
  console.error("ERROR: --vault-path is required");
  console.error("Usage: node vault-init.mjs --vault-path .memory --project-name sga-cancelamento");
  process.exit(1);
}

if (!args["project-name"]) {
  console.error("ERROR: --project-name is required");
  console.error("Usage: node vault-init.mjs --vault-path .memory --project-name sga-cancelamento");
  process.exit(1);
}

const vaultBasePath = resolve(args["vault-path"]);
const projectName = args["project-name"];
const language = args.language || "pt-BR";
const autoSave = args["auto-save"] === "true";

// Vault root = <vault-path>/<project-name>/
const vaultRoot = join(vaultBasePath, projectName);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoNow() {
  return new Date().toISOString().replace("Z", "-03:00");
}

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, obj) {
  writeFileSync(filePath, JSON.stringify(obj, null, 2) + "\n", "utf-8");
}

function writeText(filePath, content) {
  writeFileSync(filePath, content, "utf-8");
}

async function downloadFile(url, destPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`WARNING: Failed to download ${url} (HTTP ${response.status}). You can install the plugin manually later.`);
      return false;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    console.warn(`WARNING: Failed to download ${url}: ${err.message}. You can install the plugin manually later.`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Content folders (directly in vault root, no intermediary)
// ---------------------------------------------------------------------------

const contentFolders = [
  "contexts",
  "decisions",
  "entities",
  "learnings",
  "conversations",
  "snippets",
  "_indexes",
];

// ---------------------------------------------------------------------------
// Obsidian config files
// ---------------------------------------------------------------------------

const appJson = {
  livePreview: true,
  showFrontmatter: true,
  defaultViewMode: "preview",
};

const appearanceJson = {
  theme: "obsidian",
  cssTheme: "",
  enabledCssSnippets: ["glassmorphism"],
};

const corePluginsJson = [
  "file-explorer",
  "global-search",
  "graph",
  "tag-pane",
  "outgoing-link",
  "backlink",
  "page-preview",
  "note-composer",
  "command-palette",
  "editor-status",
  "starred",
  "outline",
];

const communityPluginsJson = ["new-3d-graph"];

const graphJson = {
  "collapse-filter": false,
  "search": "",
  "showTags": true,
  "showAttachments": false,
  "hideUnresolved": false,
  "showOrphans": true,
  "collapse-color-groups": false,
  "colorGroups": [
    { "query": "path:contexts", "color": { "a": 1, "rgb": 5025616 } },
    { "query": "path:decisions", "color": { "a": 1, "rgb": 2849791 } },
    { "query": "path:entities", "color": { "a": 1, "rgb": 10159007 } },
    { "query": "path:learnings", "color": { "a": 1, "rgb": 16742400 } },
    { "query": "path:_indexes", "color": { "a": 1, "rgb": 8421504 } },
    { "query": "path:conversations", "color": { "a": 1, "rgb": 16776960 } },
    { "query": "path:snippets", "color": { "a": 1, "rgb": 65407 } },
  ],
  "collapse-display": false,
  "showArrow": true,
  "textFadeMultiplier": -0.5,
  "nodeSizeMultiplier": 1.3,
  "lineSizeMultiplier": 0.8,
  "collapse-forces": false,
  "centerStrength": 0.4,
  "repelStrength": 12,
  "linkStrength": 1,
  "linkDistance": 200,
  "scale": 0.5,
  "close": false,
};

// ---------------------------------------------------------------------------
// 3D Graph plugin config
// ---------------------------------------------------------------------------

const graph3dManifest = {
  id: "new-3d-graph",
  name: "New 3D Graph",
  version: "2.4.1",
  minAppVersion: "1.5.0",
  description: "Visualize your vault in 3D with a powerful, highly customizable, and filterable graph.",
  author: "Aryan Gupta",
  authorUrl: "https://aryan-gupta.is-a.dev",
  isDesktopOnly: true,
};

const graph3dData = {
  searchQuery: "",
  showNeighboringNodes: true,
  filters: [],
  showAttachments: false,
  hideOrphans: false,
  showTags: false,
  groups: [
    { query: "path:contexts", color: "#4CC790" },
    { query: "path:decisions", color: "#2B87FF" },
    { query: "path:entities", color: "#9B59B6" },
    { query: "path:learnings", color: "#FF8C00" },
    { query: "path:_indexes", color: "#708090" },
    { query: "path:conversations", color: "#F1C40F" },
    { query: "path:snippets", color: "#00FF7F" },
  ],
  useThemeColors: false,
  colorNode: "#2080F0",
  colorTag: "#9A49E8",
  colorAttachment: "#75B63A",
  colorLink: "#334466",
  colorHighlight: "#FFB800",
  backgroundColor: "#080812",
  nodeSize: 2,
  tagNodeSize: 1,
  attachmentNodeSize: 1.2,
  linkThickness: 0.6,
  nodeShape: "Sphere",
  tagShape: "Tetrahedron",
  attachmentShape: "Cube",
  showNodeLabels: true,
  labelDistance: 120,
  labelFadeThreshold: 0.6,
  labelTextSize: 2.5,
  labelTextColorLight: "#000000",
  labelTextColorDark: "#E0E8FF",
  labelBackgroundColor: "#1A1A2E",
  labelBackgroundOpacity: 0.6,
  labelOcclusion: false,
  useKeyboardControls: true,
  keyboardMoveSpeed: 2,
  zoomOnClick: true,
  rotateSpeed: 2,
  panSpeed: 2,
  zoomSpeed: 3,
  centerForce: 0.08,
  repelForce: 12,
  linkForce: 0.015,
};

// ---------------------------------------------------------------------------
// Glassmorphism CSS
// ---------------------------------------------------------------------------

const glassmorphismCss = `/* Glassmorphism Theme — Obsidian Memory Vault */

:root {
  --glass-bg: rgba(30, 30, 46, 0.6);
  --glass-bg-light: rgba(45, 45, 65, 0.5);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 16px;
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --glass-text: rgba(205, 214, 244, 0.95);
  --glass-text-muted: rgba(166, 173, 200, 0.7);
  --glass-accent: rgba(137, 180, 250, 0.9);
  --glass-accent-glow: rgba(137, 180, 250, 0.15);
  --glass-green: rgba(166, 227, 161, 0.9);
  --glass-blue: rgba(137, 180, 250, 0.9);
  --glass-purple: rgba(203, 166, 247, 0.9);
  --glass-orange: rgba(250, 179, 135, 0.9);
  --glass-red: rgba(243, 139, 168, 0.9);
  --glass-yellow: rgba(249, 226, 175, 0.9);
  --glass-radius: 12px;
}

body {
  background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 40%, #16213e 70%, #0d0d1a 100%) !important;
}

.app-container { background: transparent !important; }

.workspace-leaf, .workspace-leaf-content, .view-content {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(var(--glass-blur)) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur)) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--glass-radius) !important;
}

.workspace-split.mod-left-split, .workspace-split.mod-right-split {
  background: rgba(20, 20, 35, 0.5) !important;
  backdrop-filter: blur(20px) !important;
}

.titlebar, .workspace-tab-header-container {
  background: rgba(20, 20, 35, 0.7) !important;
  backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid var(--glass-border) !important;
}

.workspace-tab-header {
  background: rgba(40, 40, 60, 0.4) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 8px 8px 0 0 !important;
  transition: all 0.3s ease !important;
}

.workspace-tab-header.is-active {
  background: rgba(60, 60, 90, 0.6) !important;
  border-bottom-color: var(--glass-accent) !important;
  box-shadow: 0 2px 10px var(--glass-accent-glow) !important;
}

.markdown-preview-view, .markdown-source-view, .cm-s-obsidian {
  color: var(--glass-text) !important;
}

.markdown-preview-view h1, .cm-header-1 {
  color: var(--glass-blue) !important;
  text-shadow: 0 0 20px rgba(137, 180, 250, 0.2) !important;
}

.markdown-preview-view h2, .cm-header-2 {
  color: var(--glass-purple) !important;
  text-shadow: 0 0 15px rgba(203, 166, 247, 0.15) !important;
}

.markdown-preview-view h3, .cm-header-3 {
  color: var(--glass-green) !important;
}

.internal-link, .cm-hmd-internal-link {
  color: var(--glass-accent) !important;
  text-decoration: none !important;
  transition: all 0.2s ease !important;
}

.internal-link:hover {
  color: white !important;
  text-shadow: 0 0 12px var(--glass-accent) !important;
}

.tag {
  background: rgba(137, 180, 250, 0.12) !important;
  border: 1px solid rgba(137, 180, 250, 0.2) !important;
  border-radius: 20px !important;
  padding: 2px 10px !important;
  color: var(--glass-accent) !important;
  backdrop-filter: blur(8px) !important;
  transition: all 0.2s ease !important;
}

.tag:hover {
  background: rgba(137, 180, 250, 0.25) !important;
  box-shadow: 0 0 12px var(--glass-accent-glow) !important;
}

.markdown-preview-view pre, .cm-s-obsidian .HyperMD-codeblock-bg {
  background: rgba(15, 15, 30, 0.6) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 8px !important;
  backdrop-filter: blur(10px) !important;
}

.markdown-preview-view code, .cm-s-obsidian .cm-inline-code {
  background: rgba(40, 40, 70, 0.5) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 4px !important;
  color: var(--glass-green) !important;
  padding: 1px 5px !important;
}

.markdown-preview-view table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  background: rgba(25, 25, 45, 0.4) !important;
  backdrop-filter: blur(8px) !important;
}

.markdown-preview-view th {
  background: rgba(50, 50, 80, 0.5) !important;
  color: var(--glass-accent) !important;
  border-bottom: 1px solid var(--glass-border) !important;
}

.markdown-preview-view td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important;
}

.frontmatter-container, .metadata-container {
  background: rgba(20, 20, 40, 0.5) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--glass-radius) !important;
  backdrop-filter: blur(12px) !important;
}

.callout {
  background: rgba(30, 30, 55, 0.5) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--glass-radius) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: var(--glass-shadow) !important;
}

::-webkit-scrollbar { width: 6px !important; }
::-webkit-scrollbar-track { background: transparent !important; }
::-webkit-scrollbar-thumb { background: rgba(137, 180, 250, 0.2) !important; border-radius: 3px !important; }
::-webkit-scrollbar-thumb:hover { background: rgba(137, 180, 250, 0.4) !important; }

.graph-view.color-fill-focused { opacity: 0.9 !important; }
.graph-view.color-line { opacity: 0.3 !important; }

.modal, .prompt {
  background: rgba(25, 25, 45, 0.85) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--glass-radius) !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5) !important;
}

button {
  background: rgba(50, 50, 80, 0.4) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 8px !important;
  color: var(--glass-text) !important;
  backdrop-filter: blur(8px) !important;
  transition: all 0.2s ease !important;
}

button:hover {
  background: rgba(70, 70, 110, 0.5) !important;
  box-shadow: 0 0 12px var(--glass-accent-glow) !important;
}

.nav-file-title:hover, .nav-folder-title:hover {
  background: rgba(137, 180, 250, 0.08) !important;
  border-radius: 6px !important;
}

.nav-file-title.is-active {
  background: rgba(137, 180, 250, 0.15) !important;
  border-radius: 6px !important;
}

.markdown-preview-view blockquote {
  border-left: 3px solid var(--glass-purple) !important;
  background: rgba(203, 166, 247, 0.05) !important;
  border-radius: 0 8px 8px 0 !important;
  padding: 8px 16px !important;
}

.markdown-preview-view hr {
  border: none !important;
  height: 1px !important;
  background: linear-gradient(90deg, transparent, var(--glass-border), rgba(137, 180, 250, 0.2), var(--glass-border), transparent) !important;
}

strong { color: var(--glass-yellow) !important; }
em { color: var(--glass-orange) !important; }

.markdown-preview-view ul > li::marker, .markdown-preview-view ol > li::marker {
  color: var(--glass-accent) !important;
}

.three-d-graph canvas, .graph-3d-view canvas, [class*="3d-graph"] canvas, .view-content canvas {
  pointer-events: all !important;
  touch-action: none !important;
  z-index: 10 !important;
}

.three-d-graph, .graph-3d-view, [class*="3d-graph"], .view-content:has(canvas) {
  overflow: hidden !important;
  pointer-events: all !important;
}
`;

// ---------------------------------------------------------------------------
// Welcome note
// ---------------------------------------------------------------------------

function buildWelcomeNote() {
  const now = isoNow();
  return `---
type: context
title: "Vault de Memoria — Guia de Uso"
created: ${now}
updated: ${now}
tags:
  - claude-memory
  - meta
  - status/active
aliases:
  - "Como funciona a memoria do Claude"
confidence: high
source: manual
---

# Vault de Memoria — Guia de Uso

Este vault e a **memoria externa do Claude Code**. Cada conversa significativa
produz notas atomicas e interconectadas que o Claude pode consultar em sessoes futuras.

## Estrutura de Pastas

| Pasta | Conteudo |
|-------|----------|
| \`decisions/\` | Decisoes de arquitetura, design, tecnologia |
| \`learnings/\` | Bugs resolvidos, gotchas, descobertas |
| \`contexts/\` | Estado atual de projetos e ambientes |
| \`conversations/\` | Resumos de sessoes com o Claude |
| \`entities/\` | Ferramentas, libs, servicos, pessoas |
| \`snippets/\` | Codigo reutilizavel, queries, comandos |
| \`_indexes/\` | MOCs (Maps of Content) auto-gerados |

## Visualizacao

- **Graph View 2D**: Ctrl+G — grafo colorido por categoria
- **Graph View 3D**: Ctrl+P > "3D Graph: Open 3D Graph" — grafo 3D interativo
- **Tema Glassmorphism**: visual vitrificado com transparencias

## Comandos para o Claude Code

- \`"salvar no vault"\` — persiste a conversa atual
- \`"o que decidimos sobre X?"\` — busca decisoes
- \`"lembrar isso"\` — salva um item especifico
- \`"stats do vault"\` — mostra estatisticas
- \`"reindexar vault"\` — reconstroi os MOCs

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
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const createdPaths = [];

  // 1. Ensure vault-path base directory exists
  ensureDir(vaultBasePath);

  // 2. Create vault root: <vault-path>/<project-name>/
  ensureDir(vaultRoot);

  // 3. Create content folders directly in vault root
  for (const folder of contentFolders) {
    const folderPath = join(vaultRoot, folder);
    ensureDir(folderPath);
    createdPaths.push(folderPath);
  }

  // 4. Create .obsidian config directory structure
  const obsidianDir = join(vaultRoot, ".obsidian");
  const pluginsDir = join(obsidianDir, "plugins");
  const graph3dDir = join(pluginsDir, "3d-graph");
  const snippetsDir = join(obsidianDir, "snippets");

  ensureDir(obsidianDir);
  ensureDir(pluginsDir);
  ensureDir(graph3dDir);
  ensureDir(snippetsDir);

  // 5. Write Obsidian config files
  writeJson(join(obsidianDir, "app.json"), appJson);
  writeJson(join(obsidianDir, "appearance.json"), appearanceJson);
  writeJson(join(obsidianDir, "core-plugins.json"), corePluginsJson);
  writeJson(join(obsidianDir, "community-plugins.json"), communityPluginsJson);
  writeJson(join(obsidianDir, "graph.json"), graphJson);

  // 6. Write 3D graph plugin files
  writeJson(join(graph3dDir, "manifest.json"), graph3dManifest);
  writeJson(join(graph3dDir, "data.json"), graph3dData);

  // 7. Download 3D graph plugin main.js and styles.css from GitHub
  const graph3dBaseUrl = "https://github.com/Apoo711/obsidian-3d-graph/releases/download/2.4.1";
  const mainJsDownloaded = await downloadFile(
    `${graph3dBaseUrl}/main.js`,
    join(graph3dDir, "main.js"),
  );
  const stylesCssDownloaded = await downloadFile(
    `${graph3dBaseUrl}/styles.css`,
    join(graph3dDir, "styles.css"),
  );

  // 8. Write glassmorphism CSS snippet
  writeText(join(snippetsDir, "glassmorphism.css"), glassmorphismCss);

  // 9. Write welcome note
  const welcomeNotePath = join(vaultRoot, "contexts", "vault-guia-de-uso.md");
  writeText(welcomeNotePath, buildWelcomeNote());

  // 10. Write .vault-config.json to CWD and HOME
  const vaultConfig = {
    vault_path: `./.memory/${projectName}`,
    project_name: projectName,
    auto_save: autoSave,
    language,
  };

  const cwdConfigPath = join(process.cwd(), ".vault-config.json");
  writeJson(cwdConfigPath, vaultConfig);

  const homeConfigPath = join(process.env.HOME || "~", ".vault-config.json");
  writeJson(homeConfigPath, vaultConfig);

  // 11. Output JSON summary
  const output = {
    action: "initialized",
    vault_root: vaultRoot,
    project_name: projectName,
    config_paths: [cwdConfigPath, homeConfigPath],
    folders_created: contentFolders,
    obsidian_config: obsidianDir,
    plugins: {
      "3d-graph": {
        manifest: join(graph3dDir, "manifest.json"),
        data: join(graph3dDir, "data.json"),
        main_js: mainJsDownloaded ? join(graph3dDir, "main.js") : "DOWNLOAD_FAILED",
        styles_css: stylesCssDownloaded ? join(graph3dDir, "styles.css") : "DOWNLOAD_FAILED",
      },
    },
    snippets: {
      glassmorphism: join(snippetsDir, "glassmorphism.css"),
    },
    welcome_note: welcomeNotePath,
    language,
    auto_save: autoSave,
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});
