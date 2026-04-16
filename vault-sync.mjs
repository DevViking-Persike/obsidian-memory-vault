#!/usr/bin/env node

/**
 * vault-sync.mjs — Sincroniza documentos do projeto com o vault Obsidian
 *
 * Uso:
 *   node vault-sync.mjs --config .vault-config.json                    # sync docs → vault
 *   node vault-sync.mjs --config .vault-config.json --direction export # vault → docs (limpa frontmatter)
 *   node vault-sync.mjs --config .vault-config.json --dry-run          # mostra o que faria
 *   node vault-sync.mjs --config .vault-config.json --force            # sobrescreve notas existentes
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from "fs";
import { join, resolve, relative, basename, extname, dirname } from "path";

// --- Arg parsing ---

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

// --- Carregar config ---

function loadConfig(configPath) {
  const paths = [
    configPath,
    join(process.cwd(), ".vault-config.json"),
    join(process.env.HOME || "~", ".vault-config.json"),
  ].filter(Boolean);

  for (const p of paths) {
    try {
      const resolved = resolve(p);
      if (existsSync(resolved)) {
        return { config: JSON.parse(readFileSync(resolved, "utf-8")), configPath: resolved };
      }
    } catch { /* continue */ }
  }

  console.error("ERRO: .vault-config.json nao encontrado.");
  process.exit(1);
}

const { config, configPath } = loadConfig(args.config);
const VAULT = resolve(config.vault_path);
const PROJECT = config.project_name || "projeto";
const DIRECTION = args.direction || "import"; // import = docs→vault, export = vault→docs
const DRY_RUN = args["dry-run"] === true;
const FORCE = args.force === true;

if (!config.sync || !config.sync.sources || config.sync.sources.length === 0) {
  console.error("ERRO: Nenhuma fonte de sync configurada em .vault-config.json");
  console.error('Adicione: "sync": { "sources": [{ "path": "docs/adrs", "type": "decision", "tags": ["topic/adr"] }] }');
  process.exit(1);
}

// --- Helpers ---

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function isoNow() {
  return new Date().toISOString().replace("Z", "-03:00");
}

function getSubfolder(type) {
  const map = {
    decision: "decisions",
    learning: "learnings",
    context: "contexts",
    conversation: "conversations",
    entity: "entities",
    snippet: "snippets",
  };
  return map[type] || "contexts";
}

function listMdFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listMdFiles(full));
    } else if (entry.isFile() && extname(entry.name) === ".md") {
      results.push(full);
    }
  }
  return results;
}

function hasFrontmatter(content) {
  return content.startsWith("---\n");
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n*/);
  if (!match) return { frontmatter: null, body: content };
  return { frontmatter: match[1], body: content.slice(match[0].length) };
}

function extractTitle(content, filename) {
  // Tenta extrair do frontmatter
  const fmMatch = content.match(/^title:\s*"?([^"\n]+)"?/m);
  if (fmMatch) return fmMatch[1].trim();

  // Tenta extrair do primeiro # heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  // Fallback: nome do arquivo
  return basename(filename, ".md").replace(/[-_]/g, " ");
}

function buildFrontmatter(opts) {
  const now = isoNow();
  const tags = ["claude-memory", `project/${PROJECT}`, ...(opts.tags || []), "status/active"];
  return [
    "---",
    `type: ${opts.type}`,
    `title: "${opts.title.replace(/"/g, '\\"')}"`,
    `created: ${now}`,
    `updated: ${now}`,
    "tags:",
    ...tags.map((t) => `  - ${t}`),
    `aliases: []`,
    `confidence: high`,
    `source: sync`,
    `sync_source: "${opts.syncSource}"`,
    "---",
  ].join("\n");
}

function stripFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
}

function convertWikilinksToMarkdown(content) {
  // [[slug|texto]] → texto
  // [[slug]] → slug
  return content
    .replace(/\[\[([^\]|]+?)\|([^\]]+?)\]\]/g, "$2")
    .replace(/\[\[([^\]]+?)\]\]/g, "$1");
}

// --- Mapa de sync (rastreia origem de cada nota) ---

const SYNC_MAP_PATH = join(VAULT, ".sync-map.json");

function loadSyncMap() {
  try {
    if (existsSync(SYNC_MAP_PATH)) {
      return JSON.parse(readFileSync(SYNC_MAP_PATH, "utf-8"));
    }
  } catch { /* ignore */ }
  return {};
}

function saveSyncMap(map) {
  writeFileSync(SYNC_MAP_PATH, JSON.stringify(map, null, 2), "utf-8");
}

// --- IMPORT: docs → vault ---

