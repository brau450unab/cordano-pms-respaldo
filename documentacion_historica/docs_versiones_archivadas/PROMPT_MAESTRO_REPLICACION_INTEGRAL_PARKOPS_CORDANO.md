# PROMPT MAESTRO Y ESPECIFICACIÓN INTEGRAL DE REPLICACIÓN 1:1 — PARKOPS PMS & ERP (CORDANO INVERSIONES INMOBILIARIAS LTDA.)

> [!IMPORTANT]
> **PROPÓSITO DE ESTE DOCUMENTO**: Este archivo `.md` constituye el **Blueprint Maestro Autónomo (Single Source of Truth)** para replicar de principio a fin la aplicación **ParkOps PMS & ERP** de **Cordano Inversiones Inmobiliarias Ltda.** (Serrano 447, Iquique, Chile). Contiene:
> 1. **El Prompt Maestro de Replicación 1:1** (listo para copiar y pegar en Google AI Studio, Google Stitch, Antigravity, Cursor, Bolt o v0).
> 2. **La Documentación PRD Canónica Consolidada** (reglas de negocio, tarifas, caja ciega, antifraude y flujos).
> 3. **El Sistema de Diseño Completo (`DESIGN.md`)** (tokens, paleta Borgoña Cordano `#80093A`, estética macOS Pathway Redux / Liquid Glass y tipografía tabular).
> 4. **El Inventario Completo de Archivos, Contratos TypeScript, Store y Endpoints API** necesarios para compilar y desplegar en Google Cloud Run.
> 5. **La Descripción Exhaustiva de Todas las Capturas, Pantallas, Modales y Diagramas** del sistema (18 capturas documentadas al detalle).

---

## BLOQUE 1: PROMPT MAESTRO PARA REPLICAR LA APLICACIÓN (COPIAR Y PEGAR)

```markdown
Actúa como un Arquitecto Principal de Software Full-Stack y Diseñador UI/UX Senior especialista en sistemas críticos de misión (Parking Management Systems & ERP). Tu objetivo es construir y replicar con fidelidad 1:1 la plataforma completa **"ParkOps PMS & ERP"** para la empresa **Cordano Inversiones Inmobiliarias Ltda.**, ubicada físicamente en **Serrano 447, Iquique, Chile** (junto al Consulado Italiano, superficie de ~700 m² con 30 plazas canónicas: Sector A 01–15, Sector B 16–30, más 5 plazas adicionales de sobrecupo temporal SC-01 a SC-05 = 35 slots en cuadrícula 7×5).

### 1. STACK TECNOLÓGICO E INFRAESTRUCTURA OBLIGATORIA
- **Framework**: Next.js 14.2+ (App Router, TypeScript estricto, React 18, Server & Client Components).
- **Estilos e Iconografía**: Tailwind CSS 3.4+, `lucide-react`, `clsx`, `tailwind-merge`.
- **Inteligencia Artificial Integrada**: SDK oficial `@google/genai` (Gemini 2.5 Flash) para reconocimiento óptico de patentes (LPR/OCR), inspección visual de daños preexistentes, auditoría inteligente de cierres de turno y asistente operativo de garita.
- **Infraestructura Cloud Run**:
  - Proyecto GCP: `gen-lang-client-0862587160` (N° `349577440002`) | Región: `us-west1`.
  - Servicio Cloud Run: `cordano-pms-v1` expuesto en puerto `8080` (`output: 'standalone'` en Next.js + `Dockerfile` multi-etapa Node 20 Alpine).
  - URL Producción: `https://cordano-pms-v1-349577440002.us-west1.run.app`.
  - Google Stitch Project ID: `projects/12916038623650348087`.
- **Persistencia Híbrida Offline-First**: Store transaccional en memoria/servidor (`pmsStore.ts`) sincronizado con `IndexedDB` local en el navegador para operar sin interrupciones ante caídas de internet, marcando los tickets emitidos en contingencia con el sufijo `O` (`TKT-AAAAMMDD-T0X-XXXXO`).

### 2. REGLAS INQUEBRANTABLES DE UX/UI Y ERGONOMÍA DE GARITA
1. **Ergonomía Keyboard-First y Cero Scroll en 1080p**:
   - Toda acción crítica en la garita (`/`) se ejecuta mediante atajos directos de teclado (`F1` Ingreso, `F2` Cobro, `F3` Mapa de Plazas, `F4` Patente Extranjera / Reimpresión, `F8` Arqueo de Caja Ciega, `Enter` Confirmar, `Esc` Cerrar modales).
   - Autofoco inmediato en el input de patente al abrir ingreso o cobro.
   - En monitores 1080p de garita, el cockpit principal opera en diseño Bi-Panel Asimétrico (Columna Izquierda 7/12: Check-in + Check-out; Columna Derecha 5/12: Matriz `SerranoLayoutMap` de 7 filas × 5 columnas = 35 plazas) **sin scroll vertical ni horizontal**.
2. **Tipografía Numérica Tabular Estricta**:
   - Todo monto en pesos chilenos CLP (sin decimales, con punto separador de miles, ej. `$4.500 CLP`), cronómetro de estadía, porcentaje de ocupación o patente vehicular DEBE usar `font-mono tabular-nums` (`Geist Mono` / `IBM Plex Mono`) para evitar saltos visuales en actualizaciones en tiempo real.
3. **Identidad Visual Corporativa "Cordano macOS Pathway Redux"**:
   - Logotipo oficial monocromático (`/cordano-logo.png`): marco negro concéntrico redondeado con letra `'C'` blanca central.
   - Color de Acento Primario: **Borgoña Sofisticado** (`#80093A`, hover `#A52C55`).
   - Superficies: Fondo general claro macOS (`#F9F9FB`), tarjetas blancas (`#FFFFFF`) con bordes sutiles (`#E2E2E4`), cabeceras y barras de control en pizarra oscura (`#0F172A` / `#1A1C1D`).
   - Botones grandes táctiles (48px–52px de alto), esquinas redondeadas estilo squircle macOS (`rounded-xl` a `rounded-3xl`) y modales flotantes centrales con `backdrop-blur-md`.
4. **Código Semántico Oficial de Colores para Plazas (Serrano 447)**:
   - **Disponible**: Verde Esmeralda (`#10B981`)
   - **Ocupada**: Gris Pizarra (`#64748B` / `#0F172A` en tarjeta activa)
   - **Reservada / Sobrecupo**: Ámbar (`#F59E0B`)
   - **Abonado / Convenio / VIP**: Azul (`#3B82F6`)
   - **PMR (Movilidad Reducida - Plazas A-01 y A-02)**: Cian (`#06B6D4`)
   - **Punto de Carga EV (Eléctrico - Plaza A-03)**: Violeta (`#8B5CF6`)
   - **Sobrestadía / Alerta Crítica**: Rojo Carmesí (`#EF4444`)

