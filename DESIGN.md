# CORDANO PMS — Documento Maestro de Diseño, Arquitectura y Especificación Funcional

> **Documento de Referencia Técnica y Gestión de Proyecto**  
> **Sistema**: CORDANO PMS (Cordano Parking Ops — V1)  
> **Fecha de Consolidación**: Septiembre 2026  
> **Autor**: Arquitectura de Software & Gestión de Proyectos  
> **Propósito**: Base técnica, funcional y de negocio para el desarrollo e implementación del nuevo frontend desde cero (excluyendo código visual previo).

---

## 1. Resumen de Requerimientos y Contexto

### 1.1. Contexto Operativo y Geográfico
- **Entorno**: Estacionamiento comercial urbano de rotación continua y abonados mensuales en Chile (ej. Serrano 447, Iquique, Región de Tarapacá).
- **Moneda oficial**: Peso Chileno (`CLP`, `$`), sin decimales, con desglose físico exacto del cono monetario vigente.
- **Huso Horario de Referencia**: `America/Santiago` (UTC-3 / UTC-4 según horario oficial de Chile).
- **Capacidad Instalada**: 30 a 32 cajones físicos (slots), divididos estratégicamente en tres sectores:
  1. *Zona A (Techado)*: Cupos cubiertos de alta demanda.
  2. *Zona B (General)*: Patios abiertos de rotación general.
  3. *Zona C (Preferencial)*: Cupos para personas con movilidad reducida, embarazadas, tercera edad o convenios especiales.

### 1.2. Objetivos Principales del Sistema
1. **Velocidad de Pista y Operación en Cabina (Cero Fricción)**:
   - Proporcionar al cajero/operador una herramienta táctil, rápida y sin distracciones para registrar entradas en menos de 5 segundos y cobrar salidas en menos de 10 segundos.
2. **Blindaje Financiero y Cierre de Turno Ciego**:
   - Erradicar la manipulación de caja obligando al operador a declarar el dinero físico sin conocer el monto teórico acumulado por el sistema.
3. **Trazabilidad y Auditoría Forense**:
   - Registro inmutable de cada descuento, anulación, fuga forzada o retiro manual, respaldado por PIN de supervisor y sellos criptográficos.
4. **Supervisión Remota Multiplataforma**:
   - Acceso en tiempo real para dueños y administradores mediante la nube (Google Cloud Firestore) y planillas ejecutivas (Google Sheets).

### 1.3. Reglas de Negocio Esenciales

#### A. Tarifación y Tolerancia
- **Período de Gracia (Grace Period)**:
  - Primeros **15 minutos** (configurable por administración). Si el vehículo ingresa y sale dentro de este lapso, el costo es `$0 CLP`.
- **Fracción y Minuto**:
  - Pasado el período de gracia, se cobra el tiempo total transcurrido por bloques o minuto fraccionado según el tarifario vigente por tipo de vehículo (Automóvil, Camioneta/SUV, Motocicleta, Furgón).
- **Recargos Especiales**:
  - *Nocturno*: Aplicable a estadías que cruzan el umbral de las 22:00 hrs.
  - *Fin de Semana / Feriado*: Recargo porcentual sobre la base estándar.
- **Ticket Perdido**:
  - Cobro fijo punitivo predefinido (ej. `$10.000 CLP`), exigiendo la patente del vehículo y la validación de un supervisor.

#### B. Control de Acceso y Anti-Passback
- **Validación de Patente Chilena**:
  - Admisión de formatos vigentes: Nuevo (4 letras + 2 números, ej. `BB·CL·10`) y Antiguo (2 letras + 4 números, ej. `AB·12·34`). Normalización automática a mayúsculas sin guiones ni puntos en base de datos.
- **Regla Anti-Passback**:
  - Queda estrictamente prohibido emitir un nuevo ticket para una patente que ya figure en estado `activo` (dentro del recinto). Se debe arrojar alerta bloqueante con el número de ticket existente.

