# Plan y spec — UI/UX v2

Estado: propuesta · Requiere `@andrextor_ia11012/p2p-log-parser@2.1.0` (ya
instalado)

## Por qué

El concepto funciona: pegas un log, la aplicación lo ordena en una línea de
tiempo y te deja seguir una traza. Lo que falla es la **densidad y el orden de
lectura**. Hoy la aplicación muestra mucho de lo poco que tiene resuelto, y nada
de lo mucho que el parser ya le entrega. El resultado es una tarjeta cargada de
chips que no responden a ninguna pregunta concreta, y un juego de filtros que no
cubre las preguntas que el usuario sí se hace: *¿qué falló?*, *¿contra qué
proveedor?*, *¿fue el simulador?*, *¿en qué fase del checkout se cayó?*

El principio que gobierna este plan es el mismo del parser, movido una capa
arriba: **si el dato ya está resuelto, la UI decide cuándo enseñarlo, no cómo
calcularlo.** Y su corolario, que es el que evita la saturación: **un badge solo
existe si responde a una pregunta que el usuario se hace mirando esa tarjeta.**

---

## Diagnóstico

Lo que sigue está verificado contra el código, no supuesto.

### 1. El contador de fallos y el filtro de fallos no hablan del mismo conjunto

`logStore.ts:44-56` cuenta los errores con el criterio bueno:

```ts
e.outcome?.isError || e.level === "ERROR" || e.level === "CRITICAL"
```

Pero al pulsar el botón, `LogAnalyzer.vue:77` pone `levelFilter = "ERROR"` y
`logStore.ts:72` filtra con `event.level !== activeLevel`. Un rechazo del
proveedor llega como `INFO`, así que **el botón dice «12 Critical failures» y al
pulsarlo aparecen 3**. Es el bug más caro de la aplicación: entrena al usuario a
desconfiar del único atajo que tiene para llegar a lo que le importa.

### 2. El logo borra los datos

`LogAnalyzer.vue` monta el cuadrado «P2P» de la esquina superior izquierda con
`@click="handleClearContext"`, que llama a `store.clearLogsByApp`. Tiene el
aspecto exacto de un logotipo de vuelta al inicio, y sin confirmación ni
deshacer. Hay un botón «Clear Logs» explícito a la derecha, así que este es
puro daño colateral.

### 3. No se puede añadir un log sin borrar el que hay

El uploader vive en el `v-else` de `hasEventsForCurrentTab`. En cuanto hay un
evento, desaparece de la interfaz. Para sumar un segundo fichero —el caso normal
cuando cruzas Checkout con REST, o dos exports del mismo incidente— hay que
vaciar primero. El store, en cambio, **sí** soporta acumular: dedu­plica por
huella y concatena.

### 4. La búsqueda solo mira dos campos

`logStore.ts:83-86` busca en `event.message` y `event.id`. No mira el endpoint,
ni el proveedor, ni la operación, ni ninguno de los trece identificadores de
`correlation`. Escribir una referencia de pago en el buscador no encuentra nada,
aunque el parser la tenga resuelta en `correlation.reference`.

### 5. Datos resueltos que la interfaz ignora por completo

Ninguno de estos aparece en pantalla, en ningún sitio:

| Dato | Qué contesta |
|---|---|
| `details.transport` | ¿fue HTTP, SOAP, ISO8583 o interno? |
| `details.simulator` | **¿esto corrió contra el simulador o contra el proveedor real?** |
| `details.phase` / `step` | ¿en qué fase del checkout estamos? |
| `details.tag` | `[KOUNT]`, `[SUBSCRIPTION][PAYMENT_PROCESS]`… |
| `details.channel` | canal Monolog: identifica al proveedor cuando falta `provider` |
| `outcome.kind` | ¿excepción de transporte, rechazo de negocio, HTTP o validación? |
| `stats.byCategory` / `byLevel` / `timespan` | composición y ventana temporal del lote |
| `describeOperation()`, `REST_OPERATION_LABELS` | nombre legible de `sale`, `createOTP`… |

