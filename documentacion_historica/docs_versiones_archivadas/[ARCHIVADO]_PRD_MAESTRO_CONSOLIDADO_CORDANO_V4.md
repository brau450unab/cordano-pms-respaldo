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


# PRD Maestro Consolidado V4.0: Cordano Operations ERP & ParkOps PMS

**Documento Oficial de Especificación de Producto y Arquitectura de Sistemas**  
**Empresa**: Cordano Inversiones Inmobiliarias Ltda.  
**Instalación Piloto**: Serrano 447, Iquique, Región de Tarapacá, Chile (~700 m², 30 plazas canónicas)  
**Infraestructura**: Google Cloud Run (`cordano-pms-v1` en `us-west1`), Google Cloud Datastore, PostgreSQL con Prisma, IndexedDB (PWA Offline-First)  
**Estado del Documento**: Consolidado Canónico (Integración de Documentos 1 al 26 + Design Tokens Borgoña macOS Pathway)  
**Fecha de Emisión**: Septiembre 2026  

---

## 1. Resumen Ejecutivo y Misión del Producto

### 1.1 Contexto Estratégico y Decisiones Fundacionales (Alineación Grill-Me)
A través del proceso formal de entrevista `/grill-me`, se han establecido las 12 definiciones canónicas innegociables para Cordano Inversiones Inmobiliarias Ltda. en Serrano 447, Iquique:

1. **Volumen Operativo & Enfoque de Interfaz**: Operación de **volumen moderado/bajo** con registro manual asistido por vehículo. Interfaz limpia, ordenada, amigable y orientada a cero errores.
2. **Rol Principal (Administrador)**: Control financiero gerencial, supervisión remota 24/7 y **exportación con 1 clic a Excel (.xlsx) y Google Sheets** para análisis contable profundo, más Reportes Z en PDF.
3. **Exclusividad Operativa de Garita (Single-Writer)**: Mientras el turno esté abierto, el cajero es el **ÚNICO autor con permisos de escritura transaccional** sobre vehículos. El Administrador opera en modo **estrictamente visualizador (Read-Only)** para no vulnerar la responsabilidad de caja del operador.
4. **Prevención de Robos & Cola de Excepciones**: Para no retrasar la salida del cliente, el operador registra cobros parciales, descuentos o extravíos bajo su PIN individual de 4 dígitos. La transacción queda en una **Cola de Excepciones Pendientes** que exige validación del Administrador (vía código temporal OTP / Authenticator) como condición obligatoria antes de poder cerrar el turno.
5. **Motor de Tarifas**: \$35 CLP/minuto para autos, \$25 motos, \$45 camionetas. **30 minutos de gracia iniciales** (gratis si sale antes de 30m; al minuto 31 se cobra completo desde el minuto cero), redondeo al alza a la decena y multa por ticket perdido de \$10.000 CLP.
6. **Layout Flexible por Capacidad**: Capacidad de 30 vehículos. No se obliga a micro-gestionar números de cajón individuales; se gestiona el contador de ocupación en tiempo real (ej. 18/30) y el flujo mediante **Tablero Kanban por tiempo de permanencia** (<1h, 1-2h, 2-4h, >4h).
7. **PWA Offline-First**: Persistencia en IndexedDB local con sufijo "O" y sincronización automática idempotente con Google Cloud Run (`cordano-pms-v1` en `us-west1`).
8. **Ticket Térmico Dual (Papel + WhatsApp)**: Impresora continua de 80mm con código de barras Code 128 (sin QR). Previsualización con botón "Imprimir" y botón "Enviar por WhatsApp" (si el cliente dio su celular). El ticket físico incluye impreso el WhatsApp de atención de la garita.
9. **CCTV Independiente en Fase MVP**: Cámaras físicas operan de forma separada; en el PMS se incluye una vista maqueta con la infraestructura y librerías preparadas para futura conexión.
10. **Módulo de Configuración ERP**: Pestañas de Tarifas versionadas (congelamiento al ingreso), Datos de la Empresa & WhatsApp, Usuarios con PIN y Parámetros de Caja.
11. **Auditoría Inmutable Append-Only**: Bitácora de eventos con trazabilidad de PIN, marcas Verde (descuentos) y Rojo (recargos/fugas), y sellos criptográficos SHA-256.
12. **Identidad Cordano**: Logotipo oficial concéntrico con 'C' central blanca, Design Tokens "macOS Pathway Redux" (Borgoña `#80093A`, superficies `#F9F9FB`, tipografía Manrope y monoespaciada `tabular-nums`).