#### C. Convenios Comerciales y Abonados Mensuales
- **Suscripciones**: Registro de vehículos autorizados por contrato mensual (empresas, bancos, trabajadores locales, vecinos).
- **Semáforo de Vigencia**:
  - `Al día` (Verde): Contrato vigente. Tarifa al salir es `$0 CLP` (o tarifa preferencial pactada).
  - `Por vencer` (Ámbar / Naranja): Faltan 5 a 7 días para el vencimiento de la mensualidad. El sistema alerta al operador para que gestione el cobro de la renovación en pista.
  - `Vencido` (Rojo): Plazo caducado. El vehículo pierde el beneficio y el sistema le liquida la estadía como cliente particular por minuto.
- **Renovación en Cabina**: Posibilidad de cobrar el mes siguiente en la misma caja, emitiendo comprobante e impactando el turno.

#### D. Arqueo Ciego y Cuadratura de Turno (Blind Close)
- **Definición de Cierre Ciego**:
  - Al cerrar turno, el cajero **NO** ve los montos calculados por el sistema (ni recaudación teórica, ni desglose por método de pago).
  - El cajero debe contar y declarar:
    1. Efectivo físico desglosado por denominación chilena (Billetes: $20.000, $10.000, $5.000, $2.000, $1.000; Monedas: $500, $100, $50, $10).
    2. Total sumado de vouchers POS (Débito y Crédito).
    3. Total sumado de comprobantes de Transferencia Electrónica.
- **Tolerancia Estricta de $2.000 CLP**:
  - $|\text{Efectivo Declarado} - \text{Efectivo Esperado}| \le \$2.000\text{ CLP} \rightarrow$ Turno Cuadrado / Aprobado.
  - Diferencia superior a $\pm\$2.000\text{ CLP} \rightarrow$ **Descuadre Crítico (Bandera Roja)**:
    - Exige obligatoriamente:
      1. Justificación escrita y detallada del cajero.
      2. Autorización y presencia de **PIN de Supervisor**.
      3. Nombre del supervisor que valida la recepción de la gaveta.
- **Custodia de Vehículos en Arrastre (Handover)**:
  - El acta de cierre registra el inventario exacto de autos que quedan físicamente dentro del patio al momento del cambio de turno, traspasando la responsabilidad al siguiente operador.
- **Doble Firma del Acta**:
  - Generación de **Copia 1 (Caja / Recinto)** y **Copia 2 (Operador Saliente)**, con generación de reporte en PDF formal.

#### E. Mermas y Fugas (Salidas Forzadas)
- En caso de que un conductor rompa barrera o escape sin pagar, el operador no puede eliminar el ticket:
  - Debe seleccionar la opción **"Registrar Fuga / Salida Forzada"**.
  - Exige PIN de supervisor y motivo del incidente.
  - El ticket pasa a estado `anulado_fuga`, calcula el monto no percibido para auditoría, pero no se suma como dinero en caja, manteniendo el arqueo transparente.

#### F. Movimientos Manuales de Caja
- **Retiro / Sangría**: Extracción de excedentes de efectivo desde la caja hacia la caja fuerte de seguridad. Reduce el efectivo esperado del cajero.
- **Gasto Menor**: Compra imprevista autorizada (insumos de aseo, rollo térmico). Reduce el efectivo esperado.
- **Ingreso Manual**: Inyección de sencillo/cambio a la gaveta. Aumenta el efectivo esperado.
- Todos generan comprobante numerado (`VOUCHER-XXXX`).

#### G. Checklist de Inicio de Turno
- 5 verificaciones físicas obligatorias:
  1. Integridad del perímetro del recinto.
  2. Conteo físico de autos en arrastre vs. sistema.
  3. Prueba de barrera y semáforos.
  4. Revisión y enfoque de cámaras de seguridad.
  5. Stock de papel térmico en impresoras y aseo en área de cobro.
