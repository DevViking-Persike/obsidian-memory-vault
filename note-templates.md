# Referencia de Templates de Notas

Use estes templates ao criar notas. Copie o template apropriado,
preencha os campos e salve na subpasta correta.

---

## Resumo de Conversa

```markdown
---
type: conversation
title: "Titulo descritivo breve da sessao"
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

## Resumo

Um paragrafo resumindo o que esta conversa realizou.

## Decisoes Principais

- [[decisions/{{decision-slug}}|Descricao breve]] — justificativa em uma linha
- (repetir para cada decisao)

## Aprendizados

- [[learnings/{{learning-slug}}|Descricao breve]]
- (repetir para cada aprendizado)

## Mudancas de Contexto

- Atualizado [[contexts/{{context-slug}}]] — o que mudou
- (repetir para cada atualizacao de contexto)

## Novas Entidades

- [[entities/{{entity-slug}}]] — o que/quem e
- (repetir para cada nova entidade)

## Snippets Produzidos

- [[snippets/{{snippet-slug}}]] — o que faz
- (repetir para cada snippet)

## Questoes em Aberto

- Questao que ficou sem resolucao → proximos passos possiveis
- (repetir)

## Notas Brutas

Anotacoes livres da conversa que nao se encaixam nas secoes acima.
```

---

## Decisao

```markdown
---
type: decision
title: "O que foi decidido"
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

## Contexto

Por que essa decisao surgiu? Link para a [[conversations/{{conversation-slug}}|conversa]]
que a produziu e qualquer [[contexts/{{context-slug}}|contexto]] relevante.

## Decisao

Declaracao clara do que foi decidido.

## Alternativas Consideradas

1. **Alternativa A** — descricao. Rejeitada porque: motivo.
2. **Alternativa B** — descricao. Rejeitada porque: motivo.

## Consequencias

- Positiva: o que isso viabiliza
- Negativa: quais tradeoffs foram aceitos
- Neutra: quais restricoes isso cria

## Relacionados

- [[entities/{{related-entity}}]]
- [[decisions/{{related-decision}}]] (se substitui ou se baseia em outra)
```

---

## Aprendizado

```markdown
---
type: learning
title: "O que foi aprendido"
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

## Problema

Qual era o problema ou a duvida?

## Descoberta

O que foi aprendido, encontrado ou corrigido?

## Insight Principal

A frase-chave que o seu eu futuro precisa lembrar.

## Evidencia

Trecho de codigo, mensagem de erro, benchmark ou link para documentacao que sustenta isso.

```{{language}}
// codigo ou comando relevante
```

## Relacionados

- [[entities/{{related-tool-or-lib}}]]
- [[conversations/{{conversation-slug}}|Conversa original]]
```

---

## Contexto (Evergreen)

```markdown
---
type: context
title: "{{Project or Area}} — Estado Atual"
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

## Visao Geral

Sobre o que e este projeto/area? Um paragrafo.

## Stack Atual

- Linguagem: 
- Framework: 
- Runtime: 
- Banco de Dados: 
- SO/Ambiente: 

## Arquitetura

Descricao breve da arquitetura atual. Link para
[[decisions/{{slug}}|decisoes]] relevantes que a moldaram.

## Trabalho Ativo

O que esta em andamento ou e o proximo passo?

## Problemas Conhecidos

- Descricao do problema → link para [[learnings/{{slug}}]] se documentado

## Historico

| Data | Mudanca | Link |
|------|---------|------|
| {{date}} | {{o que mudou}} | [[conversations/{{slug}}]] |
```

---

## Entidade (Evergreen)

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
  - "{{nome alternativo}}"
confidence: high
source: conversation
---

# {{Entity Name}}

## O que e

Um paragrafo descrevendo o que esta entidade e.

## Por que usamos

Por que isso foi escolhido? Link para [[decisions/{{slug}}]] se aplicavel.

## Fatos Importantes

- Versao: 
- Docs: 
- Peculiaridades notaveis: link para [[learnings/{{slug}}]]

## Relacionados

- [[entities/{{related-entity}}]]
- Projetos que usam: [[contexts/{{project-context}}]]
```

---

## Snippet

```markdown
---
type: snippet
title: "O que este snippet faz"
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

## Uso

Quando e por que usar este snippet.

## Codigo

```{{language}}
// codigo reutilizavel
```

## Notas

Ressalvas, dependencias ou configuracoes necessarias.

## Origem

Produzido durante [[conversations/{{conversation-slug}}|esta sessao]].
```