### 1.2 Misión y Propuesta de Valor
- **Misión**: Profesionalizar y digitalizar al 100% el ciclo de vida del vehículo y del flujo financiero en Serrano 447, erradicando el fraude y brindando una herramienta rápida, ergonómica y digna para el personal de garita, y un panel de control ejecutivo transparente para la propiedad.
- **Término Operativo Clave**: El binomio **Placa Patente** (Identificador Único del Vehículo) y **Número Telefónico** (Canal de Notificación y Comprobante Digital) constituye el núcleo transaccional.

---

## 2. Identidad de Marca y Sistema de Diseño "Cordano macOS Pathway"

Se fusiona la identidad corporativa de Cordano Inversiones Inmobiliarias Ltda. con la ergonomía visual de Apple Developer (macOS Pathway):

### 2.1 Logotipo Oficial
- **Composición**: Marco monocromático negro con marcos concéntricos redondeados de alto contraste y la letra central **'C'** grabada en blanco puro (`cordano-logo.png`).
- **Ubicación en UI**: Encabezado global izquierdo en Navbar (44px) y portada del Reporte Z / Ticket Térmico 80mm.

### 2.2 Paleta de Colores y Tokens Visuales
- **Color de Acción Primario (Brand Accent)**: **Borgoña Sofisticado** (`#80093A` / Hover: `#A52C55`). Utilizado en botones de acción principal, indicadores activos de navegación y destacados de marca.
- **Superficies y Fondos**:
  - Fondo Base de Aplicación: Blanco / Gris extra claro (`#F9F9FB` / `#F5F5F7`).
  - Contenedores y Tarjetas: Blanco puro (`#FFFFFF`) con bordes sutiles (`#E2E2E4` / 1px solid).
  - Encabezados y Barras de Control: Pizarra oscura (`#1A1C1D` / `#0F172A`).
- **Colores Semánticos de Estacionamiento y Finanzas (Norma Estricta Serrano 447)**:
  - **Disponible**: Verde Esmeralda (`#10B981` / `#30D158`)
  - **Ocupado**: Gris Pizarra (`#64748B`)
  - **Reservado**: Ámbar (`#F59E0B` / `#FF9F0A`)
  - **Abonado / VIP**: Azul Sistema (`#3B82F6` / `#0A84FF`)
  - **PMR (Movilidad Reducida - Ley 20.422)**: Cian (`#06B6D4` / `#64D2FF`) — *Plazas A-01 y A-02*
  - **Punto de Carga EV (Eléctrico)**: Violeta (`#8B5CF6`) — *Plaza A-03*
  - **Sobrestadía / Alerta Crítica (>3h / >24h)**: Rojo Carmesí (`#EF4444` / `#BA1A1A`)
  - **Auditoría Financiera**: **Verde** para descuentos autorizados y **Rojo** para recargos, tickets perdidos y fugas.

### 2.3 Tipografía
- **Interfaz General, Títulos y Navegación**: **Manrope** (legibilidad superior y proporciones limpias estilo Apple).
- **Datos Numéricos, Finanzas y Patentes**: **IBM Plex Mono / Geist Mono** con propiedad obligatoria `tabular-nums font-mono` para evitar oscilaciones o saltos visuales en cronómetros de estadía y montos CLP en tiempo real.

---

## 3. Matriz de Roles, Perfiles y Segregación de Funciones (SoD)

El sistema prohíbe las cuentas compartidas y establece una estricta Segregación de Funciones:

