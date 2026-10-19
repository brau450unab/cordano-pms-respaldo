# Registro de Entrada
Pantalla optimizada para registrar el ingreso de vehículos de forma rápida y sin errores, capturando información esencial y validando disponibilidad antes de asignar un slot.

Layout Hierarchy:
- Header (Full-width):
  - Minimal Navigation Bar
- Content Container (Positioned below the header):
  - Left Panel: Formulario de registro
  - Right Panel: Vista previa y confirmación

## Minimal Navigation Bar
- Botón "Volver al Dashboard"
- Título de la página: "Registro de Entrada"
- Indicador de espacios disponibles (número)
- Hora del sistema

## Formulario de Registro de Vehículo
- Campo obligatorio: Patente del vehículo (formato chileno, validación automática, texto en mayúsculas)
- Campo: Teléfono del conductor (+56 prefijo por defecto, formato chileno, opcional)
- Selector obligatorio: Tipo de vehículo (Auto / Moto / Camioneta / SUV)
- Campo: Hora estimada de salida (selector de hora con incrementos de 30 minutos, valor por defecto: +2 horas)
- Mensaje informativo automático sobre tiempo de gracia y tarifa aplicable según selección
- Botón de validación: "Verificar Disponibilidad" (valida anti-passback y disponibilidad de slots)

## Asignación de Slot
- Lógica de asignación automática:
  - Si quedan más de 6 espacios: el cliente elige libremente (mostrar mapa interactivo)
  - Si quedan 6 o menos: el sistema sugiere un slot específico (mostrar sugerencia destacada)
- Mapa visual del estacionamiento con slots numerados
- Estados visuales: Disponible (verde) / Ocupado (rojo) / Sugerido (amarillo destacado)
- Slot seleccionado destacado con borde grueso
- Información del slot: número, tipo recomendado de vehículo

## Opciones de Ticket
- Checkbox: Imprimir ticket físico (activado por defecto)
- Checkbox: Enviar ticket digital por WhatsApp (requiere teléfono ingresado)
- Vista previa del ticket con información a imprimir:
  - Patente del vehículo
  - Tipo de vehículo
  - Slot asignado
  - Fecha y hora de entrada
  - Código de ticket único (QR + alfanumérico)
  - Tarifas aplicables (por minuto según tipo)
  - Tiempo de gracia
  - Aviso de responsabilidad del cliente por conservar el ticket

## Acciones de Confirmación
- Botón primario destacado: "Registrar Entrada y Emitir Ticket"
- Botón secundario: "Cancelar"
- Indicador de progreso durante emisión de ticket e impresión
