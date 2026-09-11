# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.8.0] - 2026-09-11

### Added
- **El embudo dice cómo acabó cada sesión.** Columna *Result* con el `outcome`
  que ya deriva la librería (2.5.0): `APPROVED`, `REJECTED`, `PENDING`,
  `FAILED`, `EXPIRED`, `ABANDONED @ paso` o `UNKNOWN` cuando se procesó pero el
  log no trae la resolución. Hasta ahora el punto verde en *Process* solo
  decía que se llegó a `/process`; un rechazo se veía igual que un pago.
- Columnas *Process* (created → process) y *Total* (primer → último evento),
  también en el CSV.
- Orden de la tabla por tiempo, por resultado (fallos primero) o por duración,
  y «showing 15 of N» con botón para verlas todas en vez de un recorte mudo.
- Tarjetas *Processed* y *Approved*; el embudo gana un último escalón
  *Approved*.

### Changed
- **El color dice el resultado, no el código HTTP.** Un rechazo del gateway
  viaja en un 200 y el badge lo pintaba «200» en verde; ahora, cuando el
  resultado no es OK, manda él: `PENDING` en naranja, `REJECTED` y `FAILED` en
  rojo. El aviso de la tarjeta explica también los rechazos.
- Un rechazo no es un error: no cuenta en el contador ni en el filtro de
  fallos ni pone el borde rojo (eso queda para `FAILED`). Viene de la librería
  2.5.1, que traduce el estado del gateway a resultado.
- En el embudo, `EXPIRED` pasa a rojo junto a `REJECTED` y `FAILED`.
- **La tarjeta de checkout enseña `TX` y `P2P ID`** junto a SID y Trace, con
  clic para copiar y filtrar. El id de transacción venía en la mitad de las
  líneas y el `placetopay_id` en las que cierran el pago, y solo se veían
  abriendo el JSON. Ojo: en «Calling updateSessionStateAction» y en los
  «Update session state trace» la app de checkout escribe `placetopay_id:
  null`; ahí no hay nada que mostrar.
- El pipeline de estado lee también `new_status`, que es la clave que usa
  «Calling updateSessionStateAction» para el `pending → finished`.

### Fixed
- **La conversión contaba rechazos.** Era «llegó a `/process` / total»; ahora
  es aprobadas / total.
- **Las barras del embudo mezclaban COLLECT con pagos.** Un cobro por API nunca
  hace entry ni show, así que en un lote con cobros el embudo dibujaba una caída
  en *Entry* que no era abandono. Se calcula solo sobre sesiones con SPA y se
  indica cuántos cobros quedan fuera.
- Tipo de sesión: SUBSCRIPTION, AUTOPAY y UNKNOWN se pintaban como «Collect».
- El CSV recalculaba resultado y paso de abandono con su propia regla; ahora
  usa la del parser.

## [1.7.0] - 2026-09-11

### Added
- **Una tarjeta por entrada al checkout.** Los registros que deja cada carga de
  la página —`checkout.session.created`, `GET /spa/session/…`,
  `checkout.session.entry`, `Fetching SPA index.html` y el `GET
  /api/v4/session/{id}/{token}` con que el SPA carga la sesión— son siempre los
  mismos y por separado no cuentan nada, así que iban en cinco tarjetas
  plegables con un HTML entero de payload. Ahora se colapsan en una sola
  tarjeta abierta (`SessionEntryCard`) con una línea por registro: hora, lado
  (FRONTEND/BACKEND), evento y tipo o ruta.
- El grupo se corta al cambiar de sesión y cuando arranca otra carga con
  distinta traza, así una recarga o la vuelta de 3DS salen como una segunda
  entrada y no se confunden con la primera. Un registro con fallo nunca se
  colapsa: conserva su tarjeta y su borde rojo.

## [1.6.1] - 2026-09-10