`simulator` es el más grave de la lista: es la diferencia entre «el proveedor
rechazó el pago» y «esto nunca salió de casa», y ahora mismo no se distingue.

### 6. Micrositios existe en el modelo pero no en la interfaz

`APP_TYPES` declara `MICROSITIOS` y `LogCard.vue:19` le asigna
`CheckoutLogCard`, pero la cabecera solo pinta pestañas para `CHECKOUT` y
`REST`. Es una rama muerta: se puede llegar por el tipo del evento pero no
navegar a ella.

### 7. La tarjeta no tiene jerarquía

`CheckoutLogCard.vue` son ~340 líneas de plantilla donde todos los chips pesan
lo mismo: mismo tamaño, mismo grosor, mismo tratamiento. Sin una posición fija
por tipo de dato, el ojo no aprende dónde mirar y tiene que releer cada tarjeta
entera.

---

## Principios de diseño

1. **Tres niveles de lectura.** Fila superior: *qué pasó y cómo acabó*. Fila
   secundaria: *quién y dónde*. Desplegable: *el detalle y el JSON*.
2. **Posiciones fijas.** Cada clase de dato tiene su ranura. El ojo aprende que
   el resultado está siempre a la izquierda y el proveedor siempre en la tercera
   posición. Un badge que salta de sitio cuesta más que uno que falta.
3. **Presupuesto de cuatro badges** en la tarjeta plegada. El quinto va dentro.
   Si algo entra, algo sale.
4. **Silencio por defecto.** Un badge que aparece en el 100% de las tarjetas no
   informa: es ruido con estilo. `provider: API_REST` ya se oculta por eso;
   la regla se generaliza.
5. **El color solo significa resultado.** Rojo, ámbar y verde quedan reservados
   para `outcome`. Todo lo demás es neutro, para que un fallo se vea desde el
   otro extremo de la pantalla.

---

## Fase 1 — Lo que no es cosmético *(prioridad alta)*

Son cuatro bugs de experiencia, no mejoras. Van primero porque el resto se
construye encima.

### 1.1 Un solo criterio de error

Sustituir `levelFilter: LogLevel | "ALL"` por `outcomeFilter: "ALL" | "ERRORS"`
en el store, filtrando con el mismo predicado que ya usa `stats.errors`.

**Criterio:** el número del botón y la cantidad de tarjetas tras pulsarlo
coinciden siempre. Test unitario sobre el predicado, con un evento `INFO` que
lleva `outcome.isError: true`.

### 1.2 El logo no destruye

Quitar el `@click` del cuadro «P2P». Si se quiere acción, que sea volver al
uploader sin borrar. «Clear Logs» ya existe y debe pedir confirmación:
`ConfirmationModal.vue` ya está en el repo, usado por `LogUploader`.

### 1.3 Añadir logs sin vaciar

Un botón «Add logs» permanente en la barra de control que abra `LogUploader` en
un modal. El store ya acumula y deduplica; es solo exponerlo.

**Criterio:** subir dos ficheros seguidos deja los eventos de ambos, y el
contador de la pestaña refleja la suma.

### 1.4 Búsqueda que mira donde está el dato

Extender el filtro de texto a `details.endpoint`, `details.operation`,
`details.provider` y a todos los valores de `correlation`.

**Criterio:** pegar una referencia, un BIN o un `traceId` en el buscador
encuentra sus eventos.

---

## Fase 2 — Sistema de badges *(prioridad alta)*

El núcleo de la petición. Un helper único, `getEventBadges(event)` en
`shared/ui/`, devuelve una lista ordenada y ya recortada al presupuesto. Las
tarjetas dejan de decidir: solo pintan.

```ts
interface Badge {
  slot: "outcome" | "transport" | "service" | "flow";
  text: string;
  title: string;      // tooltip con el nombre largo
  tone: "danger" | "warn" | "ok" | "neutral" | "alert";
  mono?: boolean;
}
```

