> # 📦 Repositorio archivado — el portal vive ahora en `EZI-Metales/ebi`
>
> **Archivado el 2026-09-18.** Este código se mudó a
> [`EZI-Metales/ebi`](https://github.com/EZI-Metales/ebi), en `apps/portal/`, junto a las
> migraciones de la base y al backend que lo alimenta. La mudanza se hizo con
> `git subtree`, así que **los 11 commits de este repo se conservan allá**.
>
> - **El sitio en vivo es <https://ezi-metales.github.io/ebi/>.** La URL anterior
>   (`/EBI-Frontend/`) sigue funcionando: redirige a la nueva conservando el hash, así que
>   un marcador a `#/balance-score-card` no se rompe.
> - **Se publica solo.** Un workflow construye y publica al hacer `push` a `main`; ya no
>   hay que correr `npm run deploy` a mano — esa era la razón por la que este sitio se
>   quedó diez meses sin actualizarse, con el Balance Score Card ya escrito y sin llegar
>   a nadie.
> - **Por qué se unificó:** decisión P-6 del plan `ebi-portal` del workspace. El backend
>   no estaba en ningún repositorio, así que un cambio del portal se repartía entre este
>   repo, el de la base y un App Service sin control de código fuente.
>
> Lo de abajo se conserva como estaba y **ya no se mantiene**.

---

# EBI-web-legacy

Frontend de EBI (React 18 + MUI 7 + Vite 6, `HashRouter`), desplegado en GitHub Pages.
Login y datos vienen de un backend Express (`src/services/api.service.js`, axios con
`withCredentials`).

## Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL del backend en producción (p. ej. `https://backend-eps.azurewebsites.net/api`). En desarrollo, si no se define, se usa el proxy de Vite (`/api` → `localhost:4000`). |
| `VITE_SCORECARD_MOCK` | `1` activa el modo mock del Balance Score Card (ver abajo). |

## Desarrollo

```
npm install
npm run dev
```

## Balance Score Card

Pantalla `/balance-score-card` (protegida, ítem fijo del Sidebar debajo de «Inicio»)
que muestra la matriz de KPI del Balance Score Card por perspectiva (Financiera,
Cliente, Procesos internos, Capital Humano), con columnas `Y-2`, `Y-1`, `Meta`,
`Ene`…`Dic` y `Y` (YTD), coloreadas contra la meta vigente. Los KPI de tipo `manual`
son editables en línea (diálogo de captura) para el usuario que tenga permiso.

- Servicio: `src/services/scorecard.service.js` (`getCatalog`, `getValues`, `postEntry`)
  sobre `api.service.js` sigue el contrato de `Backend-EPS` (`/api/scorecard/*`).
- Componentes: `src/components/Scorecard/` (`ScorecardToolbar`, `ScorecardMatrix`,
  `KpiCell`, `KpiEntryDialog`, `scorecard.format.js` con las reglas puras de formato,
  color y meta vigente).

### Modo mock (sin backend)

Con `VITE_SCORECARD_MOCK=1`, `scorecard.service.js` sirve datos de
`src/mocks/scorecard.mock.js` en vez de llamar al backend (catálogo, valores y
captura quedan en memoria del navegador).

Como el login real tampoco puede completarse sin backend, bajo la misma bandera
`AuthProvider` (`src/auth/context/Auth.provider.jsx`) trata la sesión como válida de
entrada, con un usuario ficticio `{ idUsuario: 0, Nombre: 'Modo demostración' }` y
menú vacío — así se puede llegar directo a cualquier pantalla protegida sin pasar por
`/login`. Es un cambio mínimo, acotado por completo detrás de la bandera; con
`VITE_SCORECARD_MOCK` apagado (o sin definir) el login funciona como siempre.

Para correr todo en modo mock:

```
# PowerShell
$env:VITE_SCORECARD_MOCK='1'; npm run dev

# bash
VITE_SCORECARD_MOCK=1 npm run dev
```

Y navegar a `http://localhost:3001/#/balance-score-card`.