### Fixed
- **Las horas de la traza se leían en zonas distintas.** La hora de cada tarjeta
  salía de recortar el texto `timestamp`, que trae la hora local del archivo de
  log de origen: las líneas del SDK vienen en `-05:00` y las de `http.log` en
  UTC, así que un request de las `13:35:41` aparecía respondido a las
  `18:35:45`. Ahora se rinde desde `ts` —el epoch, siempre en UTC— y se muestra
  en `America/Bogota`, la zona en que se emiten los logs.
- **El bloque de un minuto dependía del navegador.** `toLocaleString` sin zona
  usa la de la máquina, así que la misma traza se repartía en bloques distintos
  según quién la mirara. Va con la zona fija.
- **La ventana temporal del resumen del lote salía en UTC**, por convertir el
  epoch a ISO antes de formatearlo.

### Changed
- `formatEventTime` recibe el epoch (`ts`) y un texto de respaldo, en vez de la
  marca de tiempo en texto. La precisión mostrada es de milisegundos: los
  microsegundos que traían algunas líneas no sobreviven al epoch.

## [1.6.0] - 2026-09-09

### Changed
- **Fuera la barra de facetas.** Resultado, Tipo de fallo, Proveedor, Operación, Transporte, Entorno, Fase y Categoría ocupaban tres filas de la barra superior para acotar un lote que casi siempre cabe en una pantalla de scroll. Se van también las fichas de categoría del resumen. Quedan el nombre del analizador, la ventana temporal con el tiempo transcurrido, los contadores del lote, el atajo de fallos críticos y el buscador. El panel de proveedores de REST sigue funcionando: acciona la misma faceta, que se conserva. Caen con ello `FacetBar.vue`, `buildFacets` y los recuentos por categoría y nivel de `summarizeEvents`, que ya no miraba nadie.

### Fixed
- **Subir logs a REST podía dejar la pantalla en blanco.** `RestBody` llamaba a `details.action.replace(...)`, y `action` es opcional en la librería de parseo: una sola línea sin acción lanzaba `Cannot read properties of null` y Vue abortaba el render de todo el árbol. La etiqueta se omite cuando no hay acción.
- **La lectura de logs se descuadraba al estrechar la ventana.** La línea de tiempo medía `calc(100vh - 180px)`, un hueco calculado a ojo para la cabecera de escritorio; en móvil la barra de control envuelve a tres filas y esos 180px se quedaban cortos, así que la lista se salía de la pantalla y su scroll interno quedaba fuera de alcance. Ahora la altura se hereda del contenedor —`h-dvh` en la raíz, `flex-1 min-h-0` en medio— y no hay número que ajustar.
- **El Session Explorer se comía el ancho del móvil.** Sus 256px fijos dejaban la línea de tiempo en un canal inservible. Por debajo de 768px arranca cerrado y se abre superpuesto sobre la lista, con fondo para cerrarlo; el botón para reabrirlo ya no exige tener un filtro de sesión activo. El panel sigue el cambio de tamaño de la ventana, no solo el arranque: encogerla con el panel abierto también lo cierra.
- **Scroll horizontal en móvil.** La cabecera de cada bloque temporal usaba un `-ml-8` sin padre que lo absorbiera. Las acciones de la cabecera de la línea de tiempo (Results, Funnel, Export, Errors) ahora envuelven en vez de desbordar.

## [1.5.0] - 2026-09-09

Cierra el plan de UI/UX (`docs/plan-ux.md`): fases 4, 5 y 6.

### Added
- **Franja de contexto del lote**: ventana temporal, total, fallos, líneas sin reconocer y reparto por categoría, bajo la barra de control. Se calcula sobre los eventos de la pestaña activa y no sobre `ParseStats`, porque este describe una sola llamada al parser mientras el store acumula varias subidas.
- **El panel de proveedores navega**: pulsar un proveedor —o uno de sus fallos— enciende y apaga su faceta. Acciona el filtro que ya existía en vez de estrenar uno propio.