### 3. REGLAS DE NEGOCIO, TARIFAS Y CONTROL ANTIFRAUDE
1. **Motor de Tarifas y Tiempo de Gracia**:
   - Tarifas por minuto congeladas al momento del ingreso y redondeadas siempre al alza a la decena más cercana en CLP (`Math.ceil((minutos * tarifa) / 10) * 10`).
   - Tarifas configurables (Estándar Garita: Auto `$35/min`, Camioneta `$45/min`, Moto `$25/min`; o perfil base `$25/$30/$15`).
   - Tiempo de gracia inicial configurable (30 minutos por defecto): si el vehículo se retira dentro del tiempo de gracia, el cobro es `$0 CLP`.
   - Filtros de seguridad: estadías de `0 segundos` se descartan por error; estadías `< 5 minutos` despliegan alerta de posible error de digitación ofreciendo anulación rápida.
   - Multa por Ticket Extraviado: recargo fijo de `$10.000 CLP` más el tiempo de estadía calculado por búsqueda de patente en el sistema.
2. **Validación de Patentes y Anti-Passback Flexible**:
   - Máscara automática para patentes chilenas (`ABCD-12` o `AB-1234`) y botón/atajo `[F4]` para patentes extranjeras (Perú, Bolivia, Argentina, diplomáticas).
   - Si una patente ya registra un ticket activo en el recinto, se activa un modal Anti-Passback pidiendo confirmación explícita antes de permitir o rechazar el ingreso.
3. **Principio de Custodia Única (Single-Writer) y Segregación de Roles**:
   - **Operador de Garita**: Único rol autorizado a abrir turno de caja, registrar ingresos y cobrar salidas. Opera a ciegas respecto al total recaudado acumulado del sistema.
   - **Administrador**: Supervisa en tiempo real en modo **Solo Lectura (Read-Only)** sobre la garita activa, visa excepciones con su PIN de 4 dígitos, audita cierres de turno, configura tarifas y descarga reportes en Excel/CSV en 1 clic. **Tiene prohibido abrir turnos de caja con cuenta de administrador**.
4. **Cola de Excepciones No Bloqueante y Auditoría con Sello SHA-256**:
   - Descuentos menores, cobros parciales, fugas o tickets perdidos se registran en garita con el **PIN individual del operador** y justificación escrita obligatoria (`>10 caracteres`) para no detener la fila de autos.
   - Estas incidencias alimentan la **Cola de Aprobaciones Pendientes** en `/admin`, donde el Administrador debe visarlas con su PIN.
   - En la bitácora inmutable (`AuditLog`), los descuentos autorizados se etiquetan en **VERDE** y los recargos/multas/fugas en **ROJO**.
5. **Cierre de Caja Ciego y Reporte Z Térmico (80mm)**:
   - Al abrir turno, el operador verifica y declara el fondo fijo de sencillo (ej. `$50.000 CLP`).
   - Al cerrar turno (`F8`), el operador cuenta y declara los billetes chilenos (`$20.000`, `$10.000`, `$5.000`, `$2.000`, `$1.000`), monedas, total de vouchers de tarjeta POS y transferencias **sin ver cuánto espera el sistema**.
   - Una vez enviado el arqueo ciego, el sistema calcula: `Declarado - (Esperado Efectivo + Fondo Inicial) = Diferencia / Cuadre`, genera un hash criptográfico **SHA-256** de sellado inmutable y habilita la impresión del **Reporte Z térmico de 80mm en duplicado**.
6. **Servicios Especiales en Paralelo (Noche y Convenios Mensuales)**:
   - Se gestionan en un submódulo separado (`/convenios`). Bloquean la plaza asignada en la matriz de Serrano 447 pero **no ingresan a la lista de vehículos rotativos por minuto** ni distorsionan la caja diaria transitoria.
```

---

## BLOQUE 2: DOCUMENTACIÓN PRD CANÓNICA CONSOLIDADA

### 2.1 Flujo Operacional Completo del Día a Día (6 Fases Canónicas)

```mermaid
flowchart TD
    subgraph F1["FASE 1: Apertura de Turno y Caja"]
        A1["Login Operador con PIN de 4 dígitos"] --> B1["Verificación de Fondo Inicial de Sencillo ($50.000 CLP)"]
        B1 --> C1["Campos Tarjeta ($0) y Transferencia ($0) visibles"]
        C1 --> D1["Confirmación de Apertura -> Ingreso directo al Cockpit POS"]
    end

    subgraph F2["FASE 2: Ingreso de Vehículo (Check-in F1)"]
        D1 --> A2["Autofoco en Patente (Máscara Chilena o Modo Extranjero F4)"]
        A2 --> B2{"¿Validación Anti-Passback?"}
        B2 -- "Patente ya activa" --> C2["Pop-up de Advertencia: Confirmar o Cancelar"]
        B2 -- "Patente limpia" --> D2["Selección de Tipo (Auto $35 / Camioneta $45 / Moto $25)"]
        C2 --> D2
        D2 --> E2["Teléfono (+569), Email con autocompletado @ y Daños Opcionales"]
        E2 --> F2["Emisión de Ticket Térmico 80mm (Code 128 + Sufijo O si es Offline)"]
        F2 --> G2["Asignación de Plaza en Matriz 7×5 (Sector A, B o Sobrecupo SC)"]
    end

    subgraph F3["FASE 3: Monitoreo en Matriz 7×5 (35 Plazas)"]
        G2 --> A3["Tarjeta de Plaza Ocupada: Patente + Minutos + Monto Acumulado CLP"]
        A3 --> B3["Clic en Plaza -> Abre Modal Informativo Puro"]
        B3 --> C3["Botón Único: 'Ir a Cobro en Garita' -> Transfiere Patente a Check-out"]
    end

    subgraph F4["FASE 4: Cobro, Salida y Excepciones (Check-out F2)"]
        C3 --> A4["Búsqueda por Escaneo Lineal Code 128 o Patente"]
        A4 --> B4["Cálculo Exacto: Gracia 30m (Gratis <=30m) o Cobro Completo Redondeado"]
        B4 --> C4{"¿Flujo Regular o Excepción?"}
        C4 -- "Cobro Regular" --> D4["Selección Efectivo / Tarjeta / Transferencia + Visor Vuelto Gigante"]
        C4 -- "Descuento / Ticket Perdido / Fuga" --> E4["Autorización con PIN + Motivo (>10 caracteres) + Etiqueta Verde/Roja"]
        D4 --> F4["Liberación Inmediata de Plaza en Matriz"]
        E4 --> F4
    end

    subgraph F5["FASE 5: Cierre de Caja Ciego y Arqueo (F8)"]
        F4 --> A5["Conteo Físico Ciego de Billetes ($20k a $1k), Monedas y Vouchers"]
        A5 --> B5["Firma con PIN de Operador sin ver el monto esperado"]
        B5 --> C5["Revelación de Cuadratura: Efectivo Sistema vs Recontado = Diferencia"]
        C5 --> D5["Sellado Criptográfico SHA-256 + Emisión de Reporte Z Térmico 80mm"]
    end

    subgraph F6["FASE 6: Supervisión Administrativa y Cambio de Turno"]
        D5 --> A6["Administrador entra al App Launcher (/admin)"]
        A6 --> B6["Visa Excepciones Pendientes con PIN Supervisor (9999)"]
        B6 --> C6["Exporta Planilla Completa en 1 Clic a Excel / Google Sheets (.csv)"]
    end
