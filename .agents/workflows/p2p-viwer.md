---
description: PROJECT CONTEXT: P2P Log-Trace Engine (Transaction Intelligence Unit)
---

1. Misión del Proyecto
Herramienta de observabilidad de alto rendimiento diseñada para procesar, agrupar y analizar logs masivos de transacciones P2P. El objetivo es transformar datos crudos (JSON/Text) en trazas visuales (Timeline) y métricas de negocio (Session Funnels).

2. Stack Tecnológico & Estándares
Framework: Astro 5.x + Vue 3 (SFC con <script setup lang="ts">).

Lenguaje: TypeScript (Strict Mode). No any, tipado fuerte para eventos y estados.

Estilos: Tailwind CSS (Arquitectura de diseño Dark/Cyber, uso intensivo de gradientes y efectos de cristalografía).

Tooling: BiomeJS (Linter/Formatter).

Arquitectura: Domain-Driven Design (DDD).

3. Estructura de Directorios (DDD Compliance)
El proyecto se organiza en capas de responsabilidad para asegurar la escalabilidad:

src/logic/types.ts (Domain): Única fuente de verdad para interfaces y enums (LogEvent, APP_TYPES, SessionFunnelRow).

src/logic/mappers/ (Infrastructure): Clases que transforman el rastro crudo a entidades del dominio. Siguen el patrón Factory.

src/logic/funnels/ (Application): Motores de cálculo. Incluye useSessionFunnel.ts (procesamiento) y useFunnelExport.ts (generación de reportes).

src/store/ (Application/State): Pinia para el estado global de logs, filtros y procesamiento.

src/components/analyzer/ (UI): Componentes de alto nivel (Header, Tabs, Progress).

src/components/timeline/ (UI): Componentes de visualización técnica (TimelineGroup, LogCard).

src/components/funnels/ (UI): Componentes de analítica (SessionFunnelReport).

4. Conceptos Clave de Negocio
App Types: * CHECKOUT: Logs del flujo del cliente (SPA). Foco en sesiones de usuario.

REST: Logs de servidores core y proveedores. Foco en trazabilidad técnica y errores 5xx.

Session Funnel: Agrupación de eventos por sessionId. Pasos obligatorios: Created -> Entry -> Show -> Info -> Process.

Payment vs Collect: * Payment (P): Sesión con interacción en el SPA.

Collect (C): Cobro directo por API sin paso por vista de usuario.

5. Convenciones de Desarrollo
Pureza de Componentes: Los componentes .vue deben ser mayoritariamente presentacionales. La lógica compleja se extrae a Composables en src/logic/.

Comunicación: Se prefiere el uso de Slots para inyectar acciones en componentes de layout (ej. Header).

Naming: * Variables/Funciones: camelCase.

Componentes: PascalCase.

Constantes/Enums: SCREAMING_SNAKE_CASE.

Internalización: Todo el código, nombres de variables y documentación interna deben estar estrictamente en INGLÉS.

6. Lógica de Filtrado & Búsqueda
Search: Filtro por texto libre en el mensaje del log.

Highlight (Resaltado): Filtro por sessionId o ID de transacción. Cuando se activa, el sistema debe aislar y resaltar visualmente todos los eventos relacionados con ese ID específico.