# Reglas de negocio financieras — FinanzasPro

> Estado: **reglas oficiales del MVP, pendientes de implementación**. Definen los
> cálculos que deberán implementar los servicios y selectores del backend.
> No modifican el frontend actual.
> Entidades y campos canónicos: [diseño de base de datos](./database-design.md).

## 1. Principios

1. **Un solo origen de verdad:** todos los importes nacen de `Movement`.
2. **Los ahorros son transferencias internas, no gastos.** Un
   `Movement` de tipo `savings_transfer` mueve dinero disponible hacia una meta;
   no incrementa el total de gastos, no consume presupuestos y no entra en las
   secciones Necesidades/Deseos de la regla 50/30/20.
3. **Cada cálculo se filtra por usuario y por rango de fechas.** Nunca se suman
   datos de otros usuarios.
4. **Los importes se calculan con `Decimal`, no con `float`.**
5. **El progreso de una meta se deriva de sus transferencias.** No existe un
   contador `saved_amount` editable ni almacenado. `status`
   (`in_progress`/`completed`/`expired`) también es calculado y no es una columna.
6. **Un periodo mensual se expresa como intervalo semiabierto**
   `[primer día del mes, primer día del mes siguiente)`, para no duplicar el
   último día ni depender de la hora.
7. **Las transferencias a ahorro tienen un único canal de creación:**
   `POST /api/v1/savings-goals/{id}/contributions/`. `POST /api/v1/movements/`
   solo acepta `income` y `expense`; un `savings_transfer` enviado allí se
   rechaza con `400`. La edición y eliminación de aportes existentes se hacen por
   `/api/v1/movements/{id}/`.

## 2. Clasificación contable de los movimientos

| `movement_type` | Afecta ingresos | Afecta gastos | Afecta dinero disponible | Afecta presupuesto | Afecta meta | Sección 50/30/20 |
| --- | --- | --- | --- | --- | --- | --- |
| `income` | Suma | No | Suma | No | No | No |
| `expense` | No | Suma | Resta | **Sí** | No | Necesidades o deseos según categoría |
| `savings_transfer` | No | **No** | **Resta** | **No** | Suma progreso | **Ahorro** |

La restricción de base de datos impide que un `savings_transfer` tenga
`category_id`. Aunque se consultara por categoría, todo cálculo de gasto filtra
explícitamente `movement_type = 'expense'`.

### 2.1 Diferencia entre balance y dinero disponible

- **Balance neto:** resultado del periodo. No descuenta ahorro porque la
  transferencia no destruye riqueza, solo cambia su ubicación.
- **Dinero disponible:** efectivo del periodo que no está comprometido en
  gastos ni en aportes a metas.

```
net_balance      = income_total - expense_total
available_money  = income_total - expense_total - savings_contributions
```

No se modelan cuentas bancarias, saldos iniciales ni transferencia automática de
dinero entre meses. Por tanto, `available_money` es un **flujo del periodo**, no
el saldo real de una cuenta ni el arrastre del mes anterior. Cada periodo se
calcula desde cero con sus propios movimientos. Si en el futuro se añaden cuentas
o saldo inicial, la fórmula deberá incorporarlos; hoy no forman parte del MVP.

El mismo criterio se aplica al Dashboard y a Reportes. `savings_accumulated` es
la única métrica histórica acumulada y no se usa como saldo disponible.

## 3. Periodos y rangos

### 3.1 Fecha contable

Se usa `Movement.movement_date` (`date`), no `created_at`, para decidir a qué mes
pertenece un movimiento. `created_at` solo se usa para ordenar capturas del mismo
día.

### 3.2 Mes calendario

Para un periodo `YYYY-MM`:

```
start       = YYYY-MM-01
end_excl    = primer día del mes siguiente
where       = movement_date >= start AND movement_date < end_excl
```

Ejemplo: noviembre de 2026 → `[2026-11-01, 2026-12-01)`.