```

### 2.2 Formato Canónico del Ticket Térmico de 80mm
- **Formato ID Online**: `TKT-AAAAMMDD-T0X-XXXX` (ej. `TKT-20260925-T01-0104`).
- **Formato ID Contingencia Offline**: `TKT-AAAAMMDD-T0X-XXXXO` (ej. `TKT-20260925-T01-0105O`).
- **Estructura Impresa**:
  1. Logotipo monocromático Cordano + Encabezado: `CORDANO INVERSIONES INMOBILIARIAS LTDA. — SERRANO 447, IQUIQUE`.
  2. Patente en tipografía gigante monoespaciada (`ABCD-12`), Tipo de vehículo, Plaza asignada (`A-04`), Fecha y Hora exacta de ingreso y Tarifa por minuto congelada.
  3. Teléfono/WhatsApp de atención de garita impreso y contador de reimpresiones (`Reimpresión #0`).
  4. **Código de Barras Lineal (Code 128)** de alto contraste para lectura láser en `<100ms` + **Código QR** complementario.
  5. **Leyenda Legal Obligatoria**: *"IMPORTANTE: No pierda este ticket. El extravío tiene una multa fija de $10.000 CLP adicionales al tiempo de estadía previa acreditación de dominio del vehículo."*

---

## BLOQUE 3: SISTEMA DE DISEÑO OFICIAL (`DESIGN.md` & TOKENS)

### 3.1 Especificación `DESIGN.md`
El sistema combina dos modos armónicos:
1. **Modo Operativo macOS Pathway Redux (Garita, Admin, Reportes, Configuración, Documentación)**: Superficie clara de alto contraste diurno (`#F9F9FB`) ideal para lectura bajo luz solar intensa del desierto de Iquique, con cabeceras oscuras (`#0F172A`), tarjetas blancas puras (`#FFFFFF`), bordes `#E2E2E4` y acento corporativo **Borgoña Cordano (`#80093A`)**.
2. **Modo Inmersivo Liquid Glass & Titanium Dark (Landing Comercial, Hub Central, Login y Visor CCTV)**: Superficie obsidiana (`#06080E` / `#0B0F19`), paneles translúcidos (`rgba(15, 23, 42, 0.45)` con `backdrop-blur: 20px`), bordes sutiles `rgba(255, 255, 255, 0.12)` y fotografías arquitectónicas de Serrano 447.

### 3.2 Tabla de Tokens de Color y Semántica

| Token / Variable | Valor Hex / RGBA | Uso Específico en la Interfaz |
| :--- | :--- | :--- |
| `cordano.burgundy` | `#80093A` | Botones primarios, badges oficiales, bordes activos, foco de inputs e identidad de marca. |
| `cordano.hover` | `#A52C55` | Estado `:hover` de botones primarios y enlaces destacados. |
| `cordano.surface` | `#F9F9FB` | Fondo general del Cockpit de Garita, Dashboard Ejecutivo y módulos ERP. |
| `cordano.dark` | `#1A1C1D` / `#0F172A` | Navbar superior, dock inferior de atajos, cabeceras de modales y tarjetas de slots ocupados. |
| `slot.available` | `#10B981` | Plazas libres en `SerranoLayoutMap` y estado "En Línea" de Cloud Run. |
| `slot.occupied` | `#64748B` / `#0F172A` | Plazas ocupadas en tiempo real con patente, minutos y monto en CLP. |
| `slot.reserved` | `#F59E0B` | Plazas reservadas, fila 7 de sobrecupo (`SC-01` a `SC-05`) y alertas pendientes de visación. |
| `slot.subscriber` | `#3B82F6` | Plazas bloqueadas por Convenios Empresariales mensuales. |
| `slot.pmr` | `#06B6D4` | Plazas de Movilidad Reducida (`A-01` y `A-02`, Ley 20.422). |
| `slot.ev` | `#8B5CF6` | Plaza con Punto de Carga Eléctrica (`A-03`) y Servicio Noche. |
| `slot.overstay` | `#EF4444` | Alerta de sobrestadía (`>3h`), fugas sin pago, multas por ticket perdido y faltantes de caja. |

---

## BLOQUE 4: ARQUITECTURA DE ARCHIVOS Y CONTRATOS DE CÓDIGO PARA REPLICAR LA APP

### 4.1 Árbol Completo del Proyecto

