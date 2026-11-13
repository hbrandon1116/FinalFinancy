# Arquitectura del backend — FinanzasPro

> Estado: **arquitectura oficial del MVP, pendiente de implementación**. No se
> implementaron modelos Django, no se instalaron dependencias y no se modificó el
> frontend.
> Documentos relacionados: [diseño de base de datos](./database-design.md),
> [contrato de API](./api-contract.md) y [reglas de negocio](./business-rules.md).
> Las decisiones de esos documentos son la referencia canónica.

## 1. Punto de partida inspeccionado

| Elemento | Estado actual |
| --- | --- |
| `Backend/` | Vacío; no existe proyecto Django, `manage.py`, settings ni migraciones. |
| Frontend | React 19 + Vite 8 + React Router 7. |
| Módulos UI | Login, Registro, Dashboard, Movimientos, Presupuestos, Ahorro, Reportes y Ajustes. |
| Estado del frontend | Contextos en memoria (`MovimientosContext`, `PresupuestosContext`, `AhorroContext`). |
| Datos | `src/data/mockData.js` con movimientos, categorías, presupuestos y metas simuladas. |
| Comunicación | `src/services/api.js` es un placeholder; `request()` lanza «API no conectada». |
| URL base actual | `http://localhost:8000/api` (sin versión). |
| Autenticación | Formularios simulados; no hay JWT ni protección de rutas. |
| Documentación existente | `Frontend/docs/documentacion-sprints.md` (sprints del frontend). |
| Ahorro en el frontend | Los aportes viven dentro de `meta.aportes`; no son movimientos ni afectan gastos. |

Hallazgos relevantes para la integración:

1. El frontend calcula gastos sumando `tipo === 'gasto'`; los aportes a metas están
   fuera de esa lista. La API debe conservar esa semántica: `savings_transfer` no
   es gasto.
2. El Dashboard muestra `balance = ingresos - gastos`, pero el dinero disponible
   real debe restar también los aportes a ahorro. La integración deberá consumir
   `available_money` del backend y no recalcularlo.
3. Los IDs mock son números (`Date.now()`); la API usa UUID, por lo que las claves
   de React y las comparaciones deben migrar a string/UUID.
4. El frontend usa nombres en español (`monto`, `categoria`, `mes`, `objetivo`);
   la API usa `snake_case` en inglés. La adaptación se hará en
   `services/api.js`/capa de datos, no cambiando el contrato.
5. La URL base definitiva es `/api/v1`; `VITE_API_URL` deberá actualizarse en la
   fase de integración.
6. El refresh token no se guardará en `localStorage`: se usará cookie `HttpOnly`
   + CSRF, con access token solo en memoria.
7. El frontend actual trunca el mes en Reportes; el backend oficial usa meses
   calendario completos, así que la integración deberá corregir ese límite.

## 2. Objetivos y no objetivos

### Objetivos

- Backend Django REST Framework modular y mantenible.
- PostgreSQL como única base de datos.
- Autenticación JWT y aislamiento total de datos por usuario.
- Una única fuente de verdad para los movimientos, incluidas las transferencias
  a ahorro.
- Cálculos financieros centralizados y reutilizados por Dashboard, Presupuestos,
  Reportes y Metas.
- Contrato JSON estable y documentado para conectar el frontend.
- Camino de implementación por fases, con tests de las reglas críticas.

### No objetivos de esta etapa

- Implementar los modelos o migraciones.
- Modificar el frontend.
- Instalar paquetes.
- Diseñar el despliegue definitivo.
- Implementar funcionalidades fuera del MVP: retiros de ahorro, cuentas
  bancarias, saldos iniciales, cambio de correo, recuperación/verificación de
  contraseña o correo, exportación de reportes e integraciones bancarias
  externas. Pueden mencionarse como mejoras futuras, no como funcionalidad
  existente.

## 3. Arquitectura de alto nivel

```mermaid
flowchart LR
    SPA["React SPA<br/>Vite"] -->|HTTPS + JSON<br/>Bearer access + refresh cookie| API["Django REST Framework<br/>/api/v1"]
    API --> AUTH["Autenticación JWT<br/>SimpleJWT"]
    API --> PERM["Permisos y filtrado<br/>por propietario"]
    PERM --> SER["Serializers<br/>validación de forma"]
    SER --> SVC["Servicios de escritura<br/>transaction.atomic"]
    SVC --> IDEMP["Idempotencia<br/>IdempotencyRecord"]
    API --> SEL["Selectores de lectura<br/>agregaciones SQL"]
    SVC --> ORM["Django ORM"]
    SEL --> ORM
    ORM --> PG[("PostgreSQL<br/>NUMERIC, constraints, índices")]
    AUTH --> PG
```

### Capas

1. **HTTP / ViewSet**: recibe la petición, resuelve autenticación, aplica
   permisos, valida parámetros y serializa la respuesta. No contiene cálculos
   financieros.
