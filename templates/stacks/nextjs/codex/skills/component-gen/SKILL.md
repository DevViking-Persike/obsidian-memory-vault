# Component Gen — Skill

Gera um componente React completo com tipos e teste.

## Argumentos
- `name`: Nome do componente (PascalCase)
- `type`: "page", "feature", "ui"
- `client`: true/false (precisa de 'use client'?)

## Steps
1. Crie o componente em:
   - `ui` → `src/components/ui/{Name}.tsx`
   - `feature` → `src/components/features/{Name}.tsx`
   - `page` → `src/app/{name}/page.tsx`
2. Defina a interface de props com TypeScript
3. Implemente o componente com Tailwind CSS
4. Se `client: true`, adicione 'use client' no topo
5. Crie o teste em `{Name}.test.tsx` no mesmo diretorio
6. Exporte do barrel file se aplicavel (`index.ts`)