| Rol | Destino al Login | Permisos Transaccionales | Capacidad de Auditoría y Configuración |
| :--- | :--- | :--- | :--- |
| **Operador / Cajero (Carlos)** | POS de Operación (Check-in / Check-out) | Apertura de turno, emisión de tickets, cobro de caja, cierre ciego. *Único con permisos de escritura transaccional durante el turno.* | Solo consulta de sus propios tickets y reporte de su turno activo. No puede editar tarifas ni borrar registros. |
| **Supervisor de Turno** | Dashboard de Supervisión / Layout | Puede operar como cajero si abre turno. Puede emitir códigos OTP o autorizar excepciones en garita. | Lectura de turnos activos. Autorización de cobros parciales, anulaciones y tickets perdidos. |
| **Administrador (Patricia / Braulio / Angelo)** | Dashboard Ejecutivo Central | Solo lectura remota mientras el turno está en curso. Para operar físicamente, debe abrir un turno propio independiente. | Control total: configuración de tarifas dinámicas, gestión de usuarios, auditoría append-only, exportaciones PDF/CSV. |
| **Auditor Externo** | Panel de Auditoría | Sin acceso a caja ni a creación de tickets. | Solo lectura histórica, descarga de reportes Z y validación de sellos criptográficos SHA-256. |

---

## 4. Mapa del Sitio Completo y Módulos de la Plataforma

Estructura modular exhaustiva de la aplicación:

```text
/ (Raíz del Sitio)
├── /landing                      → Landing Page pública informativa y conversión comercial
├── /faq                          → Sección de Preguntas Frecuentes para usuarios y clientes
├── /login                        → Portal de autenticación con selector de perfil y 2FA
├── /recuperar-password           → Flujo de recuperación segura mediante correo/código
├── /registro                     → Creación y alta de usuarios (restringido a invitación Admin)
├── /inicio                       → Hub central de comando y distribución según rol
│
├── /operacion                    → MÓDULOS OPERATIVOS DE GARITA (Cajero)
│   ├── /operacion/ingreso        → Check-in rápido de vehículos & validación Anti-Passback (<10s)
│   ├── /operacion/salida         → Check-out POS, visor gigante de vuelto y medios de pago (<15s)
│   ├── /operacion/layout         → Matriz interactiva de 30 Plazas Serrano 447 (Plano 2D + Kanban)
│   └── /operacion/cierre         → Protocolo de Arqueo y Cierre de Caja Ciego por denominación
│
├── /reportes                     → MÓDULOS DE REPORTES Y ANALÍTICA
│   ├── /reportes/dashboard       → Métricas en tiempo real (ocupación, rotación, recaudación acumulada)
│   ├── /reportes/financieros     → Detalle por medio de pago (Efectivo, Transbank, Transferencias)
│   ├── /reportes/ocupacion       → Heatmap de demanda horaria y picos semanales
│   └── /reportes/pdf-generator   → Motor de exportación de Reportes Z y planillas tributarias
│
├── /auditoria                    → BITÁCORA INMUTABLE DE SEGURIDAD
│   ├── /auditoria/eventos        → Ledger Append-only con trazabilidad de PIN y hashes SHA-256
│   └── /auditoria/incidencias    → Gestión de excepciones: fugas, descuentos y tickets perdidos
│
└── /configuracion                → NÚCLEO ADMINISTRATIVO ERP
    ├── /configuracion/tarifas    → Motor tarifario dinámico, tramos día/noche, tiempo de gracia
    ├── /configuracion/usuarios   → Gestión de operadores, roles, turnos y credenciales
    ├── /configuracion/permisos   → Matriz de accesos granulares RBAC
    ├── /configuracion/layout     → Parámetros físicos del recinto (30 slots, PMR, EV, sobrecupo)
    └── /configuracion/hardware   → Configuración de impresora térmica 80mm y streams CCTV
```

---

## 5. Procedimiento Operativo Estándar de Garita (SOP: Las 6 Fases del Día a Día)

Este esquema define la secuencia exacta de trabajo del operador en la garita de Serrano 447, concebida para maximizar la velocidad, eliminar la fatiga mental y blindar a ambas partes ante discrepancias:

### Fase 1: Inicio de Sesión y Preparación Operativa
- **Propósito**: Establecer la caja base del día y sincronizar el sistema con la realidad física del estacionamiento antes de emitir el primer ticket.
1. **Inicio de sesión en Operación POS**:
   - El operador ingresa desde el navegador a la URL del módulo POS de ParkOps y digita sus credenciales seguras.
2. **Inicio de turno**:
   - Hace clic en **"Iniciar Turno"**. Este dispositivo físico queda registrado como la **"caja activa"** y única fuente de verdad transaccional para ese período.