2. **Serializer**: valida tipos, longitudes, importes y estructura del payload.
   Puede validar relaciones, pero no ejecuta la operación.
3. **Servicio de escritura**: aplica reglas de negocio, verifica propiedad,
   ejecuta transacciones y devuelve el resultado. Las creaciones financieras
   pasan por el servicio de idempotencia.
4. **Selector de lectura**: consultas optimizadas y agregaciones para Dashboard,
   Reportes, presupuestos y metas. Reutiliza las fórmulas de negocio.
5. **Modelo / ORM**: persistencia. Las constraints de PostgreSQL son la última
   línea de defensa.
6. **Base de datos**: integridad referencial, unicidad, índices y tipos decimales.
7. **Idempotencia**: tabla `IdempotencyRecord` y servicio común que arbitra por
   `UNIQUE (user_id, idempotency_key)`, evita duplicados y reproduce la respuesta
   original; no existe una fila de estado intermedio.

## 4. Stack propuesto

| Componente | Propuesta | Estado |
| --- | --- | --- |
| Lenguaje | Python 3.12+ | Por instalar. |
| Framework | Django 5.2 LTS | No instalado. |
| API | Django REST Framework | No instalado. |
| Autenticación | `djangorestframework-simplejwt` + blacklist | No instalado. |
| Driver PostgreSQL | `psycopg` 3 | No instalado. |
| CORS | `django-cors-headers` | No instalado. |
| Base de datos | PostgreSQL 15+ | No provisionada. |
| OpenAPI | `drf-spectacular` (opcional) | No instalado. |
| Tests | `django.test.TestCase` + `APIClient` (sin dependencia extra) | — |
| Lint/formato | Ruff (opcional) | No instalado. |

No se debe añadir ninguna dependencia hasta iniciar la implementación. Las
decisiones de producto y seguridad ya están cerradas en los documentos; las
únicas definiciones abiertas son las de cumplimiento de §14 y no bloquean el
desarrollo del MVP.

## 5. Estructura propuesta del backend

```text
Backend/
├── manage.py
├── requirements.txt              # o pyproject.toml; aún no existe
├── .env.example                  # variables, sin secretos reales
├── README.md
├── config/
│   ├── __init__.py
│   ├── urls.py                   # rutas raíz y /api/v1
│   ├── asgi.py
│   ├── wsgi.py
│   └── settings/
│       ├── __init__.py
│       ├── base.py               # configuración común
│       ├── dev.py                # DEBUG, CORS local
│       ├── prod.py               # seguridad y HTTPS
│       └── test.py               # base de test aislada
├── apps/
│   ├── __init__.py
│   ├── common/
│   │   ├── models.py             # UUIDModel, TimeStampedModel, IdempotencyRecord
│   │   ├── exceptions.py         # errores de dominio
│   │   ├── exception_handler.py  # JSON de error uniforme
│   │   ├── idempotency.py        # replay/conflicto de Idempotency-Key
│   │   ├── pagination.py
│   │   ├── permissions.py        # IsOwner / scoping
│   │   ├── mixins.py             # UserScopedQuerySetMixin
│   │   ├── validators.py         # montos, periodos, fechas
│   │   └── tests/
│   ├── users/
│   │   ├── models.py             # User personalizado
│   │   ├── managers.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services.py           # registro, términos, baja, cambio de contraseña
│   │   ├── tokens.py             # cookies HttpOnly + CSRF
│   │   ├── migrations/
│   │   └── tests/
│   ├── categories/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services.py
│   │   ├── migrations/
│   │   └── tests/
│   ├── movements/
│   │   ├── models.py             # Movement
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services.py           # crear/editar/borrar movimientos
│   │   ├── selectors.py          # listados y totales
│   │   ├── migrations/
│   │   └── tests/
│   ├── budgets/
│   │   ├── models.py             # Budget
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services.py
│   │   ├── selectors.py          # consumo y resumen
│   │   ├── migrations/
│   │   └── tests/
│   ├── savings/
│   │   ├── models.py             # SavingsGoal
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services.py           # metas y aportes
│   │   ├── selectors.py          # progreso y resumen
│   │   ├── migrations/
│   │   └── tests/
│   └── analytics/
│       ├── views.py              # dashboard y reportes (solo lectura)
│       ├── urls.py
│       ├── serializers.py        # forma de salida
│       ├── selectors.py          # agregaciones por rango
│       └── tests/
└── docs/                         # opcional; la documentación vive en /docs/backend
```

### 5.1 Responsabilidad de cada app

| App | Responsabilidad | Modelos |
| --- | --- | --- |
| `users` | Usuario, autenticación, perfil, contraseña, términos y baja de cuenta. | `User` |
| `categories` | Catálogo privado, categorías predeterminadas y clasificación 50/30/20. | `Category` |
| `movements` | Registro financiero y persistencia común de ingresos, gastos y transferencias; la creación de aportes se orquesta desde `savings`. | `Movement` |
| `budgets` | Límites mensuales y consumo. | `Budget` |
| `savings` | Metas y aportes (orquesta `Movement`). | `SavingsGoal` |
| `analytics` | Dashboard y reportes; sin escritura. | Ninguno |
| `common` | Base abstracta, idempotencia, permisos, paginación, errores y validadores. | `IdempotencyRecord` |

