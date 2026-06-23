# Bugfix Flow

## 1. Reproduzir
- Qual o comportamento esperado?
- Qual o comportamento atual?
- Quando comecou a falhar? (`git log` para identificar commit)

## 2. Localizar
- Buscar o codigo relevante com grep no diretorio correto

## 3. Diagnosticar
- Ler o codigo ao redor do ponto de falha
- Verificar se e regressao (git blame)
- Checar se ha teste que deveria ter pego o bug

## 4. Corrigir
- Correcao MINIMA — nao refatorar codigo adjacente
- Manter convencoes existentes

## 5. Testar
- Escrever teste que FALHA sem a correcao e PASSA com ela

## 6. Validar
{{VALIDATE_COMMANDS}}

## 7. Commit
```
fix: descricao curta da causa raiz

Causa: explicacao do que estava errado
Correcao: o que foi feito para resolver
```
