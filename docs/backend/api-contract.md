# Contrato de API — FinanzasPro

> Estado: **contrato oficial del MVP, pendiente de implementación**. No hay backend
> implementado todavía.
> Base URL local: `http://localhost:8000/api/v1`
> Formato: JSON UTF-8. Autenticación: JWT Bearer para el access token y refresh
> token en cookie `HttpOnly` (Django REST Framework + SimpleJWT).
> Modelo de datos canónico: [diseño de base de datos](./database-design.md).
> Reglas de cálculo: [reglas de negocio](./business-rules.md).

## 1. Convenciones generales

### 1.1 Versionado y rutas

- Todas las rutas llevan prefijo **`/api/v1`**. La decisión está cerrada; el
  frontend deberá actualizar `VITE_API_URL` a `http://localhost:8000/api/v1`.
- Las rutas terminan en `/`.
- Los identificadores son UUID en formato string.
- Los nombres de campos de la API son `snake_case` en inglés. El frontend puede
  conservar sus nombres en español mediante una capa de adaptación; los nombres
  de categorías y metas son datos y pueden estar en español.

### 1.2 Autenticación y sesión

- `Authorization: Bearer <access_token>` en todas las rutas protegidas.
- El **access token** dura 15 minutos; se mantiene solo en memoria en el SPA y
  nunca en `localStorage`.
- El **refresh token** dura 7 días, rota en cada refresh y se envía en una cookie
  `HttpOnly`, `Secure` en producción, con `SameSite=Lax` en un despliegue
  same-site o `SameSite=None; Secure` si frontend y API están en sitios distintos.
  La cookie tiene `Path=/api/v1/auth/` para que no viaje en cada petición.
- El refresh token **nunca** se devuelve en el cuerpo JSON ni se guarda en
  `localStorage`/`sessionStorage`.
- Los endpoints que usan la cookie (`/auth/refresh/` y `/auth/logout/`) exigen el
  header `X-CSRFToken` y la cookie `csrftoken` (double-submit de Django). El
  endpoint `GET /auth/csrf/` obtiene/renueva la cookie CSRF cuando el SPA la
  necesita.
- La cookie CSRF no es `HttpOnly` (el SPA debe leerla para enviar el header),
  pero no contiene el refresh token.
- Son públicos: registro, login, refresh, CSRF y documentación OpenAPI. Logout
  requiere cookie de refresh válida y CSRF; no exige access token vigente.
- Los errores de autenticación no deben revelar si un correo existe.
- CORS debe permitir credenciales solo desde el origen explícito del frontend y
  aceptar los headers `Authorization`, `Content-Type`, `Idempotency-Key` y
  `X-CSRFToken`.

### 1.3 Tipos de datos

| Dato | Representación JSON | Ejemplo |
| --- | --- | --- |
| UUID | string | `"7f1c2a4e-9b1d-4c3a-8e2f-1a2b3c4d5e6f"` |
| Importe | **string decimal** con 2 decimales | `"145000.00"` |
| Fecha de negocio | string ISO `YYYY-MM-DD` | `"2026-11-10"` |
| Fecha/hora | string ISO 8601 UTC | `"2026-11-11T15:30:00Z"` |
| Periodo | string `YYYY-MM` | `"2026-11"` |
| Enumeraciones | string en minúsculas | `"expense"` |

Los importes se envían y reciben como string para no perder precisión. El
frontend puede convertirlos con `Number(...)` solo para mostrar; nunca debe
enviar números flotantes calculados. Las fechas de negocio no llevan hora.

Todos los importes están en **COP**; no existe campo `currency` ni conversión en
el MVP. No se implementan cuentas bancarias, saldos iniciales ni multimoneda.

### 1.4 Enumeraciones

| Campo | Valores | Significado |
| --- | --- | --- |
| `movement_type` | `income`, `expense`, `savings_transfer` | Ingreso, gasto o transferencia a ahorro. |
| `Category.kind` | `income`, `expense` | Tipo de categoría. |
| `Category.rule_503020_group` | `needs`, `wants`, `null` | Clasificación 50/30/20; solo gastos. |
| `Budget.status` | `normal`, `warning`, `exceeded` | Consumo < 80 %, 80–100 %, > 100 %. |
| `SavingsGoal.status` | `in_progress`, `completed`, `expired` | En progreso, completada, vencida; calculado de solo lectura. |
| Filtro `period` | `current_month`, `previous_month`, `last_3_months`, `last_6_months`, `current_year`, `custom` | Periodos predefinidos para reportes; los mensuales usan meses completos. |
| `IdempotencyRecord.operation` | `create_income_expense`, `create_savings_transfer` | Operación financiera protegida por clave. |

### 1.5 Paginación

Los listados usan paginación estándar de DRF:

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/v1/movements/?page=2",
  "previous": null,
  "results": []
}
```

Parámetros: `page` (entero ≥ 1) y `page_size` (1–100, por defecto 20).
Los listados de movimientos, presupuestos y metas añaden un objeto `summary` o
`totals` calculado sobre **todo el conjunto filtrado**, no solo sobre la página.

### 1.6 Formato de errores

Todos los errores usan la misma estructura, incluso los de validación:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Los datos enviados no son válidos.",
    "details": {
      "amount": ["El monto debe ser mayor que cero."],
      "category_id": ["La categoría no pertenece al usuario autenticado."]
    },
    "request_id": "req_01JABCDEF"
  }
}
```

`details` es opcional. Un error de negocio general puede no tener `details`.

| HTTP | `code` | Cuándo |
| --- | --- | --- |
| 400 | `validation_error` | Campos inválidos o regla de negocio incumplida. |
| 400 | `idempotency_key_required` | Falta `Idempotency-Key` en una creación financiera. |
| 400 | `invalid_idempotency_key` | El header no es un UUID válido. |
| 400 | `reauth_failed` | La contraseña actual no coincide en una operación sensible. |
| 401 | `authentication_required` | Falta el access token o está vencido. |
| 401 | `invalid_credentials` | Correo o contraseña incorrectos en el login. |
| 401 | `invalid_token` | Token malformado, vencido o revocado. |
| 403 | `permission_denied` | El usuario no tiene permiso para la acción. |
| 403 | `csrf_failed` | Falta o no coincide el token CSRF en refresh/logout. |
| 404 | `not_found` | Recurso inexistente **o de otro usuario** (no se filtra su existencia). |
| 405 | `method_not_allowed` | Método HTTP no permitido. |
| 409 | `duplicate_resource` | Correo, categoría, presupuesto o meta duplicados. |
| 409 | `resource_in_use` | Categoría con movimientos/presupuestos. |
| 409 | `archived_goal` | Intento de aportar a una meta archivada o editar una meta archivada. |
| 409 | `idempotency_conflict` | Misma clave con un payload/operación diferente. |
| 429 | `throttled` | Límite de peticiones excedido. |
| 500 | `server_error` | Error no controlado; incluir `request_id`. |