- Mecanismo *Snooze*: Permite postergar por 15 minutos en caso de flujo vehicular inmediato.

### 1.4. Perfiles y Roles de Usuario (RBAC)
1. **Operador / Cajero**:
   - Registrar entradas y salidas.
   - Cobrar en efectivo, POS o transferencia.
   - Solicitar movimientos de caja y renovar convenios.
   - Ejecutar el checklist de apertura y el arqueo ciego final.
   - *Restricciones*: No puede modificar tarifas, no puede ver el monto esperado de caja, no puede anular tickets sin PIN de supervisor.
2. **Supervisor de Turno**:
   - Autorizar descuentos manuales superiores a la norma.
   - Autorizar salidas forzadas o fugas vehiculares.
   - Validar y autorizar descuadres de caja que superen los $\pm\$2.000\text{ CLP}$.
   - Autorizar sangrías y retiros a bóveda.
3. **Administrador General / Propietario**:
   - Modificar tarifas, períodos de gracia y recargos.
   - Crear, editar o dar de baja contratos de convenios.
   - Consultar la bitácora completa de auditoría SHA-256.
   - Configurar y sincronizar la conexión a Google Sheets y Google Cloud.

---

## 2. Estado Actual de la Aplicación

### 2.1. Nivel de Madurez del Proyecto
- **Fase**: Prototipo Funcional Completo (MVP Avanzado con lógica de negocio validada en el cliente).
- **Backend / Conectividad**: Vinculado con el proyecto de Google Cloud `gen-lang-client-0862587160` (Proyecto Nº `349577440002`).
- **Base de Datos Operativa**: Integrado con **Firebase Firestore** con colecciones y reglas de seguridad desplegadas.
- **Persistencia de Respaldo**: Doble capa (*dual-write*) activa: guarda en Firestore y en `localStorage` del navegador para contingencias fuera de línea.
- **Reportería Tabular**: Módulo de exportación y sincronización con **Google Sheets API v4** preparado con OAuth 2.0.

### 2.2. Componentes de Lógica Operativa Validados
- Motor de cálculo de estadías chilenas (minuto fraccionado, gracia de 15m, recargos).
- Validador y detector de patentes duplicadas (anti-passback).
- Formulario de arqueo ciego con calculadora de denominación monetaria chilena.
- Semáforo de días restantes para convenios y abonados.
- Generador de comprobantes y actas de cierre en formato imprimible/PDF (usando `jspdf`).
- Bitácora de eventos con severidades clasificadas (`info`, `warning`, `critical`).

---

## 3. Copywriting y Frases Clave

El tono del sistema debe ser **ejecutivo, preciso, sobrio y enfocado en la seguridad operativa**. A continuación, los textos y frases normadas:

### 3.1. Landing Page e Inicio de Sesión
- **Título Institucional**: `"CORDANO PMS — Sistema de Control y Gestión Operacional"`
- **Subtítulo**: `"Control de acceso vehicular, tarifación en tiempo real y auditoría financiera ciega."`
- **Frase de Autenticación**: `"Ingrese sus credenciales operativas o PIN de autorización para habilitar el terminal de cobro."`
- **Badges de Confianza**:
  - `"Terminal Certificado — Recinto Serrano 447"`
  - `"Enlace Activo con Google Cloud Platform"`
  - `"Auditoría Continua con Sellado Digital"`

### 3.2. Pistas de Entrada y Salida (Operación Diaria)
- **Ingreso**:
  - Botón Principal: `"Registrar Ingreso de Vehículo"`
  - Etiqueta de Patente: `"Patente del Vehículo (Formato Nacional)"`
  - Placeholder: `"Ej: BBCL10 o AB1234"`
  - Asignación de Espacio: `"Asignar Cajón Inmediato (Opcional)"`
  - Anti-Passback Error: `"Alerta Anti-Passback: La patente [PATENTE] ya cuenta con un ingreso activo registrado a las [HORA] en el ticket [ID]."`
  - Confirmación: `"Ticket emitido exitosamente. Entrada registrada en tiempo cero."`