### 3.3 Presets de reportes

Todos los presets mensuales usan **meses calendario completos**. La fecha final
de un preset nunca es «hoy»: es el último día del mes correspondiente. El
Dashboard y Reportes comparten estos límites y las mismas fórmulas.

| Preset | `from` | `to` |
| --- | --- | --- |
| `current_month` | Primer día del mes actual | Último día del mes actual |
| `previous_month` | Primer día del mes anterior | Último día del mes anterior |
| `last_3_months` | Primer día del mes actual − 2 meses | Último día del mes actual |
| `last_6_months` | Primer día del mes actual − 5 meses | Último día del mes actual |
| `current_year` | 1 de enero del año actual | 31 de diciembre del año actual |
| `custom` | `from` recibido | `to` recibido |

Para consultar se usa `movement_date >= from AND movement_date <= to` (o,
equivalentemente, `< to + 1 día`). `from` y `to` son inclusivos para el usuario.

- `custom` permite fechas inclusivas arbitrarias para una consulta puntual. Si
  el rango no coincide con meses completos, el resumen cubre exactamente ese
  rango; no se completa artificialmente hacia los extremos. Para reportes
  mensuales se deben usar los presets o un rango de mes completo.
- Los meses sin movimientos dentro de un rango mensual se rellenan con ceros en
  la serie, sin inventar importes.
- Un movimiento con `movement_date` futura dentro del mes actual **sí** pertenece
  al periodo completo y aparece en el Dashboard y en Reportes.

El Dashboard usa `period=YYYY-MM`, que equivale a un mes calendario completo. No
existe una variante «hasta hoy» en el backend. La integración del frontend deberá
dejar de truncar el mes actual en la pantalla de Reportes.

### 3.4 Zona horaria y fechas

- `movement_date` es una fecha sin hora: no cambia de día por zona horaria.
- Los límites de fecha se calculan con la fecha de negocio en
  `America/Bogota`, no con la fecha UTC del servidor.
- Si el cliente omite `movement_date`, el backend usa la fecha actual en
  `America/Bogota`. Nunca usa `new Date().toISOString()` del navegador para
  derivar la fecha contable, porque cerca de medianoche puede devolver otro día.
- Los `timestamptz` se guardan en UTC y se serializan en ISO 8601 UTC; la UI los
  presenta en `America/Bogota`.
- La API serializa fechas de negocio como `YYYY-MM-DD` y periodos como
  `YYYY-MM`. No se envían horas para `movement_date`, `deadline` ni
  `period_start`.

## 4. Cálculos base del periodo

Para un usuario `u` y un rango `[from, to]`:

### 4.1 Total de ingresos

```
income_total = SUM(amount)
               WHERE user_id = u
                 AND movement_type = 'income'
                 AND movement_date BETWEEN from AND to
```

- Los ingresos son siempre positivos.
- No se restan transferencias ni gastos.
- Si no hay registros, el resultado es `Decimal("0.00")`.

### 4.2 Total de gastos

```
expense_total = SUM(amount)
                WHERE user_id = u
                  AND movement_type = 'expense'
                  AND movement_date BETWEEN from AND to
```

- **Nunca** se incluye `savings_transfer`.
- Aunque una transferencia tuviera categoría por un error de datos, el filtro
  por tipo la excluye. La restricción de base evita ese estado.
- Los gastos no se netean con devoluciones porque el modelo no contempla
  devoluciones/notas crédito; se corrige editando o eliminando el gasto.

### 4.3 Dinero destinado a ahorros en el periodo

```
savings_contributions = SUM(amount)
                        WHERE user_id = u
                          AND movement_type = 'savings_transfer'
                          AND movement_date BETWEEN from AND to
```

Es el total aportado a metas dentro del periodo. No es lo mismo que el saldo
acumulado de las metas.

### 4.4 Ahorro acumulado histórico