```text
NUEVO PMS CORDANO/
├── AGENTS.md                                          # Reglas permanentes de negocio y UX/UI
├── GEMINI.md                                          # Directrices gemelas del agente
├── DESIGN.md                                          # Tokens de diseño oficiales
├── README.md                                          # Guía de despliegue en Cloud Run y uso local
├── Dockerfile                                         # Contenedor multi-etapa Node 20 Alpine (Puerto 8080)
├── cloudbuild.yaml                                    # Pipeline CI/CD para Google Cloud Build
├── deploy-cloudrun.bat                                # Script de despliegue en 1 clic con gcloud CLI
├── package.json                                       # Dependencias Next.js 14, Lucide, @google/genai
├── tailwind.config.ts                                 # Configuración de paleta cordano y slot
├── tsconfig.json                                      # Configuración TypeScript con alias @/*
├── public/
│   ├── cordano-logo.png                               # Logotipo oficial monocromático 'C' de Cordano
│   ├── landing-hero.jpg                               # Fotografía arquitectónica para el Hero de Landing
│   ├── serrano_render.jpg                             # Render fotorrealista del estacionamiento Serrano 447
│   ├── login-panel.jpg                                # Imagen lateral del portal de autenticación
│   ├── hub-bg.jpg                                     # Fondo ambiental para el Hub de operaciones
│   └── cuestionario-grillme-flow.html                 # Diagrama interactivo standalone de flujo de decisiones
├── docs/
│   ├── INDICE_DOCUMENTACION.md                        # Catálogo maestro y matriz de compatibilidad
│   ├── PRD_SISTEMA_DE_PARKING.md                      # PRD V2.0 Canónico Oficial
│   ├── PARKOPS_ESPECIFICACIONES_TECNICAS_V2.md        # Contratos de API y arquitectura Cloud Run
│   ├── ESPECIFICACION_DISENO_FLUJO_Y_LANDING.md       # Especificación UI/UX de menús, pop-ups y landing
│   ├── MAPA_DE_SITIO_Y_ARQUITECTURA.md                # Mapa jerárquico de rutas y matriz RBAC
│   ├── PROMPT_MAESTRO_REPLICACION_INTEGRAL_PARKOPS_CORDANO.md # Este documento maestro
│   ├── cordano-database.architecture.json             # Esquema relacional de 11 tablas
│   ├── cordano-database-architecture.html             # Visor interactivo de base de datos
│   └── [ARCHIVADO]_*.md                               # 8 documentos históricos preservados con banner
└── src/
    ├── types/
    │   └── index.ts                                   # Interfaces canónicas: Ticket, ParkingSlot, Shift, AuditLog
    ├── lib/
    │   ├── pmsStore.ts                                # Motor transaccional en memoria (35 slots, tarifas, arqueo SHA-256)
    │   └── aiStudio.ts                                # Integración con Google Gemini 2.5 Flash (LPR, Daños, Auditoría)
    ├── components/
    │   ├── Navbar.tsx                                 # Barra de navegación superior macOS con estado de ocupación
    │   ├── PosCheckin.tsx                             # Formulario de ingreso rápido con Anti-Passback y ticket térmico
    │   ├── PosCheckout.tsx                            # Buscador de salida, calculadora de vuelto gigante y excepciones PIN
    │   ├── SerranoLayoutMap.tsx                       # Matriz derecha 7×5 (35 slots) + Modal Informativo Puro
    │   ├── SlotMap.tsx                                # Vista expandida de 30 plazas + Tablero Kanban por permanencia
    │   ├── ShiftModal.tsx                             # Apertura de turno, Cierre de Caja Ciego por billetes y Reporte Z
    │   ├── AuditLogView.tsx                           # Bitácora antifraude con filtros e insignias Verde/Rojo
    │   └── CloudRunBanner.tsx                         # Panel de telemetría y diagnóstico de Google Cloud Run
    └── app/
        ├── layout.tsx                                 # Root layout con tipografías e hidratación
        ├── globals.css                                # Reglas CSS globales, animaciones e impresión térmica 80mm
        ├── page.tsx                                   # [/] Cockpit Operativo de Garita (Cero Scroll + 7×5 Slots)
        ├── landing/page.tsx                           # [/landing] Portal interno de enlace rápido y acceso protegido
        ├── login/page.tsx                             # [/login] Acceso unificado con Tabs (Operador vs Administrador)
        ├── recuperar-password/page.tsx                # [/recuperar-password] Restablecimiento con código OTP
        ├── registro/page.tsx                          # [/registro] Alta y enrolamiento de nuevos operadores
        ├── hub/page.tsx                               # [/hub] Launchpad operativo con reloj oficial de Chile (CLT)
        ├── admin/page.tsx                             # [/admin] App Launcher estilo Odoo/macOS (8 módulos) + Dashboard
        ├── admin/usuarios/page.tsx                    # [/admin/usuarios] Gestión de personal, roles y PINs de 4 dígitos
        ├── reportes/page.tsx                          # [/reportes] Suite financiera, exportación CSV/Excel y Reporte Z
        ├── configuracion/page.tsx                     # [/configuracion] Motor ERP en 4 pestañas (Tarifas, Empresa, PINs, Caja)
        ├── convenios/page.tsx                         # [/convenios] Submódulo paralelo de Convenios y Pernoctas Mensuales
        ├── cctv/page.tsx                              # [/cctv] Monitoreo de cámaras IP Serrano 447 y LPR
        ├── documentacion/page.tsx                     # [/documentacion] Manuales SOP por rol + Repositorio Vigente/Archivado
        ├── faq/page.tsx                               # [/faq] Base de conocimientos interactiva con buscador
        └── api/
            ├── checkin/route.ts                       # POST ingreso de vehículos y validación Anti-Passback
            ├── checkout/route.ts                      # GET/POST liquidación de estadía, vuelto y excepciones con PIN
            ├── slots/route.ts                         # GET estado en vivo de las 35 plazas (Sector A, B y Sobrecupo)
            ├── shifts/route.ts                        # GET/POST/PUT apertura y cierre de caja ciego con hash SHA-256
            ├── audit/route.ts                         # GET bitácora inmutable de auditoría
            ├── cloudrun/route.ts                      # GET/POST estado y prueba de latencia del servicio Cloud Run
            ├── docs/route.ts                          # GET catálogo y lector de documentos con compatibilidad histórica
            ├── export/sheets/route.ts                 # GET exportación directa de planillas CSV compatibles con Excel
            ├── health/route.ts                        # GET healthcheck de disponibilidad del contenedor en puerto 8080
            └── ai/
                ├── assistant/route.ts                 # POST asistente operativo con Gemini 2.5 Flash
                ├── damage-inspection/route.ts         # POST análisis de daños vehiculares por imagen
                ├── lpr-ocr/route.ts                   # POST lectura automática de patentes chilenas/extranjeras
                ├── shift-audit/route.ts               # POST dictamen inteligente de descuadres de caja
                └── tools/route.ts                     # GET/POST herramientas auxiliares de IA
```

### 4.2 Contratos de Datos Principales (`src/types/index.ts`)

```typescript
export type VehicleType = 'auto' | 'camioneta' | 'moto';
export type TicketStatus = 'CREADO' | 'IN_PARKING' | 'PAGADO' | 'ENTREGADO' | 'ANULADO' | 'ACTIVO';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
export type IncidenceType = 'FUGA' | 'DESCUENTO' | 'SOBRECARGO' | 'MULTA_EXTRAVIO' | 'COBRO_PARCIAL' | 'ANULACION_ERROR';

export interface Ticket {
  id_ticket: string; // TKT-AAAAMMDD-T0X-XXXX o TKT-AAAAMMDD-T0X-XXXXO
  patente: string;
  is_foreign_plate?: boolean;
  vehiculo_tipo: VehicleType;
  slot_numero: number;
  slot_codigo?: string;
  fecha_hora_ingreso: string;
  fecha_hora_salida?: string;
  duracion_total_minutos?: number;
  monto_total_cobrado?: number;
  monto_original_calculado?: number;
  estado_ticket: TicketStatus;
  driver_phone?: string;
  driver_email?: string;
  metodo_pago?: PaymentMethod;
  monto_entregado?: number;
  vuelto?: number;
  tarifa_por_minuto: number;
  tiempo_gracia_minutos: number;
  is_offline?: boolean;
  sufijo_offline?: string;
  reprint_count: number;
  observaciones?: string;
  incidencia?: IncidenceType;
  descuento_aplicado?: number;
  recargo_multa?: number;
  pin_autorizador?: string;
}

export type SlotStatus = 'DISPONIBLE' | 'OCUPADO' | 'RESERVADO' | 'MANTENCION';
export type SlotType = 'NORMAL' | 'PMR' | 'ELECTRICO' | 'SOBRECUPO';

export interface ParkingSlot {
  id: number;
  codigo: string; // A-01 a A-15, B-16 a B-30, SC-01 a SC-05
  sector: 'A' | 'B' | 'SOBRECUPO';
  tipo: SlotType;
  estado: SlotStatus;
  ticket_actual?: Ticket;
}

export interface CashDenominations {
  b20000: number;
  b10000: number;
  b5000: number;
  b2000: number;
  b1000: number;
  monedas: number;
}

export interface Shift {
  id_turno: string;
  id_operador: string;
  nombre_operador: string;
  monto_inicial_caja: number;
  desglose_efectivo?: CashDenominations;
  monto_declarado_efectivo?: number;
  monto_declarado_tarjeta?: number;
  monto_declarado_transferencia?: number;
  monto_esperado_efectivo?: number;
  monto_esperado_tarjeta?: number;
  monto_esperado_transferencia?: number;
  monto_esperado_total?: number;
  diferencia?: number;
  estado: 'ABIERTO' | 'CERRADO';
  fecha_apertura: string;
  fecha_cierre?: string;
  total_tickets_emitidos: number;
  total_tickets_cobrados: number;
  total_fugas?: number;
  total_descuentos?: number;
  hash_sellado?: string;
}

export type AuditColorTag = 'VERDE' | 'ROJO' | 'AZUL' | 'GRIS';

export interface AuditLog {
  id_auditoria: string;
  accion: string;
  tipo_evento?: IncidenceType | 'CIERRE' | 'APERTURA' | 'REIMPRESION' | 'SISTEMA';
  color_tag?: AuditColorTag;
  id_usuario: string;
  nombre_usuario: string;
  fecha_hora: string;
  motivo?: string;
  autorizador_pin?: string;
  metadatos?: Record<string, any>;
}
```

