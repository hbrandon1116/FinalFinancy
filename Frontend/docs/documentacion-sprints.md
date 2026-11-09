# Documentación de Sprints — Final-Financy (Frontend)

Registro de lo realizado en cada sprint del frontend.

---

## Sprint 0 — Estructura base y enrutado

**Objetivo:** dejar el frontend de React + Vite organizado, escalable y con las rutas
principales creadas, sin desarrollar todavía ninguna funcionalidad.

**Estado:** completado y verificado.

### Qué se hizo

1. Se creó la estructura de carpetas del proyecto (`assets`, `components`, `pages`,
   `layouts`, `services`, `data`, `hooks`, `context`, `utils`).
2. Se crearon las 8 páginas de la aplicación, cada una en su propio archivo.
3. Se configuró React Router con las rutas de la aplicación.
4. Se creó `MainLayout` como layout compartido de las páginas internas.
5. Se creó `services/api.js` preparado para la futura API de Django REST Framework
   (sin conectar).
6. Se creó `data/mockData.js` con la estructura base de datos simulados.
7. Se definieron estilos globales básicos en `src/index.css`.
8. Se eliminaron los archivos residuales del template de Vite.

### Archivos creados

| Archivo | Descripción |
| --- | --- |
| `src/App.jsx` | Configuración de rutas con `BrowserRouter` y `Routes`. |
| `src/main.jsx` | Punto de entrada. **Sin cambios** respecto al template. |
| `src/index.css` | Estilos globales: reset, variables CSS y clases base del layout. |
| `src/layouts/MainLayout.jsx` | Layout común (sidebar, cabecera y contenido) con `Outlet`. |
| `src/components/ui/PageTitle.jsx` | Componente reutilizable del encabezado de cada página. |
| `src/pages/Login.jsx` | Página de inicio de sesión. |
| `src/pages/Registro.jsx` | Página de creación de cuenta. |
| `src/pages/Dashboard.jsx` | Página principal (resumen financiero). |
| `src/pages/Movimientos.jsx` | Página de ingresos y gastos. |
| `src/pages/Reportes.jsx` | Página de reportes. |
| `src/pages/Ahorro.jsx` | Página de metas de ahorro. |
| `src/pages/Presupuestos.jsx` | Página de presupuestos. |
| `src/pages/Ajustes.jsx` | Página de ajustes de la cuenta. |
| `src/services/api.js` | Capa de comunicación con la API (sin backend conectado). |
| `src/data/mockData.js` | Estructura de datos simulados para desarrollo. |
| `src/{assets,hooks,context,utils}/.gitkeep` | Conservan las carpetas vacías en Git. |
| `.env.example` | Plantilla de variables de entorno (`VITE_API_URL`). |
| `docs/documentacion-sprints.md` | Este documento. |

### Archivos eliminados (residuos del template de Vite)

| Archivo | Motivo |
| --- | --- |
| `src/App.css` | Dejó de usarse al reescribir `App.jsx`. |
| `src/assets/react.svg` | Recurso del template, sin uso. |
| `src/assets/vite.svg` | Recurso del template, sin uso. |
| `src/assets/hero.png` | Recurso del template, sin uso. |
| `public/icons.svg` | Sprite de iconos del template, sin uso. |
| `README.md` | Texto genérico de Vite; su documentación vive aquí. |

### Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `index.html` | `lang="es"` y `<title>Final-Financy</title>`. |
| `package.json` | Sin cambios: `react-router-dom` ya estaba instalado. |

### Estructura final