```
savings_accumulated = SUM(amount)
                      WHERE user_id = u
                        AND movement_type = 'savings_transfer'
```

No se filtra por fecha. Incluye aportes a metas archivadas, porque el dinero se
transfirió y debe conservarse en la historia. En la UI se puede mostrar como
«Total acumulado en todas las metas».

### 4.5 Balance neto

```
net_balance = income_total - expense_total
```

No resta ahorro. Una transferencia no es una pérdida: el dinero sigue siendo del
usuario, solo está earmarked.

### 4.6 Dinero disponible

```
available_money = income_total - expense_total - savings_contributions
                = net_balance - savings_contributions
```

Puede ser negativo si los aportes superan el flujo disponible. No se limita a
cero, porque un valor negativo es información financiera relevante y no un error
de cálculo.

### 4.7 Resumen

| Métrica | Fórmula | ¿Incluye ahorro? |
| --- | --- | --- |
| `income_total` | Σ type `income` | No |
| `expense_total` | Σ type `expense` | **No** |
| `savings_contributions` | Σ type `savings_transfer` | Solo aquí |
| `net_balance` | ingresos − gastos | No resta ahorro |
| `available_money` | ingresos − gastos − aportes | Resta ahorro |
| `savings_accumulated` | Σ histórico de transferencias | Sí |

En la API, el campo `savings_total` representa exactamente
`savings_contributions` del periodo. `savings_accumulated` solo aparece en el
Dashboard y no se usa como saldo disponible.

## 5. Progreso de metas de ahorro

Para una meta `g` del usuario:

```
saved_amount       = SUM(amount) de todos los Movement
                     WHERE savings_goal_id = g.id
                       AND movement_type = 'savings_transfer'

remaining_amount   = MAX(0, target_amount - saved_amount)
progress_percent   = target_amount > 0
                     ? ROUND(saved_amount / target_amount * 100, 2)
                     : 0
contributions_count = COUNT(Movement) con las mismas condiciones
```

### 5.1 Estado

Se evalúa en este orden:

1. `completed` si `saved_amount >= target_amount`.
2. `expired` si `saved_amount < target_amount` y `deadline < fecha_actual_negocio`.
3. `in_progress` en cualquier otro caso.

La fecha actual se evalúa en `America/Bogota`. Una meta completada nunca aparece
como vencida, aunque su fecha límite haya pasado. El estado es calculado; no se
guarda en la tabla.

### 5.2 Aportes, sobreahorro y retiros

- Un aporte **no** se valida contra el saldo restante: se permite sobreahorrar.
- Si `saved_amount > target_amount`, `remaining_amount = 0` y el porcentaje
  puede superar 100. La barra visual puede limitarse a 100 %, pero el backend
  devuelve el porcentaje real.
- Aportar a una meta ya completada está permitido si no está archivada.
- Aportar a una meta vencida pero no archivada está permitido. El estado seguirá
  siendo `expired` hasta que se alcance el objetivo.
- **No existen retiros de ahorro en el MVP.** Un aporte es siempre positivo y de
  tipo `savings_transfer`. Si en el futuro se añaden retiros, no deben modelarse
  como `expense`; requerirán un tipo y una regla propios.
- El aporte se crea exclusivamente con
  `POST /api/v1/savings-goals/{id}/contributions/`, no con `POST /movements/`.
  El servicio de ahorro valida la meta y delega la persistencia en el servicio
  común de movimientos; `Movement` sigue siendo la única fuente de verdad.
- El estado de la meta se calcula al leerla: `completed` si
  `saved_amount >= target_amount`; `expired` si está incompleta y
  `deadline < fecha_actual_negocio`; `in_progress` en otro caso.
  `target_amount` y `deadline` alimentan ese cálculo; `archived_at` solo marca la
  meta como archivada y no añade un cuarto estado.

### 5.3 Efectos de crear, editar o eliminar un aporte