---

## BLOQUE 5: DESCRIPCIÓN DETALLADA DE TODAS LAS CAPTURAS, VISTAS Y DIAGRAMAS

A continuación se describe exhaustivamente cada una de las **18 capturas visuales y pantallas interactivas** de la aplicación para que cualquier modelo de IA, desarrollador o herramienta de diseño pueda reconstruirlas con precisión absoluta:

---

### CAPTURA 01: Cockpit Operativo de Garita (`/`) — Pantalla Dividida Cero Scroll + Matriz 7×5
- **Ruta**: `/` ([`src/app/page.tsx`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/src/app/page.tsx))
- **Distribución Geométrica**: Pantalla completa 1080p sin barras de scroll, estructurada en 3 niveles verticales:
  1. **Navbar Superior (`h-16`, fondo `#0F172A`)**:
     - Izquierda: Logotipo monocromático `/cordano-logo.png` en contenedor cuadrado redondeado negro, título **`PARKOPS CORDANO`**, badge **`V4.0`** en borgoña translúcido y subtítulo `Serrano 447, Iquique • 30 Plazas`.
     - Centro: Pestañas rápidas con insignias de teclado (`POS Garita [F1]`, `Plano 30 Slots [F3]`, `Caja Ciega [F8]`, `Auditoría`, `Cloud Run`).
     - Derecha: Píldora de ocupación en vivo con punto verde pulsante (`25 Libres / 10 Ocupados`), botón `CCTV`, conmutador de modo `Garita / Táctil` y enlaces a `Admin ERP`, `SOP`, `Portal` y `Login`.
  2. **Área Central de Trabajo (Grid de 12 columnas, `max-w-[1600px]`)**:
     - **Columna Izquierda (`xl:col-span-7`)**:
       - Banner compacto oscuro de estado: *"Garita Serrano 447 • Turno Activo: SHF-ACTIVO • Cloud Run us-west1 • IndexedDB Offline-First"*.
       - **Tarjeta Superior — `PosCheckin` (Ingreso de Vehículo)**: Input gigante de patente con autofoco (`ABCD-12`), botón `[F4] Extranjera`, selector táctil de 3 tarjetas de vehículo (`Auto $35/min`, `Camioneta $45/min`, `Moto $25/min`), campos de teléfono (`+569`), correo con sugerencias de dominio al escribir `@` (`@gmail.com`, `@outlook.com`, etc.), selector opcional de slot y botón primario ancho en Borgoña `#80093A` **`Registrar Ingreso e Imprimir Ticket (Enter)`**.
       - **Tarjeta Inferior — `PosCheckout` (Cobro y Salida)**: Buscador universal con lupa para escaneo de código de barras lineal Code 128 o digitación de patente, chips de acceso rápido con las patentes actualmente estacionadas, desglose matemático en tiempo real (`Minutos Transcurridos`, `30m Gracia`, `Total a Pagar CLP`), botones de medio de pago (`Efectivo`, `Tarjeta`, `Transferencia`), calculadora de vuelto gigante en verde esmeralda y botones de excepción (`Descuento`, `Ticket Perdido +$10.000`, `Vehículo en Fuga`).
     - **Columna Derecha (`xl:col-span-5`, fija `h-[calc(100vh-140px)]`) — Componente `SerranoLayoutMap`**:
       - Cabecera con punto borgoña: **`PISTAS SERRANO 447 • 35 PLAZAS (7×5)`** y contador tabular `X/30 Plazas (Y% Ocupación)`.
       - **Matriz de 7 Filas × 5 Columnas**:
         - **Filas 1 a 3 (Sector A Oeste)**: Slots `A-01` al `A-15` (con iconos celestes de silla de ruedas PMR en `A-01`/`A-02` y rayo violeta EV en `A-03`).
         - **Filas 4 a 6 (Sector B Este)**: Slots `B-16` al `B-30`.
         - **Fila 7 Adicional (Sobrecupo Temporal)**: Slots `SC-01` al `SC-05` en tonos ámbar.
       - **Diseño de cada Tarjeta de Slot (`h-[66px]`, `rounded-xl`)**:
         - Si está **Libre**: Fondo verde esmeralda tenue (`bg-emerald-50/40`), código del slot arriba a la izquierda (`A-04`) y texto central `"Libre"`.
         - Si está **Ocupado**: Fondo pizarra oscuro (`bg-slate-900`), código del slot en gris, **patente en blanco negrita monoespaciada (`KJLP-34`)**, tiempo transcurrido abajo a la izquierda (`42m`) y **monto acumulado en verde esmeralda (`$1.470`)** abajo a la derecha.
  3. **Footer / Dock Inferior de Atajos (`bg-slate-900`)**: Barra horizontal fija con botones de teclado (`F1 Ingreso`, `F2 Cobro`, `F8 Caja Ciega / Arqueo`, `CCTV`, `Auditoría`) y leyenda `TKT Linear Code 128`.

---

