# Plan — aprovechar el parser v2

Estado: en curso · Rama: `features/parser-v2` · Requiere
`@andrextor_ia11012/p2p-log-parser@2.0.0`

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

## Pendiente

### 1. Embudo de sesión: dejar de recalcularlo *(prioridad media)*

`domains/checkout/composables/useSessionFunnel.ts:75-91` deduce los pasos
haciendo `endpoint.includes("/otp/generate")`, `msg.includes("3DS")`, etc. El
`CheckoutMetadataExtractor` de la librería ya calcula por sesión
`flags {otp, threeDS, interest}`, `finalState`, `hasSuccessfulTransaction`,
`sessionType` y `reference`, y ahora los devuelve **también con una sola
sesión** (antes exigía dos).

Migrar el embudo a `metadata.sessions`. Si falta algún paso que la librería no
cubra, añadirlo allí en vez de reimplementarlo aquí.

### 2. Superficie de `stats` sin usar *(prioridad media)*

`LogAnalyzer.vue:77,170` usa el `StoreStats` local `{total, globalTotal, errors}`
e ignora el `ParseResult.stats` de la librería. Interesa sobre todo
**`unrecognized`**: el número de líneas que ninguna estrategia convirtió en
evento. Es la señal directa de «te equivocaste de aplicación» o «este formato
todavía no está soportado», y hoy el usuario no ve nada — el log simplemente
sale vacío.

Mostrarlo junto a los errores de parseo en `ParsingErrorsModal.vue`.
Nota: la fila de cabecera de un CSV cuenta como una unidad no reconocida.

### 3. Agrupar por intercambio *(prioridad baja)*

`pairKey` permite pintar petición y respuesta como una sola fila plegable con su
duración, en vez de dos eventos sueltos. Afecta a `TimelineGroup.vue`. Es un
cambio de diseño, no una corrección: decidir primero si aporta.

### 4. Panel de proveedores *(prioridad baja)*

`RestParseMetadata` trae `requestsByProvider`, `errors[]` y `slowest[]` (los
diez intercambios más lentos) y nadie los consume. Alimentan directamente un
panel de latencia y fallos por proveedor.

---

## Trampas conocidas

- **v2.0.0 no está en npm todavía.** El tag `v2.0.0` sí está en el remoto del
  parser, pero su CI condicionaba `pnpm publish` a que el tag *no* existiera, y
  con `fetch-depth: 0` el tag viaja en el clon: taguear antes de mergear apagó
  la publicación. Corregido en el parser (`fix(ci)`, sin pushear) para preguntar
  a npm en vez de al tag. Hasta que ese workflow corra, `pnpm install
  --frozen-lockfile` falla aquí y con él todo el CI: el lockfile sigue en
  `^1.3.0`. Regenerarlo (`pnpm install`) en cuanto la 2.0.0 esté publicada.
- **`processedHashes`** (`logStore.ts`) deduplica con
  `` `${timestamp}_${message.slice(0,60)}` ``. Ahora `event.id` es estable y
  deriva del contenido, así que sirve para lo mismo sin recortar cadenas.
- **Microsites sigue sin enriquecer.** No hay logs reales contra los que
  validar un parser propio, así que usa el mapper genérico: no esperar
  `phase`, `operation` ni `outcome` con detalle en ese dominio.
- **REST y Checkout no coinciden en `category` ante un fallo.** REST la cambia a
  `ERROR`; Checkout la deja como transporte (`HTTP_RES`) y refleja el fallo solo
  en `outcome`. Para colorear errores usar **siempre `outcome.isError`**, nunca
  `category`. Está pendiente de unificar en la librería.
