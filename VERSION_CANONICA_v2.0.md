# CORDANO PMS — ESPECIFICACIÓN DE VERSIÓN CANÓNICA MASTER v2.0.0
**Ubicación Oficial**: Serrano 447, Iquique, Chile  
**Fecha de Emisión**: 15 de Octubre de 2026  
**Entorno Principal**: `C:\Users\BraulioAM\OneDrive - UNIVERSIDAD ANDRES BELLO\PROYECTOS ANTIGRAVITY\PROYECTO CORDANO ENTREGABLE`  
**Host de Desarrollo**: `http://localhost:3000`  
**Estado**: **PRODUCCIÓN LOCAL Y ONLINE CANÓNICA (MASTER RELEASE v2.0.0)**

---

## 1. DECLARACIÓN OFICIAL DE VERSIÓN Y ARQUITECTURA

A partir de esta versión (`v2.0.0`), el paquete contenido en la carpeta **`PROYECTO CORDANO ENTREGABLE`** se consagra como la **Única Fuente de la Verdad (Single Source of Truth)** para el desarrollo, despliegue y operación del sistema **Cordano Parking Management System (PMS)**.

Todas las versiones precedentes, descargas y carpetas anteriores han sido consolidadas y purgadas, quedando respaldadas exclusivamente en el historial y en el repositorio de respaldo.

---

## 2. MATRIZ DE ENTORNOS Y CLASIFICACIÓN DE VERSIONES

| Entorno / Ubicación | Versión | Clasificación | Estado Operativo | Directiva Antigravity |
| :--- | :---: | :---: | :---: | :--- |
| **`PROYECTO CORDANO ENTREGABLE`** (`localhost:3000`) | **v2.0.0** | **CANÓNICA MASTER** | **ACTIVO (Principal)** | **Única carpeta local de trabajo, desarrollo y ejecución.** |
| **Cloud Run (`https://cordanopms.ai.studio`)** | **v2.0.0** | **PRODUCCIÓN OFICIAL** | **ACTIVO (100% Tráfico - Rev 11+)** | **Instancia pública oficial en línea.** |
| **GitHub Oficial (`cordano-pms-oficial`)** | **v2.0.0** | **REPOSITORIO OFICIAL** | **SINCRONIZADO (`main`)** | **Código fuente canónico en control de versiones.** |
| **Google AI Studio App** (`e1c08131...`) | v2.0.0 | Entorno de Prototipado Visual | Standby de Sincronización | Se sincroniza desde Localhost únicamente bajo confirmación. |
| **GitHub Respaldo (`cordano-pms-respaldo`)** | **v2.0.0 Checkpoint** | **Copia de Seguridad Oficial** | **ACTIVO / RESPALDADO** | **Punto de restauración canónico v2.0.0 actualizado.** |
| ~~`cordano-pms-version-publicada`~~ | v1.0.0 | **VERSIÓN ANTERIOR (LEGACY)** | **PURGADA / ELIMINADA** | **Eliminada definitivamente del almacenamiento local.** |
| ~~`NUEVO PMS CORDANO`~~ | v0.x | **PROTOTIPO ANTERIOR** | **PURGADA / ELIMINADA** | **Eliminada definitivamente del almacenamiento local.** |

---

## 3. INVENTARIO COMPLETO DE COMPONENTES Y MÓDULOS (v2.0.0)

La versión canónica **v2.0.0** consolida e implementa de extremo a extremo los siguientes subsistemas:

### 3.1. Garita Operativa & Punto de Venta Split-Screen (POS)
- **Archivos**: `src/components/pms/PosView.tsx`, `src/components/pms/LiveOperationsView.tsx`, `src/components/pms/PatioMatrix2D.tsx`.
- **Ruta**: `/pos` o `/operacion`.
- **Funcionalidades**:
  - Vista dividida (Split-Screen): Registro de entrada (Check-in) a la izquierda y Búsqueda/Cobro de salida (Check-out) a la derecha.
  - Atajos de teclado profesionales `F1` a `F10` para agilizar la garita.
  - Cálculo de tarifas en tiempo real con 15 minutos de gracia por tolerancia municipal.
  - Registro antifraude para ticket extraviado ($8.000 CLP) con justificación obligatoria.

### 3.2. Matriz 2D Interactiva con Drag & Drop de Plazas
- **Capacidad**: 30 plazas físicas distribuidas en **Sector A (01–15)** y **Sector B (16–30)** correspondientes a Serrano 447, Iquique.
- **Interacción**:
  - Soporte de **Drag & Drop HTML5** nativo: arrastre de un vehículo ocupado hacia una plaza vacía para reubicación o hacia otra plaza ocupada para intercambio de puesto (*slot swap*).
  - Indicadores visuales en tiempo real: anillo violeta/rosa (`ring-2 ring-primary-500/70`) en la plaza destino y opacidad en el elemento arrastrado.
  - Soporte móvil/táctil: Modal contextual de reasignación rápida de plaza para pantallas sin ratón.
  - Estado sincronizado en `src/context/ParkingContext.tsx` (`moveOrSwapVehicleSlot`).

