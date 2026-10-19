> [!WARNING]
> **DOCUMENTO HISTÓRICO ARCHIVADO — VERSIÓN ANTERIOR**
> Este documento contiene especificaciones previas o parciales generadas en etapas iniciales del proyecto.
> Ha sido preservado exclusivamente para fines de trazabilidad y auditoría histórica.
> 
> **Documentación Vigente Oficial (V2.0 Canónica)**:
> - PRD Maestro: [PRD_SISTEMA_DE_PARKING.md](file:///docs/PRD_SISTEMA_DE_PARKING.md)
> - Especificaciones Técnicas: [PARKOPS_ESPECIFICACIONES_TECNICAS_V2.md](file:///docs/PARKOPS_ESPECIFICACIONES_TECNICAS_V2.md)
> - Diseño, Flujos y Landing: [ESPECIFICACION_DISENO_FLUJO_Y_LANDING.md](file:///docs/ESPECIFICACION_DISENO_FLUJO_Y_LANDING.md)
> - Mapa de Sitio y Navegación: [MAPA_DE_SITIO_Y_ARQUITECTURA.md](file:///docs/MAPA_DE_SITIO_Y_ARQUITECTURA.md)
> - Índice General: [INDICE_DOCUMENTACION.md](file:///docs/INDICE_DOCUMENTACION.md)
> 
> ---


# Master de Consolidación y Guía de Entrevista Técnica: ParkOps PMS & ERP
## Proyecto: Parking Management System — Cordano Inversiones Inmobiliarias Ltda.
**Instalación Física**: Serrano 447, Iquique, Chile (~700 m² | 30 Plazas)  
**Microservicio Cloud Run**: `cordano-pms-v1` (GCP: `gen-lang-client-0862587160` | Región: `us-west1`)  
**Proyecto Google Stitch**: `projects/12916038623650348087` (*NUEVO PMS CORDANO - ParkOps Iquique*)  
**Fecha de Consolidación**: Septiembre 2026 | Versión: 3.0 Canónica

---

## Prólogo y Metodología de Consolidación

Este documento ha sido construido a partir de la investigación exhaustiva y triangulación de **todas las fuentes de verdad documentales, actas de reuniones y prototipos del proyecto**:
1. **Notion Workspace**:
   - `PRD Sistema de Parking` (ID: `cfce6ec4-dc22-83d1-b0ec-016822a98fab`) — Requerimientos de apertura, contexto de Braulio & Angelo y demo CarWatch.
   - `PRD Actualizado y Acta de Revisión 31-Julio-2026` (ID: `af634634-e567-4d82-b2ff-51bc703b518e`) — Acuerdos operacionales, modo offline, sufijo "O", exclusiones de MVP y gestión de PIN.
   - `PRD Base y Evaluación de Ingeniería` (ID: `3aee6ec4-dc22-808f-b862-f58a55c92fe8`) — Detección de edge cases, riesgos de sincronización y vacíos de diseño.
   - `ParkOps Build Plan` (ID: `3c9e6ec4-dc22-81d6-846a-ce92fa83b159`) y `Prompt PRD` (ID: `572e6ec4-dc22-823b-90c6-813bd3788033`).
2. **Historial de Prototipos Google Stitch**:
   - Proyecto Base `11170226797373845541`: `persona_operador.md`, `persona_administrador.md`, `product_charter.md`, `user_flow.md`, planes de pantalla POS, pago, cierre ciego, auditoría y tarifas.
   - Proyecto Activo `12916038623650348087` (*ParkOps Iquique*): Pantallas Cockpit Garita macOS, Salida y Cobro Rápido, Cierre Ciego 1080p, Plano Serrano 447 y Tablero Kanban.
3. **Especificaciones y Arquitectura Técnica Local**:
   - `PARKOPS_ESPECIFICACIONES_TECNICAS_V2.md`, `PLAN_DE_ARQUITECTURA.md`, `cordano-database.architecture.json`, `DESIGN.md`, `src/lib/pmsStore.ts` y directrices permanentes `AGENTS.md` / `GEMINI.md`.

### Cómo interactuar con este reporte
Para cada punto y funcionalidad se presenta:
- **Objetivo y Contexto Operativo**: Qué resuelve la funcionalidad en la garita o administración.
- **Análisis de Divergencias entre Documentos**: Qué decía el Documento A (Notion inicial), qué acordó el Documento B (Revisión 31-Julio) y qué dictan las especificaciones técnicas V2.
- **Frases Clave y Utilidad Técnica**: Conceptos irrenunciables para la lógica del sistema.
- **Recomendación Técnica del Agente AI**: Nuestra propuesta justificada basada en ergonomía, seguridad antifraude y viabilidad técnica.
- **Plantilla de Respuesta / Elección**: Espacio estructurado para que selecciones tus opciones y ajustes tus definiciones antes de generar el PRD Centralizado definitivo.

---

## BLOQUE 1: EJE 1 — LA IDEA, OBJETIVOS, USUARIOS Y REGLAS DE NEGOCIO (PRD CENTRAL)

### 1.1 Modelo de Negocio y Alcance Comercial en Serrano 447
- **Objetivo**: Establecer con exactitud qué vende el recinto y qué queda fuera del sistema para evitar sobrediseño o desvíos contables.
- **Divergencia entre documentos**:
  - *Notion Apertura / PRD Inicial*: Planteaba "venta exclusiva de tiempo de estacionamiento por minuto" sin artículos de conveniencia ni tienda, pero dejaba abierta la puerta a convenios con empresas.
  - *Demo CarWatch*: Incluía sistemas de fidelización por puntos acumulables, canjes y venta cruzada.
  - *Especificaciones V2 & AGENTS.md*: Confirma venta 100% exclusiva de tiempo de estadía por minuto en CLP. Sin venta de productos retail ni puntos de fidelización en MVP. Convenios empresariales manejados como reserva de bahías con tarifa preferencial fija, no con puntos.
- **Frases Clave**: `Cobro por minuto cerrado hacia arriba`, `Venta exclusiva de tiempo`, `Sin retail/artículos`, `Convenios sin puntos`.
- **Recomendación Técnica**: Consolidar como regla dura que ParkOps gestiona **exclusivamente venta de tiempo por minuto en CLP**. Dejar el motor preparado para tarifas corporativas (convenios) como una regla de tarifa especial asociada a la patente, descartando sistemas de puntos o artículos físicos para el lanzamiento.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: 100% Venta de tiempo por minuto. Sin retail ni puntos. Tarifas de convenio como regla tarifaria asociada a patente.
  - [ ] **Opción B**: Habilitar a futuro venta menor en garita (bebidas, accesorios) con selector de productos en POS.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 1.2 Capacidad Real, Sectores y Topología de Plazas
- **Objetivo**: Configurar la matriz canónica de plazas en base de datos, layout 2D y asignación física en el terreno de Serrano 447.
- **Divergencia entre documentos**:
  - *Minuta de Apertura*: Menciona terreno de ~700 m² con capacidad de 24 vehículos (distribución estándar holgada) hasta 50-60 (distribución compacta / acomodador).
  - *Stitch Pantalla 1 (POS heredado)*: Mostraba un contador de `45 / 120 plazas` divididas en Subterráneo -1, -2 y Exterior (heredado de plantilla genérica).
  - *PRD V2 & AGENTS.md*: Fija **exactamente 30 plazas a nivel de superficie**, divididas en:
    - **Sector A (Plazas 01 a 15)**: Costado oeste del terreno.
    - **Sector B (Plazas 16 a 30)**: Costado este del terreno.
- **Frases Clave**: `30 Plazas Canónicas`, `Sector A: 01-15`, `Sector B: 16-30`, `Superficie 700m² Serrano 447`.
- **Recomendación Técnica**: Adoptar **30 plazas fijas (Sector A: 01–15, Sector B: 16–30)** como estándar único del MVP. El layout 2D y el selector de bahías reflejarán exactamente estas 30 plazas. Si en horas punta se guardan vehículos extra en pasillo (acomodador), se habilita un slot virtual de contingencia `SOBRECUPO-XX` debidamente auditado.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: 30 plazas fijas (A: 01-15, B: 16-30) con soporte para slots de sobrecupo controlados.
  - [ ] **Opción B**: Mantener configuración de 24 plazas estándar y 6 de reserva dinámica.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 1.3 Asignación de Plazas: Sugerencia Inteligente vs Asignación Libre / Drag & Drop
- **Objetivo**: Definir cómo se vincula el vehículo que ingresa con un cajón de estacionamiento.
- **Divergencia entre documentos**:
  - *Notion PRD Inicial*: "Si quedan ≤ 6 espacios disponibles, el sistema sugiere un slot obligatorio; si quedan > 6, el cliente elige libremente".
  - *Acta Revisión 31-Julio*: "Anular el requerimiento de sugerencia automática de slots del PRD; los slots son meramente visuales y el operador puede mover las tarjetas por drag & drop en el Kanban".
  - *Cockpit Stitch & V2 Specs*: Asignación visual por clic o asignación automática del primer slot disponible (`A-01` a `B-30`), con posibilidad de reubicar arrastrando en plano 2D.
- **Frases Clave**: `Sugerencia no intrusiva`, `Asignación visual / Drag & Drop`, `Sin bloqueo operativo al ingresar`.
- **Recomendación Técnica**: **Asignación automática predeterminada pero no bloqueante**. Al registrar la patente, el sistema auto-asigna el slot disponible más cercano a la entrada (ej. A-01), pero el operador puede cambiarlo con un clic o arrastrarlo en el layout sin que eso frene los <10 segundos del check-in.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Auto-asignación rápida del primer slot libre, editable con un clic / drag & drop.
  - [ ] **Opción B**: Libre elección total (el operador o cliente elige el slot al estacionar y el operador lo vincula luego).
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 1.4 Formato Canónico de Patentes y Modo Patente Extranjera
- **Objetivo**: Capturar con máxima velocidad y validar sin falsos bloqueos las matrículas vehiculares en Iquique (zona franca, turismo y comercio transfronterizo).
- **Divergencia entre documentos**:
  - *Notion PRD Base*: Exigía validación estricta de patente chilena; causaba dudas sobre cómo ingresar autos de Perú, Bolivia o patentes diplomáticas.
  - *Acta Revisión 31-Julio & V2 Specs*: Patente chilena nueva (4 consonantes + 2 números: `ABCD-12`) y antigua (2 letras + 4 números: `AB-1234`). Añadir un **botón de un solo clic / atajo F4 para "Modo Extranjero / Libre"** que desactiva la máscara y permite ingresar cualquier texto alfanumérico (ej. `PB-9821-PE`, `2384-BOL`).
- **Frases Clave**: `Patente como ID primario`, `Máscara chilena automática`, `Bypass Extranjera 1-Click`, `Autofoco inmediato`.
- **Recomendación Técnica**: Implementar campo con máscara automática en mayúsculas (`ABCD-12` / `AB-1234`). Si el operador presiona un botón visible o la tecla `[F4]`, el input cambia a modo libre internacional, permitiendo patentes de tacneños, bolivianos o vehículos sin patente con código provisional temporal (`SIN-001`).
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Detección inteligente de formato chileno + botón/atajo `[F4]` para patente extranjera/especial libre.
  - [ ] **Opción B**: Campo de texto libre universal en mayúsculas con validación flexible.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 1.5 Datos del Conductor y Ticket Digital por WhatsApp
- **Objetivo**: Gestionar la captura de datos de contacto sin generar fricción ni retrasar las colas de ingreso.
- **Divergencia entre documentos**:
  - *Notion PRD Inicial*: Proponía solicitar teléfono y correo obligatorios para enviar ticket digital y notificaciones automáticas por API Cloud WhatsApp.
  - *Acta Revisión 31-Julio*: "El cliente puede negarse a entregar datos; si se niega, se marca 'Cliente no proporciona datos' para auditar a operadores que omitan el paso por pereza. Prefijo fijo `+569` con 8 dígitos. Enlace manual `wa.me` en vez de API de pago costosa".
- **Frases Clave**: `Datos opcionales`, `Prefijo +569 fijo`, `Auditoría de omisión de datos`, `Enlace wa.me sin costo de API`.
- **Recomendación Técnica**: Campo de teléfono con prefijo prellenado `+569` y 8 casillas. Botón rápido `[ESC] Sin Datos`. El sistema registra la tasa de tickets sin teléfono por operador para auditoría. Al cobrar o ingresar, si hay teléfono, se provee botón de un clic que abre `https://wa.me/569XXXXXXXX?text=...` con el comprobante formateado, evitando contratos caros con Meta Cloud API para el MVP.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Teléfono opcional con `+569`, botón rápido `Sin Datos` auditado y enlace directo `wa.me`.
  - [ ] **Opción B**: Integración automatizada directa con WhatsApp Business Cloud API (requiere cuenta Meta verified).
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 1.6 Simbología del Ticket Físico Térmico: Código de Barras vs Código QR
- **Objetivo**: Asegurar lectura inmediata del ticket a la salida con hardware de garita estándar.
- **Divergencia entre documentos**:
  - *Notion PRD base y Stitch Screen 3*: Hacen referencias mixtas a "código QR o código de ticket".
  - *Acta Revisión 31-Julio & AGENTS.md*: **Prohíbe expresamente códigos QR** en el PDF térmico: exige **código de barras lineal estándar (Code 128)**, debido a que las pistolas láser estándar de garita leen Code 128 a distancia en 100ms, mientras que los QR sufren por baja resolución o arrugas del papel térmico de 58mm/80mm.
- **Frases Clave**: `Simbología lineal Code 128`, `Sin códigos QR`, `Lectura láser 100ms`, `Formato 58mm / 80mm`.
- **Recomendación Técnica**: Respetar la directriz canónica: **Código de barras lineal Code 128** en el ticket físico térmico, con el código de ticket legible debajo (`TKT-20260923-T01-0014`). La pistola lectora USB actúa como emulador de teclado escaneando el código en 1 paso.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Ticket térmico con Código de Barras Code 128 lineal (optimizado para pistolas láser).
  - [ ] **Opción B**: Incluir ambos (Code 128 arriba + QR de respaldo abajo).
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 1.7 Motor de Tarifas, Tiempos de Gracia y Redondeo
- **Objetivo**: Establecer la lógica de liquidación financiera exacta por minuto.
- **Divergencia entre documentos**:
  - *Acta Revisión 31-Julio*: "Tiempo de gracia establecido en 30 minutos sin costo; redondeo por minuto cerrado siempre hacia arriba".
  - *Especificaciones V2 & Store actual*: "Tiempo de gracia configurable entre 10 y 30 minutos (por defecto 10 min); Tarifa base Auto: $25–$35 CLP/min, Camioneta: $30–$45 CLP/min, Moto: $15–$25 CLP/min; Multa ticket perdido: $10.000 CLP".
  - *Regla de congelación*: La tarifa aplicable es la **vigente al momento exacto de la entrada del vehículo**, protegiendo al cliente si la administración cambia los valores durante su permanencia.
- **Frases Clave**: `Tarifa congelada al ingreso`, `Redondeo minuto cerrado hacia arriba`, `Gracia configurable (10-30 min)`, `Multa fija ticket extraviado`.
- **Recomendación Técnica**:
  - **Tiempo de Gracia**: 10 minutos por defecto (si sale antes de 10 min, total = $0 CLP). Configurable por el Admin entre 0 y 60 min.
  - **Tarifas estándar Iquique**: Auto ($25 CLP/min = $1.500/hora), Camioneta ($30 CLP/min = $1.800/hora), Moto ($15 CLP/min = $900/hora).
  - **Redondeo**: Minuto cerrado hacia arriba, ajustado a la decena de pesos CLP (`Math.ceil(monto / 10) * 10`).
  - **Multa por Ticket Perdido**: Valor plano de $10.000 CLP + cobro de horas estimadas con autorización de PIN.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Gracia 10 min, Auto $25 CLP/min, Camioneta $30 CLP/min, Moto $15 CLP/min, Multa $10.000 CLP.
  - [ ] **Opción B**: Gracia extendida de 30 min (conforme a acta de julio) y tarifa única por minuto para todos los vehículos.
  - [ ] **Valores tarifarios que deseas fijar**: _____________________________________________

---

### 1.8 Cuenta Cliente y Crédito a Fin de Mes (Alcance MVP)
- **Objetivo**: Decidir el tratamiento de convenios con empresas o clientes frecuentes en el lanzamiento.
- **Divergencia entre documentos**:
  - *Notion PRD Inicial*: Planteaba "Cuenta cliente para facturación a fin de mes" como medio de pago directo en POS.
  - *Acta Revisión 31-Julio & V2 Specs*: "Excluir cuenta cliente a fin de mes del MVP. Es un subsistema complejo de CRM, líneas de crédito, cobranza y riesgo. En MVP solo se registra perfil de vehículo/cliente frecuente con notas".
- **Frases Clave**: `Excluido de MVP inicial`, `Ficha de cliente frecuente informativa`, `Liquidación en garita (Efectivo/Tarjeta/Transf)`.
- **Recomendación Técnica**: En MVP, mantener los 3 medios de pago inmediatos: **Efectivo**, **Tarjeta (POS externo)** y **Transferencia bancaria**. La entidad `Cliente` existe para autocompletar datos y registrar recurrencia, pero sin otorgar crédito a plazo hasta la Fase 2 (cuando se diseñe el módulo de facturación).
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Excluir crédito mensual del MVP; mantener registro de clientes frecuentes y cobro inmediato en garita.
  - [ ] **Opción B**: Incluir botón "Abonado / Cuenta Corriente" que marque el ticket como saldado $0 CLP y acumule deuda en un reporte.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 1.9 Tratamiento Antifraude para Excepciones y Fugas
- **Objetivo**: Blindar la caja contra prácticas indebidas (anulaciones falsas, cobros menores no justificados o fugas no documentadas).
- **Divergencia entre documentos**:
  - *PRD Inicial*: Mencionaba genéricamente "override con clave de admin".
  - *Acta 31-Julio & AGENTS.md*:
    - **Cobro Parcial / Disputa**: Si el cliente alega error de cálculo, el operador puede cobrar un monto menor ingresando su **PIN individual**, pero el evento queda etiquetado en auditoría con campo obligatorio de observación.
    - **Vehículo Fugado**: Se marca la salida, se anula el ticket con PIN, no ingresa dinero a caja y queda registrado en auditoría roja.
    - **Código de Colores de Auditoría**: Verde para descuentos autorizados, Rojo para multas/fugas, Azul/Gris para aperturas normales.
- **Frases Clave**: `PIN individual de 4 dígitos`, `Sin anulaciones sin motivo`, `Registro de Fuga sin cobro`, `Auditoría cromática`.
- **Recomendación Técnica**: Adoptar el sistema de **PIN individual de 4 dígitos** para cada operador. Cualquier modificación a la tarifa calculada exige ingresar PIN y seleccionar motivo predeterminado (Disputa de minutos, Desperfecto mecánico, Vehículo de servicio, Fuga). La acción genera un registro inmutable en el `AuditTrail`.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: PIN individual del operador + motivos estructurados + marcado cromático en bitácora.
  - [ ] **Opción B**: Exigir PIN de Supervisor/Admin presencial o código OTP remoto para autorizar cualquier descuento.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

## BLOQUE 2: EJE 2 — ARQUITECTURA BACKEND, CLOUD RUN, PERSISTENCIA Y SINCRONIZACIÓN

### 2.1 Infraestructura Cloud Run y Proyecto GCP
- **Objetivo**: Consolidar la plataforma de despliegue en la nube y sus variables canónicas.
- **Datos Configurados en Repositorio**:
  - Proyecto GCP: `gen-lang-client-0862587160` (N° `349577440002`)
  - Región: `us-west1` (Oregón, baja latencia hacia Chile)
  - Microservicio: `cordano-pms-v1` en puerto `8080`
  - URL Activa: `https://cordano-pms-v1-349577440002.us-west1.run.app`
  - Docker: Multi-stage Node.js 20 Alpine con standalone output Next.js.
- **Frases Clave**: `Google Cloud Run`, `Contenedor Docker Alpine :8080`, `Microservicio cordano-pms-v1`.
- **Recomendación Técnica**: Mantener Google Cloud Run como el backend canónico serverless en producción. Next.js ejecuta las rutas de frontend y los endpoints API `/api/*` de manera unificada, minimizando costos cuando no hay tráfico nocturno.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Arquitectura actual unificada en Google Cloud Run (`cordano-pms-v1`).
  - [ ] **Opción B**: Separar Frontend en Vercel y Backend API en Cloud Run.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 2.2 Persistencia Local Offline-First y Sufijo "O" de Tickets
- **Objetivo**: Garantizar que la garita siga emitiendo tickets y cobrando aunque se corte la fibra óptica o el enlace móvil en Iquique.
- **Divergencia entre documentos**:
  - *PRD Base*: Hablaba vagamente de "sincroniza sin conflictos", calificado como riesgo técnico por el evaluador si dos terminales emitían tickets simultáneamente con la misma numeración.
  - *Acta 31-Julio & V2 Specs*:
    - **Sufijo "O"**: Los tickets generados mientras la terminal opera en modo offline llevan obligatoriamente el sufijo `O` (ej. `TKT-20260923-T01-0015O`).
    - **Single Writer**: Solo la terminal física autorizada de garita tiene turno activo de escritura. Los demás dispositivos (celular de admin, supervisor) son solo lectura.
    - **Caché IndexedDB**: La sesión local en Chrome almacena el estado completo en IndexedDB y envía la cola en lote al detectar reconexión (`navigator.onLine`).
- **Frases Clave**: `Sufijo O para offline`, `IndexedDB local journaling`, `Single Writer forzado`, `Reconciliación sin colisión`.
- **Recomendación Técnica**: Implementar el almacén `IndexedDB` en el cliente con service worker PWA. La numeración online proviene del servidor; la numeración offline usa un contador local prefijado con el identificador de la garita y el sufijo `O`. Al recuperar conexión, un webhook background sincroniza los tickets `O` hacia Cloud Run sin pisar identificadores online.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: IndexedDB local + sufijo `O` obligatorio + Single-Writer en garita.
  - [ ] **Opción B**: UUID v4 universal para todos los tickets (elimina el sufijo O pero los códigos son más largos).
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 2.3 Capa Caliente en Memoria (Redis RAM) vs Base de Datos Transaccional
- **Objetivo**: Asegurar latencias de respuesta <100ms en el cockpit de garita y persistencia blindada al cerrar turno.
- **Arquitectura en `cordano-database.architecture.json`**:
  - **Hot Operational Path (<2ms)**: El set de patentes activas (Anti-passback) y los cronómetros de los 30 slots se evalúan en memoria RAM / Redis sin bloqueos de lectura en disco.
  - **Atomic Migration Path**: Al ejecutar el cierre ciego de turno, el motor empaqueta todas las transacciones y las persiste atómicamente en base de datos transaccional (Google Cloud Datastore / Firestore / PostgreSQL Neon).
  - **ERP Reporting Path**: Los balances consolidados de los turnos cerrados se exportan automáticamente a Google Sheets oficial de Cordano y al dashboard administrativo.
- **Frases Clave**: `Hot path en RAM <2ms`, `Anti-passback atómico`, `Migración atómica al cerrar turno`, `Sincronización a Google Sheets`.
- **Recomendación Técnica**: Mantener el diseño desacoplado: durante el turno de 8 horas, las operaciones viven en el store de alta velocidad (local/RAM); al ejecutar el Cierre Ciego, el turno se "sella" con hash SHA-256 y se guarda en base de datos persistente, disparando el respaldo a Google Sheets.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Store de alta velocidad durante el turno + migración atómica al cerrar turno + export a Sheets.
  - [ ] **Opción B**: Transaccionalidad directa en base de datos SQL para cada micro-evento (check-in, cálculo, checkout).
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 2.4 Cierre de Turno Ciego (*Blind Checkout*) y Reconciliación
- **Objetivo**: Garantizar transparencia total en la rendición de cuentas del cajero y eliminar fraudes por conteo amañado.
- **Especificaciones Canónicas (AGENTS.md / V2 Specs / Stitch Screen 4)**:
  - El operador finaliza su jornada y presiona `Cerrar Turno`.
  - **Declaración Ciega**: La pantalla le solicita contar físicamente su gaveta y declarar:
    - Billetes desglosados ($20.000, $10.000, $5.000, $2.000, $1.000) y monedas en efectivo.
    - Total de vouchers de tarjeta (Transbank POS externo).
    - Comprobantes de transferencia bancaria confirmados.
  - **Sin revelación previa**: El sistema **no muestra cuánto dinero espera** hasta que el operador presiona "Confirmar Declaración".
  - **Revelación y Cuadre**: El sistema muestra en 3 columnas:
    `Declarado Físico` vs `Esperado por Sistema` = `Diferencia / Cuadre` ($0 CLP = Badge Verde Perfecto).
  - Emisión de duplicado: Reporte Z impreso en papel térmico para el cajero y acta digital en PDF para la administración.
- **Frases Clave**: `Declaración a ciegas`, `Desglose de billetes físico`, `Fórmula: Declarado - Esperado = Diferencia`, `Reporte Z duplicado`.
- **Recomendación Técnica**: Mantener estrictamente el Cierre Ciego en 3 columnas como componente central de ParkOps ERP. Si la diferencia negativa supera un umbral de tolerancia ($1.000 CLP), el sistema marca la sesión como "Cierre con Descuadre" para revisión prioritaria en la auditoría del Administrador.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Cierre Ciego estricto con desglose por denominación y cálculo automático post-declaración.
  - [ ] **Opción B**: Cierre asistido donde el cajero puede ver el total esperado antes de cerrar la gaveta.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 2.5 Sincronización Horaria y Manejo de Cambio de Hora Oficial de Chile
- **Objetivo**: Evitar disputas por cobro o fraudes al cambiar la hora del sistema.
- **Divergencia entre documentos**:
  - *PRD Inicial*: "El admin puede ajustar manualmente la hora del sistema y el UTC". El evaluador alertó que esto permite alterar tarifas retroactivamente.
  - *Acta 31-Julio*: La hora se sincroniza una vez al día con servidor NTP de Chile (SHOA / UTC-3 o UTC-4 según época del año). Los cambios de hora oficial ocurren a las 00:00. Si un vehículo está dentro durante un cambio de hora, se calcula a su favor (hora más beneficiosa). No se permite cambio manual arbitrario de hora que afecte registros pasados.
- **Frases Clave**: `Sincronización NTP Chile`, `Sin alteración manual retroactiva`, `Regla a favor del cliente en cambio de hora`.
- **Recomendación Técnica**: La hora del sistema se toma del servidor Cloud Run sincronizado con zona horaria `America/Santiago`. La terminal offline toma el timestamp de su reloj local y, si hay desfase al reconectar, se registra la discrepancia en la auditoría sin modificar los minutos cobrados al cliente.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Hora oficial por NTP servidor (Chile), sin ajuste manual arbitrario de timestamps.
  - [ ] **Opción B**: Permitir al Admin ajustar la zona horaria desde un desplegable en ajustes.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

## BLOQUE 3: EJE 3 — FRONTEND, EXPERIENCIA DE USUARIO (UX/UI macOS) Y GOOGLE STITCH

### 3.1 Ergonomía de Garita: Keyboard-First y Flujo 100% Sin Scroll
- **Objetivo**: Permitir que el operador atienda a un vehículo en menos de 10 segundos sin tocar el ratón y sin perder información por scroll en monitores de garita (1080p y 4K).
- **Regla Canónica (AGENTS.md / GEMINI.md)**:
  - Atajos de teclado primarios:
    - `[ENTER]`: Confirmar ingreso / Confirmar cobro.
    - `[F1]`: Check-in / Foco en patente.
    - `[F2]`: Cobrar vehículo seleccionado.
    - `[F3]`: Búsqueda rápida por ticket o patente.
    - `[F4]`: Alternar a modo patente extranjera / libre.
    - `[F8]`: Finalizar turno / Cierre ciego.
    - `[ESC]`: Cancelar / Cerrar modales.
  - Autofoco inmediato en el campo de patente al cargar la pantalla o terminar un cobro.
  - La pantalla principal de garita cabe completa en 1080p (1920x1080) sin scroll vertical ni horizontal.
- **Frases Clave**: `Keyboard-First`, `Atajos F1-F9`, `Autofoco permanente`, `Pantalla 1080p sin scroll`.
- **Recomendación Técnica**: Implementar la arquitectura Keyboard-First con escuchadores globales `useHotkeys`. Para tablets táctiles, habilitar un botón de conmutación en la esquina superior que despliega un teclado numérico/alfanumérico táctil grande sin desarmar la vista de escritorio.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Operación Keyboard-First total sin scroll en 1080p + switch táctil opcional para tablet.
  - [ ] **Opción B**: Interfaz orientada prioritariamente al mouse/touch sin atajos de teclado de función.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 3.2 Adaptación y Homogeneización de Pantallas Google Stitch
- **Objetivo**: Integrar los prototipos existentes en Stitch al flujo real de Serrano 447, limpiando elementos obsoletos de maquetas heredadas.
- **Pantallas Activas en Proyecto Stitch `12916038623650348087`**:
  1. `Operación POS — Check-in & Vehículos en Turno` (`d09c4b80583e4978a4cb2630441bd485`)
  2. `Plano en Tiempo Real — Serrano 447` (`83e3e5b92d9645ed920a1a94c21c5e7a`)
  3. `Proceso de Salida y Cobro Rápido` (`16aa7c649bbc45eaab47c4bcb7879ae6`)
  4. `Cierre de Caja Ciego & Conciliación` (`3b4892334a8744148bc67cbd67e7f9cf`)
  5. `Cockpit Garita macOS Minimalista` (`f7bffe5359044163b9c044c567d61067`)
  6. `ParkOps macOS Cierre Ciego y Auditoría 1080p` (`1bbb84c9bd264b138da37300edda8b0e`)
  7. `ParkOps Matriz macOS Minimalista 1080p` (`e73cd5e9d94b432994f3ffe9681e5125`)
  8. `Monitoreo y Tablero Kanban de Estadía` (`64866862dd74475494cadff19437b3d4`)
- **Modificaciones requeridas para alineación canónica**:
  - Eliminar referencias a 120 plazas o subterráneos: fijar **30 plazas (Sector A y Sector B)**.
  - Reemplazar código QR en la pantalla de cobro por **código de barras lineal Code 128**.
  - Ajustar visualización del plano a la distribución real del terreno rectangular de ~700 m² en Serrano 447 (Caseta de entrada, portón, pasillo central y bahías laterales).
- **Frases Clave**: `Unificación visual macOS`, `Plano real Serrano 447 (30 plazas)`, `Eliminación de maquetas demo`.
- **Recomendación Técnica**: Sincronizar estas 4 vistas madre en el código Next.js:
  1. **Vista Garita Principal (Cockpit)**: Formulario de entrada a la izquierda + Matriz/Kanban de vehículos dentro a la derecha.
  2. **Modal Pop-up de Salida (Liquidación)**: Detalle del cobro, visor gigante de vuelto y selección de pago.
  3. **Modal de Cierre Ciego**: Matriz de conteo físico de 3 columnas.
  4. **Panel de Auditoría / Reportes**: Vista de supervisión con destacados en verde/rojo.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Consolidar las pantallas de Stitch bajo las 4 vistas madre adaptadas a Serrano 447.
  - [ ] **Opción B**: Mantener pantallas adicionales independientes para cada sub-operación.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 3.3 Código Semántico de Colores y Tipografía Tabular
- **Objetivo**: Eliminar ambigüedades visuales y asegurar legibilidad inmediata bajo luz solar en la garita.
- **Estándar Definido en `DESIGN.md` y `AGENTS.md`**:
  - **Plazas Disponibles**: Verde Esmeralda (`#10B981` / `#30D158`)
  - **Plazas Ocupadas**: Gris Pizarra (`#64748B` / `#1E293B`)
  - **Plazas Reservadas / Convenios**: Ámbar (`#F59E0B` / `#FF9F0A`)
  - **Abonados / VIP**: Azul Corporativo (`#3B82F6` / `#0A84FF`)
  - **PMR (Movilidad Reducida)**: Cian (`#06B6D4` / `#64D2FF`)
  - **Sobrestadía (>4 horas) o Alerta**: Rojo Carmesí (`#EF4444` / `#FF453A`)
  - **Tipografía Primaria**: **Geist** para textos, encabezados y etiquetas.
  - **Tipografía Numérica**: **Geist Mono** o **IBM Plex Mono** con clase obligatoria `tabular-nums` para patentes (`KD-JL-84`), montos (`$3.450 CLP`) y tiempos (`01:45:12`).
- **Frases Clave**: `Código semántico de 6 colores`, `Geist + Geist Mono`, `tabular-nums obligatorio`.
- **Recomendación Técnica**: Mantener rigurosamente esta paleta y regla tipográfica. En Tailwind CSS, todas las cifras deben llevar `font-mono tabular-nums tracking-wide` para que los números no oscilen horizontalmente al actualizarse los cronómetros en vivo.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Paleta semántica estándar y tipografía Geist Mono con tabular-nums.
  - [ ] **Opción B**: Ajustar paleta hacia modo monocromático absoluto blanco/negro con acento azul.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 3.4 Divulgación Progresiva y Estética macOS
- **Objetivo**: Evitar pantallas sobrecargadas con tablas interminables o exceso de texto que confunda al operador.
- **Directrices de Diseño (DESIGN.md)**:
  - Interfaz de baja densidad: la vista principal solo muestra el estado global y los campos de acción inmediata.
  - La información secundaria (historial de patentes, detalles técnicos, desglose de tarifas o eventos de auditoría) se revela mediante **tooltips translúcidos** o **modales pop-up flotantes centrales** con efecto `backdrop-blur: 20px`.
  - Botones ergonómicos de 48px a 52px con curvatura estilo macOS (`rounded-xl` / `14px-16px`), micro-relieve y sombras suaves.
- **Frases Clave**: `Baja densidad`, `Divulgación progresiva`, `Modales flotantes con backdrop-blur`, `Botones macOS 48-52px`.
- **Recomendación Técnica**: Aplicar el patrón de modales con `<dialog>` nativo o Radix UI Dialog para asegurar accesibilidad WCAG AA, cierre instantáneo con `[ESC]` y foco retenido.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Estética macOS minimalista con modales flotantes `backdrop-blur` y divulgación progresiva.
  - [ ] **Opción B**: Interfaz clásica de panel denso con múltiples tablas y acordeones visibles.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 3.5 Integración de Cámaras CCTV
- **Objetivo**: Permitir al operador y administrador vigilar el portón de acceso y el patio de autos.
- **Divergencia entre documentos**:
  - *PRD Inicial*: Planteaba "evaluar integración con cámaras CCTV y reconocimiento facial/LPR".
  - *Acta 31-Julio & V2 Specs*: "Sin reconocimiento facial ni LPR obligatorio en MVP. Las cámaras CCTV son únicamente enlaces de streaming de video IP (RTSP/HTTP/HLS) o links directos accesibles desde la barra superior del sistema para verificación visual humana".
- **Frases Clave**: `CCTV visual sin IA/LPR en MVP`, `Enlaces de streaming IP`, `Verificación humana de portón`.
- **Recomendación Técnica**: En la barra superior de ParkOps, disponer de un botón `[Cámaras]` que abre un modal con la grilla de video en vivo de las cámaras de acceso y patio (mediante reproductor HLS/WebRTC o enlaces directos al NVR local de Serrano 447), dejando el motor LPR automático para la Fase 2.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Visor de cámaras en streaming directo/enlaces IP sin LPR automático en MVP.
  - [ ] **Opción B**: Incorporar prototipo de lectura OCR de patentes mediante cámara web/IP en garita.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

### 3.6 Integración y Despliegue en Google AI Studio y Cloud Run
- **Objetivo**: Asegurar que todo el código, componentes y prompts estén estructurados para poder abrirse, editarse y desplegarse fluidamente desde **Google AI Studio** o desde **Antigravity**.
- **Requerimientos de Compatibilidad**:
  - Repositorio limpio con Next.js 14+ / React 18, TypeScript estricto y Tailwind CSS.
  - Estructura modular en `/src`:
    - `src/components/`: Componentes atómicos de UI (Cockpit, PosCheckin, PosCheckout, ShiftModal, SlotMap, AuditLogView).
    - `src/lib/`: Motores de estado, stores, cálculos de tarifa y conectores Cloud Run / IndexedDB.
    - `src/types/`: Interfaces canónicas de TypeScript.
    - `src/app/api/`: Rutas API REST compatibles con Node.js y edge runtimes.
  - Compatibilidad de exportación: prompts de sistema, esquemas de herramientas y configuraciones de Cloud Run exportables a Google AI Studio para iteración asistida por modelos Gemini 1.5/2.0.
- **Frases Clave**: `Google AI Studio Ready`, `Arquitectura Modular Next.js`, `Tipado TypeScript estricto`, `Exportación limpia`.
- **Recomendación Técnica**: Estructurar los contratos de datos y la arquitectura de componentes de modo que cualquier pantalla o funcionalidad pueda probarse de forma aislada tanto en Google AI Studio (como web app reactiva o prototipo asistido) como en Cloud Run.
- **Opciones a validar por el Usuario**:
  - [ ] **Opción A (Recomendada)**: Estructura modular estándar Next.js/TypeScript 100% compatible con Google AI Studio y Cloud Run.
  - [ ] **Frase clave elegida / Comentario**: _________________________________________________

---

## BLOQUE 4: MATRIZ DE DIVERGENCIAS Y RESOLUCIÓN RECOMENDADA

Esta matriz consolida las 9 discrepancias detectadas entre las distintas fuentes del proyecto:

| # | Tema / Funcionalidad | Fuente A (Notion Inicial / CarWatch) | Fuente B (Acta Revisión 31-Julio) | Fuente C (V2 Specs / AGENTS.md / Stitch) | Recomendación Técnica Antigravity | Decisión del Usuario |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Capacidad de Plazas** | 24 estándar / 50-60 compactas (120 en demo) | 30 plazas estimadas en plano | **Exactamente 30 plazas canónicas** (Sector A: 01-15, Sector B: 16-30) | **Fijar 30 plazas** (Serrano 447). Habilitar slot virtual de sobrecupo en caso de autos en pasillo. | [ ] Opción A: 30 plazas fijas |
| **2** | **Interacción en Garita** | Clics y menús asistidos | Sin atajos; interacción solo clic; switch para tablet touch | **Keyboard-First obligatorio** (F1-F9, Enter, Esc), sin scroll en 1080p | **Keyboard-First** como modo rey para garita rápida (<10s) + switch táctil opcional para tablet. | [ ] Opción A: Keyboard-First |
| **3** | **Sugerencia de Slot** | Obligatoria si quedan ≤6 plazas libres | Anular sugerencia automática; slots meramente visuales | Auto-asignación del primer slot disponible, editable | **Auto-asignación inteligente no bloqueante**: sugiere slot más cercano pero no frena el flujo. | [ ] Opción A: No bloqueante |
| **4** | **Código en Ticket** | Código QR o código de ticket | **Código de barras lineal (Code 128)**, prohíbe QR | Code 128 lineal escaneable por pistola láser estándar | **Código de barras lineal Code 128** (el papel térmico de 58/80mm y pistolas láser no leen bien QR). | [ ] Opción A: Code 128 lineal |
| **5** | **Tiempo de Gracia** | 5 a 10 minutos | Establecido en 30 minutos | Configurable entre 10 y 30 minutos (default 10 min) | **10 minutos por defecto**, configurable por Admin (0 a 60 min) en módulo de ajustes. | [ ] Opción A: 10 min configurable |
| **6** | **Tarifas y Redondeo** | Cobro en bloques decrecientes | Redondeo por minuto cerrado siempre hacia arriba | Tarifa por minuto: Auto $25-$35, SUV $30-$45, Moto $15-$25 | **Tarifa por minuto congelada al entrar**, redondeo por minuto cerrado al alza hacia la decena de pesos CLP. | [ ] Opción A: Minuto al alza |
| **7** | **Cuenta Cliente a Fin de Mes** | Cuenta corriente mensual en POS | **Excluida del MVP** (solo contexto informativo) | Excluida; solo registro de clientes recurrentes | **Excluir crédito mensual del MVP**; registrar solo patente/frecuencia para cobro inmediato. | [ ] Opción A: Excluir crédito |
| **8** | **Persistencia y Backend** | Node Express + PostgreSQL (Neon) en Railway | Sesión activa fuente de verdad; sync al reconectar | **Cloud Run (`cordano-pms-v1`) + Redis RAM + Datastore** | **Híbrido**: Cloud Run en producción + IndexedDB local offline + Redis RAM para anti-passback <2ms. | [ ] Opción A: Híbrido Cloud Run |
| **9** | **Cierre de Caja** | Cierre estándar con total visible | **Cierre Ciego (*Blind Checkout*)** estricto | Cierre Ciego en 3 columnas (Declarado vs Sistema = Cuadre) | **Cierre Ciego obligatorio** con desglose de gaveta física por billete y reporte Z impreso. | [ ] Opción A: Cierre Ciego 3 cols |

---

## BLOQUE 5: PLANTILLA DE RESPUESTA DIRECTA PARA EL USUARIO

Copia este bloque en tu siguiente mensaje confirmando o ajustando las opciones para generar el **PRD Centralizado Definitivo**:

```markdown
### MIS RESPUESTAS PARA EL PRD CENTRALIZADO PARKOPS

1. MODELO DE NEGOCIO:
   - [x] Opción A: Venta exclusiva de tiempo por minuto. Sin venta retail ni puntos.
   - Comentario adicional: __________________________________________________

2. CAPACIDAD Y DISTRIBUCIÓN:
   - [x] Opción A: 30 plazas canónicas (Sector A: 01-15, Sector B: 16-30 en Serrano 447).
   - Comentario adicional: __________________________________________________

3. ASIGNACIÓN DE BAHÍAS:
   - [x] Opción A: Auto-asignación ágil del slot más cercano + reubicación visual drag & drop.
   - Comentario adicional: __________________________________________________

4. VALIDACIÓN DE MATRÍCULAS:
   - [x] Opción A: Máscara chilena automática (ABCD-12 / AB-1234) + Botón/F4 para patente extranjera/libre.
   - Comentario adicional: __________________________________________________

5. DATOS DEL CLIENTE Y TICKET DIGITAL:
   - [x] Opción A: Teléfono opcional con +569, botón rápido Sin Datos auditado y enlace directo wa.me.
   - Comentario adicional: __________________________________________________

6. TICKET TÉRMICO FÍSICO:
   - [x] Opción A: Código de barras lineal Code 128 (sin códigos QR) para pistola láser estándar.
   - Comentario adicional: __________________________________________________

7. MOTOR TARIFARIO Y TIEMPO DE GRACIA:
   - [x] Opción A: Tiempo de gracia de 10 min (configurable), cobro por minuto cerrado hacia arriba.
   - Tarifas deseadas: Auto: $_____ CLP/min | SUV/Camioneta: $_____ CLP/min | Moto: $_____ CLP/min | Multa ticket: $_____ CLP.

8. CUENTA CLIENTE A FIN DE MES:
   - [x] Opción A: Excluida del MVP. Cobro inmediato en garita (Efectivo / Tarjeta / Transferencia).
   - Comentario adicional: __________________________________________________

9. CONTROL ANTIFRAUDE Y EXCEPCIONES:
   - [x] Opción A: PIN individual de 4 dígitos para cobro parcial, fuga o descuento + auditoría en colores.
   - Comentario adicional: __________________________________________________

10. ARQUITECTURA BACKEND Y MODO OFFLINE:
    - [x] Opción A: Microservicio Cloud Run (`cordano-pms-v1`) + IndexedDB local con sufijo "O" para tickets offline.
    - Comentario adicional: __________________________________________________

11. ERGONOMÍA DE GARITA:
    - [x] Opción A: Keyboard-First (F1 a F9, Enter, Esc), sin scroll en 1080p + switch tablet touch.
    - Comentario adicional: __________________________________________________

12. PANTALLAS GOOGLE STITCH Y ESTILO MAC OS:
    - [x] Opción A: Adoptar las 4 pantallas madre adaptadas a Serrano 447, Geist Mono tabular-nums y modales blur.
    - Comentario adicional: __________________________________________________
```

---
*Fin del Documento Maestro de Consolidación — ParkOps V3.0*
