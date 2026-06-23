# Add Route — Skill

Cria um novo endpoint FastAPI completo com todas as camadas.

## Argumentos
- `name`: Nome do recurso (ex: "users", "products")
- `method`: HTTP method (GET, POST, PUT, DELETE)
- `path`: URL path (ex: "/api/v1/users/{id}")

## Steps
1. Crie o model SQLAlchemy em `src/models/{name}.py`
2. Crie os schemas Pydantic em `src/schemas/{name}.py` (Create, Update, Response)
3. Crie o repository em `src/repositories/{name}_repository.py`
4. Crie o service em `src/services/{name}_service.py`
5. Crie o router em `src/api/v1/{name}.py`
6. Registre o router em `src/api/v1/__init__.py`
7. Crie migration: `alembic revision --autogenerate -m "add {name}"`
8. Crie testes em `tests/unit/test_{name}_service.py`