### Changed
- **Jerarquía de la tarjeta**: cabecera común (`LogCardHeader`) para los dos dominios, con el mensaje como único elemento con peso tipográfico, la fila de badges deliberadamente tenue y la ruta recortada por el centro, que conserva la cola —que es lo que identifica una llamada—. `durationMs` sube a la cabecera también en Checkout.
- La hora se formatea igual en las tarjetas y en el intercambio; antes eran dos relojes distintos en la misma pantalla.
- **Micrositios sale de la interfaz.** La librería solo le ofrece un formato frente a los cinco de Checkout y los tres de REST, así que sus eventos salen sin enriquecer. Se le dará pestaña cuando tenga estrategias propias. Cae también `AnalyzerSelector.vue`, que no importaba nadie.

### Changed
- **El payload se ve entero al desplegar la tarjeta.** Tenía un tope de 384px con scroll propio dentro del acordeón, así que un JSON de treinta líneas —el tamaño normal de una petición— obligaba a desplazar dentro de algo que ya estabas desplazando. El scroll horizontal se queda: una línea larga no debe romper el ancho.

### Fixed
- **El modo claro no se leía.** Los grises de texto usaban `slate-400`, que sobre blanco da 2.56:1 —muy por debajo del 4.5:1 que exige WCAG AA—, y los badges tiraban de `emerald-600` (3.77:1) y `orange-600` (3.56:1). Los tonos suben a `slate-600` y a la familia `-700`, y el neutro de los badges gana fondo y borde propios. El modo oscuro se revisó con el mismo método y estaba bien salvo tres sitios: la ruta y el bloque de raw log usaban `slate-500` (3.80:1 sobre la tarjeta oscura) y la etiqueta «Exchange» usaba `slate-600` (2.38:1). Pasan a `slate-400`, que da 7.05:1. El resto de la paleta oscura —incluidos los tonos de color y el JSON en verde sobre negro— ya superaba el mínimo con holgura.
- **La deduplicación perdía eventos.** `processedHashes` usaba `timestamp + los primeros 60 caracteres del mensaje`, así que dos peticiones seguidas a la misma ruta que solo se diferencian en el identificador del final colisionaban y se descartaba una, en silencio. Ahora la clave es `event.id`, que el parser deriva del contenido completo y de la traza.

## [1.4.0] - 2026-09-09

Revisión de UI/UX guiada por `docs/plan-ux.md`: se corrigen cuatro fallos de
experiencia y se pone en pantalla la información que el parser ya resolvía.
Requiere `p2p-log-parser@2.4.0`.

### Fixed
- **El contador de fallos y el filtro no describían el mismo conjunto.** El contador usaba `outcome.isError` y el filtro comparaba `level === "ERROR"`; como un rechazo del proveedor llega en `INFO`, el botón decía doce fallos y aparecían tres. Ambos comparten ahora el predicado `isFailure`, y el filtro de nivel pasa a ser de resultado.
- **El logo borraba los datos.** El cuadro «P2P» de la cabecera llamaba a `clearLogsByApp` sin confirmación. Deja de ser botón, y «Clear Logs» confirma.
- **No se podía añadir un log sin borrar el anterior.** El uploader solo existía en el estado vacío; ahora hay un botón permanente que lo abre en modal. El store ya acumulaba y deduplicaba.
- **La búsqueda solo miraba `message` e `id`.** Ahora también el endpoint, la operación, el proveedor y los identificadores de `correlation`: pegar una referencia o un BIN encuentra sus eventos.
- **Los intercambios no se agrupaban si cruzaban un minuto.** Se emparejaba dentro de cada bloque de la línea de tiempo, y los bloques son de un minuto. Ahora se empareja antes de agrupar.