Los errores de validación de DRF (`{"field": [...]}`) deben mapearse al formato
anterior mediante un `EXCEPTION_HANDLER` personalizado. Las respuestas 404 de
recursos de otro usuario también usan `not_found`, para evitar enumeración.

### 1.7 Reglas transversales

- Todo recurso de negocio se filtra por el usuario del token. Nunca se acepta
  `user_id` en el cuerpo de una petición.
- Los ID de categorías, metas y movimientos de otro usuario responden `404`.
- `POST` de creación devuelve `201`; `DELETE` devuelve `204` sin cuerpo.
- No se permite cambiar `movement_type` ni `Category.kind` después de creados.
- Los importes siempre son positivos; el significado lo da el tipo.
- Escrituras que afectan varias filas se ejecutan en una transacción atómica.
- El refresh token no se expone en JSON; la API usa cookies `HttpOnly` y CSRF.
- Toda creación financiera (ingreso/gasto o aporte a meta) exige
  `Idempotency-Key`.

### 1.8 Idempotencia de creaciones financieras

`Idempotency-Key` es **obligatorio** en `POST /movements/` y en
`POST /savings-goals/{id}/contributions/`. El valor debe ser un UUID válido
generado por el cliente para cada acción del usuario; el cliente debe reutilizar
la misma clave al reintentar esa acción. Las claves de las dos operaciones no son
intercambiables: la misma clave usada en endpoints distintos produce
`409 idempotency_conflict`.

Comportamiento:

1. La clave se guarda en `IdempotencyRecord` junto con un fingerprint SHA-256 del
   método, la operación, la ruta normalizada y el cuerpo canónico.
2. Si ya existe un registro confirmado para `(user_id, idempotency_key)` con el
   **mismo fingerprint**, se reproducen el código HTTP y el cuerpo originales, con
   `Idempotent-Replay: true`. No se crea otro movimiento.
3. Si existe con un fingerprint distinto, se devuelve
   `409 idempotency_conflict`.
4. Si no existe, se crea el movimiento, se serializa la respuesta y se inserta el
   registro de idempotencia **completo** dentro de la misma transacción atómica.
   El movimiento y la respuesta quedan confirmados o revertidos juntos.
5. Si dos peticiones concurrentes usan la misma clave, PostgreSQL arbitra mediante
   `UNIQUE (user_id, idempotency_key)`. Una confirma la transacción; la otra
   recibe `IntegrityError` al insertar, hace rollback, consulta el registro
   confirmado en una transacción nueva y reproduce la respuesta o devuelve
   `409 idempotency_conflict` si el fingerprint no coincide. Si la operación
   ganadora revirtió, la inserción de la otra no encuentra conflicto y la
   operación puede completarse.
6. No se devuelve un 409 de «procesamiento en curso»: no hay una fila intermedia
   visible ni se promete ese comportamiento. La segunda petición espera la
   resolución de la restricción única.
7. Los errores de validación no se almacenan: el cliente puede corregir el
   payload y reintentar. Los errores 500 tampoco se almacenan.
8. La clave expira a las 24 horas. El registro se elimina en una tarea de
   limpieza; el cliente debe generar una clave nueva por acción y no reutilizarla
   después de ese plazo.
9. La clave no viaja en el cuerpo ni en la respuesta; solo en el header.
10. Una respuesta completada se reproduce aunque el movimiento se edite o elimine
    después dentro de la ventana de 24 h. La clave representa una operación ya
    aceptada; para una operación nueva el cliente debe generar otra clave.

La tabla y las restricciones están en `database-design.md` §4.6. La creación del
movimiento y el registro idempotente deben confirmarse en la **misma**
transacción.

## 2. Resumen de endpoints

| # | Método | Ruta | Descripción | Auth |
| --- | --- | --- | --- | --- |
| 1 | POST | `/auth/register/` | Registrar usuario, crear categorías predeterminadas y devolver access token. | No |
| 2 | POST | `/auth/login/` | Iniciar sesión con email y contraseña. | No |
| 3 | POST | `/auth/refresh/` | Renovar el access token usando la cookie de refresh. | No (cookie + CSRF) |
| 4 | POST | `/auth/logout/` | Revocar el refresh token y borrar la cookie. | Cookie + CSRF |
| 5 | GET | `/auth/csrf/` | Obtener o renovar la cookie CSRF. | No |
| 6 | GET | `/users/me/` | Consultar el perfil autenticado. | Sí |
| 7 | PATCH | `/users/me/` | Actualizar el perfil autenticado. | Sí |
| 8 | POST | `/users/me/password/` | Cambiar la contraseña. | Sí |
| 9 | POST | `/users/me/deactivate/` | Desactivar la cuenta conservando sus datos. | Sí |
| 10 | DELETE | `/users/me/` | Anonimizar la cuenta y conservar la historia financiera. | Sí |
| 11 | GET | `/categories/` | Listar categorías del usuario. | Sí |
| 12 | POST | `/categories/` | Crear categoría. | Sí |
| 13 | GET | `/categories/{id}/` | Consultar una categoría. | Sí |
| 14 | PATCH | `/categories/{id}/` | Editar nombre o grupo 50/30/20. | Sí |
| 15 | DELETE | `/categories/{id}/` | Eliminar una categoría sin uso. | Sí |
| 16 | GET | `/movements/` | Listar y sumar movimientos filtrados. | Sí |
| 17 | POST | `/movements/` | Crear ingreso o gasto (`income`/`expense`). | Sí |
| 18 | GET | `/movements/{id}/` | Consultar un movimiento. | Sí |
| 19 | PATCH | `/movements/{id}/` | Editar un movimiento sin cambiar su tipo. | Sí |
| 20 | DELETE | `/movements/{id}/` | Eliminar un movimiento (incluye aportes). | Sí |
| 21 | GET | `/budgets/` | Listar presupuestos y resumen del periodo. | Sí |
| 22 | POST | `/budgets/` | Crear presupuesto mensual por categoría. | Sí |
| 23 | GET | `/budgets/{id}/` | Consultar un presupuesto. | Sí |
| 24 | PATCH | `/budgets/{id}/` | Editar límite y/o periodo. | Sí |
| 25 | DELETE | `/budgets/{id}/` | Eliminar un presupuesto. | Sí |
| 26 | GET | `/savings-goals/` | Listar metas y resumen global. | Sí |
| 27 | POST | `/savings-goals/` | Crear meta de ahorro. | Sí |
| 28 | GET | `/savings-goals/{id}/` | Consultar meta con progreso. | Sí |
| 29 | PATCH | `/savings-goals/{id}/` | Editar meta. | Sí |
| 30 | DELETE | `/savings-goals/{id}/` | Archivar meta (conserva historia). | Sí |
| 31 | GET | `/savings-goals/{id}/contributions/` | Historial de aportes de la meta. | Sí |
| 32 | POST | `/savings-goals/{id}/contributions/` | Crear el único canal de aportes (`savings_transfer`). | Sí |
| 33 | GET | `/dashboard/summary/` | Resumen del dashboard por mes. | Sí |
| 34 | GET | `/reports/overview/` | Datos consolidados de reportes por rango. | Sí |