- **Cobro y Salida**:
  - Botón de Liquidación: `"Liquidar Estadía y Liberar Cupo"`
  - Frase de Gracia: `"Estadía cubierta bajo los 15 minutos de tolerancia (Costo: $0 CLP)."`
  - Vuelto / Cambio: `"Cambio a Devolver al Conductor: $[MONTO] CLP"`
  - Voucher POS: `"Ingrese últimos 4 dígitos o folio del comprobante Transbank/Getnet"`
  - Ticket Extraviado: `"Aplicar Tarifa Plana por Ticket Extraviado (Requiere Patente)"`
  - Fuga: `"Declarar Fuga Vehicular / Evasión de Barrera"`

### 3.3. Arqueo Ciego y Fin de Turno
- **Apertura de Turno**:
  - `"Declaración de Fondo Inicial de Sencillo (Gaveta de Cambio)"`
- **Cierre Ciego**:
  - Título: `"Arqueo Ciego de Caja — Rendición Operacional"`
  - Advertencia al Cajero: `"Cuente físicamente el dinero de la gaveta. Ingrese el número exacto de billetes y monedas. El sistema contrastará el saldo final de forma privada."`
  - Regla de Tolerancia: `"Tolerancia máxima permitida sin justificación: ±$2.000 CLP."`
  - Cuadrado (Verde): `"Arqueo Conforme: La caja cuadra dentro de la tolerancia operativa permitida."`
  - Descuadre (Rojo): `"Alerta de Descuadre Crítico: Se detectó una diferencia de $[MONTO] CLP. Se requiere justificación formal del cajero y validación mediante PIN de supervisor para procesar el cierre."`
- **Acta de Traspaso**:
  - `"Acta Oficial de Cierre de Turno y Traspaso de Custodia de Vehículos"`
  - `"Copia 1: Respaldo de Administración y Caja"`
  - `"Copia 2: Comprobante de Recepción del Operador"`

---

## 4. Árbol de Navegación (Sitemap)

Estructura jerárquica de la plataforma para la nueva arquitectura:

```
CORDANO PMS
│
├── / (Acceso Público & Seguridad)
│   ├── /login (Inicio de sesión por Operador / PIN / Google Auth)
│   └── /terminal-lock (Pantalla de bloqueo por inactividad de cabina)
│
├── /operacion (Vistas del Operador de Cabina — Rol: Cajero/Operador)
│   ├── /operacion/pos (Punto de Venta Unificado: Entrada rápida + Cobro de salida)
│   ├── /operacion/patio (Mapa interactivo de slots y asignación física)
│   ├── /operacion/turnos (Apertura de turno, movimientos manuales de caja, sangrías)
│   ├── /operacion/cierre-ciego (Módulo de conteo físico y cuadratura de turno)
│   └── /operacion/checklist (Checklist interactivo de 5 puntos con snooze de 15m)
│
├── /gestion (Vistas de Gestión y Supervisión — Rol: Supervisor/Administrador)
│   ├── /gestion/dashboard (Métricas gerenciales: recaudación, rotación, ocupación)
│   ├── /gestion/convenios (Padrón de abonados, contratos de flotas, renovaciones)
│   ├── /gestion/tarifario (Configuración de tarifas, minutos de gracia y penalidades)
│   ├── /gestion/auditoria (Bitácora inmutable de eventos, intentos de acceso y fugas)
│   └── /gestion/base-datos (Explorador relacional de tablas y sincronizador a Google Sheets)
│
└── /reportes (Emisión y Exportación)
    ├── /reportes/acta-turno/:id (Visualizador e impresor PDF de acta doble)
    └── /reportes/consolidado-diario (Resumen para gerencia y contabilidad)
```

---

## 5. Análisis y Estructura de Diseño