### Added
- **Sistema de badges con ranuras fijas** (`getEventBadges`): resultado, transporte y dirección, servicio, origen, y simulador o fase. Presupuesto de cuatro en la tarjeta plegada, posiciones estables y color reservado al resultado. Pone en pantalla `transport`, `simulator`, `phase`, `channel`, `tag`, `operation` y `outcome.kind`, que no se veían en ningún sitio.
- **Filtros por facetas** construidos sobre el lote: una faceta sin valores no se pinta, y la que se queda con uno solo se retira. Los recuentos se afinan con las demás facetas pero ignoran la propia, para que ningún valor anuncie resultados que luego no aparecen.
- **Tarjeta única de intercambio** (`ExchangeCard`): petición y respuesta en dos columnas bajo una cabecera compartida, con botón de desplegado visible y clic en cualquier parte de la tarjeta.
- **Líneas no reconocidas** (`stats.unrecognized`) visibles en la cabecera y en el modal de errores.
- **Panel de proveedores** en la timeline REST, con peticiones por proveedor, los más lentos y los fallos del lote.

### Changed
- El embudo de sesión lee `metadata.sessions` en vez de deducir los pasos con `endpoint.includes(...)`.
- `shared/types` reexporta la librería entera en vez de una lista escrita a mano que se quedaba corta.
- Fuera `src/logic/types.ts`, un barrel que no importaba nadie.

## [1.3.0] - 2026-09-09

Esta versión traslada al parser todo lo que la capa visual venía derivando por su
cuenta. Requiere `p2p-log-parser@2.1.0`.

### Changed
- **Detección de errores unificada**: `CheckoutLogCard` usa `outcome.isError` en vez de combinar nivel, categoría y `statusCode`. La categoría no servía para esto: ante un fallo, REST la cambia a `ERROR` mientras Checkout la deja como transporte.
- **Identificación de sesión**: `useCheckoutSessions` lee `correlation.sessionId` en lugar de recorrer seis rutas a mano.
- **Embudo de sesión**: `useSessionFunnel` pasó de deducir los pasos con `endpoint.includes(...)` y `msg.includes("3DS")` a leer `metadata.sessions`. Sigue respetando el filtro activo, recortando a las sesiones visibles.
- **Badge de estado**: la v2 dejó de inventar el `statusCode`, así que donde antes había un `200` fabricado ahora se muestra `outcome.status` (`OK` / `FAILED` / `REJECTED` / `PENDING`), que sí sale del log.

### Added
- **Panel de proveedores**: `ProviderPanel` pinta peticiones por proveedor, los diez intercambios más lentos y los fallos del lote sobre la timeline REST.
- **Líneas no reconocidas**: `stats.unrecognized` se muestra en la cabecera y en el modal de errores. Es la señal de «te equivocaste de aplicación» o «formato no soportado»; antes el log salía vacío sin explicación.
- **Agrupación por intercambio**: petición y respuesta se pintan como una sola fila con su duración; la petición se despliega bajo demanda. Lo que se queda sin pareja sigue suelto.
- **`OutcomeAlert`**: el bloque de error, antes duplicado, lo comparten REST y Checkout.

### Fixed
- **Builds nativos bloqueados**: `pnpm-workspace.yaml` traía el texto de ejemplo como valor (`'@biomejs/biome': set this to true or false`), que no es un booleano. pnpm abortaba con `ERR_PNPM_IGNORED_BUILDS` en cada comando y biome, esbuild y sharp se quedaban sin su postinstall.
- **Barrel de tipos**: `shared/types/index.ts` era una lista escrita a mano que se quedaba corta cada vez que la librería ganaba un tipo, y el fallo aparecía lejos del sitio real.

## [1.2.2] - 2026-04-21

### Changed
- **Timeline Layout**: Transitioned the timeline visualization from a constrained zigzag layout to a full-width vertical backbone, improving screen real estate utilization.
- **Log Cards Aesthetics**: Refined the visual hierarchy of log cards, enlarging primary log messages and softening metadata for cleaner scannability. Added category-specific icons (upload, download, error, user action) for immediate recognition.
- **Log Parsing Engine**: Bumped `p2p-log-parser` dependency to `1.2.3` to incorporate improved "Frontend Request" descriptions and robust source identification.