Quedan **fuera del MVP** y no tienen endpoint: retiros de ahorro, cuentas
bancarias, saldos iniciales, cambio de correo, recuperación de contraseña,
verificación de correo, exportación de reportes e integraciones bancarias
externas. Se documentan solo como mejoras futuras.

El registro crea automáticamente el catálogo de categorías de
`database-design.md` §4.2.1. El usuario puede editar o eliminar esas categorías
como cualquier categoría propia, respetando `PROTECT`.

## 3. Recursos de respuesta

### 3.1 `UserResource`

```json
{
  "id": "8a1f3c2e-1b2c-4d5e-9f6a-7b8c9d0e1f2a",
  "email": "laura@example.com",
  "full_name": "Laura Gómez",
  "is_active": true,
  "terms_accepted_at": "2026-11-11T15:30:00Z",
  "date_joined": "2026-11-11T15:30:00Z",
  "updated_at": "2026-11-11T15:30:00Z"
}
```

Nunca incluye `password`, `is_staff`, `is_superuser`, `deactivated_at` ni
`anonymized_at`. `terms_accepted_at` es la prueba de aceptación registrada por el
servidor.

### 3.2 `CategoryResource`

```json
{
  "id": "c1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f601",
  "name": "Alimentación",
  "kind": "expense",
  "rule_503020_group": "needs",
  "created_at": "2026-11-01T12:00:00Z",
  "updated_at": "2026-11-01T12:00:00Z"
}
```

`rule_503020_group` es `"needs"`, `"wants"` o `null`. En categorías de ingreso
siempre es `null`.

### 3.3 `MovementResource`

Ingreso o gasto:

```json
{
  "id": "d1e2f3a4-b5c6-4d7e-8f90-a1b2c3d4e5f6",
  "movement_type": "expense",
  "amount": "145000.00",
  "description": "Supermercado Éxito",
  "movement_date": "2026-11-10",
  "category": {
    "id": "c1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f601",
    "name": "Alimentación",
    "kind": "expense"
  },
  "savings_goal": null,
  "created_at": "2026-11-10T18:22:00Z",
  "updated_at": "2026-11-10T18:22:00Z"
}
```

Transferencia a ahorro:

```json
{
  "id": "e1f2a3b4-c5d6-4e7f-9a80-b1c2d3e4f5a6",
  "movement_type": "savings_transfer",
  "amount": "800000.00",
  "description": "Aporte quincenal al fondo",
  "movement_date": "2026-11-11",
  "category": null,
  "savings_goal": {
    "id": "f1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f607",
    "name": "Fondo de Emergencia"
  },
  "created_at": "2026-11-11T14:00:00Z",
  "updated_at": "2026-11-11T14:00:00Z"
}
```

La transferencia **no tiene categoría**. Esa es la garantía visible de que no
entra en presupuestos ni en gastos. En este recurso se puede leer una
transferencia existente; su **creación** se hace exclusivamente por
`POST /savings-goals/{id}/contributions/`, no por `POST /movements/`.

### 3.4 `BudgetResource`

```json
{
  "id": "a1b2c3d4-e5f6-4a70-8b91-c2d3e4f5a607",
  "period": "2026-11",
  "category": {
    "id": "c1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f601",
    "name": "Alimentación"
  },
  "limit_amount": "300000.00",
  "spent_amount": "181500.00",
  "remaining_amount": "118500.00",
  "exceeded_amount": "0.00",
  "usage_percent": 60.5,
  "status": "normal",
  "created_at": "2026-11-01T12:00:00Z",
  "updated_at": "2026-11-01T12:00:00Z"
}
```

`spent_amount` solo suma movimientos `expense` de la misma categoría y mes. Los
`savings_transfer` nunca se incluyen.

### 3.5 `SavingsGoalResource`

```json
{
  "id": "f1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f607",
  "name": "Fondo de Emergencia",
  "description": "Cubrir tres meses de gastos esenciales.",
  "target_amount": "3000000.00",
  "saved_amount": "1800000.00",
  "remaining_amount": "1200000.00",
  "progress_percent": 60.0,
  "status": "in_progress",
  "deadline": "2027-02-28",
  "contributions_count": 2,
  "archived_at": null,
  "created_at": "2026-10-01T12:00:00Z",
  "updated_at": "2026-11-11T14:00:00Z"
}
```

`saved_amount`, `remaining_amount`, `progress_percent`, `status` y
`contributions_count` son **campos calculados de respuesta**; no son columnas ni
se almacenan. `status` deriva de `target_amount`, `deadline` y la suma de
transferencias; `archived_at` indica el archivo y no añade un cuarto estado.
`status` nunca se acepta en un request. `progress_percent` puede
superar 100 si hay sobreahorro; el backend no recorta el valor. `status` usa la
fecha de negocio en `America/Bogota`.

### 3.6 `SavingsContributionResource`

Es el mismo `MovementResource` de tipo `savings_transfer`, pero el endpoint de
aportes garantiza la forma y añade comodidad:

```json
{
  "movement": {
    "id": "e1f2a3b4-c5d6-4e7f-9a80-b1c2d3e4f5a6",
    "movement_type": "savings_transfer",
    "amount": "800000.00",
    "description": "Aporte quincenal al fondo",
    "movement_date": "2026-11-11",
    "category": null,
    "savings_goal": {
      "id": "f1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f607",
      "name": "Fondo de Emergencia"
    },
    "created_at": "2026-11-11T14:00:00Z",
    "updated_at": "2026-11-11T14:00:00Z"
  },
  "goal": {
    "id": "f1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f607",
    "name": "Fondo de Emergencia",
    "saved_amount": "1800000.00",
    "remaining_amount": "1200000.00",
    "progress_percent": 60.0,
    "status": "in_progress"
  }
}
```

## 4. Autenticación

### 4.1 POST `/auth/register/`

| Atributo | Valor |
| --- | --- |
| Descripción | Crea una cuenta, registra la aceptación de términos, crea las categorías predeterminadas y devuelve el access token. |
| Autenticación | No |
| Éxito | `201 Created` |

**Request**

```json
{
  "full_name": "Laura Gómez",
  "email": "laura@example.com",
  "password": "MiClaveSegura123",
  "accept_terms": true
}
```