### 5.1. Filosofía de Diseño: "Ergonomía de Cabina y Cero Slop"
- **Entorno Hostil de Operación**: Las casetas de estacionamiento enfrentan reflejos de sol diurno, pantallas táctiles pequeñas o sucias, e iluminación artificial deficiente de noche.
- **Directrices Visuales**:
  - **Alto Contraste Estricto**: Nunca usar grises claros sobre fondos blancos. WCAG AA mínimo 4.5:1.
  - **Elementos Táctiles Grandes**: Objetivos de toque (*touch targets*) de al menos 48px a 56px para botones clave en pantalla POS.
  - **Sin Adornos Superfluos**: Prohibidos los degradados arbitrarios de color morado/azul, sombras pesadas difuminadas y efectos de vidrio reflectante (*glassmorphism*). Priorizar superficies sólidas y limpias.
  - **Doble Tipografía Semántica**:
    - Tipografía de lectura e interfaz: `Manrope` o `Plus Jakarta Sans` (humana, nítida y geométrica).
    - Tipografía numérica, patentes y dinero: `JetBrains Mono` (monoespaciada, perfecta para alineación vertical de cifras en columnas).

### 5.2. Paleta de Colores Corporativa
- **Color Institucional Primario (Borgoña Cordano)**: `#80093A`
  - Utilizado en: Botones de acción primaria, encabezados institucionales, bordes de selección activa.
- **Primario Hover / Activo**: `#A52C55`
- **Fondo de Aplicación (Off-White Calmante)**: `#F8F9FA` (reduce el encandilamiento).
- **Superficie de Tarjetas y Módulos**: `#FFFFFF` con borde fino `#E2E2E4`.
- **Texto Principal**: `#1D1D1F` (negro carbón profundo).
- **Texto Secundario**: `#515154` (gris grafito legible).
- **Semántica Operativa**:
  - *Verde Esmeralda* (`#059669` / Fondo `#ECFDF5`): Slot disponible, cobro exitoso, turno cuadrado, convenio al día.
  - *Rojo Carmesí* (`#DC2626` / Fondo `#FEF2F2`): Slot ocupado, descuadre superior a $2.000, fuga reportada, convenio vencido.
  - *Ámbar Dorado* (`#D97706` / Fondo `#FFFBEB`): Período de gracia activo, convenio por vencer, advertencia de supervisor.
  - *Azul Pizarra* (`#2563EB` / Fondo `#EFF6FF`): Slot preferencial / personas con discapacidad, convenio corporativo.

### 5.3. El Widget HUD Persistente (Head-Up Display)
Un componente esencial de la interfaz es la **Barra Flotante Inferior de Turno**:
- Permanece visible en todo momento para el cajero sin importar la página en la que se encuentre.
- Muestra en tiempo real:
  1. *Reloj vivo*: Tiempo exacto transcurrido del turno (`04h 12m 30s`).
  2. *Ocupación*: Razón de cupos (`24/30 Slots`).
  3. *Recaudación*: Total acumulado en el turno actual.
  4. *Estado de Sincronización*: Indicador de conexión Firestore (`Cloud Sync OK`).
  5. *Botón Rápido de Cierre*: Acceso directo al arqueo ciego para cambio de turno expedito.

---

## 6. Reporte Técnico y Arquitectura de Sistemas

### 6.1. Identificadores de Infraestructura Activa
- **Google Cloud Platform (GCP) Project ID**: `gen-lang-client-0862587160`
- **GCP Project Number**: `349577440002`
- **Google Cloud Run Host Region**: `us-west1`
- **AI Studio Applet ID**: `e1c08131-a20e-48b9-8ee7-ee1d6aede812`
- **URLs de Producción y Previsualización**:
  - Desarrollo: `https://ais-dev-ozdgdixo2zrjkhyagygnzk-68180734196.us-west1.run.app`
  - Compartida / Staging: `https://ais-pre-ozdgdixo2zrjkhyagygnzk-68180734196.us-west1.run.app`
