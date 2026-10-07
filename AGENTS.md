# CORDANO PMS — Reglas de Arquitectura & Contexto del Proyecto

## 1. Identificación del Proyecto & Ecosistema
- **Nombre Oficial**: CORDANO PMS (Cordano Parking Ops)
- **Google Cloud Project ID**: `gen-lang-client-0862587160` (CORDANO PMS V1)
- **AI Studio Applet ID**: `e1c08131-a20e-48b9-8ee7-ee1d6aede812`
- **Cloud Run Host Region**: `us-west1` (Project Number: `68180734196`)
- **Repositorio GitHub**: `https://github.com/brau450unab/pms_matic`
- **Cuenta Propietaria**: `automatizable@gmail.com`

---

## 2. Propósito & Modelo Operativo
CORDANO PMS es un Parking Management System diseñado para organizar, registrar y auditar el día a día operativo de un estacionamiento local:
1. **Operador de Turno (Registro Activo)**:
   - Registro manual rápido de ingresos y salidas con patente.
   - Cálculo automático de tarifas por minuto/fracción y tolerancia de gracia.
   - Emisión de ticket térmico/QR y punto de cobro (Efectivo / POS Débito-Crédito / Transferencia).
   - Arqueo de caja y Cierre Ciego de turno.
2. **Supervisores / Administradores (Visualizadores Remotos)**:
   - Acceso desde otros dispositivos en modo lectura/supervisión en tiempo real.
   - Monitoreo del plano de slots ocupados, recaudación acumulada del turno y alertas de auditoría.
   - Acceso a reportes analíticos y configuraciones del tarifario.

---

## 3. Arquitectura de Datos & Integración con Google Sheets
Para asegurar trazabilidad, persistencia y análisis de datos en hojas de cálculo:
- **Estructura de Tablas en Google Sheets / Base de Datos**:
  1. `REGISTRO_VEHICULOS`: `[ID_Ticket, Patente, Tipo_Vehiculo, Slot, Fecha_Hora_Ingreso, Fecha_Hora_Salida, Minutos_Totales, Tarifa_Aplicada, Total_Pagado, Metodo_Pago, Operador, Estado]`
  2. `TURNOS_CAJA`: `[ID_Turno, Fecha, Operador, Hora_Apertura, Hora_Cierre, Monto_Inicial, Total_Efectivo_Declarado, Total_Digital, Diferencia_Arqueo, Estado_Cierre]`
  3. `CLIENTES_FRECUENTES_CONVENIOS`: `[ID_Cliente, Nombre_RazonSocial, Rut, Patentes_Asociadas, Tipo_Convenio, Tarifa_Especial, Estado]`
  4. `LOGS_AUDITORIA`: `[Timestamp, ID_Usuario, Evento, Detalle, Modulo]`