### Added
- **Interactive Sticky Headers**: Timeline headers are now clickable buttons that trigger smooth scrolling (`scrollIntoView`) back to the start of their corresponding log block.
- **Quick-Copy Metadata**: The "Essential Identifiers" (Trace Hash, Reference, Tenant) at the bottom of the log cards now act as one-click copy buttons with instant visual success feedback, replacing the previous session-filtering behavior.
- **Copy Raw Log**: Introduced a hover-activated button on the raw log indicator to easily copy the unformatted log title directly to the clipboard.

### Fixed
- **UI Styling**: Resolved a typo (`group/terminall`) in the JSON payload viewer component.

## [1.2.1] - 2026-03-30
### Added
- **Timeline Session Context**: The `TimelineHeader` now elegantly displays the extracted `TENANT_DOMAIN` and the current `session_id` as a badge whenever a specific Session is actively filtered or is perfectly singular in the file.

### Fixed
- **Trace Context Extraction**: Enhanced `isMatch` to comprehensively query nested JSON properties (like `context.session_id` or `payload.session_id`), allowing non-standard formats (such as raw Grafana logs) to appropriately funnel down to their respective Sessions Explorer instances.
- **Library Parser Overrides**: Explicitly enforced `appType` bindings inside the log store to prevent the `p2p-log-parser` engine from inadvertently miscategorizing `Checkout` traces into the `REST` domain tabs.
- **Standalone Traces Auto-Selection**: Isolated, standalone logs uploaded without generating dedicated global `metadata` now cleanly fallback by pushing their discovered IDs to the store. This flawlessly triggers the Session UI logic.

## [1.2.0] - 2026-03-30

### Added
- **Global Paste Listener**: Enabled pasting logs directly via `Ctrl+V` without needing to focus the application explicitly.

### Changed
- **Layout Space Optimization**: Removed the static application footer and integrated it into the LogAnalyzer's empty state, giving full vertical space to the log timelines.
- **Session Explorer UI**: Pre-calculated metadata directly via computed properties, saving redundant function calls during view rendering. Hidden `UNKNOWN` tag instances for cleaner UI.

### Fixed
- **Formats Reactivity Issue**: Fixed a bug where supported parsing formats weren't dynamically updated when changing from `Checkout` to `REST` tabs.

## [1.1.0] - 2026-03-24

### Added
- **Floating Session Focus**: Relocated the session navigation pill to a premium floating fixed footer "above the block" for improved accessibility and to avoid content clashing.
- **Session Explorer Sidebar**: Extracted the session list into a dedicated `SessionExplorer` component for better modularity.
- **Enhanced Glassmorphism**: Updated the UI with richer backdrop blurs, ring borders, and multi-layered shadows for a more high-end feel.

### Changed
- **Modular Architecture**: Significant refactoring of `CheckoutTimeline.vue`:
  - Extracted core session logic into the `useCheckoutSessions` composable.
  - Deployed new sub-components: `SessionExplorer.vue` and `SessionFocusPill.vue`.
  - Reduced main component complexity and file size by over 60%.


## [1.0.1] - 2026-03-24

### Changed
- **UI/UX Overhaul**: Completely redesigned the core visualization components for a more premium, modern, and navigable experience:
  - `LogCard.vue`: Improved typography, layout, and added smooth CSS Grid accordion animations.
  - `CheckoutBody.vue`: Replaced the tags UI with structured data grids, visual state transition pipelines, and Mac-style terminal code blocks for payloads.
  - `LogUploader.vue`: Added a clear empty-state dropzone with drag-and-drop support, loading feedback for large files, and designated raw data areas.
  - `LogTimeline.vue`: Transformed into an "Explorer Layout" with a left sidebar for sessions and a sticky floating navigation pill for the active session.

## [1.0.0] - 2026-03-24

### Added
- Initial release of the Log Trace P2P analyzer.
- Support for Checkout and REST log parsing.
- BiomeJS integration for linting and formatting.
- GitHub Actions CI/CD pipeline with automated tags and releases.
- Vitest setup for unit testing.
- Type-safe log parsing integration with `@andrextor_ia11012/p2p-log-parser`.