- **Cuenta Administradora**: `automatizable@gmail.com`
- **Repositorio de Control de Versiones**: `https://github.com/brau450unab/pms_matic`

### 6.2. Diagrama de Arquitectura de Tres Capas

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CAPA 1: CLIENTE (FRONTEND)                      │
│                                                                        │
│   [ PWA / React SPA en Navegador de Cabina o Tablet Móvil ]            │
│   ├── Máquina de Estado React (Context / Redux / Zustand)              │
│   ├── Capa Local-First (LocalStorage / IndexedDB para contingencia)    │
│   └── Generador de Documentos PDF y Comprobantes Térmicos (58/80mm)    │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  │ HTTPS / WebSocket
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   CAPA 2: SERVIDOR (GOOGLE CLOUD RUN)                  │
│                                                                        │
│   [ Contenedor Docker Node.js / Express en us-west1 ]                  │
│   ├── Escucha fija en Puerto 3000 (0.0.0.0:3000)                       │
│   ├── Proxy inverso NGINX administrado                                 │
│   ├── Endpoints REST: /api/tickets, /api/shifts, /api/sheets-sync      │
│   └── Gestión segura de variables de entorno y secrets de GCP          │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   │ SDK Admin / Web                 │ REST API v4
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        BASE DE DATOS VIVA            │  │     AUDITORÍA Y NEGOCIO      │
│     Google Cloud Firestore           │  │      Google Sheets         │
│     (Proyecto: 349577440002)         │  │  (Hojas de Cálculo Drive)   │
├──────────────────────────────────────┤  ├──────────────────────────────┤
│ • tickets: Estadías y cobros         │  │ 1. REGISTRO_VEHICULOS        │
│ • slots: Estado de los 30 cajones    │  │ 2. TURNOS_CAJA               │
│ • shifts: Arqueos ciegos             │  │ 3. CLIENTES_FRECUENTES       │
│ • cash_movements: Sangrías           │  │ 4. LOGS_AUDITORIA            │
│ • agreements: Abonados               │  │                              │
│ • audit_logs: Trazabilidad SHA-256   │  │                              │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### 6.3. Esquema Normalizado de Datos (11 Tablas y Colecciones)