### Ranura 1 — Resultado *(siempre primera, es la única con color)*

| Condición | Badge | Tono |
|---|---|---|
| `details.statusCode` numérico | el código | por rango: 5xx danger, 4xx warn, resto ok |
| si no, `outcome.status` | `OK` / `FAILED` / `REJECTED` / `PENDING` | ok / danger / warn / neutral |
| `outcome.kind` presente y hay fallo | se añade al `title`, no ocupa ranura | — |

Ya implementado parcialmente en `getStatusBadge`; se absorbe aquí.

### Ranura 2 — Transporte y dirección *(responde «¿es una petición HTTP?»)*

Esta es la ranura que pide el ejemplo del encargo. Combina `category`,
`details.method` y `details.transport` en **un solo** badge en vez de tres:

| Señal | Badge |
|---|---|
| `category` `HTTP_REQ_OUT` + `method` | `→ POST` |
| `category` `HTTP_REQ_IN` + `method` | `← POST` |
| `category` `HTTP_RES` | `← RES` |
| `transport: "soap"` | `SOAP` |
| `transport: "iso8583"` | `ISO8583` |
| `transport: "internal"` | `INTERNAL` |
| `category` `DB_OP` / `USER_ACTION` / `BROWSER_LOAD` | icono actual, sin texto |

`transport` manda sobre `method` cuando ambos existen: saber que fue SOAP dice
más que saber que fue POST.

### Ranura 3 — Servicio *(responde «¿contra quién?»)*

| Fuente, en orden | Nota |
|---|---|
| `details.provider` | omitido si es `API_REST` (regla ya vigente) |
| `correlation.provider` | |
| `details.channel` | resuelto con `CHANNEL_PROVIDERS` de la librería |

Y encima, cuando `details.simulator === true`, un badge **`SIM`** con tono
`alert`, que es el único no-resultado con color propio. Es información que
cambia por completo la lectura de un fallo y no puede pasar desapercibida.

### Ranura 4 — Contexto de flujo

- **Checkout**: `details.phase` como texto y `details.step` en el tooltip.
- **REST**: `describeOperation(details.operation)` para el nombre legible, con
  el crudo en el tooltip. `details.tag` si no hay operación.

### Lo que sale de la tarjeta plegada

`source`, `subType`, `awsRequestId` y el endpoint completo bajan al desplegable.
El endpoint se queda arriba pero **truncado por el centro** (`/api/…/process`),
que conserva el final, que es la parte que identifica.

---

## Fase 3 — Filtros por facetas *(prioridad alta)*

Sustituir el par «buscador + toggle de errores» por una barra de facetas que se
construye **sobre lo que hay en el lote**, no sobre una lista fija: una faceta
sin valores no se pinta.

| Faceta | Origen | Control |
|---|---|---|
| Resultado | `outcome.status` | chips múltiples |
| Tipo de fallo | `outcome.kind` | chips, solo si hay fallos |
| Proveedor | `metadata.requestsByProvider` / `correlation.provider` | desplegable con recuento |
| Operación | `correlation.operation` | desplegable con recuento |
| Transporte | `details.transport` | chips |
| Simulador | `details.simulator` | interruptor «solo real» |
| Fase | `details.phase` | chips (solo Checkout) |
| Categoría | `stats.byCategory` | desplegable |

Cada faceta muestra su recuento, y las combinaciones son conjunción entre
facetas y disyunción dentro de cada una. Las facetas activas se resumen en
chips descartables, ampliando el `#filter-chip` que ya existe.

**Criterio:** con un log de checkout real se puede llegar a «respuestas del
proveedor X, rechazadas, que no son del simulador» sin escribir texto libre.

---

## Fase 4 — Jerarquía de la tarjeta *(prioridad media)*

Reescribir la cabecera de `CheckoutLogCard` y `RestLogCard` sobre una base
común, `LogCardHeader.vue`, que consume `getEventBadges`. Hoy las dos tarjetas
repiten la misma estructura con clases distintas.