### CAPTURA 02: Modal Informativo Puro de Plaza (Pop-up de Inspección de Slot)
- **Disparador**: Clic sobre cualquier tarjeta de las 35 plazas en `SerranoLayoutMap`.
- **Aspecto Visual**: Overlay a pantalla completa con desenfoque `bg-black/60 backdrop-blur-sm` y tarjeta central blanca (`rounded-3xl`, `max-w-sm`, animación `animate-scaleUp`).
- **Contenido**:
  - Encabezado con punto borgoña: **`Ficha Informativa • Plaza A-05`** y botón `✕`.
  - Bloque oscuro (`bg-slate-900 text-white rounded-2xl p-4 font-mono`) con:
    - `Patente Vehículo`: Badge grande destacado (ej. `ABCD-12`).
    - `Ticket ID`: Correlativo completo (`TKT-20260925-T01-0101`).
    - `Hora de Ingreso`: Formato `HH:mm`.
    - `Tiempo Transcurrido`: Texto en ámbar brillante (`48 minutos`).
    - `Monto Acumulado`: Cifra tabular en verde esmeralda (`$1.680 CLP`).
  - Si tiene teléfono registrado, muestra un recuadro gris claro inferior con el número `+569...`.
  - **Único Botón de Acción Primaria**: Botón ancho en Borgoña `#80093A` **`Ir a Cobro en Garita ->`**, que cierra el modal, inyecta la patente en `PosCheckout` y traslada el foco al cobro.

---

### CAPTURA 03: Modal de Apertura de Turno de Garita
- **Disparador**: Automático si el turno está cerrado, o manual al iniciar jornada de operador.
- **Aspecto Visual**: Modal flotante central (`rounded-3xl`, `max-w-md`) sobre fondo difuminado `backdrop-blur-md`.
- **Contenido**:
  - Icono de reloj sobre fondo borgoña suave y título **`Apertura de Turno Garita`** (*"Verificación de fondo de sencillo para iniciar el Punto de Venta"*).
  - Input de nombre del operador asignado (`Carlos Morales (Operador Garita)`).
  - Input numérico grande `font-mono tabular-nums` para **Fondo Inicial de Efectivo en Caja (CLP)** prellenado en `$50.000`.
  - Dos tarjetas informativas secundarias lado a lado: `Saldo Tarjeta: $0 CLP` y `Saldo Transferencia: $0 CLP`.
  - Input de **PIN de Confirmación (4 Dígitos)** centrado con máscara `••••`.
  - Botón principal Borgoña: **`Confirmar Apertura e Iniciar Punto de Venta ->`**.

---

### CAPTURA 04: Previsualización de Ticket Térmico 80mm (Code 128 + WhatsApp)
- **Ubicación**: Se despliega en `PosCheckin` inmediatamente después de registrar el ingreso de un vehículo.
- **Aspecto Visual**: Simulación fotorrealista de cinta de papel térmico blanco de 80mm con bordes dentados/sombra, tipografía monoespaciada negra sobre blanco:
  - Encabezado centrado: `CORDANO INVERSIONES INMOBILIARIAS LTDA.` / `SERRANO 447 - IQUIQUE`.
  - Patente en tamaño extra grande (`2xl`), tipo de vehículo, slot asignado, fecha/hora de entrada y tarifa por minuto congelada.
  - Si fue emitido sin internet, resalta el badge **`MODO CONTINGENCIA OFFLINE (SUFIJO O)`**.
  - Representación gráfica de las barras verticales del **Código Lineal Code 128** con el código legible debajo (`TKT-20260925-T01-0102`).
  - Pie legal de advertencia sobre multa de `$10.000 CLP` por extravío y teléfono WhatsApp de garita.
  - Botones inferiores: **`Imprimir Ticket Térmico`** (invoca `window.print()`) y **`Enviar Comprobante por WhatsApp`** (abre enlace `wa.me` preformateado).

---

### CAPTURA 05: Modal de Excepciones Antifraude con PIN (Descuento, Ticket Perdido y Fuga)
- **Ubicación**: Emergente desde `PosCheckout` al pulsar *Descuento*, *Ticket Perdido* o *Reportar Fuga*.
- **Aspecto Visual**: Modal de seguridad con borde superior de alerta (Ámbar para descuento, Rojo Carmesí para extravío o fuga).
- **Contenido**:
  - Explicación de la regla de negocio: *"Esta acción quedará grabada de forma inmutable en la bitácora de auditoría y requerirá visación del Administrador antes del cierre de turno"*.
  - Si es **Descuento**: Campo para monto a descontar en CLP + PIN de operador (`1234`) + Textarea obligatorio para justificación escrita (`>10 caracteres`).
  - Si es **Ticket Perdido**: Aplica automáticamente el recargo fijo de `+$10.000 CLP` sobre el tiempo calculado por patente y solicita PIN autorizador.
  - Si es **Vehículo en Fuga**: Registra salida forzosa con cobro `$0` para liberar la plaza y marca el evento con etiqueta **ROJA** en la auditoría sin descuadrar el efectivo físico del cajero.

---

### CAPTURA 06: Cierre de Caja Ciego (`F8`), Conteo de Billetes y Reporte Z Duplicado
- **Componente**: [`src/components/ShiftModal.tsx`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/src/components/ShiftModal.tsx)
- **Aspecto Visual**: Panel ancho dividido en 2 etapas:
  1. **Etapa de Declaración Ciega (Antes de cerrar)**:
     - El sistema **oculta por completo** los montos esperados.
     - Grilla de conteo de billetes chilenos con cálculo automático de subtotales en vivo:
       - Billetes de `$20.000` × cantidad = subtotal
       - Billetes de `$10.000` × cantidad = subtotal
       - Billetes de `$5.000` × cantidad = subtotal
       - Billetes de `$2.000` × cantidad = subtotal
       - Billetes de `$1.000` × cantidad = subtotal
       - Total en `Monedas` (CLP)
     - Inputs para `Total Vouchers Tarjeta (Transbank/Getnet)` y `Total Transferencias`.
     - Campo de PIN de Operador de 4 dígitos y botón **`Ejecutar Cierre Ciego y Sellar Turno`**.
  2. **Etapa Post-Arqueo y Reporte Z**:
     - Tabla comparativa de 3 columnas: **`Monto Esperado Sistema`** vs **`Monto Físico Declarado`** = **`Diferencia / Cuadre`** (resaltado en Verde si es `$0`, Azul si hay sobrante, Rojo si hay faltante).
     - Recuadro criptográfico con el **Sello SHA-256 de 64 caracteres hexadecimales** y botón para copiar hash.
     - Modal de **Reporte Z Térmico 80mm Duplicado** listo para imprimir (Copia Operador + Copia Sobre de Remesa Administrador).

---

