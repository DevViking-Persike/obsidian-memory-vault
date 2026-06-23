---
description: Regras de seguranca
globs: [{{SECURITY_GLOBS}}]
---

# Regras de Seguranca

## Secrets
- NUNCA commitar secrets, .env, API keys, connection strings
- Usar variaveis de ambiente ou secrets manager
- .gitignore deve cobrir arquivos sensiveis

## Input Validation
- Todos os handlers/endpoints validam input antes de processar
- Todos os DTOs de entrada tem validacao
- Nunca confiar em dados do cliente

## OWASP Top 10
- Sem concatenacao de strings em queries
- Sem renderizacao de HTML nao sanitizado
- URLs validadas antes de chamadas HTTP (prevenir SSRF)
- Error messages nao expoe detalhes internos ao cliente
- Handlers verificam autorizacao

{{SECURITY_EXTRA}}

## Dependencias
{{SECURITY_DEPS}}
