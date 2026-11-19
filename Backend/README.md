# FinanzasPro — Backend

Backend Django del MVP de FinanzasPro. Esta fase deja el proyecto, la
configuración de Django REST Framework/SimpleJWT y PostgreSQL preparados, pero
**no implementa todavía los modelos financieros ni los endpoints de negocio**.

La fuente de verdad de la arquitectura, el contrato y las reglas está en
[`docs/backend`](../docs/backend):

- [Diseño de base de datos](../docs/backend/database-design.md)
- [Contrato de API](../docs/backend/api-contract.md)
- [Reglas de negocio](../docs/backend/business-rules.md)
- [Arquitectura del backend](../docs/backend/backend-architecture.md)

## 1. Requisitos

- Python 3.10 o superior. En este equipo se verificó con **Python 3.14.3**.
  La entrada `py -3.12` está registrada pero apunta a una instalación rota; usa
  el intérprete que funcione en tu máquina.
- PostgreSQL 15 o superior.
- Las dependencias fijadas en `requirements.txt`.

## 2. Crear el entorno e instalar dependencias

Desde la raíz del repositorio:

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Si PowerShell bloquea la activación, ejecuta una vez:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

También puedes usar el intérprete del entorno sin activarlo:

```powershell
.\.venv\Scripts\python.exe manage.py check
```

## 3. Configurar variables de entorno

```powershell
Copy-Item .env.example .env
```

Edita `Backend/.env` con tus datos locales. No se versiona y no debe contener
secretos compartidos. Para generar una clave de Django:

```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Variables principales:

| Variable | Uso |
| --- | --- |
| `DJANGO_SECRET_KEY` | Clave de Django. Obligatoria en producción. |
| `DJANGO_DEBUG` | `true` solo en desarrollo. |
| `DJANGO_ALLOWED_HOSTS` | Hosts permitidos, separados por coma. |
| `DATABASE_URL` | URL de PostgreSQL. |
| `DATABASE_CONN_MAX_AGE` | Reutilización de conexiones; por defecto 60 s. |
| `CORS_ALLOWED_ORIGINS` | Orígenes del frontend permitidos. |
| `CSRF_TRUSTED_ORIGINS` | Orígenes de confianza para CSRF. |
| `JWT_ACCESS_TOKEN_LIFETIME` | Duración del access token, en minutos. |
| `JWT_REFRESH_TOKEN_LIFETIME` | Duración del refresh token, en días. |
| `JWT_SIGNING_KEY` | Opcional; por defecto usa `DJANGO_SECRET_KEY`. |
| `REFRESH_COOKIE_SECURE` | Debe ser `true` en producción. |
| `REFRESH_COOKIE_SAMESITE` | `Lax` o `None` según el despliegue. |
| `IDEMPOTENCY_TTL_HOURS` | Ventana de idempotencia; por defecto 24 h. |
| `DATABASE_HEALTH_TOKEN` | Token temporal del diagnóstico de base de datos. Vacío lo deshabilita. |

`DATABASE_URL` debe tener el formato:

```text
postgresql://USUARIO:CLAVE@localhost:5432/finanzaspro
```

## 4. Crear la base de datos PostgreSQL

No hay credenciales reales en el repositorio. Crea el rol y la base con el
usuario administrador de tu instalación local. Reemplaza los valores entre
ángulos; no los agregues al repositorio:

```powershell
psql -U postgres
```

Dentro de `psql`:

```sql
CREATE ROLE <usuario> LOGIN PASSWORD '<clave>';
CREATE DATABASE finanzaspro OWNER <usuario>;
\q
```

Después configura `DATABASE_URL` en `.env`. Si `psql` no está en el `PATH`,
usa la ruta de instalación de PostgreSQL en tu equipo.

Comprueba la conexión con:

```powershell
python manage.py check --database default
```

## 5. Migraciones y estado de esta fase

En esta fase se definió el modelo base `users.User` y se configuró
`AUTH_USER_MODEL = "users.User"` antes de cualquier migración. **No se generaron
ni aplicaron migraciones**: no se crearon tablas de usuarios, categorías,
movimientos, presupuestos ni metas.

Cuando comience la fase 2 (autenticación), se debe generar la migración inicial
del usuario personalizado y aplicarla junto con las migraciones de Django:

```powershell
python manage.py makemigrations users
python manage.py migrate
```

No ejecutes `migrate` antes de que exista esa migración: Django necesita crear
el usuario personalizado desde la primera migración.

## 6. Comprobar y ejecutar

```powershell
python manage.py check
python manage.py test --settings=config.settings.test
python manage.py runserver 8000
```

`runserver` comprueba las migraciones y necesita PostgreSQL disponible; si el
servicio de base de datos está detenido, el arranque no completa. La API se
expone bajo `http://localhost:8000/api/v1/`. En esta fase las rutas están
preparadas pero los endpoints de negocio todavía no existen, salvo el
diagnóstico temporal de base de datos. El panel de Django está en
`http://localhost:8000/admin/`.