```
final-financy-frontend/
├── .env.example
├── docs/
│   └── documentacion-sprints.md
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/          # Imágenes, iconos y logos propios
│   ├── components/
│   │   └── ui/
│   │       └── PageTitle.jsx
│   ├── context/         # Contextos globales (auth, usuario, estado financiero)
│   ├── data/
│   │   └── mockData.js
│   ├── hooks/           # Hooks personalizados
│   ├── layouts/
│   │   └── MainLayout.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Registro.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Movimientos.jsx
│   │   ├── Reportes.jsx
│   │   ├── Ahorro.jsx
│   │   ├── Presupuestos.jsx
│   │   └── Ajustes.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/           # Moneda, fechas, cálculos y validaciones
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

### Función de cada carpeta

| Carpeta | Función |
| --- | --- |
| `src/assets/` | Recursos estáticos del frontend: imágenes, iconos propios, logos y demás recursos visuales. |
| `src/components/` | Componentes reutilizables de interfaz, agrupados por tipo. Hoy solo `ui/` con el encabezado de página. |
| `src/context/` | Contextos globales de React: autenticación, usuario actual y estado financiero. Se implementarán más adelante. |
| `src/data/` | Datos simulados (mocks) usados en desarrollo mientras no exista el backend. |
| `src/hooks/` | Hooks personalizados reutilizables entre componentes. |
| `src/layouts/` | Estructura general de la aplicación (sidebar, navegación y contenido). `MainLayout` agrupa las páginas que-usuario tiene sesión iniciada. |
| `src/pages/` | Una página por archivo. Cada ruta de la aplicación carga la página que le corresponde. |
| `src/services/` | Comunicación con la API de Django REST Framework. Concentra las peticiones HTTP para que el resto del código no las haga directamente. |
| `src/utils/` | Funciones auxiliares: formateo de moneda y fechas, cálculos financieros y validaciones. |

### Mapa de rutas

| Ruta | Página | Layout |
| --- | --- | --- |
| `/` | Redirige a `/login` | — |
| `/login` | `pages/Login.jsx` | suelto |
| `/registro` | `pages/Registro.jsx` | suelto |
| `/dashboard` | `pages/Dashboard.jsx` | `MainLayout` |
| `/movimientos` | `pages/Movimientos.jsx` | `MainLayout` |
| `/reportes` | `pages/Reportes.jsx` | `MainLayout` |
| `/ahorro` | `pages/Ahorro.jsx` | `MainLayout` |
| `/presupuestos` | `pages/Presupuestos.jsx` | `MainLayout` |
| `/ajustes` | `pages/Ajustes.jsx` | `MainLayout` |

### Decisiones de arquitectura

1. **`App.jsx` solo enruta.** No tiene lógica de negocio ni interfaz, para que crecer la aplicación
   no convierta ese archivo en un punto de conflicto.
2. **Rutas anidadas con `MainLayout`.** Las páginas de la aplicación cuelgan de una ruta de layout y
   se renderizan mediante `Outlet`. Cuando se añadan el sidebar y la protección de rutas, esos cambios
   quedan aislados en `layouts/MainLayout.jsx` sin tocar cada página.
3. **`PageTitle` reutilizable.** Evita repetir el marcado del encabezado en las 8 páginas.
4. **`MainLayout` con placeholders.** El sidebar y la cabecera son contenedores vacíos con comentarios:
   la estructura existe, el diseño llega en su sprint.
5. **`.gitkeep` en carpetas vacías.** Git no versiona directorios vacíos; sin este archivo
   `hooks`, `context`, `utils` y `assets` desaparecerían del repositorio.
6. **`services/api.js` como única puerta de salida.** Cuando exista el backend se implementa `request`
   una sola vez y toda la aplicación sigue hablando con ese módulo.
7. **Sin dependencias nuevas.** `react-router-dom` ya estaba en el proyecto. No se añadieron librerías
   de UI, gráficos, formularios ni manejo de estado global: se incorporarán cuando sean necesarias.
8. **`.env.example` en lugar de `.env`.** Documenta `VITE_API_URL` sin versionar valores reales ni
   arriesgar subir credenciales. Para usarlo: `copy .env.example .env`.

### Fuera de alcance en este sprint

No se implementó, por decisión explícita:

- Dashboard completo, gráficos y regla financiera 50/30/20
- Formularios de movimientos, presupuestos o metas de ahorro
- Login y registro funcionales
- Conexión con Django, base de datos o endpoints
- Autenticación y protección de rutas
- Sidebar y navegación
- Diseño visual de cualquier sección

### Verificación realizada

| Comprobación | Resultado |
| --- | --- |
| `npm install` | Correcto — 148 paquetes, 0 vulnerabilidades |
| `npm run lint` | Correcto — 0 errores de ESLint |
| `npm run build` | Correcto — 34 módulos, compilación sin errores |
| `npm run dev` | Servidor iniciado en `http://localhost:5173` |
| Rutas (`/`, `/login`, `/registro`, `/dashboard`, `/movimientos`, `/reportes`, `/ahorro`, `/presupuestos`, `/ajustes`) | Las 9 responden HTTP 200 y montan `#root` |
| Transformación de módulos en el dev server | Los 7 módulos principales compilan sin errores |

### Estado del repositorio

No se realizó ningún cambio fuera de `final-financy-frontend`. El backend de Django no se ha tocado.

---

## Próximos sprints (propuesta)

| Sprint | Contenido |
| --- | --- |
| 1 | Sidebar, navegación y diseño base de las secciones. |
| 2 | Contextos de autenticación, usuario actual y protección de rutas. |
| 3 | Login y registro funcionales, conectados a Django. |
| 4 | Categorías y registro de ingresos y gastos. |
| 5 | Dashboard: saldo, resumen del mes y regla 50/30/20. |
| 6 | Reportes por período, presupuestos y metas de ahorro. |