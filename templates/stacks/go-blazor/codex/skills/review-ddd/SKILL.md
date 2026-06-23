# Review DDD — Skill

Revise codigo Go verificando aderencia a Domain-Driven Design e arquitetura hexagonal.

## Trigger
Quando houver mudancas em `services/internal/`.

## Steps
1. Verifique que `domain/` nao importa pacotes externos (so standard library)
2. Verifique que `application/` depende apenas de `ports/` (interfaces)
3. Verifique que adapters implementam os ports corretamente
4. Verifique que Lambda handlers sao finos (< 30 linhas)
5. Verifique que logica de negocio esta em `application/` ou `domain/`, nunca em adapters
6. Reporte violacoes com arquivo:linha e severidade
