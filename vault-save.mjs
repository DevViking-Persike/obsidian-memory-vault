#!/usr/bin/env node

/**
 * vault-save.mjs — Save a note to the Obsidian memory vault
 *
 * Usage:
 *   node vault-save.mjs --config .vault-config.json --type decision \
 *     --title "My Decision" --tags "project/foo,topic/bar" \
 *     --links "entities/some-tool,contexts/my-project" \
 *     --content "Markdown content here"
 *
 *   OR pipe content:
 *   echo "# Content" | node vault-save.mjs --config ... --type ... --title ...
 *
 *   OR use a file:
 *   node vault-save.mjs --config ... --content-file /tmp/note.md ...
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "fs";
import { join, resolve } from "path";

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

// --- Load config ---

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
        return JSON.parse(readFileSync(resolved, "utf-8"));
      }
    } catch { /* continue */ }
  }

  console.error("ERROR: No .vault-config.json found. Create one with vault_path set.");
  process.exit(1);
}

const config = loadConfig(args.config);
const VAULT = resolve(config.vault_path);

// --- Validate ---

const VALID_TYPES = ["decision", "learning", "context", "conversation", "entity", "snippet", "index"];
const type = args.type;

if (!type || !VALID_TYPES.includes(type)) {
  console.error(`ERROR: --type must be one of: ${VALID_TYPES.join(", ")}`);
  process.exit(1);
}

if (!args.title) {
  console.error("ERROR: --title is required");
  process.exit(1);
}

// --- Helpers ---

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function isoNow() {
  return new Date().toISOString().replace("Z", "-03:00"); // adjust TZ as needed
}

function getSubfolder(type) {
  const map = {
    decision: "decisions",
    learning: "learnings",
    context: "contexts",
    conversation: "conversations",
    entity: "entities",
    snippet: "snippets",
    index: "_indexes",
  };
  return map[type] || type;
}

function needsDatePrefix(type) {
  return ["decision", "learning", "conversation"].includes(type);
}

function datePrefix() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timePrefix() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}${pad(d.getMinutes())}`;
}

// --- Build note ---

const slug = slugify(args.title);
const subfolder = getSubfolder(type);
const dir = join(VAULT, subfolder);

let filename;
if (type === "conversation") {
  filename = `${datePrefix()}-${timePrefix()}-${slug}.md`;
} else if (needsDatePrefix(type)) {
  filename = `${datePrefix()}-${slug}.md`;
} else {
  filename = `${slug}.md`;
}

const filepath = join(dir, filename);

// Parse tags and links
const tags = ["claude-memory", ...(args.tags ? args.tags.split(",").map((t) => t.trim()) : [])];
const links = args.links ? args.links.split(",").map((l) => l.trim()) : [];

// Get content
let content = "";
if (args["content-file"]) {
  content = readFileSync(resolve(args["content-file"]), "utf-8");
} else if (args.content) {
  content = args.content;
} else {
  // Try reading from stdin (non-TTY)
  try {
    if (!process.stdin.isTTY) {
      content = readFileSync("/dev/stdin", "utf-8");
    }
  } catch { /* empty content */ }
}

// Build frontmatter
const now = isoNow();
const frontmatter = [
  "---",
  `type: ${type}`,
  `title: "${args.title.replace(/"/g, '\\"')}"`,
  `created: ${now}`,
  `updated: ${now}`,
  "tags:",
  ...tags.map((t) => `  - ${t}`),
  "aliases: []",
  `confidence: ${args.confidence || "high"}`,
  `source: ${args.source || "conversation"}`,
  "---",
].join("\n");

// Build wikilinks section if links provided
let linksSection = "";
if (links.length > 0) {
  linksSection = "\n\n## Related\n\n" + links.map((l) => `- [[${l}]]`).join("\n");
}

const fullNote = `${frontmatter}\n\n${content}${linksSection}\n`;

// --- Write ---

mkdirSync(dir, { recursive: true });

// For evergreen notes (context, entity), check if file exists and handle update
if (!needsDatePrefix(type) && type !== "conversation") {
  const existingPath = join(dir, filename);
  if (existsSync(existingPath)) {
    // Update: read existing, update the `updated` field, append new content
    let existing = readFileSync(existingPath, "utf-8");
    existing = existing.replace(/^updated: .+$/m, `updated: ${now}`);
    // Append under a "## Updates" heading
    const updateBlock = `\n\n## Update — ${datePrefix()}\n\n${content}${linksSection}\n`;
    writeFileSync(existingPath, existing + updateBlock, "utf-8");
    console.log(JSON.stringify({
      action: "updated",
      type,
      path: existingPath,
      title: args.title,
      relative: existingPath.replace(VAULT + "/", ""),
    }));
    process.exit(0);
  }
}

writeFileSync(filepath, fullNote, "utf-8");

console.log(JSON.stringify({
  action: "created",
  type,
  path: filepath,
  title: args.title,
  filename,
  relative: filepath.replace(VAULT + "/", ""),
  wikilink: `[[${subfolder}/${slug}|${args.title}]]`,
}));
