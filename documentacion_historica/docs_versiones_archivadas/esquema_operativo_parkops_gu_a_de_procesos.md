# Esquema Operativo: Proceso de Gestión de Estacionamiento ParkOps

Este documento describe el flujo operativo de extremo a extremo del sistema ParkOps, detallando cada fase, el ingreso de información requerido y el manejo de variantes operacionales.

---

## Fase 1: Registro de Ingreso (Check-In)
*Objetivo: Registrar la entrada del vehículo y emitir el comprobante de estadía.*

### 1.1 Captura de Datos
El operador inicia el proceso en el módulo **Operación POS**.
- **Patente (Placa):** Ingreso manual o vía scanner (formato chileno: `AB·CD·12`). El sistema valida automáticamente si existe una estadía activa previa (*Anti-passback*).
- **Tipo de Vehículo:** Selección obligatoria (Auto, SUV, Camioneta, Moto) para aplicar la tarifa correcta.
- **Información del Cliente (Opcional):** Si la patente está asociada a un cliente recurrente o abonado, se despliega su perfil automáticamente.
- **Teléfono:** Para envío de ticket digital vía WhatsApp (opcional).

### 1.2 Asignación de Espacio (Slot)
- **Sugerencia Automática:** Si la ocupación es crítica (6 espacios o menos), el sistema sugiere el slot más eficiente.
- **Selección Manual:** El operador puede elegir el espacio desde el **Layout en Tiempo Real**.

### 1.3 Emisión de Ticket
Se genera un comprobante físico y/o digital con:
- Código único de ticket (QR + Alfanumérico).
- Fecha y hora exacta de entrada.
- Espacio asignado.
- Resumen de tarifas y tiempo de gracia.

---

## Fase 2: Estadía y Monitoreo
*Objetivo: Controlar la ocupación y el tiempo de permanencia en tiempo real.*

### 2.1 Vista de Layout
- **Visualización:** Mapa interactivo con estados (Disponible, Ocupado, Reservado, Mantención).
- **Control de Tiempo:** Identificación visual de vehículos con estadía prolongada (ej: badge ámbar para > 4 horas).

### 2.2 Variantes en Estadía
- **Cambio de Slot:** Movimiento manual de un vehículo de un espacio a otro registrado en la bitácora.
- **Modo Offline:** Si se pierde la conexión, el sistema permite seguir registrando ingresos localmente (IndexedDB) y se sincroniza al recuperar internet.

---

## Fase 3: Salida y Proceso de Pago (Check-Out)
*Objetivo: Calcular la tarifa, procesar el pago y liberar el espacio.*

### 3.1 Búsqueda y Validación
- El operador escanea el ticket o ingresa la patente.
- El sistema calcula: `(Hora Salida - Hora Entrada) - Tiempo Gracia`.

### 3.2 Liquidación de Tarifa
- **Tarifa Dinámica:** Aplica recargos por horario punta o días festivos según configuración.
- **Monto Total:** Se muestra en pantalla grande para el cliente.

### 3.3 Medios de Pago
- **Efectivo:** Calculadora de vuelto automática destacada.
- **Tarjeta / Transferencia:** Registro de confirmación de pago externo.
- **Cuenta de Cliente:** Descuento directo de saldo prepago o convenio.

---

## Fase 4: Cierre de Turno y Auditoría
*Objetivo: Consolidar la recaudación y asegurar la transparencia financiera.*

### 4.1 Cierre de Caja Ciego
1. El operador declara el efectivo y vouchers físicos sin ver el total del sistema.
2. El sistema revela el monto esperado y calcula la **Diferencia**.
3. Si existe descuadre significativo, se requiere una justificación obligatoria.

### 4.2 Bitácora de Auditoría
Registro inmutable de todas las excepciones:
- **Anulaciones:** Requieren motivo y clave de administrador.
- **Ticket Perdido:** Aplicación de multa fija tras validación de patente.
- **Apertura Manual:** Registro de apertura de barreras sin ticket asociado.

---

## Resumen de Escenarios y Errores Comunes

| Escenario | Acción del Sistema | Resolución |
| :--- | :--- | :--- |
| **Patente Duplicada** | Bloqueo por Anti-passback. | Verificar si el vehículo anterior no marcó salida. |
| **Error de Impresora** | Alerta visual en Dashboard. | Pago queda confirmado; se ofrece re-impresión o envío digital. |
| **Ticket Perdido** | Función especial en POS. | Cobro de multa configurada + registro en auditoría. |
| **Descuadre de Caja** | Marcado rojo en reporte. | Revisión obligatoria por parte del Administrador. |
| **Falla de Internet** | Activación Modo Offline. | Operación continúa; sincronización automática posterior. |

---
*ParkOps — Sistema de Gestión Operativa Iquique*