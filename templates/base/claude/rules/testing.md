---
description: Regras de testes
globs: [{{TEST_GLOBS}}]
---

# Regras de Testes

{{TEST_RULES}}

## Geral
- Feature nova sem teste = review bloqueado
- Bugfix deve incluir teste que reproduz o bug
- Testes devem ser deterministicos (sem dependencia de ordem ou timing)
