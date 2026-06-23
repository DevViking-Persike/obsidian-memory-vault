# Bugfix — Skill

Fluxo estruturado para investigar e corrigir bugs.

## Argumentos
- `description`: Descricao do bug
- `area`: Area afetada do projeto

## Steps
1. **Reproduzir**: Identifique o comportamento esperado vs atual
2. **Localizar**: Encontre o codigo relevante com grep/find
3. **Diagnosticar**: Leia o codigo e identifique a causa raiz
4. **Corrigir**: Aplique a correcao minima necessaria
5. **Testar**: Escreva ou atualize teste que cobre o bug
6. **Validar**: Rode build + lint + testes existentes
7. **Documentar**: Commit message com prefixo "fix:" descrevendo a causa