### 5.2 Dependencias entre apps

```text
users
  ↑
categories
  ↑
savings        (SavingsGoal necesita User)
  ↑
movements      (Movement referencia Category y SavingsGoal)
  ↑
budgets        (Budget referencia Category)
  ↑
analytics      (lee todos los modelos)
```

La dependencia no es simétrica entre modelos y servicios:

- **Modelos:** `Movement` referencia `Category` y `SavingsGoal`; `Budget`
  referencia `Category`; `SavingsGoal` referencia `User`. Por eso
  `movements`/`budgets` dependen de modelos de `categories`/`savings`.
- **Servicios:** `savings.services` llama a `movements.services` para persistir
  el aporte. `movements.services` **no** importa `savings.services`.
- El ciclo se rompe con referencias por string (`"savings.SavingsGoal"`,
  `"categories.Category"`) y con llamadas internas dentro del servicio de
  movimientos. No se importan modelos de `savings` en el nivel superior de
  `movements.models`.
- `analytics` solo importa modelos y selectores; nunca es importado por las apps
  de escritura.

## 6. Servicios y selectores

### 6.1 Servicios de escritura

| Servicio | Operación | Transacción |
| --- | --- | --- |
| `users.services.register_user` | Crea usuario, registra `terms_accepted_at` y crea las categorías predeterminadas del catálogo. | Sí. |
| `users.services.change_password` | Verifica contraseña actual y guarda el hash. | Sí. |
| `users.services.deactivate_account` | Desactiva, revoca refresh tokens y conserva datos. | Sí. |
| `users.services.anonymize_account` | Anonimiza identidad y conserva la fila propietaria y la historia. | Sí. |
| `common.idempotency.execute` | Reproduce una respuesta confirmada o ejecuta el callback de creación y persiste movimiento + respuesta en la misma transacción. | Sí. |
| `categories.services.create_category` | Valida nombre/tipo y captura duplicados. | Sí. |
| `movements.services.persist_movement` | Servicio común interno: valida forma, resuelve relaciones y persiste el `Movement`; no se expone por HTTP. | Participa en la transacción del llamador. |
| `movements.services.create_income_expense` | Crea `income` o `expense` y rechaza `savings_transfer`; es el servicio del endpoint `POST /movements/`. | Sí. |
| `movements.services.create_savings_transfer` | Crea un `savings_transfer` con meta activa y sin categoría; solo lo llama `savings.services`. | Sí. |
| `movements.services.update_movement` | Edita campos permitidos sin cambiar el tipo. | Sí. |
| `movements.services.delete_movement` | Elimina y deja que los agregados se recalculen. | Sí. |
| `budgets.services.create_budget` | Valida categoría de gasto, periodo y duplicado. | Sí. |
| `savings.services.create_goal` | Crea meta y valida unicidad activa. | Sí. |
| `savings.services.add_contribution` | Orquesta el aporte: valida la meta y llama a `movements.services.create_savings_transfer` con la clave de idempotencia. | Sí. |
| `savings.services.archive_goal` | Archiva sin borrar movimientos. | Sí. |

Los servicios reciben siempre `user` como argumento, nunca toman un `user_id` del
payload. Las creaciones financieras reciben además `idempotency_key`; el servicio
de idempotencia verifica la propiedad del registro y que el fingerprint coincida.
Devuelven instancias de modelo o lanzan errores de dominio.

### 6.2 Selectores de lectura

| Selector | Devuelve | Uso |
| --- | --- | --- |
| `movements.selectors.movement_totals` | Ingresos, gastos, ahorro, balance y disponible. | Listado y dashboard. |
| `budgets.selectors.budget_consumption` | Gasto por presupuesto, restante, porcentaje y estado. | Presupuestos. |
| `savings.selectors.goal_progress` | Ahorrado, restante, porcentaje, estado y nº de aportes. | Metas y reportes. |
| `analytics.selectors.dashboard_summary` | Resumen mensual completo + recientes. | Dashboard. |
| `analytics.selectors.report_overview` | Serie mensual, categorías, evolución y regla 50/30/20. | Reportes. |

**No debe existir más de una implementación de una misma fórmula.** Por ejemplo,
el gasto consumido de un presupuesto se calcula en
`budgets.selectors.budget_consumption` y se reutiliza en el resumen y en los
tests.

### 6.3 Frontera entre serializer, servicio y base de datos

| Nivel | Qué valida |
| --- | --- |
| Serializer | Tipos, campos obligatorios, importes > 0, longitudes, formato de fecha/periodo, UUID válidos. |
| Servicio | Propiedad de categoría/meta, coherencia de tipo, meta activa, duplicados de negocio, reglas de edición. |
| PostgreSQL | PK, FK, `CHECK` de forma, importes, periodos, unicidad, `PROTECT`. |

