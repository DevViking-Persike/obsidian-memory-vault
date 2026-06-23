# Add Endpoint — Skill

Cria um novo endpoint seguindo a arquitetura hexagonal completa.

## Argumentos
- `name`: Nome do endpoint (ex: "get-product", "create-order")
- `method`: HTTP method (GET, POST, PUT, DELETE)
- `service`: Nome do microservice (ex: "products", "orders")

## Steps
1. Crie o domain entity/value object em `services/internal/domain/`
2. Defina os ports (inbound + outbound) em `services/internal/ports/`
3. Implemente o application service em `services/internal/application/`
4. Crie o adapter inbound (Lambda handler) em `services/internal/adapters/inbound/`
5. Crie o adapter outbound (DynamoDB) em `services/internal/adapters/outbound/`
6. Adicione o handler ao `cmd/{service}/main.go`
7. Crie testes unitarios para domain e application
8. Atualize `infra/` com o novo endpoint no API Gateway