Disposición fija:

```
┌─────────────────────────────────────────────────────────────┐
│ [200] [→ POST] [CREDIBANCO] [SIM]        1.24 s   12:04:31  │  ranuras + duración + hora
│ Autorización rechazada por el proveedor                     │  mensaje, el elemento con más peso
│ /api/…/process · sesión a1b2c3                        ▾     │  contexto tenue
└─────────────────────────────────────────────────────────────┘
```

El mensaje pasa a ser el elemento tipográficamente dominante. Hoy compite con
seis chips del mismo tamaño.

`durationMs` sube a la cabecera en **ambos** dominios: ahora solo lo pinta REST.

---

## Fase 5 — Paridad entre dominios *(prioridad media)*

`SessionExplorer` es el mejor componente de la aplicación y solo lo tiene
Checkout. REST se merece su equivalente, alimentado por `RestParseMetadata`, que
ya trae `requestsByProvider`, `errors[]` y `slowest[]`.

**Hecho, con una desviación:** en vez de un panel lateral con su propio filtro,
`ProviderPanel` acciona la faceta de proveedor que la fase 3 ya construyó.
Un panel aparte habría significado dos formas de filtrar lo mismo, que acaban
discrepando; así el estado del filtro es uno solo y el panel se limita a ser
otra puerta de entrada. Pulsar un proveedor —o uno de sus fallos— enciende y
apaga esa faceta.

**Micrositios, retirado de la interfaz.** La librería solo le ofrece un formato
—el parser genérico de líneas Laravel— frente a los cinco de Checkout y los tres
de REST, así que sus eventos salen sin fase, sin operación y sin `outcome` con
detalle. Darle pestaña habría sido exponer algo a medias; se le dará cuando
tenga estrategias propias y logs reales contra los que validarlas. De paso cae
`AnalyzerSelector.vue`, que no importaba nadie.

---

## Fase 6 — Contexto del lote *(prioridad baja)*

Una franja de resumen bajo la barra de control: ventana temporal, reparto por
categoría, fallos y el `unrecognized`. Responde «¿qué acabo de cargar?» antes de
empezar a leer tarjetas.

**Hecho, sin usar `ParseStats`.** Sus campos describen **una** llamada al
parser, y el store acumula varias subidas repartidas por aplicación: enseñar las
del último lote habría descrito otra cosa. `summarizeEvents` cuenta sobre los
eventos ya parseados de la pestaña activa, usando el `ts` que el parser resolvió
—sin volver a interpretar fechas— y el mismo `isFailure` que el resto de la
aplicación. Las categorías accionan su faceta, como el panel de proveedores.

---

## Qué NO se hace

- **No se rediseña la paleta ni la tipografía.** El aspecto actual funciona; el
  problema es de jerarquía y de información, no de estilo.
- **No se añade ninguna dependencia.** Todo se resuelve con Tailwind y Vue, que
  ya están.
- **No se deriva ni un dato nuevo en la capa visual.** Si falta algo, se pide a
  la librería, como se hizo con los hitos del embudo.
- **No se persiste el estado de filtros entre sesiones.** Hasta que alguien lo
  pida.

---

## Orden sugerido

Fase 1 primero y sola: son bugs, y el 1.1 afecta a la confianza en todo lo
demás. Después la 2 y la 3 juntas, que se refuerzan —los badges enseñan qué
existe y las facetas dejan filtrarlo—. La 4 después, cuando ya esté claro qué
badges sobreviven. La 5 y la 6, cuando haya uso real que las justifique.

## Criterios de aceptación transversales

- Ninguna tarjeta plegada muestra más de cuatro badges.
- El único color en un badge que no sea de resultado es el `SIM`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test:run` y `pnpm build` siguen en verde.
- `getEventBadges` y el predicado de error llevan test unitario: son las dos
  piezas con ramas de verdad.