Las constraints de base de datos no reemplazan la validación de API: la base
protege la integridad aunque otro proceso escriba directamente.

## 7. Flujo de una petición

### 7.1 Escritura (ejemplo: aporte a una meta)

```mermaid
sequenceDiagram
    participant F as Frontend
    participant V as SavingsView
    participant I as common.idempotency
    participant S as savings.services
    participant M as movements.services
    participant DB as PostgreSQL

    F->>V: POST /savings-goals/{id}/contributions/<br/>Idempotency-Key
    V->>V: JWT, permisos, serializer
    V->>I: execute(user, key, operation, fingerprint, callback)
    I->>DB: SELECT IdempotencyRecord
    alt existe y el fingerprint coincide
        I-->>V: response_status + response_body
        V-->>F: respuesta original + Idempotent-Replay
    else no existe
        I->>S: add_contribution(user, goal_id, data)
        S->>DB: SELECT goal FOR UPDATE
        S->>S: valida propietario y no archivada
        S->>M: create_savings_transfer(user, goal, amount, date)
        M->>M: persist_movement(...)
        M->>DB: INSERT Movement(category=NULL, goal=...)
        S->>DB: consulta progreso
        S-->>I: movement + goal
        I->>DB: INSERT IdempotencyRecord(response)
        Note over I,DB: Movement + registro se confirman juntos
        I-->>V: resultado
        V-->>F: 201 JSON
    else existe y el fingerprint difiere
        I-->>V: 409 idempotency_conflict
        V-->>F: error uniforme
    end
    Note over I,DB: Si el INSERT choca con UNIQUE, la transacción perdedora revierte el Movement y consulta el registro confirmado en una transacción nueva.
```

La transacción abarca la creación del movimiento, la consulta de progreso y la
inserción del registro idempotente completo. No existe una fila intermedia.
Si dos peticiones concurrentes usan la misma clave, PostgreSQL serializa el
`INSERT` por `UNIQUE (user_id, idempotency_key)`: una confirma; la otra recibe
`IntegrityError`, sale del bloque atómico y, en una transacción nueva, reproduce
la respuesta confirmada o devuelve `409 idempotency_conflict` si el payload
difiere. Si la primera revirtió, la inserción de la segunda no encuentra
conflicto y la operación se completa. No se promete un 409 de «procesamiento en
curso». El `SELECT ... FOR UPDATE` evita que la meta se
archive entre la validación y la inserción; el archivado compite por la misma
fila. El flujo de `POST /movements/` es equivalente, con callback
`create_income_expense` y sin validación de meta.

### 7.2 Lectura (ejemplo: Dashboard)

1. El ViewSet valida `period` y `recent_limit`.
2. `analytics.selectors.dashboard_summary` ejecuta agregaciones SQL filtradas
   por `user_id` y rango.
3. Se reutilizan totales de movimientos, consumo de presupuestos, progreso de
   metas y regla 50/30/20.
4. El serializer de salida convierte `Decimal` a string con 2 decimales.
5. No se envía el `user_id` en la respuesta.

### 7.3 Mapeo de endpoints a apps

| Endpoint | App |
| --- | --- |
| `/auth/*`, `/users/me/*` | `users` |
| `/categories/*` | `categories` |
| `/movements/*` | `movements` + `common.idempotency`; `POST` solo `income`/`expense` |
| `/budgets/*` | `budgets` |
| `/savings-goals/*` | `savings` + `movements` + `common.idempotency`; los aportes son el único canal de `savings_transfer` |
| `/dashboard/*`, `/reports/*` | `analytics` |

## 8. Configuración Django propuesta

### 8.1 Settings