### 6.1 Diagnóstico temporal de Supabase en Render

Este endpoint es **temporal y operativo**. No forma parte del contrato de negocio
y no debe quedar habilitado de forma permanente.

En Render, configura las variables de entorno desde el panel del servicio:

- `DATABASE_URL`: la cadena de conexión de Supabase. Si Render no resuelve la
  conexión directa, usa la cadena del pooler de Supabase compatible con IPv4.
  Incluye `sslmode=require` si tu cadena de Supabase lo indica.
- `DATABASE_HEALTH_TOKEN`: un valor largo y aleatorio. No lo guardes en Git.

Para generar el token localmente:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Después del despliegue, ejecuta:

```powershell
curl.exe -i "https://<servicio>.onrender.com/api/v1/health/database/" `
  -H "X-Database-Health-Token: $env:DATABASE_HEALTH_TOKEN"
```

Respuestas esperadas:

| Situación | HTTP | Cuerpo |
| --- | --- | --- |
| PostgreSQL responde `SELECT 1` | 200 | `{"status":"ok","database":"ok"}` |
| PostgreSQL no responde | 503 | `{"status":"error","database":"unavailable"}` |
| Token ausente o incorrecto | 401 | `{"detail":"No autorizado."}` |
| `DATABASE_HEALTH_TOKEN` no configurado | 404 | `{"detail":"Not found."}` |

El endpoint no devuelve `DATABASE_URL`, usuarios, contraseñas, hosts, mensajes
de excepción ni trazas internas. Si la conexión falla, el servidor solo registra
el nombre de la clase de excepción en sus logs.

#### Retirar el endpoint temporal

Cuando la conexión esté verificada:

1. Eliminar la ruta `api/v1/health/` de `config/urls.py`.
2. Eliminar `apps/common/urls.py`.
3. Eliminar `DatabaseHealthView` de `apps/common/views.py`; si el archivo queda
   vacío, eliminarlo también.
4. Eliminar `apps/common/tests/test_database_health.py`.
5. Eliminar `DATABASE_HEALTH_TOKEN` de `config/settings/base.py`, de
   `.env.example` y de las variables de entorno de Render.
6. Eliminar esta sección del README y volver a desplegar.

No hay migraciones ni cambios de modelos asociados a este endpoint.

## 7. Estructura

```text
Backend/
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
├── config/
│   ├── urls.py
│   ├── asgi.py
│   ├── wsgi.py
│   └── settings/
│       ├── base.py
│       ├── dev.py
│       ├── prod.py
│       └── test.py
└── apps/
    ├── common/
    ├── users/
    ├── categories/
    ├── movements/
    ├── budgets/
    ├── savings/
    └── analytics/
```

Cada app contiene la estructura para sus futuros `models.py`, `serializers.py`,
`views.py`, `urls.py`, `services.py`, `tests/` y, cuando corresponde,
`selectors.py` y `migrations/`.

## 8. Seguridad y alcance

- SimpleJWT está instalado y configurado como autenticación predeterminada.
- **La autenticación por cookies HttpOnly + CSRF no está implementada todavía**;
  solo quedaron sus ajustes preparados. Se implementará en la fase 2.
- Los endpoints de registro, login, refresh y logout no existen aún.
- El único endpoint adicional es el diagnóstico temporal de base de datos.
- No se modificó el frontend.
- No se implementaron reglas financieras, idempotencia ni los 34 endpoints.