| Operación | Efecto |
| --- | --- |
| Crear `savings_transfer` | Aumenta `saved_amount`, progreso y aportes del periodo. Reduce `available_money`. No altera `expense_total`. |
| Editar `amount` | Recalcula progreso y todos los agregados del periodo. |
| Editar `movement_date` | Mueve el aporte de periodo en reportes y dashboard. |
| Eliminar el movimiento | Reduce `saved_amount` y progreso. Aumenta `available_money` del periodo. No altera `expense_total`. |
| Editar la meta (`target_amount`) | Recalcula progreso/estado sin tocar movimientos. |
| Archivar la meta | Conserva movimientos y ahorro histórico; la oculta de la lista activa. |

### 5.4 Meta archivada

- No se puede aportar (`409 archived_goal`).
- No aparece en el listado por defecto.
- Sus transferencias siguen contando en `savings_accumulated` y en reportes.
- El endpoint de reportes no debe reconstruir el nombre de la meta desde una
  copia: puede usar el movimiento y, si la meta existe archivada, su nombre.

## 6. Presupuestos

### 6.1 Consumo de un presupuesto

Para un presupuesto del usuario, categoría `c` y periodo `YYYY-MM`:

```
spent_amount = SUM(amount)
               WHERE user_id = u
                 AND category_id = c.id
                 AND movement_type = 'expense'
                 AND movement_date >= inicio_mes
                 AND movement_date < inicio_mes_siguiente
```

El filtro `movement_type = 'expense'` es obligatorio. Aunque las transferencias
no tienen categoría, se filtra por tipo por claridad y defensa en profundidad.

```
remaining_amount = MAX(0, limit_amount - spent_amount)
exceeded_amount  = MAX(0, spent_amount - limit_amount)
usage_percent    = limit_amount > 0
                   ? ROUND(spent_amount / limit_amount * 100, 2)
                   : 0
```

### 6.2 Estado del presupuesto

| Estado | Condición | Equivalente en el frontend |
| --- | --- | --- |
| `normal` | `usage_percent < 80` | normal |
| `warning` | `80 <= usage_percent <= 100` | alerta |
| `exceeded` | `usage_percent > 100` | superado |

Los umbrales se evalúan con el porcentaje exacto (sin redondear) para no
convertir un 79,996 % en alerta por redondeo. El valor mostrado se redondea a 2
decimales. El 100 % exacto es `warning`, no `exceeded`.

### 6.3 Resumen del periodo

```
budgeted_total  = Σ limit_amount de los presupuestos del periodo
spent_total     = Σ spent_amount de esos mismos presupuestos
remaining_total = Σ remaining_amount
exceeded_total  = Σ exceeded_amount
usage_percent   = budgeted_total > 0
                  ? ROUND(spent_total / budgeted_total * 100, 2)
                  : 0
budgets_count   = cantidad de presupuestos del periodo
```

`spent_total` incluye **solo los gastos de las categorías presupuestadas**. Si el
usuario tiene gastos en una categoría sin presupuesto, esos gastos aparecen en el
total general de gastos pero no en el resumen de presupuestos. No se deben sumar
dos veces.

### 6.4 Aislamiento del ahorro

Un aporte a una meta:

- no tiene `category_id` (restricción de base),
- no es `movement_type='expense'`,
- por tanto no aparece en `spent_amount` ni en `spent_total`.

Prueba de regresión obligatoria: crear un aporte de 1.000.000 no debe cambiar
ningún `spent_amount` ni ningún estado de presupuesto.

## 7. Gastos por categoría

Para un rango:

```
for each category:
    amount = SUM(expense.amount) WHERE category_id = category.id
             AND movement_type = 'expense'
             AND movement_date BETWEEN from AND to

total_expenses = Σ amount de todas las categorías
percentage = total_expenses > 0
             ? ROUND(amount / total_expenses * 100, 2)
             : 0
```