3. **Apertura de caja (Declaración Inicial)**:
   - El operador cuenta el dinero físico con el que recibe la gaveta y digita los montos base para fondo de cambio (ej. \$50.000 CLP en sencillo).
   - Registra comprobantes o váucheres de Transbank heredados del turno anterior si aplica.
   - Comienza a correr el cronómetro del turno sincronizado con el servidor (NTP America/Santiago).
4. **Verificación de arrastre (Auditoría Inicial de la Mañana)**:
   - El operador revisa el Mapa Interactivo / Tablero Kanban y realiza una inspección visual en el patio.
   - Valida que los vehículos físicamente estacionados coincidan exactamente con los registros en estado `In-Parking` heredados de la noche anterior, depurando cualquier registro fantasma con PIN de autorización.

### Fase 2: Ingreso de Vehículos (Check-in) — Objetivo <10 Segundos
- **Propósito**: Registrar la entrada vehicular de manera ágil y emitir el comprobante de estadía sin generar filas en calle Serrano.
1. **Captura de Matrícula (Módulo POS)**:
   - Ingreso manual o vía escáner de la patente. Validación de formato chileno estándar (AB·CD·12 o AB·12·34) con autofoco inmediato.
   - Tecla rápida `F4` para conmutar a ingreso libre de patentes extranjeras o no convencionales.
2. **Validación Anti-Passback (<100ms)**:
   - El sistema verifica en milisegundos si la patente ya cuenta con una estadía activa adentro. Si está duplicada, bloquea el ingreso y lanza alerta para verificar si el vehículo previo no marcó salida o forzar ingreso bajo PIN y justificación.
3. **Tipo de Vehículo**:
   - Selección obligatoria (Auto, SUV, Camioneta, Moto) para cargar la tarifa dinámica correspondiente.
4. **Datos del Conductor (Opcional & Asistido)**:
   - Si la patente corresponde a un cliente recurrente o abonado, se despliega su perfil comercial de inmediato.
   - Si es nuevo, se consulta si desea dar información: teléfono móvil (+569 automático) o correo con sugerencia de dominio para ticket digital. Si el cliente declina, se marca "No da información" sin demoras.
5. **Asignación de Espacio (Slot)**:
   - **Sugerencia Automática**: Si la disponibilidad es crítica (6 espacios o menos libres), el sistema resalta en Ámbar el slot óptimo más cercano al acceso.
   - **Selección Manual**: Si hay más de 6 plazas libres, el operador o cliente eligen libremente desde el layout interactivo.
6. **Emisión de Ticket y Cambio de Estado**:
   - Se genera el comprobante térmico con código de barras lineal Code 128 (escaneable con pistola láser), fecha/hora exacta, plaza asignada, resumen de tarifas y tiempo de gracia (30m).
   - Se entrega el ticket, se levanta la barrera y el vehículo pasa formalmente al estado `In-Parking`.

### Fase 3: Estadía y Monitoreo Continuo
- **Propósito**: Controlar la ocupación y el tiempo de permanencia en tiempo real sin recargar pantallas.
1. **Vista de Layout (Gestión Visual)**:
   - Mapa interactivo con las 30 plazas canónicas codificadas por estado: Disponible (Verde), Ocupado (Pizarra), Reservado (Ámbar), Mantención (Gris), PMR (Cian), EV (Violeta).
2. **Control de Tiempo y Seguimiento**:
   - Cronómetro de estadía activo en tiempo real en cada tarjeta con tipografía monoespaciada `tabular-nums`.
   - Identificación visual destacada para vehículos con estadía prolongada: badge ámbar para >4 horas y rojo para >24 horas (alerta de posible abandono).
3. **Variantes Operativas en Estadía**:
   - **Cambio de Slot (Reubicación)**: Movimiento manual de un vehículo de un espacio a otro (arrastrar o reasignar), registrado inmutablemente en la bitácora de auditoría.
   - **Modo Offline (Resiliencia Iquique)**: Si se interrumpe la conexión a internet, el sistema permite seguir registrando ingresos en IndexedDB local con sufijo `O`, sincronizándose automáticamente al restablecerse la red.

### Fase 4: Salida y Proceso de Pago (Check-out) — Objetivo <15 Segundos
- **Propósito**: Liquidar la estadía con exactitud matemática, cobrar y liberar el espacio.
1. **Búsqueda y Validación**:
   - El operador lee el código de barras del ticket con la pistola láser o digita la patente en el buscador rápido. El sistema despliega el registro de inmediato.