### CAPTURA 07: Lobby / App Launcher del Administrador estilo Odoo & macOS (`/admin`)
- **Ruta**: `/admin` ([`src/app/admin/page.tsx`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/src/app/admin/page.tsx))
- **Aspecto Visual**:
  - Barra superior oscura con logo Cordano, insignia **`ERP V4.0`**, botón directo verde **`Excel / Sheets`** (descarga CSV en 1 clic) y enlace a **`Garita POS`**.
  - Cabecera limpia: *"Panel de Módulos • Cordano Inversiones Inmobiliarias"*.
  - **Cuadrícula de 8 Aplicaciones estilo Squircles macOS (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5`, tarjetas `rounded-3xl h-44`)**:
    1. **Garita Operativa (POS)**: Icono auto azul celeste, badge verde `"En Vivo"`.
    2. **Monitoreo & Plazas**: Icono gráfico borgoña, badge tabular `"X/30 Plazas"`.
    3. **Aprobaciones con PIN**: Icono llave ámbar, badge pulsante `"2 Pendientes"`.
    4. **Turnos & Conciliación**: Icono reloj esmeralda, badge `"Arqueo Ciego"`.
    5. **Reportes & Auditoría**: Icono planilla índigo, badge `"Export .xlsx"`.
    6. **Configuración ERP**: Icono engranaje pizarra, badge `"Tarifas & WhatsApp"`.
    7. **CCTV Serrano 447**: Icono cámara carmesí, badge `"CCTV 1080p"`.
    8. **Manuales & Soporte**: Icono libro violeta, badge `"SOP Fases 1-6"`.

---

### CAPTURA 08: Subvistas del Dashboard Ejecutivo (`/admin` — Monitoreo, Aprobaciones y Turnos)
- **Navegación Superior**: Al entrar a cualquier módulo interno de `/admin`, aparece en la barra superior el botón **`[ ⊞ Módulos ]`** para volver al Launchpad en 1 clic y un **Selector Desplegable (`<select>`)** para cambiar instantáneamente entre:
  - **`📊 Monitoreo y Plazas`**: 4 tarjetas KPI superiores (`Recaudación Turno Actual $184.500 CLP`, `Ocupación Serrano 447`, `Desglose Efectivo 67% vs Digital 33%`, `Cadena SHA-256 Íntegra`) y grilla panorámica de las 35 plazas.
  - **`🔑 Cola de Aprobaciones`**: Tabla ejecutiva con las excepciones registradas por el operador (`JKLP34 Cobro Parcial`, `ABCD12 Extravío`) y botón Borgoña **`Visar con PIN`**, que despliega el modal de autorización con PIN de Administrador (`9999`).
  - **`💼 Turnos y Arqueo Ciego`**: Tarjetas históricas de turnos cerrados comparando turnos cuadrados en verde (`Diferencia: $0`) frente a turnos con faltante en rojo (`Faltante -$5.000`).

---

### CAPTURA 09: Hub Central de Operaciones (`/hub`)
- **Ruta**: `/hub` ([`src/app/hub/page.tsx`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/src/app/hub/page.tsx))
- **Aspecto Visual**: Interfaz oscura *Liquid Glass* con imagen de fondo ambiental `/hub-bg.jpg` difuminada, reloj oficial de Chile (`America/Santiago`) en tiempo real segundo a segundo, barra de progreso de ocupación del recinto y tarjetas agrupadas en 3 categorías: *Operación & Garita*, *Supervisión & Finanzas* y *Configuración & Soporte*, cada una con su atajo de teclado asignado.

---

### CAPTURA 10: Submódulo de Servicios Especiales en Paralelo (`/convenios`)
- **Ruta**: `/convenios` ([`src/app/convenios/page.tsx`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/src/app/convenios/page.tsx))
- **Aspecto Visual**:
  - Tarjetas KPI de contratos activos (`Estudio Jurídico Serrano Ltda.`, `Consulado General de Italia`, `Transportes Marítimos del Norte`), facturación mensual recurrente y plazas reservadas (`A-02`, `B-18`, `B-25`).
  - Tabla filtrable con estado de pago (`AL_DIA` en verde, `PENDIENTE` en ámbar, `VENCIDO` en rojo) y modal emergente **`+ Nuevo Convenio / Servicio Noche`** que bloquea la plaza asignada sin mezclar sus ingresos con la caja rotativa por minuto.

---

### CAPTURA 11: Suite de Reportes Financieros y Exportación Excel (`/reportes`)
- **Ruta**: `/reportes` ([`src/app/reportes/page.tsx`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/src/app/reportes/page.tsx))
- **Aspecto Visual**:
  - Selector de período (`Hoy`, `Últimos 7 Días`, `Mes Actual`, `Rango Personalizado`).
  - Botón destacado verde esmeralda **`Descargar Excel / CSV (Google Sheets)`** y botón **`Previsualizar Reporte Z Térmico (80mm)`**.
  - Desglose visual con barras de proporción por medio de pago (`Efectivo`, `Tarjeta Transbank/Getnet`, `Transferencia Bancaria`) y tabla detallada de transacciones liquidadas.

---

### CAPTURA 12: Motor de Configuración ERP en 4 Pestañas (`/configuracion`)
- **Ruta**: `/configuracion` ([`src/app/configuracion/page.tsx`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/src/app/configuracion/page.tsx))
- **Aspecto Visual**: Navegación por 4 pestañas limpias estilo Preferencias del Sistema de macOS:
  1. **Tarifas & Tiempo de Gracia**: Inputs numéricos para tarifa por minuto de Auto (`$35`), Moto (`$25`), Camioneta (`$45`), minutos de gracia iniciales (`30 min`) y multa por ticket extraviado (`$10.000 CLP`), con nota de versión congelada al ingreso.
  2. **Datos Empresa & Ticket WhatsApp**: Razón social (`Cordano Inversiones Inmobiliarias Ltda.`), RUT, dirección (`Serrano 447, Iquique`), número de WhatsApp impreso en el ticket térmico y leyenda legal configurable.
  3. **Usuarios & PINs de Seguridad**: Administración rápida de operadores y supervisores.
  4. **Parámetros de Caja & Sincronización**: Fondo fijo sugerido de apertura (`$50.000 CLP`), tolerancia de descuadre y URL del microservicio Cloud Run.

---

### CAPTURA 13: Gestión de Usuarios, Roles y Enrolamiento (`/admin/usuarios` y `/registro`)
- **Rutas**: `/admin/usuarios` y `/registro`
- **Aspecto Visual**:
  - Listado de personal activo con rol (`OPERADOR_GARITA` vs `ADMIN_ERP`), turno asignado, estado de cuenta y visor/regenerador de PIN individual de 4 dígitos.
  - Formulario de alta de nuevo operador con asignación de sede (`Serrano 447, Iquique`) y validación de seguridad.

---

### CAPTURA 14: Centro de Monitoreo CCTV Serrano 447 y Cámara LPR (`/cctv`)
- **Ruta**: `/cctv` ([`src/app/cctv/page.tsx`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/src/app/cctv/page.tsx))
- **Aspecto Visual**:
  - Grilla de monitores oscuros 16:9 con indicador rojo parpadeante `LIVE • 1080p @ 30fps`:
    - `CAM 01 • ACCESO SERRANO 447 (LPR ACTIVO)` con retícula verde de enfoque de matrícula.
    - `CAM 02 • PATIO CENTRAL SECTOR A (01–15)`.
    - `CAM 03 • PATIO CENTRAL SECTOR B (16–30)`.
    - `CAM 04 • GARITA Y CAJA DE COBRO`.
  - Especificaciones técnicas de streaming `WebRTC / HLS / RTSP` e integración con el endpoint `/api/ai/lpr-ocr` (Gemini Vision).

---

### CAPTURA 15: Landing Page Minimalista de Enlace Rápido (`/landing`)
- **Ruta**: `/landing` ([`src/app/landing/page.tsx`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/src/app/landing/page.tsx))
- **Aspecto Visual**:
  - Header limpio con logo `/cordano-logo.png`, nombre `CORDANO INVERSIONES` y botón `Iniciar Sesión`.
  - **Hero Central**: Badge borgoña `"Portal Operativo Interno"`, título principal **`Gestión Integral de Estacionamientos Cordano Inversiones Inmobiliarias`** y **2 Botones Gigantes de Acceso Directo**:
    1. Tarjeta Borgoña (`#80093A`): **`Acceso Garita Operativa`** (*Punto de Venta, Check-in y Cobro -> Ingresar al POS*).
    2. Tarjeta Pizarra Oscura (`#0F172A`): **`Acceso Administración`** (*Lobby de Módulos, Arqueos y Excel -> Ingresar al ERP*).
  - **Bloque Medio**: 3 tarjetas minimalistas explicando la *Garita Keyboard-First*, el *Arqueo Ciego de Caja* y la *Exportación en 1 Clic*.
  - **Bloque Inferior Protegido**: Sección *"Documentación Técnica & Manuales de Servicio (SOP)"* con 4 tarjetas con icono de candado (`Guía del Garitero`, `Manual Administrador`, `Preguntas Frecuentes`, `Especificaciones Cloud`). Al hacer clic en cualquiera de ellas, se abre un **Modal de Autenticación Protegida** que exige el PIN de Operador (`1234`) o la Contraseña de Administrador (`admin123`) antes de redirigir al contenido.

---

### CAPTURA 16: Portal de Login Unificado (`/login`) y Recuperación OTP (`/recuperar-password`)
- **Rutas**: `/login` y `/recuperar-password`
- **Aspecto Visual**:
  - Tarjeta central estilo macOS (`rounded-3xl`, `max-w-md`) con el logotipo oficial `/cordano-logo.png` en marco negro cuadrado redondeado.
  - **Selector de Perfil Segmentado (Tabs)**:
    - Pestaña **`Operador de Garita`**: Prellena credenciales operativas, solicita PIN de 4 dígitos (`1234`) y al enviar redirige directamente a `/` (Garita POS).
    - Pestaña **`Administrador`**: Prellena credenciales ejecutivas, solicita PIN supervisor (`9999`) y al enviar redirige directamente al App Launcher en `/admin`.
  - Enlace inferior a `/recuperar-password` con flujo de verificación por código OTP de 6 dígitos.

---

### CAPTURA 17: Módulo Protegido de Documentación SOP y Repositorio Documental (`/documentacion` y `/faq`)
- **Rutas**: `/documentacion` ([`src/app/documentacion/page.tsx`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/src/app/documentacion/page.tsx)) y `/faq`
- **Aspecto Visual**:
  - Layout de 12 columnas con barra lateral izquierda (`lg:col-span-3`) de 5 secciones y panel de lectura derecho (`lg:col-span-9`):
    1. **Guía del Garitero (Fases 1–6)**: Cuadrícula de atajos `F1`, `F2`, `F8`, `Esc` y tarjetas paso a paso desde la apertura del turno hasta el cambio de cajero.
    2. **Manual Administrador**: Instrucciones de visación de excepciones con PIN, exportación CSV UTF-8 para Excel y principio *Single-Writer*.
    3. **FAQ de Incidencias**: Protocolos exactos ante pérdida de ticket (`+$10.000 CLP`), corte de internet (modo offline con sufijo `O`) y vehículos en fuga.
    4. **Arquitectura Cloud Run**: Ficha técnica oscura con los parámetros del proyecto GCP `gen-lang-client-0862587160`.
    5. **Repositorio de Docs & Archivo (`V2.0`)**: Conectado en vivo con `/api/docs`. Muestra con badges verdes **`OFICIAL V2.0`** los documentos vigentes (`PRD_SISTEMA_DE_PARKING.md`, `PARKOPS_ESPECIFICACIONES_TECNICAS_V2.md`, etc.) y con badges ámbar **`ARCHIVADO`** las 8 versiones históricas anteriores (`[ARCHIVADO]_*.md`). Al hacer clic en cualquier tarjeta, se abre un **Lector Modal de Markdown a pantalla completa** con el contenido íntegro del archivo.

---

### CAPTURA 18: Diagramas Interactivos de Arquitectura de Base de Datos y Flujo de Decisiones
- **Archivos en `/docs` y `/public`**:
  - `docs/cordano-database-architecture.html` y sus 4 capturas verificadas:
    - `cordano-database-architecture.visual-check.1440x900.dark.png`
    - `cordano-database-architecture.visual-check.1440x900.light.png`
    - `cordano-database-architecture.visual-check.2048x1320.dark.png`
    - `cordano-database-architecture.visual-check.2048x1320.light.png`
  - `public/cuestionario-grillme-flow.html` y sus 4 capturas verificadas en `docs/diagrams/`:
    - `cuestionario-grillme-flow.visual-check.1440x900.dark.png`
    - `cuestionario-grillme-flow.visual-check.1440x900.light.png`
    - `cuestionario-grillme-flow.visual-check.2048x1320.dark.png`
    - `cuestionario-grillme-flow.visual-check.2048x1320.light.png`
- **Descripción Visual de las Capturas de Diagramas**:
  - Lienzos vectoriales SVG interactivos con controles de zoom, paneo, conmutador de tema Claro/Oscuro y exportación a PNG/SVG.
  - **Diagrama de Base de Datos**: Muestra las 11 entidades relacionales (`locations`, `users`, `shifts`, `parking_slots`, `tariffs`, `vehicles`, `stays_tickets`, `payments`, `special_agreements`, `exception_approvals`, `audit_logs`) organizadas en capas con claves primarias UUID, claves foráneas multi-sede (`location_id`) y trazado de relaciones sin cruces.
  - **Diagrama de Flujo Grill-Me**: Representa el árbol completo de decisiones operativas desde la llegada del vehículo a Serrano 447 hasta la conciliación bancaria y exportación contable del Administrador.

---

## BLOQUE 6: COMANDOS DE INICIALIZACIÓN, COMPILACIÓN Y DESPLIEGUE

```bash
# 1. Instalar dependencias exactas
npm install

# 2. Ejecutar entorno de desarrollo local (http://localhost:3000)
npm run dev

# 3. Validar compilación estática y de tipos de producción (26 rutas, 0 errores)
npm run build

# 4. Desplegar microservicio independiente en Google Cloud Run (us-west1, puerto 8080)
gcloud run deploy cordano-pms-v1 \
  --source . \
  --project gen-lang-client-0862587160 \
  --region us-west1 \
  --allow-unauthenticated \
  --port 8080
```