1. **`DBUser` / `Usuarios`**: `id_usuario`, `nombre_completo`, `email`, `rol` (`OPERADOR` | `SUPERVISOR` | `ADMIN`), `pin_autorizacion`, `activo`.
2. **`DBRolePermission`**: Permisos granulares por módulo para evitar fugas de privilegios.
3. **`DBParkingSlot` / `Slots`**: `id_slot`, `codigo` (`A-01`..`C-10`), `zona`, `tipo_vehiculo`, `estado` (`disponible`, `ocupado`, `reservado`, `mantenimiento`), `current_ticket_id`, `plate_number`.
4. **`DBTicket` / `Tickets`**: `id_ticket`, `folio_ticket`, `patente`, `tipo_vehiculo`, `slot_codigo`, `hora_ingreso`, `hora_salida`, `minutos_totales`, `tarifa_aplicada`, `monto_total`, `monto_pagado`, `vuelto`, `metodo_pago` (`efectivo`, `tarjeta_debito`, `tarjeta_credito`, `transferencia`), `voucher_folio`, `estado` (`activo`, `pagado`, `anulado_fuga`, `anulado_cajero`), `operador_ingreso`, `operador_salida`.
5. **`DBShift` / `Turnos`**: `id_turno`, `numero_turno`, `operador_id`, `operador_nombre`, `hora_apertura`, `hora_cierre`, `monto_inicial_efectivo`, `desglose_billetes_apertura`, `efectivo_declarado`, `tarjeta_declarada`, `transferencia_declarada`, `desglose_billetes_cierre`, `efectivo_esperado`, `tarjeta_esperada`, `transferencia_esperada`, `diferencia_efectivo`, `diferencia_total`, `estado_cuadratura` (`cuadrado`, `descuadre_critico`), `justificacion_descuadre`, `supervisor_pin`, `supervisor_nombre`, `arrastre_vehiculos_conteo`, `firma_caja_ok`, `firma_operador_ok`, `hash_auditoria`.
6. **`DBCashMovement` / `MovimientosCaja`**: `id_movimiento`, `turno_id`, `tipo` (`RETIRO_SANGRIA`, `GASTO_MENOR`, `INGRESO_MANUAL`), `monto`, `motivo`, `comprobante_folio`, `timestamp`, `solicitante`, `autorizador_pin`.
7. **`DBAgreement` / `Convenios`**: `id_convenio`, `patente`, `empresa_razon_social`, `rut`, `nombre_contacto`, `telefono`, `email`, `tipo_convenio`, `tarifa_mensual`, `fecha_inicio`, `fecha_vencimiento`, `estado` (`al_dia`, `por_vencer`, `vencido`), `ultimo_pago_fecha`, `ultimo_pago_monto`, `ultimo_pago_voucher`.
8. **`DBCustomer` / `Clientes`**: Directorio consolidado de conductores frecuentes.
9. **`DBAuditLog` / `Auditoria`**: `id_log`, `timestamp`, `evento`, `usuario_id`, `usuario_nombre`, `detalles`, `severidad` (`info`, `warning`, `critical`), `hash_integridad`.
10. **`DBTariffConfig` / `ConfiguracionTarifas`**: Minutos de gracia (15), cobro por minuto, recargo ticket extraviado, recargo nocturno.
11. **`DBSyncQueue`**: Cola de transacciones locales pendientes de sincronizar con la nube cuando el terminal vuelve a tener internet.

---

## 7. Guía de Inicialización para el Nuevo Proyecto

Siga esta lista de verificación secuencial para inicializar el nuevo frontend y dejarlo 100% cableado a la infraestructura actual:

### Paso 1: Configuración del Entorno y Variables del Sistema
1. Asegurarse de que el servidor dev y producción enlace a `0.0.0.0` en el puerto **`3000`** (norma estricta de Cloud Run y AI Studio).
2. Crear el archivo `.env.example` declarando las variables requeridas:
   ```env
   VITE_FIREBASE_PROJECT_ID=gen-lang-client-0862587160
   VITE_FIREBASE_APP_ID=1:349577440002:web:488eeb4a99c415e104f01b
   VITE_FIREBASE_API_KEY=AIzaSyAL5dqHzF0ymkxhE8SYvA1ldUYPdMZw_GE
   VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0862587160.firebaseapp.com
   VITE_GOOGLE_CLIENT_ID=349577440002-6r0ijjtbqo7biqt4c8cd9r69daeit48v.apps.googleusercontent.com
   ```

### Paso 2: Conexión con Google Cloud Run
1. **Configuración de Contenedor**:
   - En el `package.json`, conservar la compatibilidad de producción:
     - SPA estática compilada en carpeta `dist/`.
     - Si se utiliza servidor Express personalizado (`server.ts`), compilar a `dist/server.cjs` ejecutando `node dist/server.cjs` en el puerto 3000.
2. **Health Check**:
   - Disponer de una ruta `/api/health` que devuelva `{ "status": "ok", "project": "CORDANO_PMS" }` para que Cloud Run mantenga vivo el contenedor sin reinicios en frío.

### Paso 3: Inicialización del SDK de Firebase Firestore
1. Instalar la librería cliente oficial:
   ```bash
   npm install firebase
   ```
2. Inicializar la conexión en un módulo de servicios con soporte para reconexión:
   - Configurar la persistencia de Firestore (`enableIndexedDbPersistence`) para que las consultas sigan respondiendo al cajero incluso si se corta la fibra óptica o el Wi-Fi.
   - Establecer listeners reactivos (`onSnapshot`) sobre las colecciones `slots` y `tickets`.