| Campo | Tipo | Obligatorio | Validación |
| --- | --- | --- | --- |
| `full_name` | string | Sí | 2–150 caracteres, `TRIM`. |
| `email` | string | Sí | Formato válido, único sin distinguir mayúsculas, se normaliza a minúsculas. |
| `password` | string | Sí | Mínimo 8 caracteres; validadores de Django; nunca se devuelve. |
| `accept_terms` | boolean | Sí | Debe ser `true`. El servidor fija `terms_accepted_at` con la hora actual; no acepta una fecha del cliente. |

La creación del usuario, la aceptación de términos y las categorías
predeterminadas de `database-design.md` §4.2.1 se ejecutan en una sola
transacción. Si falla cualquier paso, no se crea la cuenta.

**Response `201`**

```json
{
  "user": { "...UserResource": true },
  "access": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

**Cookies de respuesta**

```http
Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth/; Max-Age=604800
Set-Cookie: csrftoken=<csrf>; Secure; SameSite=Lax; Path=/
```

En desarrollo se omite `Secure`; en un despliegue cross-site se usa
`SameSite=None; Secure`.

**Errores**: `400 validation_error` (incluye `accept_terms` falso),
`409 duplicate_resource`, `429 throttled`.

### 4.2 POST `/auth/login/`

| Atributo | Valor |
| --- | --- |
| Descripción | Autentica por correo y contraseña. |
| Autenticación | No |
| Éxito | `200 OK` |

**Request**

```json
{
  "email": "laura@example.com",
  "password": "MiClaveSegura123"
}
```

**Response `200`**: misma estructura que el registro; el refresh y el CSRF se
entregan mediante cookies, nunca en el JSON.

**Errores**: `400 validation_error`, `401 invalid_credentials` con mensaje
genérico («Credenciales inválidas»), `429 throttled`. Una cuenta desactivada o
anonimizada responde igual que credenciales inválidas.

### 4.3 POST `/auth/refresh/`

| Atributo | Valor |
| --- | --- |
| Descripción | Obtiene un nuevo access token y rota el refresh token de la cookie. |
| Autenticación | No (cookie `refresh_token` + header `X-CSRFToken`) |
| Éxito | `200 OK` |

**Request**: sin cuerpo. El navegador envía las cookies `refresh_token` y
`csrftoken`; el SPA envía `X-CSRFToken` con el valor de la cookie CSRF.

**Headers**

```http
X-CSRFToken: <valor de la cookie csrftoken>
```

**Response `200`**

```json
{
  "access": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

Con rotación activada se emite un refresh nuevo en `Set-Cookie` y el anterior se
invalida en la lista negra. **Errores**: `401 invalid_token` si falta/está
vencido/está revocado, `403 csrf_failed`. Si el refresh es inválido, el servidor
borra la cookie.

### 4.4 POST `/auth/logout/`

| Atributo | Valor |
| --- | --- |
| Descripción | Invalida el refresh token y borra las cookies de sesión. |
| Autenticación | Cookie `refresh_token` + `X-CSRFToken`; no requiere access token vigente. |
| Éxito | `204 No Content` |

**Request**: sin cuerpo. Se envía `X-CSRFToken`. **Errores**: `401 invalid_token`,
`403 csrf_failed`. El servidor agrega el refresh a la lista negra y responde con
`Set-Cookie` de expiración para `refresh_token`.

### 4.5 GET `/auth/csrf/`

| Atributo | Valor |
| --- | --- |
| Descripción | Establece o renueva la cookie `csrftoken` para el SPA. |
| Autenticación | No |
| Éxito | `204 No Content` con `Set-Cookie: csrftoken=...` |

Se usa al cargar la aplicación si no existe la cookie CSRF y antes de llamar a
refresh/logout. La cookie no es `HttpOnly`; el SPA la lee y envía su valor en
`X-CSRFToken`. No devuelve el refresh token.

## 5. Usuarios

### 5.1 GET `/users/me/`

| Atributo | Valor |
| --- | --- |
| Descripción | Devuelve el perfil del usuario autenticado. |
| Autenticación | Sí |
| Éxito | `200 OK` con `UserResource`. |

### 5.2 PATCH `/users/me/`

| Atributo | Valor |
| --- | --- |
| Descripción | Actualiza el perfil. |
| Autenticación | Sí |
| Éxito | `200 OK` con `UserResource`. |

**Request** (todos opcionales, al menos uno):

```json
{
  "full_name": "Laura Gómez Restrepo"
}
```

El correo no se modifica en el MVP. Intentar enviar `email`, `password`,
`is_active` o `is_staff` produce `400`. El cambio de correo con verificación queda
como mejora futura.

### 5.3 POST `/users/me/password/`

| Atributo | Valor |
| --- | --- |
| Descripción | Cambia la contraseña del usuario. |
| Autenticación | Sí |
| Éxito | `204 No Content` |

**Request**

```json
{
  "current_password": "MiClaveSegura123",
  "new_password": "NuevaClaveSegura456"
}
```

Reglas: contraseña actual correcta, nueva distinta, mínimo 8 caracteres y
validadores de Django. **Errores**: `400 reauth_failed` si la contraseña actual
no coincide; `400 validation_error` si la nueva no cumple las reglas.

### 5.4 POST `/users/me/deactivate/`

| Atributo | Valor |
| --- | --- |
| Descripción | Desactiva la cuenta sin borrar datos financieros. |
| Autenticación | Sí |
| Éxito | `204 No Content` |

**Request**

```json
{
  "current_password": "MiClaveSegura123"
}
```

Efectos: `is_active = false`, `deactivated_at = now()`, revocación de todos los
refresh tokens y borrado de la cookie de refresh. Los movimientos, categorías,
presupuestos y metas se conservan. La cuenta no puede iniciar sesión; la
reactivación es administrativa y no tiene endpoint público en el MVP.
**Errores**: `400 reauth_failed` si la contraseña no coincide, `401`.

### 5.5 DELETE `/users/me/`

| Atributo | Valor |
| --- | --- |
| Descripción | Elimina la identidad de la cuenta mediante anonimización, conservando la historia financiera. |
| Autenticación | Sí |
| Éxito | `204 No Content` |

**Request**

```json
{
  "current_password": "MiClaveSegura123",
  "confirm": true
}
```

Efectos: `is_active = false`, `deactivated_at = now()`, `anonymized_at = now()`,
`email` se reemplaza por `deleted-{uuid}@example.invalid`, `full_name` por
`"Usuario eliminado"`, se revocan todos los refresh tokens y se borra la cookie.
La fila `User` **no se borra físicamente**: sigue siendo propietaria de
movimientos, categorías, presupuestos y metas, por lo que no quedan registros
huérfanos. No se puede volver a iniciar sesión con la cuenta anonimizada.

La purga física posterior a un plazo legal no forma parte del MVP; requeriría un
proceso administrativo transaccional. **Errores**: `400 reauth_failed`,
`400 validation_error` si `confirm` no es `true`, `401`.

## 6. Categorías

### 6.1 GET `/categories/`

| Atributo | Valor |
| --- | --- |
| Descripción | Lista las categorías del usuario, incluidas las predeterminadas creadas al registrarse. |
| Autenticación | Sí |
| Éxito | `200 OK` paginado con `CategoryResource`. |

**Query params**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `kind` | `income` \| `expense` | Filtra por tipo. |
| `search` | string | Busca por nombre (contiene, sin distinguir mayúsculas). |
| `ordering` | string | `name` o `-name`. |
| `page`, `page_size` | int | Paginación. |

### 6.2 POST `/categories/`

| Atributo | Valor |
| --- | --- |
| Descripción | Crea una categoría privada. |
| Autenticación | Sí |
| Éxito | `201 Created` con `CategoryResource`. |

**Request**

```json
{
  "name": "Mascotas",
  "kind": "expense",
  "rule_503020_group": "wants"
}
```

| Campo | Tipo | Obligatorio | Validación |
| --- | --- | --- | --- |
| `name` | string | Sí | 2–80 caracteres, `TRIM`, único por usuario + tipo sin distinguir mayúsculas. |
| `kind` | enum | Sí | `income` o `expense`. Inmutable después. |
| `rule_503020_group` | enum/null | No | `needs`, `wants` o `null`; debe ser `null` si `kind="income"`. |

**Errores**: `400 validation_error`, `409 duplicate_resource`.

### 6.3 GET `/categories/{id}/`

`200 OK` con `CategoryResource`; `404 not_found` si no existe o es de otro usuario.

### 6.4 PATCH `/categories/{id}/`

**Request**: `name` y/o `rule_503020_group`. No se acepta `kind` (responde 400).
**Response `200`** con el recurso actualizado. **Errores**: `400`, `404`, `409`.

Cambiar `name` o `rule_503020_group` afecta cómo se muestran y clasifican los
movimientos históricos de esa categoría en Reportes; no se guarda un snapshot en
cada movimiento. Una categoría de ingreso debe mantener
`rule_503020_group = null`.

### 6.5 DELETE `/categories/{id}/`

| Atributo | Valor |
| --- | --- |
| Descripción | Elimina una categoría si no tiene movimientos ni presupuestos. |
| Autenticación | Sí |
| Éxito | `204 No Content` |

Las categorías predeterminadas también se pueden eliminar si no están en uso; no
se recrean automáticamente. **Errores**: `404`, `409 resource_in_use` si está
referenciada. No existe archivado de categorías en el MVP; la categoría en uso se
conserva para no romper el historial.

## 7. Movimientos

### 7.1 GET `/movements/`

| Atributo | Valor |
| --- | --- |
| Descripción | Lista movimientos y calcula totales del filtro. |
| Autenticación | Sí |
| Éxito | `200 OK` paginado con `MovementResource` + `totals`. |

**Query params**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `movement_type` | enum | `income`, `expense` o `savings_transfer`. |
| `category` | UUID | Filtra por categoría (para ingresos/gastos). |
| `savings_goal` | UUID | Filtra aportes de una meta. |
| `month` | `YYYY-MM` | Atajo para el mes calendario completo. |
| `date_from` | `YYYY-MM-DD` | Desde, inclusive. |
| `date_to` | `YYYY-MM-DD` | Hasta, inclusive. |
| `search` | string | Busca en descripción y nombre de categoría. |
| `ordering` | string | Por defecto `-movement_date,-created_at`; permitir `amount`, `-amount`. |
| `page`, `page_size` | int | Paginación. |

`month` y `date_from/date_to` son mutuamente excluyentes; si se combinan,
responder `400`.

**Response `200`**

```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [ { "...MovementResource": true } ],
  "totals": {
    "income_total": "2450000.00",
    "expense_total": "1120000.00",
    "savings_total": "300000.00",
    "net_balance": "1330000.00",
    "available_money": "1030000.00"
  }
}
```

`totals` resume el conjunto filtrado completo, no solo la página. Los
`savings_transfer` solo entran en `savings_total`; nunca en `expense_total`.

### 7.2 POST `/movements/`

| Atributo | Valor |
| --- | --- |
| Descripción | Crea un ingreso o gasto. Las transferencias a ahorro no se crean aquí. |
| Autenticación | Sí |
| Header obligatorio | `Idempotency-Key: <UUID>` |
| Éxito | `201 Created` con `MovementResource`; en un replay, el mismo `201` con `Idempotent-Replay: true`. |

**Request (solo `income` o `expense`)**

```json
{
  "movement_type": "expense",
  "amount": "145000.00",
  "description": "Supermercado Éxito",
  "movement_date": "2026-11-10",
  "category_id": "c1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f601"
}
```

| Campo | Tipo | Obligatorio | Regla |
| --- | --- | --- | --- |
| `movement_type` | enum | Sí | Solo `income` o `expense` en este endpoint. |
| `amount` | string decimal | Sí | > 0, máximo 14 dígitos y 2 decimales. |
| `description` | string | Sí | 2–255 caracteres. |
| `movement_date` | date | No | Por defecto la fecha actual en `America/Bogota`. Fecha contable `YYYY-MM-DD`. |
| `category_id` | UUID | Sí | Categoría del usuario cuyo `kind` coincida con el tipo. |

**Validaciones**

- La categoría debe ser del usuario y su `kind` debe coincidir con el tipo.
- `savings_transfer` se rechaza con `400 validation_error`; el mensaje debe
  indicar que se use `POST /savings-goals/{id}/contributions/`.
- `savings_goal_id` no forma parte de este request y se rechaza si se envía.
- `Idempotency-Key` debe ser un UUID y es obligatorio; ver §1.8. La operación
  registrada es `create_income_expense`.
- Internamente usa `movements.services.create_income_expense`, que delega en el
  servicio común `persist_movement`; no duplica la lógica de persistencia.
- Todo dentro de una transacción atómica, incluida la inserción del registro de
  idempotencia.

**Errores**: `400 validation_error`, `400 idempotency_key_required`,
`400 invalid_idempotency_key`, `404 not_found` (categoría ajena),
`409 idempotency_conflict`.

### 7.3 GET `/movements/{id}/`

`200 OK` con `MovementResource`; `404` si no existe o pertenece a otro usuario.

### 7.4 PATCH `/movements/{id}/`

| Atributo | Valor |
| --- | --- |
| Descripción | Edita un movimiento existente; no crea transferencias nuevas. |
| Autenticación | Sí |
| Éxito | `200 OK` con `MovementResource`. |

**Request** (campos opcionales, al menos uno):

```json
{
  "amount": "150000.00",
  "description": "Supermercado actualizado",
  "movement_date": "2026-11-11",
  "category_id": "c1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f601"
}
```

Reglas:

- `movement_type` es inmutable; enviarlo produce `400`.
- Para un ingreso/gasto se puede cambiar `category_id`; `savings_goal_id` debe
  permanecer `null`.
- Para una transferencia se puede cambiar `savings_goal_id` (si es del usuario y
  está activa) o los campos comunes; `category_id` debe permanecer `null`. Si la
  meta destino está archivada, responde `409 archived_goal`.
- El cambio de importe de una transferencia cambia el progreso de la meta de
  forma automática al ser un cálculo derivado.
- Este endpoint no crea aportes nuevos. Para crear un `savings_transfer` se usa
  `POST /savings-goals/{id}/contributions/`; `POST /movements/` solo crea
  `income`/`expense`.
- Error `400` si la nueva relación no respeta la forma del tipo.

### 7.5 DELETE `/movements/{id}/`

| Atributo | Valor |
| --- | --- |
| Descripción | Elimina el movimiento. Si es una transferencia, reduce el progreso de la meta. |
| Autenticación | Sí |
| Éxito | `204 No Content` |

La eliminación se ejecuta en transacción atómica. No se puede eliminar un
movimiento de otro usuario (`404`).

## 8. Presupuestos

### 8.1 GET `/budgets/`

| Atributo | Valor |
| --- | --- |
| Descripción | Lista presupuestos y calcula el consumo real del periodo. |
| Autenticación | Sí |
| Éxito | `200 OK` paginado con `BudgetResource` + `summary`. |

**Query params**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `period` | `YYYY-MM` | Periodo a consultar; por defecto el mes actual. |
| `category` | UUID | Filtra por categoría. |
| `page`, `page_size` | int | Paginación. |

**Response `200`**

```json
{
  "count": 4,
  "next": null,
  "previous": null,
  "results": [ { "...BudgetResource": true } ],
  "summary": {
    "period": "2026-11",
    "budgeted_total": "530000.00",
    "spent_total": "181500.00",
    "remaining_total": "348500.00",
    "exceeded_total": "0.00",
    "usage_percent": 34.25,
    "budgets_count": 4
  }
}
```

`spent_total` suma los gastos de las categorías que tienen presupuesto en el
periodo. No incluye transferencias a ahorro ni gastos de categorías sin
presupuesto.

### 8.2 POST `/budgets/`

| Atributo | Valor |
| --- | --- |
| Descripción | Crea un presupuesto mensual para una categoría de gasto. |
| Autenticación | Sí |
| Éxito | `201 Created` con `BudgetResource`. |

**Request**

```json
{
  "category_id": "c1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f601",
  "period": "2026-11",
  "limit_amount": "300000.00"
}
```

| Campo | Tipo | Obligatorio | Validación |
| --- | --- | --- | --- |
| `category_id` | UUID | Sí | Categoría del usuario con `kind="expense"`. |
| `period` | `YYYY-MM` | Sí | Mes válido; se guarda como primer día. |
| `limit_amount` | string | Sí | > 0, 2 decimales. |

**Errores**: `400 validation_error`, `404 not_found`, `409 duplicate_resource`.

### 8.3 GET `/budgets/{id}/`

`200 OK` con `BudgetResource`; `404` si no existe o es de otro usuario.

### 8.4 PATCH `/budgets/{id}/`

**Request** (opcional): `limit_amount` y/o `period`. No se permite cambiar
`category_id` ni el usuario; si se necesita otra categoría, se crea otro
presupuesto. Validar el nuevo periodo y el duplicado. **Errores**: `400`, `404`,
`409`.

### 8.5 DELETE `/budgets/{id}/`

`204 No Content`. No afecta movimientos. `404` si no pertenece al usuario.

## 9. Metas de ahorro

### 9.1 GET `/savings-goals/`

| Atributo | Valor |
| --- | --- |
| Descripción | Lista metas con progreso calculado y resumen global. |
| Autenticación | Sí |
| Éxito | `200 OK` paginado con `SavingsGoalResource` + `summary`. |

**Query params**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `status` | `in_progress`, `completed`, `expired` | Filtro calculado. |
| `include_archived` | boolean | Por defecto `false`; `true` incluye archivadas. |
| `page`, `page_size` | int | Paginación. |

**Response `200`**

```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [ { "...SavingsGoalResource": true } ],
  "summary": {
    "total_saved": "4900000.00",
    "total_target": "6700000.00",
    "goals_in_progress": 1,
    "goals_completed": 1,
    "goals_expired": 1,
    "goals_total": 3
  }
}
```

`summary` considera las metas incluidas por los filtros. `total_saved` es la
suma del progreso de esas metas, no los aportes de un periodo.

### 9.2 POST `/savings-goals/`

| Atributo | Valor |
| --- | --- |
| Descripción | Crea una meta de ahorro. |
| Autenticación | Sí |
| Éxito | `201 Created` con `SavingsGoalResource`. |

**Request**

```json
{
  "name": "Fondo de Emergencia",
  "description": "Cubrir tres meses de gastos esenciales.",
  "target_amount": "3000000.00",
  "deadline": "2027-02-28"
}
```

| Campo | Tipo | Obligatorio | Validación |
| --- | --- | --- | --- |
| `name` | string | Sí | 2–100 caracteres, único entre metas activas del usuario sin distinguir mayúsculas. |
| `description` | string/null | No | Máximo 2000 caracteres; texto libre. |
| `target_amount` | string | Sí | > 0, 2 decimales. |
| `deadline` | date | Sí | Fecha válida y no anterior a la fecha de negocio actual en `America/Bogota` al crear. Al editar se acepta una fecha pasada y el estado se recalcula. |

No se aceptan `status`, `saved_amount`, `remaining_amount`, `progress_percent` ni
`archived_at` en el request; son campos calculados o de archivo. Enviarlos produce
`400 validation_error`.

**Errores**: `400 validation_error`, `409 duplicate_resource`.

### 9.3 GET `/savings-goals/{id}/`

`200 OK` con `SavingsGoalResource` para una meta del usuario, esté activa o
archivada; `archived_at` indica si está archivada. `404` si no existe o es de otro
usuario. No requiere cargar los aportes; el historial tiene su propio endpoint.

### 9.4 PATCH `/savings-goals/{id}/`

**Request**: `name`, `description`, `target_amount` y/o `deadline`. Recalcular
progreso y estado automáticamente. Si el nuevo objetivo queda por debajo de lo
ahorrado, la meta pasa a `completed`. Una meta archivada es de solo lectura y
responde `409 archived_goal`. `status`, `saved_amount` y `archived_at` son de
solo lectura; si se envían, `400`. **Errores**: `400`, `404`, `409`.

No se permite desarchivar desde este endpoint en v1.

### 9.5 DELETE `/savings-goals/{id}/`

| Atributo | Valor |
| --- | --- |
| Descripción | Archiva la meta (`archived_at = now()`). |
| Autenticación | Sí |
| Éxito | `204 No Content` |

La meta deja de aparecer en el listado por defecto, pero **sus transferencias se
conservan** y siguen contando en el ahorro histórico y en los reportes. No se
borran movimientos financieros. La operación es idempotente: si la meta ya está
archivada, responde `204` sin cambios. Si se intenta aportar o editar una meta
archivada: `409 archived_goal`.

### 9.6 GET `/savings-goals/{id}/contributions/`

| Atributo | Valor |
| --- | --- |
| Descripción | Historial de aportes (movimientos `savings_transfer`) de la meta. |
| Autenticación | Sí |
| Éxito | `200 OK` paginado con `MovementResource`. |

**Query params**: `date_from`, `date_to`, `ordering` (por defecto
`-movement_date,-created_at`), `page`, `page_size`. Devuelve solo aportes del
usuario y de esa meta. Se puede consultar el historial de una meta archivada;
solo la creación de nuevos aportes está bloqueada.

### 9.7 POST `/savings-goals/{id}/contributions/`

| Atributo | Valor |
| --- | --- |
| Descripción | Registra un aporte como `Movement` tipo `savings_transfer`. |
| Autenticación | Sí |
| Header obligatorio | `Idempotency-Key: <UUID>` |
| Éxito | `201 Created` con `SavingsContributionResource`; replay con el mismo `201` y `Idempotent-Replay: true`. |

**Request**

```json
{
  "amount": "800000.00",
  "movement_date": "2026-11-11",
  "description": "Aporte quincenal al fondo"
}
```

| Campo | Tipo | Obligatorio | Validación |
| --- | --- | --- | --- |
| `amount` | string | Sí | > 0, 2 decimales. |
| `movement_date` | date | No | Por defecto la fecha actual en `America/Bogota`. |
| `description` | string | No | Si se omite: `"Aporte a {nombre de la meta}"`. |

**Idempotencia**: el header `Idempotency-Key` es obligatorio, con operación
`create_savings_transfer`, y se aplica al movimiento creado y a la respuesta
completa (`movement` + `goal`). El registro idempotente se inserta completo en la
misma transacción que el movimiento. Un
reintento con la misma clave y payload reproduce la respuesta; una clave usada
con otro payload devuelve `409 idempotency_conflict`. No se devuelve un 409 de
«procesamiento en curso».

**Efectos transaccionales**

1. Valida que la meta exista, sea del usuario y no esté archivada.
2. Crea el `Movement` mediante `movements.services.create_savings_transfer`, que
   delega en el servicio común `persist_movement`, con
   `movement_type="savings_transfer"`, `category=null`, `savings_goal=meta`.
3. Serializa la respuesta y confirma el registro de idempotencia en la misma
   transacción.
4. Devuelve el movimiento y la meta recalculada.

No crea gasto, no toca presupuestos y no modifica totales de gasto. La operación
se ejecuta con `transaction.atomic()`. Este endpoint es el **único canal de
creación** de transferencias a ahorro; `Movement` sigue siendo la única fuente de
verdad y no existe una tabla adicional de aportes.

**Errores**: `400 validation_error`, `400 idempotency_key_required`,
`400 invalid_idempotency_key`, `404 not_found`, `409 archived_goal`,
`409 idempotency_conflict`.

## 10. Dashboard

### 10.1 GET `/dashboard/summary/`

| Atributo | Valor |
| --- | --- |
| Descripción | Resumen financiero del mes para la pantalla Dashboard. |
| Autenticación | Sí |
| Éxito | `200 OK` |

**Query params**

| Parámetro | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `period` | `YYYY-MM` | mes actual | Mes del resumen. |
| `recent_limit` | int | 5 | Movimientos recientes a devolver (1–20). |

**Response `200`**

```json
{
  "period": {
    "value": "2026-11",
    "from": "2026-11-01",
    "to": "2026-11-30"
  },
  "summary": {
    "income_total": "2450000.00",
    "expense_total": "1120000.00",
    "savings_total": "300000.00",
    "net_balance": "1330000.00",
    "available_money": "1030000.00",
    "savings_accumulated": "2900000.00"
  },
  "budget_summary": {
    "budgeted_total": "530000.00",
    "spent_total": "181500.00",
    "remaining_total": "348500.00",
    "exceeded_total": "0.00",
    "usage_percent": 34.25,
    "budgets_count": 4
  },
  "rule_503020": {
    "base_income": "2450000.00",
    "sections": [
      {
        "key": "needs",
        "label": "Necesidades",
        "percentage": 50,
        "actual_percent": 30.0,
        "actual_amount": "735000.00",
        "recommended_amount": "1225000.00",
        "difference_percent": -20.0,
        "difference_amount": "-490000.00"
      },
      {
        "key": "wants",
        "label": "Deseos",
        "percentage": 30,
        "actual_percent": 12.0,
        "actual_amount": "294000.00",
        "recommended_amount": "735000.00",
        "difference_percent": -18.0,
        "difference_amount": "-441000.00"
      },
      {
        "key": "savings",
        "label": "Ahorro",
        "percentage": 20,
        "actual_percent": 12.24,
        "actual_amount": "300000.00",
        "recommended_amount": "490000.00",
        "difference_percent": -7.76,
        "difference_amount": "-190000.00"
      }
    ],
    "unclassified_expense": "91000.00"
  },
  "recent_movements": [ { "...MovementResource": true } ]
}
```

`savings_total` = aportes del mes. `savings_accumulated` = suma de todos los
aportes históricos, no solo del mes. `available_money` = ingresos − gastos −
aportes del mes. `net_balance` = ingresos − gastos (no resta ahorro). El periodo
es el mes calendario completo y usa los mismos límites y fórmulas que Reportes.

Si no hay ingresos, las tres secciones devuelven `actual_percent = 0`,
`recommended_amount = "0.00"` y `difference_percent = 0`; los importes reales
siguen visibles. Si una sección supera el porcentaje recomendado, la diferencia
es positiva y no se recorta.

## 11. Reportes

### 11.1 GET `/reports/overview/`

| Atributo | Valor |
| --- | --- |
| Descripción | Datos consolidados para los gráficos y la regla 50/30/20. |
| Autenticación | Sí |
| Éxito | `200 OK` |

**Query params**

| Parámetro | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `period` | enum | `current_month` | `current_month`, `previous_month`, `last_3_months`, `last_6_months`, `current_year`, `custom`. |
| `from` | date | — | Obligatorio si `period=custom`. |
| `to` | date | — | Obligatorio si `period=custom`; debe ser ≥ `from`. |

Los presets mensuales usan **meses calendario completos**:

- `current_month`: primer y último día del mes actual.
- `previous_month`: primer y último día del mes anterior.
- `last_3_months`: primer día del mes actual − 2 meses hasta el último día del
  mes actual.
- `last_6_months`: primer día del mes actual − 5 meses hasta el último día del
  mes actual.
- `current_year`: 1 de enero al 31 de diciembre del año actual.
- `custom`: rango inclusivo `from`–`to`; puede ser parcial y se calcula
  exactamente sobre ese rango.

`current_month` **no termina hoy**. Incluye movimientos futuros registrados
dentro del mes. El Dashboard usa el mismo mes calendario completo y las mismas
fórmulas. Los rangos se interpretan con fechas de negocio en `America/Bogota` y
límites inclusivos `movement_date >= from AND movement_date <= to`.

**Response `200`**

```json
{
  "period": {
    "preset": "current_month",
    "from": "2026-11-01",
    "to": "2026-11-30",
    "label": "Mes actual"
  },
  "summary": {
    "income_total": "2450000.00",
    "expense_total": "1120000.00",
    "savings_total": "300000.00",
    "net_balance": "1330000.00",
    "available_money": "1030000.00"
  },
  "monthly": [
    {
      "period": "2026-11",
      "income_total": "2450000.00",
      "expense_total": "1120000.00",
      "savings_total": "300000.00",
      "net_balance": "1330000.00",
      "available_money": "1030000.00"
    }
  ],
  "expenses_by_category": [
    {
      "category": {
        "id": "c1a2b3c4-d5e6-4f70-8a91-b2c3d4e5f601",
        "name": "Alimentación"
      },
      "amount": "181500.00",
      "percentage": 16.2
    }
  ],
  "balance_evolution": [
    {
      "period": "2026-11",
      "net_balance": "1330000.00",
      "accumulated_net_balance": "1330000.00",
      "available_money": "1030000.00",
      "accumulated_available_money": "1030000.00"
    }
  ],
  "rule_503020": {
    "base_income": "2450000.00",
    "sections": [
      {
        "key": "needs",
        "label": "Necesidades",
        "percentage": 50,
        "actual_percent": 30.0,
        "actual_amount": "735000.00",
        "recommended_amount": "1225000.00",
        "difference_percent": -20.0,
        "difference_amount": "-490000.00"
      },
      {
        "key": "wants",
        "label": "Deseos",
        "percentage": 30,
        "actual_percent": 12.0,
        "actual_amount": "294000.00",
        "recommended_amount": "735000.00",
        "difference_percent": -18.0,
        "difference_amount": "-441000.00"
      },
      {
        "key": "savings",
        "label": "Ahorro",
        "percentage": 20,
        "actual_percent": 12.24,
        "actual_amount": "300000.00",
        "recommended_amount": "490000.00",
        "difference_percent": -7.76,
        "difference_amount": "-190000.00"
      }
    ],
    "unclassified_expense": "91000.00"
  }
}
```

**Reglas de contenido**

- `expenses_by_category` solo incluye movimientos `expense`; las transferencias
  a ahorro no aparecen porque no tienen categoría y no son gasto.
- `monthly` rellena los meses sin movimientos con ceros para que el gráfico no
  tenga huecos. Para `custom` parcial, el mes inicial/final puede cubrir solo la
  parte solicitada.
- `balance_evolution` acumula el balance neto del rango; `available_money` y
  `accumulated_available_money` usan ingresos − gastos − aportes. La acumulación
  empieza en cero al inicio del rango; no es un saldo bancario ni arrastra meses
  anteriores.
- `rule_503020` usa como base el total de ingresos del rango. Los aportes a
  ahorro forman la sección `savings` y se excluyen de necesidades/deseos.
- Los gastos de categorías sin `rule_503020_group` se informan en
  `unclassified_expense` y no se reparten artificialmente.
- Si no hay ingresos, todos los porcentajes de la regla son `0`, los
  recomendados son `0` y las diferencias son `0`; no se usa el gasto como base.
- Si una sección supera el porcentaje recomendado, `difference_percent` es
  positivo; no se recorta ni se genera un error.

**Errores**: `400 validation_error` por rango inválido o preset desconocido.

## 12. Correspondencia con el frontend actual

El frontend actual trabaja con datos mock en español y nombres de campos en
español. En la fase de integración se necesita una capa de adaptación; no se
modifica ahora. La API mantiene nombres en inglés; el adaptador traduce en ambos
sentidos.

| Frontend actual | API |
| --- | --- |
| `name` (registro) | `full_name` |
| `nombre` / `descripcion` | `description` |
| `valor` / `monto` | `amount` (string decimal) |
| `tipo: "ingreso"` | `movement_type: "income"` |
| `tipo: "gasto"` | `movement_type: "expense"` |
| aporte a meta | `movement_type: "savings_transfer"` |
| `categoria` (nombre) | `category.id` + objeto `category` en respuesta |
| `mes: "YYYY-MM"` | `period: "YYYY-MM"` |
| `limite` | `limit_amount` |
| `objetivo` | `target_amount` |
| `ahorrado` | `saved_amount` (calculado) |
| `fechaLimite` | `deadline` |
| `aportes` | endpoint de contribuciones / movimientos |
| `estado: "en-progreso"` | `status: "in_progress"` |
| `estado: "completada"` | `status: "completed"` |
| `estado: "vencida"` | `status: "expired"` |
| `normal` / `alerta` / `superado` | `normal` / `warning` / `exceeded` |
| refresh en memoria/localStorage | cookie `HttpOnly`; access en memoria |
| `disponible` actual | `available_money` (resta aportes) |

El frontend hoy permite escribir una categoría personalizada al crear un
movimiento. Con el contrato debe crear primero la categoría o reutilizar una
existente; esa coordinación se resolverá en la capa `services/api.js` y en los
formularios, sin cambiar el contrato de la base.

El adaptador también debe:

- Enviar `credentials: "include"` para las llamadas a `/auth/refresh/` y
  `/auth/logout/`.
- Leer la cookie `csrftoken` y enviar `X-CSRFToken` en refresh/logout.
- Generar un UUID nuevo por cada acción de creación de ingreso/gasto o aporte y
  reutilizarlo solo al reintentar esa misma acción.
- Ajustar los presets de Reportes al último día del mes, no a la fecha actual.
- No guardar el refresh token en `localStorage` ni en `sessionStorage`.

## 13. Decisiones pendientes (no bloqueantes)

1. **Versionado de términos y privacidad.** El MVP registra
   `terms_accepted_at`, pero no la versión aceptada. Si legal exige demostrar la
   versión, se añadirá al `User` y al payload de registro; no cambia los cálculos
   financieros.
2. **Retención legal y purga física.** El MVP desactiva o anonimiza la cuenta y
   conserva la historia. Una purga física futura requiere un plazo legal y un
   proceso administrativo transaccional que no deje movimientos sin propietario.

Ninguna de estas decisiones cambia las rutas ni las fórmulas del MVP. El
versionado, si se exige, solo añadiría campos al registro y a `User`; la purga
física sería un proceso administrativo fuera de la API pública. La documentación
de modelo, API y reglas está alineada en las decisiones oficiales.