- Solo se incluyen movimientos `expense`.
- Las transferencias `savings_transfer` no tienen categoría y quedan fuera.
- Se ordena de mayor a menor importe.
- El total de las categorías debe ser exactamente `expense_total` del periodo
  (salvo categorías eliminadas, que no se permite eliminar si tienen movimientos).
- El porcentaje es sobre el total de gastos, no sobre ingresos.

## 8. Regla 50/30/20

### 8.1 Base de cálculo

La base es el **total de ingresos del periodo**:

```
base_income = income_total
```

Es la interpretación estándar de la regla: los porcentajes se aplican sobre los
ingresos, no sobre los gastos. No se usa el patrimonio ni el saldo acumulado.

Si `base_income = 0`, se devuelven `actual_percent = 0`, `recommended_amount = 0`
y `difference_percent = 0` para las tres secciones. No se usa el gasto ni el
ahorro como base alternativa. Los importes reales (`actual_amount`) sí se
informan, pero los porcentajes permanecen en cero para no dividir por cero ni
cambiar el significado de la regla.

La clasificación se lee de `Category.rule_503020_group`. Si el usuario cambia el
grupo de una categoría, los movimientos históricos de esa categoría se
reclasifican en los reportes; no se guarda una copia del grupo en cada
movimiento. Es un comportamiento aceptado del MVP.

### 8.2 Secciones

```
needs_expense = Σ expense.amount
                WHERE category.rule_503020_group = 'needs'

wants_expense = Σ expense.amount
                WHERE category.rule_503020_group = 'wants'

unclassified_expense = expense_total - needs_expense - wants_expense

savings_amount = Σ savings_transfer.amount del periodo
```

La sección Ahorro **no** es una categoría de gasto. Son transferencias a metas.
Por eso no se puede contar dos veces: un aporte no está en `needs_expense` ni en
`wants_expense`, y tampoco en `expense_total`.

### 8.3 Porcentajes y recomendaciones

Para cada sección (`needs`, `wants`, `savings`):

```
actual_percent    = base_income > 0
                    ? ROUND(amount / base_income * 100, 2)
                    : 0
recommended_amount = ROUND(base_income * percentage / 100, 2)
difference_amount  = amount - recommended_amount
difference_percent = actual_percent - percentage
```

| Sección | `percentage` |
| --- | --- |
| Necesidades | 50 |
| Deseos | 30 |
| Ahorro | 20 |

`actual_percent` puede superar 100 si los gastos o aportes superan los ingresos.
No se recorta y no se normaliza la distribución a 100. Un `difference_percent`
positivo significa que la sección **supera** el porcentaje recomendado; uno
negativo significa que está por debajo. Superar una recomendación es informativo:
no bloquea la creación de gastos, no mueve dinero entre secciones, no cambia
presupuestos y no genera un error de API. El frontend puede mostrar una alerta
visual basada en el signo y la magnitud de la diferencia.

Ejemplo: si necesidades reales son 60 % con ingresos de 1.000.000, el recomendado
es 50 %, `difference_percent = +10` y `difference_amount = +100.000`. El backend
sigue devolviendo 60 %, no lo limita a 50 %.

### 8.4 Gastos no clasificados

Los gastos cuya categoría tiene `rule_503020_group = NULL` se informan aparte en
`unclassified_expense`. No se reparten entre necesidades y deseos ni se incluyen
silenciosamente en una sección. La UI puede mostrarlos como advertencia.

### 8.5 Ejemplo completo

Movimientos del periodo:

| Concepto | Tipo | Categoría / meta | Importe |
| --- | --- | --- | --- |
| Nómina | income | Salario | 2.450.000,00 |
| Arriendo | expense | Vivienda (needs) | 500.000,00 |
| Supermercado | expense | Alimentación (needs) | 181.500,00 |
| Transporte | expense | Transporte (needs) | 53.500,00 |
| Streaming | expense | Entretenimiento (wants) | 294.000,00 |
| Regalo | expense | Sin clasificar | 91.000,00 |
| Aporte al fondo | savings_transfer | Fondo de Emergencia | 300.000,00 |