| Ajuste | Valor propuesto | Razón |
| --- | --- | --- |
| `AUTH_USER_MODEL` | `users.User` | Usuario con email, definido antes de la primera migración. |
| `DEFAULT_PERMISSION_CLASSES` | `IsAuthenticated` | Todo cerrado por defecto; solo auth es público. |
| `DEFAULT_AUTHENTICATION_CLASSES` | `JWTAuthentication` | API stateless. |
| `DEFAULT_PAGINATION_CLASS` | `PageNumberPagination` | Paginación estándar documentada. |
| `PAGE_SIZE` | `20` | Valor moderado. |
| `PAGE_SIZE_QUERY_PARAM` | `page_size` | Permitir 1–100. |
| `EXCEPTION_HANDLER` | Handler propio | Formato de error uniforme. |
| `TIME_ZONE` | `America/Bogota` | Fecha de negocio y presentación de timestamps. |
| `USE_TZ` | `True` | `timestamptz` en UTC. |
| `USE_I18N` | `True` | Textos y locale. |
| `LANGUAGE_CODE` | `es-co` | Mensajes de validación en español. |
| `ATOMIC_REQUESTS` | `False` | Transacciones explícitas en servicios, no en cada GET. |
| `CONN_MAX_AGE` | `60` | Reutilización de conexiones en producción. |
| `DEFAULT_AUTO_FIELD` | `BigAutoField` (irrelevante) | Todas las PK son UUID explícitas. |
| `SECURE_*` | Activos en `prod.py` | HTTPS/HSTS. |
| `CORS_ALLOWED_ORIGINS` | Lista desde entorno | Solo el frontend autorizado. |
| `CORS_ALLOW_CREDENTIALS` | `True` | Necesario para la cookie de refresh. |
| `CORS_ALLOW_HEADERS` | Incluye `Authorization`, `Content-Type`, `Idempotency-Key`, `X-CSRFToken` | Headers usados por el SPA. |
| `CSRF_TRUSTED_ORIGINS` | Lista desde entorno | Necesario para refresh/logout con cookie. |
| `CSRF_COOKIE_HTTPONLY` | `False` | El SPA debe leer la cookie para `X-CSRFToken`. |
| `CSRF_COOKIE_SECURE` | `True` en producción | HTTPS. |
| `REFRESH_COOKIE_*` | Configuración propia | `HttpOnly`, `Secure`, `SameSite`, `Path` y edad. |
| `IDEMPOTENCY_TTL_HOURS` | `24` | Expiración de claves de idempotencia. |