### 3.3. Ciclo de Salida, Cobro y Emisión de Ticket Térmico 80mm
- **Archivos**: `src/components/pms/CheckoutReceiptModal.tsx`, `src/utils/pdfGenerator.ts` (`generateExitReceiptPdf`).
- **Especificaciones**:
  - Formato estricto para **impresora térmica de 80mm** (302 pt de ancho con altura variable).
  - Desglose financiero completo: Subtotal neto, IVA (19%), Recargo por extravío (si aplica), Total a Pagar en CLP.
  - Calculadora de cambio en efectivo (*vuelto*) en tiempo real.
  - Metadatos fiscales y operativos: Folio DTE fiscal, ID de Ticket de Entrada, Patente, Categoría de Vehículo, Hora de Ingreso, Hora de Salida, Tiempo Efectivo Estacionado, Operador emisor y Estación de Garita.
  - Código QR generado con datos de verificación de la transacción.
  - Integraciones de salida:
    - **Impresión Directa**: `window.print()` con CSS `@media print` optimizado a 80mm.
    - **Descarga PDF Vectorial**: Formato 80mm generado vía `jspdf`.
    - **Envío por WhatsApp**: Generación automática de enlace `https://wa.me/?text=...` con el detalle completo del ticket y comprobante de pago.
    - **Comandos ESC/POS**: Preparado para envío a puerto serie o spooler de impresión térmica.

### 3.4. Proceso de Cierre de Caja Ciego en Stepper
- **Archivo**: `src/components/pms/CierreCajaCiego.tsx`.
- **Ruta**: `/operacion/cierre`.
- **Dinámica Paso a Paso (4 Etapas)**:
  1. **Paso 1: Arqueo Físico Declarativo (Ciego)**: Conteo billete por billete ($20.000, $10.000, $5.000, $2.000, $1.000) y moneda por moneda ($500, $100, $50, $10). El cajero **no ve** la recaudación del sistema para prevenir fraudes.
  2. **Paso 2: Retención de Fondo y Sobre de Remesa**: Declaración del fondo base para el siguiente turno ($50.000 CLP estándar) y cálculo del sobre sellado para administración.
  3. **Paso 3: Aprobaciones Express Diferidas**: Validación en lote de tickets con excepciones, descuentos o extravíos registrados durante el turno con PIN de Supervisor.
  4. **Paso 4: Certificación, Cierre Definitivo & Emisión Reporte Z**:
     - Sellado criptográfico mediante hash `SHA-256`.
     - Generación del **Reporte Z en Hoja A4** estándar corporativa.
     - Emisión obligatoria en **dos copias** (Copia Garita / Copia Administración).
     - **Dos casillas de firma física al pie** (Firma Operador Saliente y Firma Supervisor/Administrador).
     - Desautenticación definitiva y bloqueo del POS.

### 3.5. Seguridad de Turno & Control de Acceso Estricto (RBAC)
- **Archivos**: `src/context/ParkingContext.tsx`, `src/components/pms/ModalAperturaTurno.tsx`.
- **Reglas Enforzadas**:
  - **Bloqueo Inicial**: Si el operador inicia sesión pero no ha abierto turno, el POS y las funciones de ingreso/salida permanecen estrictamente deshabilitadas.
  - **Modal de Apertura**: Exige declarar el fondo de caja inicial ($50.000 CLP), registrar estación y verificar hora de inicio.
  - **Dominio Exclusivo del Turno**: Solo el operador que inició el turno tiene permisos de escritura y operación (`isShiftOwner`). Cualquier otro usuario que ingrese actúa en modo visor (`isViewerOnly`), impidiendo alteraciones no autorizadas.
  - **Ubicación de Notificaciones**: Las notificaciones de estado y alerta del sistema están ancladas en la **esquina inferior izquierda** (`bottom-4 left-4`) para garantizar que no obstruyan botones de cobro o entradas.

### 3.6. Estándares Visuales & Reglas de Negocio
- **Moneda**: Formato monetario chileno obligatorio con punto de miles (`$ 1.500`, `$ 8.000`, `$ 50.000`) y tipografía monoespaciada tabular `font-mono tabular-nums`.
- **Paleta Corporativa Cordano**:
  - Rosa Corporativo Primario: `#E2498A` / Hover `#C83472`
  - Dark Mode Profesional: `#1E1E2F` / `#2D2D44`
  - Light Mode Limpio: Slate `#F8FAFC`
  - Emerald de Confirmación: `#10B981`
- **Zero-Emoji Rule**: Se prohíben emojis en interfaces operativas; se utiliza exclusivamente la librería `lucide-react`.

---

## 4. REGISTRO DE VERSIONES ANTERIORES (HISTÓRICO LEGACY)

| Versión | Identificador | Fecha | Resumen de Estado |
| :--- | :--- | :--- | :--- |
| **v1.0.0** | `cordano-pms-version-publicada` | Octubre 2026 | Versión publicada inicial desplegada en Cloud Run y alojada en carpeta Downloads. Cierre de caja en modal único, sin drag & drop 2D, sin ticket térmico 80mm de salida interactivo. **Reemplazada por v2.0.0.** |
| **v0.5.0** | `NUEVO PMS CORDANO` | Septiembre 2026 | Prototipo inicial de desarrollo con componentes en evaluación y diseño exploratorio. **Archivada y anulada.** |
| **v1.0-checkpoint** | `checkpoint-restauracion-...` | Octubre 2026 | Tag y rama fijada en GitHub Respaldo para recuperación ante desastres. **Preservada sin cambios.** |

---

## 5. CONCLUSIÓN Y ESTADO DE VALIDACIÓN
- **Compilación TypeScript**: `tsc --noEmit` exitoso (0 errores).
- **Vite Build**: Generado correctamente (`dist/` listo para producción).
- **Servidor Local**: Activo en `http://localhost:3000`.
- **Estatus**: **CANÓNICA MASTER v2.0.0 OFICIALMENTE VIGENTE**.