Cálculos:

```
income_total              = 2.450.000,00
expense_total             = 1.120.000,00   (500.000 + 181.500 + 53.500 + 294.000 + 91.000)
savings_contributions     =   300.000,00
net_balance               = 1.330.000,00
available_money           = 1.030.000,00

needs_expense             =   735.000,00
wants_expense             =   294.000,00
unclassified_expense      =    91.000,00

actual needs              = 30,00 %
actual wants              = 12,00 %
actual savings            = 12,24 %   (300.000 / 2.450.000)
actual unclassified       = 3,71 %

recommended needs         = 1.225.000,00
recommended wants         =   735.000,00
recommended savings       =   490.000,00
```

Comprobaciones:

- El aporte de 300.000 **no** está dentro de los 1.120.000 de gastos.
- El aporte **no** aparece en necesidades ni deseos.
- El ahorro disponible baja de 1.330.000 a 1.030.000.
- Si se contabilizara erróneamente como gasto, `expense_total` sería 1.420.000
  y los presupuestos podrían marcarse como excedidos sin motivo.

## 9. Dashboard

`GET /dashboard/summary/` usa el mes calendario completo `YYYY-MM`; no existe la
variante «hasta hoy». Los mismos límites y fórmulas se usan en Reportes.

- `summary.income_total`: §4.1
- `summary.expense_total`: §4.2
- `summary.savings_total`: §4.3
- `summary.net_balance`: §4.5
- `summary.available_money`: §4.6
- `summary.savings_accumulated`: §4.4
- `budget_summary`: §6.3
- `rule_503020`: §8
- `recent_movements`: últimos N por `movement_date DESC, created_at DESC`,
  incluyendo transferencias.

El Dashboard no debe calcular totales en el frontend a partir de una página de
movimientos: usa los agregados del backend para que la paginación no altere los
totales.

## 10. Reportes

`GET /reports/overview/` reutiliza exactamente las fórmulas anteriores.

### 10.1 Serie mensual

Para cada mes del rango:

```json
{
  "period": "2026-11",
  "income_total": "2450000.00",
  "expense_total": "1120000.00",
  "savings_total": "300000.00",
  "net_balance": "1330000.00",
  "available_money": "1030000.00"
}
```

Los meses sin movimientos se rellenan con ceros para que el gráfico mantenga el
eje temporal. No se inventan ingresos ni gastos.

### 10.2 Evolución del balance

```
accumulated_net_balance = Σ net_balance de los meses anteriores del rango + actual
accumulated_available_money = Σ available_money de los meses anteriores + actual
```

La acumulación comienza en cero al inicio del rango solicitado. No incluye
historia anterior al rango ni arrastra el dinero del mes anterior como saldo
disponible. Es una suma de flujos mensuales para visualizar la evolución, no un
saldo bancario. Si se desea mostrar el saldo histórico completo, se necesitaría
otro cálculo y una decisión de producto.

### 10.3 Gastos por categoría

§7. La suma de `expenses_by_category` debe coincidir con `summary.expense_total`
del mismo rango, salvo que se apliquen filtros adicionales.

### 10.4 Regla 50/30/20

§8 con el rango seleccionado. La sección Ahorro usa todos los
`savings_transfer` del rango, no los depósitos acumulados de las metas.

### 10.5 Reporte y presupuestos

Los reportes **no** usan los límites de presupuesto para calcular gastos. Un
gasto existe aunque no tenga presupuesto. Los presupuestos solo comparan el
consumo de las categorías que tienen límite definido.

## 11. Redondeo y precisión

- Almacenamiento: `NUMERIC(14,2)`.
- Sumas: `Decimal` con dos decimales; no se redondea en cada parcial para evitar
  acumulación de error.
