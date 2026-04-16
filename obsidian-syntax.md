# Obsidian-Flavored Markdown Reference

Quick reference for the Claude Code agent when generating vault notes.

## Wikilinks

```markdown
[[note-name]]                          → links to note-name.md (shortest match)
[[note-name|Display Text]]            → shows "Display Text", links to note-name.md
[[note-name#Heading]]                  → deep link to a heading in note-name.md
[[note-name#Heading|Display Text]]    → deep link with custom display text
[[note-name#^block-id]]               → link to a specific block
```

Obsidian resolves wikilinks by shortest unique match — you don't need the full path.
`[[pipe-operator-design]]` resolves to `decisions/2026-03-17-pipe-operator-design.md`.

## Tags

```markdown
#tag                    → simple tag
#project/zolo-lang      → hierarchical tag (Obsidian supports nesting with /)
#topic/error-handling    → nested tag
```

Tags can appear in YAML frontmatter (preferred) or inline in content.
Frontmatter tags are listed as a YAML array under the `tags:` key.

## Frontmatter (YAML)

```yaml
---
key: value
tags:
  - tag-one
  - tag-two
aliases:
  - "Alternative Title"
---
```

Must be the very first thing in the file. Delimited by `---` on its own line.

## Callouts

```markdown
> [!note] Title
> Content of the note callout.

> [!warning] Title
> Content of the warning callout.

> [!tip] Title
> Content of the tip callout.

> [!info] Title
> Information callout.

> [!example] Title
> Example callout — great for code patterns.
```

Supported types: note, abstract, info, tip, success, question, warning,
failure, danger, bug, example, quote.

## Code Blocks

Standard fenced code blocks with language identifiers:

````markdown
```rust
fn main() {
    println!("Hello");
}
```
````

## Embeds

```markdown
![[note-name]]                → embeds the entire note inline
![[note-name#Heading]]        → embeds only that section
![[image.png]]                → embeds an image
![[image.png|300]]            → embeds an image with width 300px
```

## Tables

Standard markdown tables:

```markdown
| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |
```

## Task Lists

```markdown
- [ ] Unchecked task
- [x] Completed task
```

## Comments

```markdown
%% This is a comment that won't render in preview %%
```

## Best Practices for Claude Memory Notes

1. Prefer wikilinks over markdown links — they're shorter and Obsidian resolves them.
2. Use frontmatter tags over inline tags — easier to search programmatically.
3. Keep note titles descriptive but concise — they become the wikilink text.
4. Use heading links when referencing a specific section of a long note.
5. Callouts are great for highlighting warnings, tips, or key insights in learning notes.
6. Always use fenced code blocks with the correct language identifier.
7. No HTML in notes — pure markdown only for maximum compatibility.