### 8.2 JWT

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
```

- `rest_framework_simplejwt.token_blacklist` debe estar en `INSTALLED_APPS`.
- Como el login es por correo, se requiere un `TokenObtainPairSerializer`
  personalizado que resuelva `email` y devuelva también `user`, en lugar del
  login por `username` de SimpleJWT.
- El registro y el login devuelven `user`, `access`, `token_type` y `expires_in`
  en JSON. **No devuelven `refresh` en el cuerpo.**
- El refresh token se entrega en una cookie `HttpOnly` (nombre
  `refresh_token`), `Secure` en producción, con `Path=/api/v1/auth/` y
  `SameSite=Lax` o `None; Secure` según el despliegue. El access token se
  mantiene solo en memoria en el SPA.
- El refresh y el logout leen la cookie y exigen `X-CSRFToken`, validado contra
  la cookie `csrftoken` de Django. Se implementan vistas propias; no se acepta el
  refresh en el cuerpo.
- `GET /auth/csrf/` establece/renueva la cookie CSRF. El SPA la lee (no es
  `HttpOnly`) y envía el header.
- Al rotar, el refresh anterior se agrega a la lista negra. Logout revoca el
  refresh actual y borra la cookie.
- El refresh no se guarda en `localStorage` ni en `sessionStorage`.
- `JWTAuthentication` debe rechazar usuarios con `is_active=False`; así una
  desactivación o anonimización invalida el acceso en la siguiente petición,
  además de la revocación de refresh tokens.

### 8.3 Variables de entorno

Nombres propuestos, sin valores reales:

```text
DJANGO_SECRET_KEY=
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://usuario:clave@localhost:5432/finanzaspro
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
JWT_SIGNING_KEY=
REFRESH_COOKIE_SECURE=false
REFRESH_COOKIE_SAMESITE=Lax
IDEMPOTENCY_TTL_HOURS=24
```

`REFRESH_COOKIE_SECURE` debe ser `true` en producción. Si frontend y API están
en sitios distintos, `REFRESH_COOKIE_SAMESITE=None` exige HTTPS. No se debe
versionar `.env`. Se versiona `.env.example` sin secretos.

## 9. Seguridad

### 9.1 Autenticación y sesión

- JWT con access token corto y refresh rotativo.
- Refresh token en cookie `HttpOnly`, `Secure` en producción y `Path`
  restringido; access token solo en memoria. No se usa `localStorage` para el
  refresh.
- CSRF double-submit para refresh/logout: cookie `csrftoken` + header
  `X-CSRFToken`. CORS con credenciales y origen explícito.
- Contraseñas con hashing de Django y validadores (`MinimumLengthValidator`,
  `CommonPasswordValidator`, `NumericPasswordValidator`,
  `UserAttributeSimilarityValidator`).
- Login con mensaje genérico para no revelar existencia de correos; una cuenta
  inactiva responde como credenciales inválidas.
- Throttling en `/auth/login/`, `/auth/register/` y `/auth/refresh/`; por
  ejemplo, 5–10 intentos por minuto por IP/cuenta. Valores a ajustar.
- No registrar tokens, contraseñas, cookies ni payloads sensibles en logs.
- En producción: HTTPS, HSTS, `DEBUG=False`, `ALLOWED_HOSTS` cerrado, cookies
  `Secure`, `CSRF_TRUSTED_ORIGINS` y CORS con lista explícita.
- La desactivación/anonimización revoca refresh tokens; el access token deja de
  servir porque la autenticación verifica `is_active`.

### 9.2 Autorización por propietario

- Todos los recursos heredan de un mixin que filtra por `request.user`.
- `get_queryset()` nunca devuelve filas de otro usuario.
- Los IDs de otro usuario responden **404**, no 403, para no confirmar su
  existencia.
- El payload nunca contiene `user_id`; si se envía, se ignora o se rechaza.
- Al crear/editar, las relaciones se resuelven con:
  ```python
  get_object_or_404(Category, id=category_id, user=request.user)
  get_object_or_404(SavingsGoal, id=goal_id, user=request.user)
  ```
- Se prohíbe usar `Model.objects.get(id=...)` sin el filtro de usuario en
  cualquier vista o servicio de negocio.
- Tests obligatorios de IDOR: usuario A intenta leer, editar, borrar y aportar a
  recursos de B.

### 9.3 Validación de datos

- Importes con `DecimalField(max_digits=14, decimal_places=2)` y validador
  `> 0`; rechazar `NaN`, `Infinity`, negativos y más de 2 decimales.
- `Category.kind` contra `Movement.movement_type`.
- `Category.kind = expense` para presupuestos.
- Meta del mismo usuario y no archivada.
- Periodo `YYYY-MM` válido; rango de reportes `to >= from`; presets mensuales
  calculados como meses calendario completos.
- Descripciones con longitud y `TRIM`; `SavingsGoal.description` máximo 2000.
- UUID válidos en rutas, QuerySets e `Idempotency-Key`.
- Límites de `page_size` y `recent_limit`.
- `accept_terms` obligatorio y `true` en el registro; fecha fijada por el
  servidor.
- Contraseña actual en desactivación/anonimización y confirmación explícita en
  la eliminación.
- Fingerprint de idempotencia y unicidad de la clave por usuario.

### 9.4 Integridad y transacciones

- `transaction.atomic()` en todos los servicios de escritura.
- `select_for_update()` sobre la meta al crear/editar un aporte para evitar
  carreras con el archivado.
- `select_for_update()` sobre la categoría al crear/editar un presupuesto si se
  quiere evitar que cambie de estado mientras se valida.
- Las constraints únicas de negocio (categoría, presupuesto y meta activa) se
  refuerzan capturando `IntegrityError` y devolviendo `409 duplicate_resource`.
  La unicidad de idempotencia se maneja aparte: replay de la respuesta o
  `409 idempotency_conflict`; nunca se traduce a `duplicate_resource`.
- `ProtectedError` se traduce a `409 resource_in_use`.
- El registro de usuario, términos y categorías predeterminadas va en una sola
  transacción.
- La creación del `Movement`, la serialización de la respuesta y la inserción
  del `IdempotencyRecord` completo van en la misma transacción. Una clave
  concurrente se resuelve por `UNIQUE (user_id, idempotency_key)`: la petición
  perdedora hace rollback —incluido su movimiento—, consulta el registro
  confirmado y reproduce la respuesta, o devuelve `409 idempotency_conflict`.
  No existe un estado intermedio ni una respuesta 409 de «procesamiento en curso».
- Si la primera transacción revierte, su registro y su movimiento desaparecen; el
  `INSERT` de la petición concurrente puede confirmarse sin conflicto. Capturar
  `IntegrityError` fuera del bloque atómico y no reutilizar la transacción rota.
- El archivado de una meta y la conservación de sus movimientos son atómicos.
- La desactivación/anonimización y la revocación de tokens son atómicas.
- No se usan contadores desnormalizados. Si en el futuro se añaden, cada
  actualización requerirá bloqueo de fila y una prueba de concurrencia.

### 9.5 Errores consistentes

Un `exception_handler` de DRF transforma:

- errores de serializers → `validation_error` con `details` por campo;
- `NotFound` → `not_found`;
- `PermissionDenied` → `permission_denied`;
- `AuthenticationFailed`/token inválido → `authentication_required`,
  `invalid_token` o `invalid_credentials`;
- CSRF inválido en refresh/logout → `403 csrf_failed`;
- contraseña actual incorrecta → `400 reauth_failed`;
- errores de dominio (`DuplicateResource`, `ResourceInUse`, `ArchivedGoal`) →
  `409` con su código;
- idempotencia: `400 idempotency_key_required`/`invalid_idempotency_key`,
  `409 idempotency_conflict`;
- excepciones no controladas → `500 server_error` con `request_id`, sin stack
  trace en la respuesta.

Los endpoints de autenticación también usan este formato, no el `detail` por
defecto de SimpleJWT.

## 10. Estrategia de consultas y rendimiento

1. **Agregar en PostgreSQL**, no en Python: `Sum`, `Count`, `TruncMonth`,
   `Coalesce`, filtros por rango.
2. **Evitar N+1** con `select_related("category", "savings_goal")` en listados y
   `prefetch_related` solo cuando se necesiten colecciones.
3. **Paginación** en movimientos, presupuestos, metas y aportes.
4. **Totales del listado** calculados sobre el queryset filtrado completo, no
   sobre la página.
5. **Índices** definidos en `database-design.md`.
6. **No cachear** en la primera versión. Si se añade caché, invalidar por
   usuario y por mutaciones de movimientos, presupuestos y metas.
7. Para reportes grandes, medir `EXPLAIN ANALYZE`; los índices propuestos cubren
   usuario + fecha, usuario + tipo + fecha y usuario + categoría + fecha.
8. Las consultas de lectura no deben cargar todos los movimientos del usuario
   para sumarlos en memoria.
9. La tabla de idempotencia se limpia por `expires_at` con una tarea periódica;
   no se consulta en endpoints de lectura.

## 11. Testing

### 11.1 Niveles

| Nivel | Herramienta | Qué prueba |
| --- | --- | --- |
| Unitario de reglas | `TestCase` / funciones puras | Fórmulas de balance, presupuesto, progreso y 50/30/20. |
| Servicios | `TestCase` con base de test | Validaciones, transacciones, duplicados y propiedad. |
| API | `APIClient` de DRF | Códigos HTTP, contrato JSON, permisos y errores. |
| Base de datos | `IntegrityError` / constraints | Checks de forma, unicidad y `PROTECT`. |
| Regresión financiera | Casos con `Decimal` | Que los aportes no contaminen gastos/presupuestos. |
| Concurrencia | Transacciones controladas | Archivado vs aporte, presupuesto duplicado, misma `Idempotency-Key` en paralelo. |

### 11.2 Casos mínimos

- Registro con y sin `accept_terms`, creación de categorías predeterminadas,
  login, refresh por cookie, logout y cambio de contraseña.
- Refresh/logout sin CSRF devuelven `403`; no se acepta refresh en el cuerpo.
- Usuario A no accede a recursos de B (lectura, edición, borrado, aporte).
- Desactivación y anonimización: tokens revocados, login bloqueado, movimientos
  con propietario y datos históricos conservados.
- Crear ingreso/gasto válidos e inválidos por `POST /movements/`.
- `POST /movements/` rechaza `savings_transfer` con `400`; los aportes solo se
  crean por `POST /savings-goals/{id}/contributions/`.
- La restricción de forma impide transferencia con categoría.
- `POST /movements/` y aporte sin `Idempotency-Key` fallan; reintento idéntico
  no duplica y reproduce la respuesta; payload distinto devuelve `409
  idempotency_conflict`.
- Dos peticiones concurrentes con la misma clave producen un solo movimiento;
  una confirma y la otra reproduce la respuesta. Si la ganadora revierte, la
  perdedora puede crear el movimiento; no se prueba ni se espera un 409 de
  «procesamiento en curso».
- Crear aporte no modifica gastos ni presupuestos; sí modifica disponible y
  progreso.
- `status` de la meta es de solo lectura y se recalcula al crear, editar, aportar
  o eliminar; no se acepta `status` en POST/PATCH.
- Editar/eliminar aporte recalcula.
- Presupuesto duplicado devuelve 409.
- Categoría en uso devuelve 409.
- Meta archivada rechaza aportes.
- Totales del Dashboard y Reportes coinciden con los selectores y con el mismo
  mes completo.
- `current_month` de Reportes termina el último día del mes, no hoy.
- Sin ingresos, la regla 50/30/20 devuelve porcentajes 0 y recomendados 0.
- Una sección por encima del porcentaje recomendado devuelve diferencia
  positiva sin recorte.
- Regla 50/30/20 excluye aportes de necesidades/deseos y los incluye en ahorro.
- Importes serializados con dos decimales.

No se implementan tests todavía; esta es la cobertura objetivo.

## 12. Estrategia de integración con el frontend

El frontend no se modifica en esta etapa. Cuando el backend esté listo:

1. Implementar `request()` en `Frontend/src/services/api.js`:
   - base URL `/api/v1`;
   - `Authorization: Bearer`;
   - `credentials: "include"` solo para refresh/logout;
   - lectura de la cookie `csrftoken` y envío de `X-CSRFToken`;
   - refresh automático una vez ante `401`;
   - generación/reutilización de `Idempotency-Key` en creaciones financieras;
   - normalización del error `{error: {...}}`.
2. Crear un adaptador de datos para mapear:
   - `full_name` ↔ `name`;
   - `description` ↔ `nombre`/`descripcion`;
   - `amount` string ↔ `valor`/`monto`;
   - `movement_type` ↔ `tipo`;
   - `category` objeto ↔ `categoria` string;
   - `period` ↔ `mes`;
   - `target_amount` ↔ `objetivo`;
   - `saved_amount` ↔ `ahorrado`;
   - `deadline` ↔ `fechaLimite`;
   - `available_money` ↔ `disponible`;
   - estados `in_progress/completed/expired` ↔ `en-progreso/completada/vencida`.
3. Reemplazar los providers mock por fetching real, manteniendo la misma interfaz
   de contexto cuando sea posible.
4. Implementar autenticación y protección de rutas (hoy no existen). El access
   token vive en memoria; al recargar, se recupera con el refresh cookie.
5. Consumir `available_money` en el Dashboard, no recalcularlo como
   ingresos − gastos.
6. Añadir el tipo `savings_transfer` al adaptador y a la UI solo en la fase de
   integración. El contrato ya lo soporta.
7. Resolver la categoría personalizada: crear/reutilizar categoría antes de
   enviar el movimiento. No se acepta una categoría por nombre en el movimiento.
8. Actualizar `.env` a `http://localhost:8000/api/v1`.
9. Configurar CORS con credenciales solo para el origen del frontend y
   `CSRF_TRUSTED_ORIGINS` correspondiente.
