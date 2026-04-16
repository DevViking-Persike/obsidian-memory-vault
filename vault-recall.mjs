#!/usr/bin/env node

/**
 * vault-recall.mjs — Search and retrieve notes from the Obsidian memory vault
 *
 * Usage:
 *   node vault-recall.mjs --config .vault-config.json --query "pipe operator"
 *   node vault-recall.mjs --config .vault-config.json --type decision --project zolo-lang
 *   node vault-recall.mjs --config .vault-config.json --tag "topic/error-handling" --limit 5
 *   node vault-recall.mjs --config .vault-config.json --recent 7  (last 7 days)
 *   node vault-recall.mjs --config .vault-config.json --list-projects
 */

import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, resolve, relative, extname, basename } from "path";

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

  console.error("ERROR: No .vault-config.json found.");
  process.exit(1);
}

const config = loadConfig(args.config);
const VAULT = resolve(config.vault_path);

// --- Helpers ---

function walkDir(dir, ext = ".md") {
  const results = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".obsidian") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, ext));
    } else if (entry.isFile() && extname(entry.name) === ext) {
      results.push(full);
    }
  }
  return results;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = {};
  const lines = match[1].split("\n");
  let currentKey = null;
  let currentArray = null;

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();

      if (val === "" || val === "[]") {
        fm[currentKey] = [];
        currentArray = fm[currentKey];
      } else if (val.startsWith('"') && val.endsWith('"')) {
        fm[currentKey] = val.slice(1, -1);
        currentArray = null;
      } else {
        fm[currentKey] = val;
        currentArray = null;
      }
    } else if (line.match(/^\s+-\s+(.*)$/) && currentKey) {
      if (!Array.isArray(fm[currentKey])) {
        fm[currentKey] = [];
      }
      const itemVal = line.match(/^\s+-\s+(.*)$/)[1].trim().replace(/^"|"$/g, "");
      fm[currentKey].push(itemVal);
      currentArray = fm[currentKey];
    }
  }

  return fm;
}

function extractBody(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n*/, "");
}

function extractWikilinks(content) {
  const links = [];
  const re = /\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    links.push(m[1]);
  }
  return links;
}

function noteInfo(filepath) {
  const content = readFileSync(filepath, "utf-8");
  const fm = parseFrontmatter(content);
  const body = extractBody(content);
  const links = extractWikilinks(content);
  const stat = statSync(filepath);

  return {
    path: filepath,
    relative: relative(VAULT, filepath),
    filename: basename(filepath),
    frontmatter: fm,
    body,
    links,
    modified: stat.mtime,
    size: stat.size,
  };
}

// --- Search functions ---

function searchByQuery(notes, query) {
  const terms = query.toLowerCase().split(/\s+/);
  return notes
    .map((n) => {
      const haystack = [
        n.frontmatter.title || "",
        (n.frontmatter.tags || []).join(" "),
        n.body,
      ]
        .join(" ")
        .toLowerCase();

      const score = terms.reduce((acc, term) => {
        const titleMatch = (n.frontmatter.title || "").toLowerCase().includes(term) ? 10 : 0;
        const tagMatch = (n.frontmatter.tags || []).some((t) => t.includes(term)) ? 5 : 0;
        const bodyMatch = n.body.toLowerCase().includes(term) ? 1 : 0;
        return acc + titleMatch + tagMatch + bodyMatch;
      }, 0);

      return { ...n, score };
    })
    .filter((n) => n.score > 0)
    .sort((a, b) => b.score - a.score);
}

function filterByType(notes, type) {
  return notes.filter((n) => n.frontmatter.type === type);
}

function filterByTag(notes, tag) {
  return notes.filter((n) => (n.frontmatter.tags || []).some((t) => t.includes(tag)));
}

function filterByProject(notes, project) {
  return filterByTag(notes, `project/${project}`);
}

function filterByRecent(notes, days) {
  const cutoff = new Date(Date.now() - days * 86400000);
  return notes.filter((n) => new Date(n.frontmatter.created || n.modified) > cutoff);
}

function listProjects(notes) {
  const projects = new Set();
  for (const n of notes) {
    for (const tag of n.frontmatter.tags || []) {
      if (tag.startsWith("project/")) {
        projects.add(tag.replace("project/", ""));
      }
    }
  }
  return [...projects].sort();
}

function listTopics(notes) {
  const topics = new Set();
  for (const n of notes) {
    for (const tag of n.frontmatter.tags || []) {
      if (tag.startsWith("topic/")) {
        topics.add(tag.replace("topic/", ""));
      }
    }
  }
  return [...topics].sort();
}

// --- Main ---

const limit = parseInt(args.limit || "20", 10);

// Load all notes
const allFiles = walkDir(VAULT);
const allNotes = allFiles.map(noteInfo);

let results;

if (args["list-projects"]) {
  const projects = listProjects(allNotes);
  console.log(JSON.stringify({ projects, count: projects.length }));
  process.exit(0);
}

if (args["list-topics"]) {
  const topics = listTopics(allNotes);
  console.log(JSON.stringify({ topics, count: topics.length }));
  process.exit(0);
}

if (args.stats) {
  const byType = {};
  for (const n of allNotes) {
    const t = n.frontmatter.type || "unknown";
    byType[t] = (byType[t] || 0) + 1;
  }
  console.log(JSON.stringify({
    total_notes: allNotes.length,
    by_type: byType,
    projects: listProjects(allNotes).length,
    topics: listTopics(allNotes).length,
  }));
  process.exit(0);
}

// Apply filters
results = [...allNotes];

if (args.type) {
  results = filterByType(results, args.type);
}

if (args.project) {
  results = filterByProject(results, args.project);
}

if (args.tag) {
  results = filterByTag(results, args.tag);
}

if (args.recent) {
  results = filterByRecent(results, parseInt(args.recent, 10));
}

if (args.query) {
  results = searchByQuery(results, args.query);
}

// Sort by date (most recent first) unless search scored
if (!args.query) {
  results.sort((a, b) => {
    const da = new Date(a.frontmatter.created || a.modified);
    const db = new Date(b.frontmatter.created || b.modified);
    return db - da;
  });
}

// Limit
results = results.slice(0, limit);

// Output
const output = results.map((n) => ({
  title: n.frontmatter.title || n.filename,
  type: n.frontmatter.type,
  relative: n.relative,
  tags: n.frontmatter.tags || [],
  created: n.frontmatter.created,
  confidence: n.frontmatter.confidence,
  score: n.score || undefined,
  wikilink: `[[${n.filename.replace(".md", "")}|${n.frontmatter.title || n.filename}]]`,
  preview: n.body.slice(0, 300).replace(/\n/g, " ").trim(),
  links: n.links,
}));

if (args.full && results.length === 1) {
  // Full note output for single result
  const n = results[0];
  console.log(JSON.stringify({
    ...output[0],
    full_content: n.body,
  }));
} else {
  console.log(JSON.stringify({ results: output, total: output.length, query: args.query || null }));
}
