# Plan — aprovechar el parser v2

Estado: aplicado, a la espera de que se publique la librería · Rama:
`features/parser-v2` · Requiere `@andrextor_ia11012/p2p-log-parser@2.1.0`

## Contexto

La v2 del parser entrega ya resuelto lo que este proyecto venía derivando por su
cuenta. El principio de la librería es: **si el dato se puede derivar del log, lo
deriva el parser, no la capa visual.** Cada rodeo que quede aquí es lógica que
hay que mantener en paralelo al parser y que se desincroniza en silencio — como
pasó con `RestParseMetadata`, cuya copia local dejó de coincidir con la que la
librería emitía sin que nada avisara.

Campos nuevos disponibles en cada `LogEvent`:

| Campo | Qué trae |
|---|---|
| `correlation` | traceId, sessionId, transactionId, placetopayId, reference, internalReference, provider, operation, tenant, tenantId, siteId, login, bin |
| `outcome` | `{isError, status, kind, httpStatus, code, message, exception}`; `kind` ∈ exception \| business \| http \| validation |
| `pairKey` / `pairRole` / `durationMs` | ida y vuelta del mismo intercambio, y cuánto tardó |
| `ts` | epoch ms UTC |
| `details.phase` / `step` | (Checkout) fase del flujo según el prefijo `«{sujeto} trace:»` |
| `details.channel` / `transport` / `simulator` / `tag` | (REST) canal Monolog, transporte, modo simulador, etiqueta `[TAG]` |

Y en `ParseResult`: `stats` `{total, byApp, byCategory, byLevel, errorCount, unrecognized, timespan}`.

---

## Hecho (en esta rama)

- `LogUIHelper.isMatch` → `matchEvent` de la librería. `getFilterIdentity` lee `correlation`.
- `RestBody.vue` pinta `log.outcome` en vez de volver a buscar `dinError`.
- `RestLogCard.vue` usa `outcome.isError` y muestra `durationMs`.
- `logStore.ts`: fuera el forzado de `event.appType`, el `details.source = "FRONTEND"` manual y la extracción de `session_id` por seis rutas.
- `shared/types/base.ts` y `domains/rest/types.ts` reexportan los tipos de la librería en vez de redeclararlos.
- **Checkout, mismo tratamiento que REST:** `CheckoutLogCard.isErrorState` usa
  `outcome.isError`; `useCheckoutSessions` lee `correlation.sessionId`;
  `CheckoutBody` pinta el fallo resuelto.
- **Badge de estado unificado:** `getStatusBadge` (en `LogUIHelper`) cae a
  `outcome.status` cuando la v2 no da `statusCode`, y reemplaza el
  `statusCodeStyle` que estaba duplicado en las dos tarjetas.
- El bloque de error, idéntico en ambos dominios, vive en
  `shared/components/OutcomeAlert.vue`.

---

## Hecho (segunda tanda)

- **Embudo de sesión**: `useSessionFunnel` ya no deduce los pasos con
  `endpoint.includes(...)`. Lee `metadata.sessions`, que ahora publica los ocho
  hitos y las duraciones (hizo falta extender la librería: ver 2.1.0). Sigue
  respetando el filtro activo recortando a las sesiones visibles.
- **`stats.unrecognized`** se acumula en el store y sale en el badge de la
  cabecera y en `ParsingErrorsModal`, también cuando no hubo errores de línea.
- **Agrupación por `pairKey`**: `toTimelineRows` une petición y respuesta en una
  fila con su duración; la petición se despliega bajo demanda. Lo que se queda
  sin pareja sigue suelto — emparejar de más mentiría sobre la duración.
- **Panel de proveedores**: `ProviderPanel.vue` consume `requestsByProvider`,
  `slowest` y `errors` sobre la timeline REST.
- El barrel `shared/types/index.ts` era una lista explícita que se quedaba corta
  cada vez que la librería ganaba un tipo. Ahora reexporta todo.

---

## Trampas conocidas

- **La librería sigue sin publicarse.** npm está en 1.3.0. El paso `Publish
  Package to NPM` sí se ejecuta y **falla**, tanto en el merge de la v2 como
  después; `pnpm publish --dry-run` empaqueta bien en local, así que apunta a
  credenciales (`NPM_TOKEN`), no al build. El log del run necesita permisos de
  admin sobre el repo para leerse. Hasta que salga la 2.1.0, `pnpm install
  --frozen-lockfile` falla aquí y con él todo el CI: el lockfile sigue en
  `^1.3.0`. Regenerarlo (`pnpm install`) en cuanto esté publicada.
- **`sessionType` ya no es solo PAYMENT/COLLECT.** La 2.1.0 distingue
  SUBSCRIPTION y AUTOPAY, que antes caían en PAYMENT. El contador «Payments»
  del embudo cuenta todo lo que no es COLLECT ni UNKNOWN para no perderlos.
- **`processedHashes`** (`logStore.ts`) sigue deduplicando con
  `` `${timestamp}_${message.slice(0,60)}` ``. Ahora `event.id` es estable y
  deriva del contenido, así que sirve para lo mismo sin recortar cadenas.
- **Microsites sigue sin enriquecer.** No hay logs reales contra los que
  validar un parser propio, así que usa el mapper genérico: no esperar
  `phase`, `operation` ni `outcome` con detalle en ese dominio.
- **REST y Checkout no coinciden en `category` ante un fallo.** REST la cambia a
  `ERROR`; Checkout la deja como transporte (`HTTP_RES`) y refleja el fallo solo
  en `outcome`. Para colorear errores usar **siempre `outcome.isError`**, nunca
  `category`. Está pendiente de unificar en la librería.