2. **Liquidación de Tarifa (Cálculo Automático)**:
   - Fórmula base: `(Hora Salida - Hora Entrada) - Tiempo de Gracia (30m)`, redondeando al minuto cerrado hacia arriba a la decena CLP.
   - Aplicación de tarifa congelada a la hora de ingreso (protege al cliente de alzas sobre la marcha).
   - Alerta temprana: Pop-up de confirmación si la estadía es menor a 5 minutos (posible error de digitación). Si es 0 segundos, eliminación automática.
   - **Visor Gigante de Monto**: El total a pagar se visualiza en pantalla grande para el conductor.
3. **Medios de Pago y Transacción**:
   - **Efectivo**: El cajero digita el monto recibido. La calculadora integrada despliega el **vuelto exacto en números gigantes** para eliminar errores bajo fatiga.
   - **Tarjeta Transbank / Transferencias**: El operador digita el monto en la máquina POS física de Transbank o verifica la transferencia, confirmando el voucher en el PMS.
   - **Cuenta de Cliente / Abonados**: Descuento directo de saldo o convenio según perfil registrado.
4. **Resolución de Conflictos en Caja**:
   - Descuentos autorizados o "Cobros Parciales" por discrepancias de tarifa exigen el ingreso del PIN individual de 4 dígitos del operador y motivo obligatorio (quedando resaltados en verde o rojo en auditoría).
5. **Cierre de Ciclo del Cliente**:
   - El ticket cambia a `PAGADO` y luego `ENTREGADO`. Se imprime el recibo térmico de salida (o se envía por WhatsApp wa.me) y el slot vuelve a estado `DISPONIBLE` inmediatamente.

### Fase 5: Escenarios, Errores Comunes y Excepciones
- **Propósito**: Resolver situaciones atípicas con respaldo digital y sin bloquear la atención.
1. **Ticket Extraviado**:
   - *Con patente legible*: Se busca en el sistema y se liquida el tiempo real con normalidad.
   - *Sin patente legible*: Función especial en POS. Cobro de multa fija configurada (\$10.000 CLP) y estimación manual bajo PIN de autorización.
2. **Fuga de Vehículo**:
   - Si un vehículo evade el pago, el operador marca la salida manual y anula el ticket ingresando su PIN. El registro queda catalogado como "Fuga" en auditoría roja sin descalabrar el saldo de efectivo esperado en caja.
3. **Falla de Impresora Térmica**:
   - Alerta visual en pantalla. La transacción queda confirmada en base de datos; se ofrece reintento de impresión o envío digital del comprobante por WhatsApp.
4. **Apertura Manual de Barrera**:
   - Registro automático en bitácora de toda elevación de barrera no asociada a un ticket pagado, requiriendo justificación obligatoria.

### Fase 6: Cierre de Turno y Cuadratura de Caja Ciega
- **Propósito**: Consolidar la recaudación del día y garantizar transparencia financiera absoluta.
1. **Fin de Operaciones**:
   - Clic en "Cerrar Turno". El sistema mantiene la sesión protegida (nunca se cierra sola por inactividad o cortes de red).
2. **Protocolo de Cierre Ciego**:
   - El sistema oculta por completo el dinero matemático esperado.
   - El operador cuenta físicamente sus billetes (\$20k, \$10k, \$5k, \$2k, \$1k), monedas y comprobantes de tarjeta, digitando los totales a ciegas.
3. **Cuadratura y Diferencias en 3 Columnas**:
   - El sistema revela lo esperado y muestra: `Monto Sistema` vs `Monto Declarado` = `Diferencia / Cuadre`.
   - Si existe un descuadre significativo (marcado en rojo), se exige una justificación escrita obligatoria del operador para la revisión administrativa.
4. **Bitácora de Auditoría y Sello Final**:
   - El turno finaliza formalmente y se genera el **Reporte Z de Cierre** sellado con hash SHA-256 inalterable. Queda archivado para la supervisión y control del Administrador.

---

## 6. Modelo de Datos Relacional y Esquema de Entidades (11 Tablas)