- Porcentajes: `ROUND_HALF_UP` a 2 decimales.
- La API expone importes como strings con exactamente 2 decimales.
- El frontend puede redondear a entero para mostrar pesos colombianos, pero no
  debe usar el valor redondeado para volver a enviar operaciones.
- Validación de importes: > 0, máximo 14 dígitos, exactamente 0–2 decimales.
  Rechazar `NaN`, `Infinity`, negativos y más de 2 decimales.

## 12. Casos límite y decisiones

| Caso | Regla |
| --- | --- |
| Sin ingresos | Todos los totales de ingreso en 0; porcentajes de la regla 0; recomendados 0; diferencias 0. Los importes de gasto/ahorro se muestran. |
| Sin gastos | `expense_total = 0`; porcentajes por categoría 0; la regla puede tener solo ahorro. |
| Sin presupuestos | `usage_percent = 0`; `budgeted_total = 0`; no dividir por cero. |
| Presupuesto de 0 | No se permite (`limit_amount > 0`). |
| Meta con objetivo 0 | No se permite (`target_amount > 0`). |
| Aporte mayor al restante | Permitido; sobreahorro; `remaining = 0`; progreso puede superar 100. |
| Aporte a meta vencida | Permitido si no está archivada; sigue vencida hasta completarse. |
| Aporte a meta archivada | Rechazado con `409 archived_goal`. |
| Meta con objetivo reducido | Si `saved >= new_target`, pasa a `completed`; el exceso no se devuelve. |
| Estado de meta | `in_progress`/`completed`/`expired` se calcula desde `target_amount`, `deadline` y los aportes; `archived_at` es un archivo separado. No se almacena ni se acepta en requests. |
| Transferencia eliminada | Reduce progreso y ahorro; no cambia gasto ni presupuesto. |
| Movimiento futuro | Pertenece al mes completo de `movement_date`; se incluye en el mes actual si está dentro de él. |
| Movimiento duplicado | Permitido; dos operaciones iguales pueden ser legítimas. Los reintentos se protegen con idempotencia. |
| Categoría borrada | No se permite si tiene movimientos/presupuestos (`PROTECT`). |
| Cuenta eliminada | Desactivación o anonimización; la fila `User` se conserva para no dejar movimientos huérfanos. |
| Moneda | COP única; no hay conversión. |
| Devoluciones/retiros | No modelados en el MVP. Se corrige con edición/borrado; un retiro futuro no debe ser `expense`. |
| Reporte `current_month` | Mes calendario completo; termina el último día del mes, no hoy. |
| Sin ingresos y con gastos | La regla 50/30/20 no usa gastos como base; los porcentajes quedan en 0. |
| Distribución superior a la recomendada | Se informa con diferencia positiva; no se recorta ni se bloquea. |
| Cambio de `rule_503020_group` | Reclasifica los movimientos históricos de esa categoría; no se guarda snapshot en `Movement`. |

## 13. Invariantes y pruebas obligatorias

El backend debe incluir tests que demuestren:

1. `expense_total` solo suma `movement_type='expense'`.
2. Crear un `savings_transfer` no modifica `expense_total`.
3. Crear un `savings_transfer` no modifica ningún `spent_amount` de presupuesto.
4. Eliminar un `savings_transfer` restaura el `available_money` del periodo y
   reduce el progreso de la meta.
5. `saved_amount` de una meta es igual a la suma de sus transferencias.
6. `progress_percent`, `remaining_amount` y `status` se recalculan al editar
   importe, fecha u objetivo.
7. `available_money = income_total - expense_total - savings_contributions`.
8. `net_balance = income_total - expense_total`.
9. La suma de `expenses_by_category` es igual a `expense_total`.
10. La suma de `needs + wants + unclassified` es igual a `expense_total`.
11. La sección Ahorro de la regla es igual a `savings_contributions`, no a una
    categoría de gasto.
