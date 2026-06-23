# Note Templates Reference

Use these templates when creating notes. Copy the appropriate template,
fill in the fields, and save to the correct subfolder.

---

## Conversation Summary

```markdown
---
type: conversation
title: "Brief descriptive title of the session"
created: {{ISO_DATETIME}}
updated: {{ISO_DATETIME}}
tags:
  - claude-memory
  - project/{{project-slug}}
  - topic/{{main-topic}}
aliases: []
confidence: high
source: conversation
---

# {{Title}}

## Summary

One paragraph summarizing what this conversation accomplished.

## Key Decisions

- [[decisions/{{decision-slug}}|Brief description]] — rationale in one line
- (repeat for each decision)

## Learnings

- [[learnings/{{learning-slug}}|Brief description]]
- (repeat for each learning)

## Context Changes

- Updated [[contexts/{{context-slug}}]] — what changed
- (repeat for each context update)

## New Entities

- [[entities/{{entity-slug}}]] — what/who it is
- (repeat for each new entity)

## Snippets Produced

- [[snippets/{{snippet-slug}}]] — what it does
- (repeat for each snippet)

## Open Questions

- Question that was left unresolved → potential next steps
- (repeat)

## Raw Notes

Brief freeform notes from the conversation that don't fit above.
```

---

## Decision

```markdown
---
type: decision
title: "What was decided"
created: {{ISO_DATETIME}}
updated: {{ISO_DATETIME}}
tags:
  - claude-memory
  - project/{{project-slug}}
  - topic/{{topic}}
  - status/active
aliases: []
confidence: high
source: conversation
---

# {{Title}}

## Context

Why did this decision come up? Link to the [[conversations/{{conversation-slug}}|conversation]]
that produced it and any relevant [[contexts/{{context-slug}}|context]].

## Decision

Clear statement of what was decided.

## Alternatives Considered

1. **Alternative A** — description. Rejected because: reason.
2. **Alternative B** — description. Rejected because: reason.

## Consequences

- Positive: what this enables
- Negative: what tradeoffs were accepted
- Neutral: what constraints this creates

## Related

- [[entities/{{related-entity}}]]
- [[decisions/{{related-decision}}]] (if supersedes or builds on another)
```

---

## Learning

```markdown
---
type: learning
title: "What was learned"
created: {{ISO_DATETIME}}
updated: {{ISO_DATETIME}}
tags:
  - claude-memory
  - project/{{project-slug}}
  - topic/{{topic}}
  - lang/{{language-or-tech}}
aliases: []
confidence: high
source: conversation
---

# {{Title}}

## Problem

What was the issue or question?

## Discovery

What was learned, found, or fixed?

## Key Insight

The one-liner takeaway that future-you needs to remember.

## Evidence

Code snippet, error message, benchmark, or link to docs that supports this.

```{{language}}
// relevant code or command
```

## Related

- [[entities/{{related-tool-or-lib}}]]
- [[conversations/{{conversation-slug}}|Original conversation]]
```

---

## Context (Evergreen)

```markdown
---
type: context
title: "{{Project or Area}} — Current State"
created: {{ISO_DATETIME}}
updated: {{ISO_DATETIME}}
tags:
  - claude-memory
  - project/{{project-slug}}
  - status/active
aliases: []
confidence: high
source: conversation
---

# {{Title}}

## Overview

What is this project/area about? One paragraph.

## Current Stack

- Language: 
- Framework: 
- Runtime: 
- Database: 
- OS/Environment: 

## Architecture

Brief description of the current architecture. Link to relevant
[[decisions/{{slug}}|decisions]] that shaped it.

## Active Work

What's currently in progress or next up?

## Known Issues

- Issue description → link to [[learnings/{{slug}}]] if documented

## History

| Date | Change | Link |
|------|--------|------|
| {{date}} | {{what changed}} | [[conversations/{{slug}}]] |
```

---

## Entity (Evergreen)

```markdown
---
type: entity
title: "{{Entity Name}}"
created: {{ISO_DATETIME}}
updated: {{ISO_DATETIME}}
tags:
  - claude-memory
  - entity/{{category}}
  - lang/{{language-if-applicable}}
aliases:
  - "{{alternative name}}"
confidence: high
source: conversation
---

# {{Entity Name}}

## What

One paragraph describing what this entity is.

## Why We Use It

Why was this chosen? Link to [[decisions/{{slug}}]] if applicable.

## Key Facts

- Version: 
- Docs: 
- Notable quirks: link to [[learnings/{{slug}}]]

## Related

- [[entities/{{related-entity}}]]
- Projects using this: [[contexts/{{project-context}}]]
```

---

## Snippet

```markdown
---
type: snippet
title: "What this snippet does"
created: {{ISO_DATETIME}}
updated: {{ISO_DATETIME}}
tags:
  - claude-memory
  - project/{{project-slug}}
  - lang/{{language}}
  - snippet/{{category}}
aliases: []
confidence: high
source: conversation
---

# {{Title}}

## Usage

When and why to use this snippet.

## Code

```{{language}}
// the reusable code
```

## Notes

Any caveats, dependencies, or configuration required.

## Origin

Produced during [[conversations/{{conversation-slug}}|this session]].
```
