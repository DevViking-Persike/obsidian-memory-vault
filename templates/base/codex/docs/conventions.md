# Convencoes — {{PROJECT_NAME}}

{{CONVENTIONS_DETAIL}}

## Commits
- Prefixos: `add:`, `fix:`, `update:`, `refactor:`
- Mensagem concisa descrevendo o "por que"
- Toda feature nova = pelo menos 1 teste unitario

## Secrets
- NUNCA commitar secrets, `.env`, API keys
- Usar variaveis de ambiente ou secrets manager
- `.gitignore` deve cobrir arquivos sensiveis