### Paso 4: Integración y Conexión con Google Sheets
1. **Carga de SDK de Google Identity Services (GIS)**:
   - Incluir en el `index.html` el script oficial de Google:
     ```html
     <script src="https://accounts.google.com/gsi/client" async defer></script>
     ```
2. **Alcances (OAuth Scopes) Requeridos**:
   - `https://www.googleapis.com/auth/spreadsheets` (Lectura y escritura de celdas).
   - `https://www.googleapis.com/auth/drive.file` (Creación de la planilla en el Drive del usuario).
3. **Mecanismo de Token Client**:
   - Inicializar con el Client ID de GCP: `349577440002-6r0ijjtbqo7biqt4c8cd9r69daeit48v.apps.googleusercontent.com`.
   - Utilizar el flujo `initTokenClient` en el cliente web para solicitar el acceso mediante ventana modal emergente de Google.
4. **Estructura Automática de las 4 Hojas Maestras**:
   - Si la hoja no existe, la función creadora debe generar una planilla con las siguientes pestañas y encabezados:
     1. `REGISTRO_VEHICULOS`: `[ID_Ticket, Folio, Patente, Tipo, Slot, Ingreso, Salida, Minutos, Tarifa, Total_Pagado, Metodo, Operador, Estado]`
     2. `TURNOS_CAJA`: `[ID_Turno, Fecha, Operador, Hora_Apertura, Hora_Cierre, Monto_Inicial, Efectivo_Declarado, Tarjeta_Declarada, Transferencia_Declarada, Diferencia_Efectivo, Estado_Cuadratura, Justificacion, Supervisor_Validador]`
     3. `CLIENTES_FRECUENTES_CONVENIOS`: `[ID_Convenio, Empresa, RUT, Contacto, Telefono, Patentes, Tarifa_Mensual, Vencimiento, Estado]`
     4. `LOGS_AUDITORIA`: `[Timestamp, Usuario, Evento, Detalle, Severidad, Hash_Auditoria]`

### Paso 5: Asignación de Nombres, Metadatos y Dominios
1. **Sincronización en `metadata.json`**:
   - `name`: `"CORDANO PMS"`
   - `description`: `"Parking Management System — Control de acceso vehicular, tarifación en tiempo real y arqueo ciego para estacionamiento."`
2. **Sincronización en `index.html`**:
   - Reemplazar cualquier etiqueta genérica en `<title>` y `<meta property="og:title">` con `"CORDANO PMS"`.
3. **Mapeo de Dominios en Cloud Run**:
   - Para vincular un dominio personalizado propio (ej. `pms.cordano.cl`):
     1. Acceder a Google Cloud Console > Cloud Run > Dominio personalizado (*Custom Domains*).
     2. Mapear el servicio al dominio registrado.
     3. Agregar los registros DNS de tipo `CNAME` y `TXT` provistos por Google en el panel de su proveedor de dominio (ej. NIC Chile o Cloudflare).

---

## 8. Consideraciones Finales para el Nuevo Frontend

- **Aislamiento de Lógica**: La capa de estado (`State Management`) debe estar desacoplada de los componentes visuales para permitir rediseñar botones, tarjetas o modales sin alterar el cálculo matemático de tarifas ni la lógica del arqueo ciego.
- **Teclado Numérico y Shortcuts**: Para acelerar la pista, implementar atajos de teclado para el cajero (ej. `[F1]` para Registrar Ingreso, `[F2]` para Cobrar Salida, `[ESC]` para Cerrar Modales, `[ENTER]` para Confirmar Cobro).
- **Compatibilidad con Impresoras Térmicas**: El formato de salida de los comprobantes debe estar diseñado en un ancho estricto de **384px (58mm)** o **576px (80mm)**, con código QR de alto contraste para lectura rápida con escáner de pistola láser.

---
*Fin del documento de diseño y arquitectura de CORDANO PMS.*
