# DDD Review — Exemplos

## Violacao: Domain importando adapter
```go
// BAD
package domain
import "github.com/aws/aws-sdk-go-v2/service/dynamodb"
```
```go
// GOOD
package domain
import "fmt"
```

## Violacao: Logica no handler
```go
// BAD — handler fazendo validacao
func Handle(ctx context.Context, req Request) (Response, error) {
    if req.Price < 0 { return Response{}, fmt.Errorf("preco invalido") }
}
```
```go
// GOOD — handler fino
func Handle(ctx context.Context, req Request) (Response, error) {
    cmd := application.CreateProductCommand{Name: req.Name, Price: req.Price}
    result, err := svc.CreateProduct(ctx, cmd)
    if err != nil { return Response{}, fmt.Errorf("create product: %w", err) }
    return toResponse(result), nil
}
```

## Violacao: Application importando adapter
```go
// BAD
package application
import "furniro/internal/adapters/outbound/dynamodb"
```
```go
// GOOD
package application
import "furniro/internal/ports/outbound"
```