10. Ajustar los presets de Reportes al mes calendario completo y consumir los
    agregados del backend.

### 12.1 Riesgos de integración detectados

| Riesgo | Mitigación |
| --- | --- |
| Los contextos actuales calculan totales en el cliente | Usar los agregados de la API; no sumar solo la página visible. |
| El frontend no conoce `savings_transfer` | Adaptador y fase de UI específica; no reutilizar `gastos`. |
| IDs numéricos vs UUID | Cambiar claves de React y comparaciones a string/UUID. |
| Operaciones de contexto síncronas (`{ok}` inmediato) | Convertir a async y manejar errores de red en la fase de integración. |
| Categoría personalizada | Crear categoría primero; no hay endpoint de movimiento por nombre. |
| Fechas ISO con hora vs `date` | Enviar `YYYY-MM-DD`; no usar `new Date().toISOString()` para la fecha contable. |
| Reporte de mes actual termina hoy | Cambiar los presets al último día del mes; el backend no trunca. |
| Refresh en `localStorage` | Usar cookie `HttpOnly` + CSRF; access token solo en memoria. |
| Doble envío de movimientos | Generar una `Idempotency-Key` por acción y reutilizarla en reintentos. |
| CORS sin credenciales | Configurar `credentials: "include"` y CORS/CSRF explícitos en desarrollo y producción. |