function syncImport() {
  const syncMap = loadSyncMap();
  const results = { created: [], updated: [], skipped: [] };

  for (const source of config.sync.sources) {
    const sourceDir = resolve(source.path);
    const files = listMdFiles(sourceDir);
    const subfolder = getSubfolder(source.type);
    const targetDir = join(VAULT, subfolder);

    mkdirSync(targetDir, { recursive: true });

    for (const filePath of files) {
      const content = readFileSync(filePath, "utf-8");
      const relPath = relative(process.cwd(), filePath);
      const title = extractTitle(content, filePath);
      const slug = slugify(title);
      const filename = `${slug}.md`;
      const targetPath = join(targetDir, filename);

      // Verificar se ja existe
      if (existsSync(targetPath) && !FORCE) {
        // Verificar se o source mudou desde o ultimo sync
        const sourceModified = statSync(filePath).mtimeMs;
        const lastSync = syncMap[relPath]?.lastSync || 0;

        if (sourceModified <= lastSync) {
          results.skipped.push({ source: relPath, reason: "sem alteracoes" });
          continue;
        }
      }

      // Extrair corpo (remover frontmatter se existir no source)
      const body = stripFrontmatter(content);

      // Construir nota do vault
      const frontmatter = buildFrontmatter({
        type: source.type,
        title,
        tags: source.tags || [],
        syncSource: relPath,
      });

      const vaultNote = `${frontmatter}\n\n${body}\n\n## Origem\n\nSincronizado de \`${relPath}\`\n`;

      if (DRY_RUN) {
        const action = existsSync(targetPath) ? "atualizar" : "criar";
        console.log(`[DRY-RUN] ${action}: ${relPath} → ${relative(VAULT, targetPath)}`);
        results[existsSync(targetPath) ? "updated" : "created"].push({
          source: relPath,
          target: relative(VAULT, targetPath),
        });
        continue;
      }

      writeFileSync(targetPath, vaultNote, "utf-8");

      // Atualizar mapa de sync
      syncMap[relPath] = {
        vaultPath: relative(VAULT, targetPath),
        lastSync: Date.now(),
        type: source.type,
        slug,
      };

      const action = existsSync(targetPath) ? "updated" : "created";
      results[action === "updated" ? "updated" : "created"].push({
        source: relPath,
        target: relative(VAULT, targetPath),
      });
    }
  }

  if (!DRY_RUN) {
    saveSyncMap(syncMap);
  }

  return results;
}

// --- EXPORT: vault → docs ---

function syncExport() {
  const syncMap = loadSyncMap();
  const results = { exported: [], skipped: [] };

  for (const [sourcePath, entry] of Object.entries(syncMap)) {
    const vaultNotePath = join(VAULT, entry.vaultPath);

    if (!existsSync(vaultNotePath)) {
      results.skipped.push({ source: sourcePath, reason: "nota do vault nao encontrada" });
      continue;
    }

    const vaultContent = readFileSync(vaultNotePath, "utf-8");
    const vaultModified = statSync(vaultNotePath).mtimeMs;

    // So exportar se o vault foi modificado depois do ultimo sync
    if (vaultModified <= entry.lastSync && !FORCE) {
      results.skipped.push({ source: sourcePath, reason: "vault nao modificado" });
      continue;
    }

    // Limpar: remover frontmatter, converter wikilinks, remover secao "Origem"
    let cleanContent = stripFrontmatter(vaultContent);
    cleanContent = convertWikilinksToMarkdown(cleanContent);
    cleanContent = cleanContent.replace(/\n## Origem\n\nSincronizado de `[^`]+`\n?$/, "").trim();

    const targetPath = resolve(sourcePath);

    if (DRY_RUN) {
      console.log(`[DRY-RUN] exportar: ${entry.vaultPath} → ${sourcePath}`);
      results.exported.push({ vault: entry.vaultPath, target: sourcePath });
      continue;
    }

    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, cleanContent + "\n", "utf-8");

    // Atualizar timestamp
    entry.lastSync = Date.now();
    results.exported.push({ vault: entry.vaultPath, target: sourcePath });
  }

  if (!DRY_RUN) {
    saveSyncMap(syncMap);
  }

  return results;
}

// --- STATUS: mostrar estado do sync ---

function syncStatus() {
  const syncMap = loadSyncMap();
  const status = { synced: [], outdated: [], missing: [] };

  for (const source of config.sync.sources) {
    const sourceDir = resolve(source.path);
    const files = listMdFiles(sourceDir);

    for (const filePath of files) {
      const relPath = relative(process.cwd(), filePath);
      const entry = syncMap[relPath];

      if (!entry) {
        status.missing.push(relPath);
        continue;
      }

      const sourceModified = statSync(filePath).mtimeMs;
      if (sourceModified > entry.lastSync) {
        status.outdated.push({ source: relPath, vault: entry.vaultPath });
      } else {
        status.synced.push({ source: relPath, vault: entry.vaultPath });
      }
    }
  }

  return status;
}

// --- Main ---

let result;

switch (DIRECTION) {
  case "import":
    result = syncImport();
    break;
  case "export":
    result = syncExport();
    break;
  case "status":
    result = syncStatus();
    break;
  default:
    console.error(`ERRO: --direction deve ser "import", "export" ou "status"`);
    process.exit(1);
}

console.log(JSON.stringify({
  action: DIRECTION,
  dry_run: DRY_RUN,
  vault: VAULT,
  ...result,
}, null, 2));