Todas las entidades transaccionales incluyen el campo `location_id` (preparadas para expansión multi-sede sin romper la operación mono-sede en Serrano 447):

1. **`Users`**: `id_usuario`, `nombre_completo`, `email`, `telefono`, `rol`, `pin_autorizacion` (hash), `estado_activo`, `location_id`.
2. **`Roles_Permissions`**: `id_permiso`, `rol`, `modulo_acceso`, `nivel_acceso`, `requiere_pin_admin`.
3. **`Customers`**: `id_cliente`, `nombre_cliente`, `rut_dni`, `telefono_contacto` (+569), `email_contacto`, `consentimiento_whatsapp`, `tipo_cliente`.
4. **`Vehicles`**: `id_vehiculo`, `patente_normalizada`, `es_patente_extranjera`, `tipo_vehiculo` (AUTO, MOTO, SUV, CAMIONETA), `id_cliente_dueno`.
5. **`ParkingSlots`**: `id_slot`, `codigo_slot` (A-01 a A-15, B-16 a B-30, SOBRECUPO-XX), `sector` (A, B, SOBRECUPO), `tipo` (NORMAL, PMR, ELECTRICO), `estado_slot` (DISPONIBLE, OCUPADO, RESERVADO, MANTENCION), `id_ticket_activo`.
6. **`Tickets`**: `id_ticket`, `codigo_ticket` (`TKT-AAAAMMDD-T0X-XXXX` o sufijo `O`), `estado_ticket` (`CREADO`, `IN_PARKING`, `PAGADO`, `ENTREGADO`, `ANULADO`, `FUGA`), `patente_normalizada`, `id_slot`, `fecha_hora_ingreso`, `fecha_hora_salida`, `duracion_total_minutos`, `minutos_gracia_aplicados`, `tarifa_por_minuto`, `monto_total_cobrado`, `es_offline`.
7. **`TariffVersions`**: `id_version_tarifa`, `nombre_version`, `tipo_vehiculo`, `precio_por_minuto`, `minutos_gracia`, `monto_multa_ticket_perdido`, `regla_redondeo`, `fecha_inicio_vigencia`, `es_activa`.
8. **`Payments`**: `id_pago`, `id_ticket`, `id_turno`, `id_usuario_cajero`, `medio_pago` (`EFECTIVO`, `TARJETA`, `TRANSFERENCIA`), `monto_total_pagado`, `monto_vuelto_entregado`, `numero_voucher_transbank`, `timestamp_pago`.
9. **`Shifts`**: `id_turno`, `id_usuario_operador`, `dispositivo_caja_id`, `fecha_hora_apertura`, `monto_inicial_caja`, `desglose_efectivo` (JSON), `monto_declarado_efectivo`, `monto_esperado_efectivo`, `diferencia`, `estado` (`ABIERTO`, `CERRADO`), `hash_sellado` (SHA-256).
10. **`AuditTrail`**: `id_evento_auditoria`, `timestamp`, `tipo_evento`, `nivel_criticidad`, `id_usuario_solicitante`, `id_admin_aprobador`, `motivo_justificacion`, `entidad_afectada`, `valor_anterior_json`, `valor_nuevo_json`, `origen_conexion`.
11. **`SyncQueue` (IndexedDB Client-Side)**: `id_local_sync`, `idempotency_key`, `tipo_operacion`, `payload_json`, `timestamp_creacion_local`, `estado_sincronizacion`.

---

## 7. Arquitectura Técnica Cloud Run & Modo Offline-First

- **Contenedor Cloud Run**: Node.js / Next.js en puerto 8080 (`gen-lang-client-0862587160`, `us-west1`).
- **Single-Writer Enforced**: La caja activa que abrió el turno tiene la exclusividad transaccional de escritura. Todos los demás clientes conectados (celulares o laptops de administradores) operan en modo lectura sincronizada.
- **Resiliencia Offline**: En caso de corte de internet en Iquique, la PWA almacena localmente los tickets en IndexedDB con el sufijo "O". Al reanudarse la conectividad, un trabajador en segundo plano sincroniza las transacciones mediante claves de idempotencia sin duplicar cobros ni generar colisiones.
- **Impresión Térmica**: Utiliza la API nativa de impresión (`window.print()`) con CSS optimizado para rollo térmico de 80mm continuo y simbología Code 128.
