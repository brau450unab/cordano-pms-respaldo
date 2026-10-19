# Configuración de Tarifas
Pantalla de administración para configurar y gestionar el motor de tarifas dinámicas, permitiendo definir precios segmentados por tipo de vehículo, horario, día de la semana y reglas especiales.

Layout Hierarchy:
- Header (Full-width):
  - Top Navigation Bar
- Content Container (Positioned below the header):
  - Main Content Area con tabs de configuración

## Top Navigation Bar
- Botón "Volver al Dashboard"
- Título de la página: "Configuración de Tarifas"
- Botón: "Vista Previa de Tarifas Activas"
- Botón primario: "Guardar Cambios"

## Tabs de Configuración
- Tab 1: "Tarifas por Tipo de Vehículo" (activo por defecto)
- Tab 2: "Horarios y Días Especiales"
- Tab 3: "Reglas Generales"
- Tab 4: "Historial de Cambios"

## Tab 1: Tarifas por Tipo de Vehículo
- Tabla de configuración de tarifas base:
  - Columna 1: Tipo de vehículo (Auto / Moto / Camioneta / SUV)
  - Columna 2: Tarifa por minuto (entrada numérica, formato moneda CLP)
  - Columna 3: Tiempo de gracia (minutos gratuitos, entrada numérica)
  - Columna 4: Estado (Activo / Inactivo, toggle)
  - Columna 5: Acciones (Editar / Duplicar / Eliminar)
- Botón: "Agregar Nuevo Tipo de Vehículo"
- Preview en tiempo real: "Con esta configuración, un auto estacionado 2 horas pagaría: $[cálculo automático]"

## Tab 2: Horarios y Días Especiales
- Sección: Tarifas por Horario
  - Lista de reglas de horario configuradas:
    - Nombre de la regla (ej: "Horario Punta Mañana")
    - Días aplicables (Lunes a Viernes / Fines de semana / Días específicos)
    - Rango horario (desde - hasta)
    - Multiplicador de tarifa (porcentaje o monto fijo adicional)
    - Botón: "Editar" / "Eliminar"
  - Botón: "Crear Nueva Regla de Horario"
- Sección: Días Festivos y Excepciones
  - Calendario interactivo para marcar días festivos
  - Tabla de días festivos configurados:
    - Fecha
    - Nombre del festivo
    - Tarifa especial (aplicar recargo / descuento / cerrado)
    - Botón: "Editar" / "Eliminar"
  - Botón: "Agregar Día Festivo"

## Tab 3: Reglas Generales
- Sección: Tiempo de Gracia
  - Campo: Tiempo de gracia por defecto (minutos, aplica si no está configurado por tipo de vehículo)
  - Checkbox: "Aplicar tiempo de gracia solo en primera hora"
- Sección: Ticket Perdido
  - Campo: Multa fija por ticket perdido (entrada numérica, formato moneda CLP)
  - Checkbox: "Requiere autorización del administrador para procesar ticket perdido"
  - Campo: Tiempo máximo de búsqueda por patente (horas, después de este tiempo se considera ticket perdido)
- Sección: Redondeo de Montos
  - Selector: Redondear montos finales a (Centavo / $10 / $50 / $100)
  - Selector: Método de redondeo (Hacia arriba / Hacia abajo / Al más cercano)
- Sección: Notificaciones de Tarifa
  - Checkbox: "Notificar al operador cuando la tarifa supere un monto específico"
  - Campo condicional: Monto umbral para notificación

## Tab 4: Historial de Cambios
- Tabla de auditoría de cambios en configuración de tarifas:
  - Fecha y hora del cambio
  - Usuario que realizó el cambio (administrador)
  - Tipo de cambio (Creación / Modificación / Eliminación)
  - Detalle del cambio (descripción o diff de valores anteriores vs nuevos)
  - Botón: "Ver Detalle Completo"
- Filtros:
  - Por rango de fechas
  - Por usuario
  - Por tipo de cambio
- Botón: "Exportar Historial" (descarga CSV)

## Modal de Creación/Edición de Regla de Horario
- Campo: Nombre de la regla
- Selector múltiple: Días aplicables (checkboxes: L, M, M, J, V, S, D)
- Campo: Hora de inicio (selector de hora)
- Campo: Hora de fin (selector de hora)
- Selector: Tipo de ajuste
  - Multiplicador (porcentaje, ej: +50% de la tarifa base)
  - Monto fijo adicional (CLP, ej: +$500 por cada hora)
- Campo: Prioridad (número, para resolver conflictos si múltiples reglas aplican)
- Botones: "Guardar" / "Cancelar"

## Validaciones y Alertas
- Validación: No permitir guardar si hay conflictos de horarios sin resolver (múltiples reglas aplicables al mismo período sin prioridad clara)
- Alerta: Si se modifica una tarifa, mostrar impacto estimado: "Esta modificación afectará aproximadamente X vehículos actualmente en el estacionamiento"
- Confirmación requerida: "Los cambios en tarifas se aplicarán inmediatamente. ¿Desea continuar?"
