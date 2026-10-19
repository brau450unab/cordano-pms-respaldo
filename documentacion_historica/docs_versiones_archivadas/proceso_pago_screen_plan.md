# Proceso de Pago
Pantalla para procesar la salida de vehículos, calcular montos automáticamente según tarifas dinámicas y gestionar el cobro con múltiples medios de pago.

Layout Hierarchy:
- Header (Full-width):
  - Minimal Navigation Bar
- Content Container (Positioned below the header):
  - Left Panel: Información del vehículo y cálculo
  - Right Panel: Método de pago y vuelto (pantalla grande)

## Minimal Navigation Bar
- Botón "Volver al Dashboard"
- Título de la página: "Proceso de Salida y Pago"
- Hora del sistema

## Búsqueda de Ticket
- Campo de entrada principal: Código de ticket (escaneo QR o ingreso manual)
- Botón de búsqueda alternativa: "Buscar por patente"
- Validación instantánea y recuperación de información del ticket

## Información del Vehículo
- Patente del vehículo (destacada)
- Tipo de vehículo con icono visual
- Slot asignado
- Fecha y hora de entrada
- Fecha y hora de salida (actual, actualizada en tiempo real)
- Tiempo total de estadía (en horas y minutos, formato legible)
- Tiempo de gracia aplicado (si corresponde)

## Cálculo Automático de Tarifa
- Tarifa base aplicable (según tipo de vehículo)
- Tarifa por minuto vigente (considerando horario y día de la semana)
- Desglose detallado del cálculo:
  - Tiempo de gracia (minutos gratuitos)
  - Tiempo facturable (tiempo total - tiempo de gracia)
  - Multiplicación: tiempo facturable × tarifa por minuto
  - Subtotal
  - Cargos adicionales (si aplica multa por ticket perdido)
- Monto total a cobrar (destacado con tamaño grande y color contrastante)

## Selección de Método de Pago
- Botones grandes de selección (solo uno activo a la vez):
  - Efectivo (por defecto)
  - Tarjeta de débito/crédito
  - Cuenta de cliente frecuente
- Si método = Efectivo:
  - Campo: Monto recibido del cliente
  - Cálculo automático de vuelto en pantalla extra grande (formato destacado para visualización del cliente)
  - Validación: monto recibido debe ser mayor o igual al total
- Si método = Tarjeta:
  - Indicador: "Procesar pago con terminal externa"
  - Confirmación manual de pago exitoso
- Si método = Cuenta de cliente:
  - Búsqueda y selección de cliente registrado
  - Saldo actual disponible
  - Confirmación de descuento de cuenta

## Confirmación de Pago
- Resumen final:
  - Monto cobrado
  - Método de pago utilizado
  - Vuelto entregado (si aplica)
  - Operador que procesó la transacción
- Checkbox: Imprimir comprobante de pago
- Botón primario destacado: "Confirmar Pago y Liberar Slot"
- Botón secundario: "Cancelar Transacción"
- Al confirmar:
  - Ticket pasa a estado "concluido"
  - Slot se libera automáticamente en el layout
  - Registro en bitácora de auditoría
  - Actualización inmediata de métricas del turno

## Casos Especiales
- Botón de acción especial: "Ticket Perdido" (requiere autorización del administrador)
  - Solicita ingreso de patente para búsqueda
  - Aplica multa por ticket perdido según configuración
  - Genera alerta para bitácora de auditoría
