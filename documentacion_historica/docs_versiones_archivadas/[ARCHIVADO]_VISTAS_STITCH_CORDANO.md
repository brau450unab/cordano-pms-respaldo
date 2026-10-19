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


# Vistas Prototipadas en Google Stitch — Cordano Operations ERP
**Proyecto:** NUEVO PMS CORDANO - ParkOps Iquique  
**ID de Proyecto Stitch:** `12916038623650348087`  
**Proyecto Base de Referencia:** `11170226797373845541` (PROYECTO ESTACIONAMIENTO INTEGRAL)  
**Acceso Web Stitch:** [https://stitch.withgoogle.com/projects/12916038623650348087](https://stitch.withgoogle.com/projects/12916038623650348087)

---

## 1. Filosofía de Rediseño: Alta Utilidad y Cero Ruido

Siguiendo la visión original y eliminando la saturación de texto redundante de las versiones preliminares, el sistema ha sido actualizado bajo los principios de **Cordano Operations ERP**:
* **Sidebar Negro Profundo (`#080808`):** Navegación técnica con isotipo y logotipo blanco CORDANO.
* **Lienzo Marfil Claro (`#FAFAF5` / `#F9F9FB`):** Alto contraste, descanso visual y legibilidad óptima para operadores en garita.
* **Tipografía Dual Intencional:**
  * **Manrope:** Encabezados humanos, botones y estructura general.
  * **IBM Plex Mono / Tabular Nums:** Matrículas chilenas, tiempos acumulados, moneda CLP y códigos de ticket.
* **Acentos Operativos:**
  * Primario: Azul Corporativo (`#0059B5` / `#0071E3`).
  * Plazas Disponibles: Verde Esmeralda (`#10B981`) o Gris Neutro (`#E5E2E1`).
  * Plazas Ocupadas: Negro Sólido (`#000000`) o Pizarra (`#1E293B`).
  * Sobrestadía / Alerta: Rojo Carmesí (`#BA1A1A`).
  * Plazas Reservadas / Convenios: Ámbar (`#F59E0B`) con icono de candado.

---

## 2. Catálogo de Pantallas en Google Stitch

### 1. Operación POS — Check-in & Vehículos en Turno
* **ID en Stitch:** `d09c4b80583e4978a4cb2630441bd485`
* **Propósito:** Entrada de vehículos en menos de 10 segundos y monitoreo de la rotación activa.
* **Componentes Clave:**
  * **Header:** Indicador de garita, tarifa diurna activa y widget circular de capacidad en vivo (`45 / 120` plazas, 62% ocupación).
  * **Panel Izquierdo:**
    * Input gigante de matrícula en IBM Plex Mono (`KD-JL-84`) con validación de mayúsculas automática.
    * Bento selector de categoría vehicular (Auto, Moto, Camioneta, PMR) con tarifas visibles.
    * Checkboxes de emisión: Ticket térmico 80mm y envío WhatsApp.
    * Botón de impacto `Registrar Ingreso [ENTER]`.
    * Métricas rápidas: Tiempo Promedio (1h 15m) y Ticket Promedio ($3.450 CLP).
  * **Panel Derecho:**
    * Tabla de `Vehículos en Turno (143 Activos)` con búsqueda en vivo.
    * Columnas: Estado, Patente, Tipo, Ingreso, Duración en vivo y botón `Cobrar [F2]`.

---

### 2. Estacionamiento — Plano Arquitectónico en Tiempo Real
* **ID en Stitch:** `83e3e5b92d9645ed920a1a94c21c5e7a`
* **Propósito:** Control visual de la ocupación espacial de los cajones del recinto en Serrano 447.
* **Componentes Clave:**
  * **Sidebar de Control:**
    * Selector de vista: Conmutador `Plano 2D` / `Kanban`.
    * Selector de sector con barras de progreso: Subterráneo -1 (40/50), Subterráneo -2 (12/50), Exterior (0/20).
    * Leyenda de estados: Disponible, Ocupado, Excedido (>4h) y Reservado.
    * Ficha rápida de bahía al hacer clic en un slot.
  * **Lienzo de Plano 2D:**
    * Representación de Caseta Garita G-01, Oficinas Cordano y rampas de acceso con cámaras LPR.
    * Distribución de Bloque A y Bloque C con cajones numerados y matrículas de autos estacionados.
    * Controles de zoom flotantes (`+`, `-`, reajustar).

---

### 3. Proceso de Salida y Cobro Rápido
* **ID en Stitch:** `16aa7c649bbc45eaab47c4bcb7879ae6`
* **Propósito:** Liquidación expedita de estadías con transparencia total de cálculo para el cliente.
* **Componentes Clave:**
  * **Búsqueda:** Lectura de código de ticket QR o patente por teclado `[F3]`.
  * **Ficha de Liquidación:**
    * Matrícula chilena destacada `KD-JL-84` con slot `A-04`.
    * Línea de tiempo: 11:15 a 13:45 (2h 30m).
    * Aplicación de 15 min de gracia (135 min cobrables a $25 CLP/min).
    * Subtotal neto + IVA 19% = **Total a Cobrar: $3.375 CLP** en tipografía gigante.
  * **Caja de Efectivo & Visor de Vuelto:**
    * Botones rápidos de denominación ($3.375 exacto, $5.000, $10.000, $20.000).
    * **Visor gigante de vuelto al cliente: $1.625 CLP** con desglose físico sugerido para agilizar la entrega de monedas y billetes.
    * Botón de acción `Confirmar Pago y Liberar Slot A-04 [ENTER]`.

---

### 4. Turno y Caja — Cierre de Caja Ciego & Conciliación
* **ID en Stitch:** `3b4892334a8744148bc67cbd67e7f9cf`
* **Propósito:** Arqueo inmutable antifraude para cambio de turno y rendición a administración.
* **Componentes Clave:**
  * **Encabezado:** Operador Carlos Soto, inicio 08:00 hrs, duración 6h 30m, 84 vehículos procesados, base de apertura $50.000 CLP.
  * **Matriz de 3 Columnas:**
    1. **Declaración Física del Operador:** Conteo de gaveta sin ver el sistema (Efectivo $185.000, Tarjetas POS $142.000, Transferencias $45.000 = Total $372.000 CLP).
    2. **Totales por Sistema:** Revelación post-declaración de los montos calculados por sensores y tickets.
    3. **Diferencia / Cuadre:** Badge verde esmeralda `✓ CAJA CUADRADA PERFECTA ($0 CLP)`, desglose fila a fila y hash criptográfico SHA-256 de la sesión.
  * **Acciones:** `Finalizar Turno y Emitir Reporte Z [ENTER]`, `Imprimir Duplicado de Arqueo [F11]` y `Descargar Acta en PDF`.
