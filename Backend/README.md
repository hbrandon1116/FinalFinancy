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
preparadas pero los endpoints todavía no existen. El panel de Django está en
`http://localhost:8000/admin/`.

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
- No se modificó el frontend.
- No se implementaron reglas financieras, idempotencia ni los 34 endpoints.