12. Un usuario no puede leer, editar, borrar ni aportar a recursos de otro.
13. Los importes se serializan con dos decimales y no pierden precisión.
14. Las restricciones de unicidad de categoría, presupuesto y meta activa
    devuelven `409`, no `500`.
15. Los estados de presupuesto respetan los umbrales 80 y 100 exactos.
16. El registro crea las categorías predeterminadas del catálogo y guarda
    `terms_accepted_at`; un registro sin `accept_terms` falla.
17. Los presets de Reportes y el Dashboard usan meses calendario completos; el
    `current_month` no termina en la fecha actual.
18. `current_month` de Reportes y `period` del Dashboard devuelven los mismos
    totales para el mismo usuario y mes.
19. Sin ingresos, los porcentajes 50/30/20 son cero y los importes reales siguen
    visibles.
20. Una distribución que excede el porcentaje recomendado devuelve una
    diferencia positiva, sin recorte ni error.
21. Reintentar `POST /movements/` o un aporte con la misma `Idempotency-Key` y
    el mismo payload no crea un segundo movimiento y reproduce la respuesta.
22. La misma clave con otro payload u otra operación/endpoint devuelve
    `409 idempotency_conflict`.
23. Dos peticiones concurrentes con la misma clave producen como máximo un
    movimiento: una confirma y la otra reproduce la respuesta; si la ganadora
    revierte, la perdedora puede completar la creación. No se espera un 409 de
    «procesamiento en curso».
24. `POST /movements/` rechaza `savings_transfer` con `400`; el aporte solo se
    crea por `POST /savings-goals/{id}/contributions/`.
25. `POST /movements/` y el endpoint de aportes usan el mismo servicio interno de
    persistencia, sin crear una tabla de aportes ni duplicar la lógica del
    movimiento.
26. `status` de la meta no es una columna: se recalcula con los aportes,
    `target_amount` y `deadline`; `archived_at` es un archivo separado. `status`
    enviado en POST/PATCH devuelve `400`.
27. Desactivar o anonimizar una cuenta no deja movimientos sin propietario y
    revoca los refresh tokens.

## 14. Ejemplo de consulta SQL de referencia

No es una consulta final; ilustra el filtro que evita contaminar gastos:

```sql
SELECT movement_type, COALESCE(SUM(amount), 0) AS total
FROM movements_movement
WHERE user_id = :user_id
  AND movement_date >= :from
  AND movement_date <= :to
GROUP BY movement_type;
```

Los consumidores deben tomar únicamente `expense` para gastos y
`savings_transfer` para ahorro. Nunca deben agrupar ambos en una misma suma.

Para presupuestos:

```sql
SELECT COALESCE(SUM(m.amount), 0) AS spent
FROM movements_movement m
WHERE m.user_id = :user_id
  AND m.category_id = :category_id
  AND m.movement_type = 'expense'
  AND m.movement_date >= :month_start
  AND m.movement_date < :next_month_start;
```

La condición `m.movement_type = 'expense'` es la garantía funcional de que las
transferencias a metas no consumen presupuestos.

## 15. Decisiones pendientes (no bloqueantes)

1. **Versionado de términos y privacidad.** El MVP registra la fecha de
   aceptación (`terms_accepted_at`), pero no la versión aceptada. Si legal exige
   demostrar la versión, se añadirá al modelo y al registro; no cambia cálculos
   financieros.
2. **Retención legal y purga física.** El MVP desactiva o anonimiza la cuenta y
   conserva la historia financiera. Una purga física futura requiere definir el
   plazo legal y un proceso administrativo transaccional que no deje movimientos
   sin propietario.

Ninguna de estas decisiones altera las fórmulas ni los tipos de movimiento del
MVP. El versionado, si se exige, añadiría campos al registro y a `User`; la purga
física sería un proceso administrativo fuera de la API pública.