## 13. Fases de implementación recomendadas

| Fase | Entregable | Criterio de aceptación |
| --- | --- | --- |
| 0 | Revisión de decisiones oficiales y pendientes de cumplimiento de §14 | No hay bloqueos de diseño para el MVP. |
| 1 | Proyecto Django + settings + PostgreSQL local | `manage.py check`, conexión y migración inicial. |
| 2 | `User` personalizado + JWT en cookie + CSRF + términos + perfil | Registro/login/refresh/logout, categorías predeterminadas y tests de auth. |
| 3 | `Category` + CRUD | Unicidad, propiedad, catálogo inicial y `PROTECT`. |
| 4 | `Movement` + idempotencia + restricciones | Ingresos y gastos por `/movements/`; `Idempotency-Key`; check de forma; tests de gasto. El modelo admite transferencias, pero su endpoint se habilita en la fase 6. |
| 5 | `Budget` + consumo | Duplicados, estados y exclusión de ahorro. |
| 6 | `SavingsGoal` + aportes | Progreso derivado, `status` calculado, sobreahorro, archivo y aportes transaccionales por `/savings-goals/{id}/contributions/`. |
| 7 | Dashboard + Reportes | Agregados reutilizados, meses completos y contrato completo. |
| 8 | Baja de cuenta + OpenAPI + revisión de seguridad + adaptador frontend | Anonimización, documentación viva y primera integración. |

Cada fase debe incluir su migración, tests y actualización del contrato si cambia.

## 14. Decisiones pendientes (no bloqueantes)

El modelo, los endpoints, los cálculos y las decisiones de seguridad del MVP
están cerrados. Quedan dos definiciones de cumplimiento que no impiden iniciar la
implementación:

1. **Versionado de términos y privacidad.** El MVP registra
   `terms_accepted_at`, pero no la versión aceptada. Si legal exige demostrar la
   versión, se añadirán campos a `User` y al registro. Consecuencia: cambio de
   esquema y del contrato de registro; no afecta la lógica financiera.
2. **Retención legal y purga física.** El MVP desactiva o anonimiza la cuenta y
   conserva la historia bajo la fila anonimizada. Una purga física futura requiere
   un plazo legal y un proceso administrativo transaccional que elimine en orden
   sin dejar movimientos huérfanos. Queda fuera de la API pública del MVP.

No hay decisiones pendientes sobre: moneda (COP), zona horaria
(`America/Bogota`), prefijo (`/api/v1`), refresh en cookie, idempotencia,
categorías predeterminadas, sobreahorro, retiros (fuera del MVP), archivo de
metas, periodos completos, base 50/30/20 sin ingresos ni baja de cuenta.

## 15. Lo que no se ha hecho

- No se creó ningún proyecto Django.
- No se definieron modelos Python ni migraciones.
- No se instalaron dependencias.
- No se modificó ningún archivo del frontend.
- No se conectó la base de datos.
- No se eliminó ninguna funcionalidad existente.

La documentación es la base para iniciar la implementación. Los pendientes de
§14 son de cumplimiento y no bloquean el desarrollo del MVP.
