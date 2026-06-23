# DDD Review Checklist

## Domain Layer (services/internal/domain/)
- [ ] Zero dependencias externas (so standard library)
- [ ] Entities com identidade e ciclo de vida
- [ ] Value objects imutaveis
- [ ] Validacoes de negocio no domain

## Ports Layer (services/internal/ports/)
- [ ] Interfaces bem definidas (inbound e outbound)
- [ ] Contratos estaveis
- [ ] Nomes descritivos (Repository, Gateway, Service)

## Application Layer (services/internal/application/)
- [ ] Depende APENAS de ports (interfaces)
- [ ] Orquestra chamadas entre domain e ports outbound
- [ ] Nao contem logica de infraestrutura

## Adapters Layer (services/internal/adapters/)
- [ ] Implementam ports corretamente
- [ ] inbound/: converte HTTP/evento -> chamada de service
- [ ] outbound/: implementa repository, gateway, etc
- [ ] Sem logica de negocio
- [ ] Lambda handlers < 30 linhas
