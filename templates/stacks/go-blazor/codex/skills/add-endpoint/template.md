# Add Endpoint — Template

## Domain Entity
```go
// services/internal/domain/{entity}.go
package domain

type {Entity} struct {
    ID   string
}

func New{Entity}(/* params */) (*{Entity}, error) {
    // validacoes de negocio
    return &{Entity}{}, nil
}
```

## Port Inbound
```go
// services/internal/ports/inbound/{service}_service.go
package inbound

type {Service}Service interface {
    {Method}(ctx context.Context, cmd {Command}) ({Result}, error)
}
```

## Port Outbound
```go
// services/internal/ports/outbound/{entity}_repository.go
package outbound

type {Entity}Repository interface {
    Save(ctx context.Context, entity *domain.{Entity}) error
    FindByID(ctx context.Context, id string) (*domain.{Entity}, error)
}
```

## Application Service
```go
// services/internal/application/{service}_service.go
package application

type {Service}ServiceImpl struct {
    repo outbound.{Entity}Repository
}
```

## Lambda Handler
```go
// services/internal/adapters/inbound/lambda/{handler}.go
func Handle(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    // parse request -> chama service -> formata response
}
```
