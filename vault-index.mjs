#!/usr/bin/env node

/**
 * vault-index.mjs — Rebuild Map of Content (MOC) indexes for the vault
 *
 * Usage:
 *   node vault-index.mjs --config .vault-config.json                    # rebuild all
 *   node vault-index.mjs --config .vault-config.json --project zolo-lang # rebuild one project
 *   node vault-index.mjs --config .vault-config.json --topic error-handling
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, resolve, extname, basename, relative } from "path";

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

function loadConfig(configPath) {
  const paths = [
    configPath,
    join(process.cwd(), ".vault-config.json"),
    join(process.env.HOME || "~", ".vault-config.json"),
  ].filter(Boolean);
  for (const p of paths) {
    try {
      const resolved = resolve(p);
      if (existsSync(resolved)) return JSON.parse(readFileSync(resolved, "utf-8"));
    } catch { /* continue */ }
  }
  console.error("ERROR: No .vault-config.json found.");
  process.exit(1);
}

const config = loadConfig(args.config);
const VAULT = resolve(config.vault_path);
const INDEX_DIR = join(VAULT, "_indexes");

function walkDir(dir, ext = ".md") {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".obsidian") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(full, ext));
    else if (entry.isFile() && extname(entry.name) === ext) results.push(full);
  }
  return results;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  const lines = match[1].split("\n");
  let currentKey = null;
  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === "" || val === "[]") fm[currentKey] = [];
      else if (val.startsWith('"') && val.endsWith('"')) { fm[currentKey] = val.slice(1, -1); currentKey = null; }
      else { fm[currentKey] = val; currentKey = null; }
    } else if (line.match(/^\s+-\s+(.*)$/) && currentKey) {
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
      fm[currentKey].push(line.match(/^\s+-\s+(.*)$/)[1].trim().replace(/^"|"$/g, ""));
    }
  }
  return fm;
}

// Load all notes (excluding _indexes)
const allFiles = walkDir(VAULT).filter((f) => !f.includes("_indexes"));
const allNotes = allFiles.map((f) => {
  const content = readFileSync(f, "utf-8");
  const fm = parseFrontmatter(content);
  return {
    path: f,
    relative: relative(VAULT, f),
    filename: basename(f, ".md"),
    ...fm,
  };
});

// Collect all projects and topics
const projects = new Set();
const topics = new Set();

for (const n of allNotes) {
  for (const tag of n.tags || []) {
    if (tag.startsWith("project/")) projects.add(tag.replace("project/", ""));
    if (tag.startsWith("topic/")) topics.add(tag.replace("topic/", ""));
  }
}

function isoNow() {
  return new Date().toISOString().replace("Z", "-03:00");
}

function buildProjectMOC(project) {
  const notes = allNotes.filter((n) => (n.tags || []).includes(`project/${project}`));
  const byType = {};

  for (const n of notes) {
    const t = n.type || "other";
    if (!byType[t]) byType[t] = [];
    byType[t].push(n);
  }

  // Sort each group by date (newest first)
  for (const t of Object.keys(byType)) {
    byType[t].sort((a, b) => (b.created || "").localeCompare(a.created || ""));
  }

  const typeLabels = {
    decision: "Decisions",
    learning: "Learnings",
    context: "Context",
    conversation: "Conversations",
    entity: "Entities",
    snippet: "Snippets",
  };

  const typeOrder = ["decision", "context", "learning", "entity", "snippet", "conversation"];

  let body = "";
  for (const t of typeOrder) {
    if (!byType[t] || byType[t].length === 0) continue;
    body += `\n## ${typeLabels[t] || t}\n\n`;
    for (const n of byType[t]) {
      const display = n.title || n.filename;
      body += `- [[${n.filename}|${display}]]\n`;
    }
  }

  const now = isoNow();
  const frontmatter = [
    "---",
    "type: index",
    `title: "${project} — Map of Content"`,
    `created: ${now}`,
    `updated: ${now}`,
    "tags:",
    "  - claude-memory",
    "  - index",
    `  - project/${project}`,
    "---",
  ].join("\n");

  return `${frontmatter}\n\n# ${project} — Map of Content\n${body}`;
}

function buildTopicMOC(topic) {
  const notes = allNotes.filter((n) => (n.tags || []).includes(`topic/${topic}`));
  notes.sort((a, b) => (b.created || "").localeCompare(a.created || ""));

  let body = "\n";
  for (const n of notes) {
    const display = n.title || n.filename;
    const typeLabel = n.type ? `\`${n.type}\`` : "";
    body += `- ${typeLabel} [[${n.filename}|${display}]]\n`;
  }

  const now = isoNow();
  const frontmatter = [
    "---",
    "type: index",
    `title: "${topic} — Topic Index"`,
    `created: ${now}`,
    `updated: ${now}`,
    "tags:",
    "  - claude-memory",
    "  - index",
    `  - topic/${topic}`,
    "---",
  ].join("\n");

  return `${frontmatter}\n\n# ${topic} — Topic Index\n${body}`;
}

function buildMasterIndex() {
  const now = isoNow();

  let body = "\n## By Project\n\n";
  for (const p of [...projects].sort()) {
    body += `- [[index-project-${p}|${p}]]\n`;
  }

  body += "\n## By Topic\n\n";
  for (const t of [...topics].sort()) {
    body += `- [[index-topic-${t}|${t}]]\n`;
  }

  body += "\n## Stats\n\n";
  const byType = {};
  for (const n of allNotes) {
    const t = n.type || "other";
    byType[t] = (byType[t] || 0) + 1;
  }
  body += `| Type | Count |\n|------|-------|\n`;
  for (const [t, c] of Object.entries(byType).sort()) {
    body += `| ${t} | ${c} |\n`;
  }
  body += `| **Total** | **${allNotes.length}** |\n`;

  const frontmatter = [
    "---",
    "type: index",
    `title: "Claude Memory — Master Index"`,
    `created: ${now}`,
    `updated: ${now}`,
    "tags:",
    "  - claude-memory",
    "  - index",
    "---",
  ].join("\n");

  return `${frontmatter}\n\n# Claude Memory — Master Index\n${body}`;
}

// --- Generate ---

mkdirSync(INDEX_DIR, { recursive: true });

const generated = [];

// Filter if specific project/topic requested
const targetProjects = args.project ? [args.project] : [...projects];
const targetTopics = args.topic ? [args.topic] : [...topics];

for (const p of targetProjects) {
  const filename = `index-project-${p}.md`;
  const filepath = join(INDEX_DIR, filename);
  writeFileSync(filepath, buildProjectMOC(p), "utf-8");
  generated.push({ type: "project", name: p, path: filepath });
}

for (const t of targetTopics) {
  const filename = `index-topic-${t}.md`;
  const filepath = join(INDEX_DIR, filename);
  writeFileSync(filepath, buildTopicMOC(t), "utf-8");
  generated.push({ type: "topic", name: t, path: filepath });
}

// Always rebuild master index
const masterPath = join(INDEX_DIR, "index-master.md");
writeFileSync(masterPath, buildMasterIndex(), "utf-8");
generated.push({ type: "master", name: "master", path: masterPath });

console.log(JSON.stringify({
  action: "indexed",
  generated: generated.length,
  indexes: generated.map((g) => ({
    type: g.type,
    name: g.name,
    relative: relative(VAULT, g.path),
  })),
  total_notes: allNotes.length,
  projects: [...projects].sort(),
  topics: [...topics].sort(),
}));
