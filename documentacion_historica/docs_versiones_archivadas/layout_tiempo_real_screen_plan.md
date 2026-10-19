# Layout en Tiempo Real
Pantalla de visualización interactiva del estado del estacionamiento con mapa de slots numerados, información detallada de cada vehículo y capacidad de gestión manual por parte del operador o administrador.

Layout Hierarchy:
- Header (Full-width):
  - Top Navigation Bar
- Content Container (Positioned below the header):
  - Left Panel: Mapa visual del layout
  - Right Panel: Información detallada y controles

## Top Navigation Bar
- Botón "Volver al Dashboard"
- Título de la página: "Layout en Tiempo Real"
- Indicador de actualización automática (cada 5 segundos)
- Hora del sistema
- Indicador de espacios disponibles vs ocupados (formato: "18/30 ocupados")

## Mapa Visual del Estacionamiento
- Representación visual de todos los slots del estacionamiento (hasta 30 slots)
- Cada slot representado como un rectángulo con:
  - Número del slot (grande y legible)
  - Icono visual según tipo de vehículo asignado (auto, moto, camioneta)
  - Patente del vehículo (si está ocupado)
  - Tiempo de estadía (formato: "2h 15m")
- Estados visuales diferenciados por color:
  - Verde: Disponible
  - Rojo: Ocupado
  - Amarillo: Reservado (si aplica)
  - Gris: Deshabilitado/fuera de servicio
- Interacción: Clic en cualquier slot abre pop-up con información detallada
- Vista responsiva adaptable: grid automático según tamaño de pantalla

## Pop-up de Información del Slot (aparece al hacer clic)
- Si el slot está OCUPADO:
  - Número del slot destacado
  - Patente del vehículo
  - Tipo de vehículo
  - Teléfono del conductor (si disponible)
  - Fecha y hora de entrada
  - Tiempo de estadía (actualizado en tiempo real)
  - Monto acumulado hasta el momento (según tarifa vigente)
  - Código del ticket
  - Botones de acción rápida:
    - "Procesar Salida" (redirige a pantalla de pago)
    - "Liberar Manualmente" (solo administrador, requiere autorización y justificación)
    - "Ver Historial del Vehículo" (si es cliente frecuente)
- Si el slot está DISPONIBLE:
  - Número del slot
  - Última ocupación (fecha y hora)
  - Estado: "Disponible para asignación"
  - Botones de acción:
    - "Asignar Manualmente" (para reservas o situaciones especiales)
    - "Deshabilitar Slot" (solo administrador, para mantenimiento u otros motivos)

## Panel de Vista Kanban (alternativa)
- Toggle para cambiar entre vista de mapa y vista Kanban
- Vista Kanban agrupa vehículos por tiempo de estadía:
  - Columna 1: "Últimos 30 minutos" (vehículos recién ingresados)
  - Columna 2: "30 min - 1 hora"
  - Columna 3: "1 - 2 horas"
  - Columna 4: "2 - 4 horas"
  - Columna 5: "+4 horas" (estadía prolongada, destacado con color de alerta)
- Cada tarjeta de vehículo muestra:
  - Patente
  - Slot asignado
  - Tiempo exacto de estadía
  - Monto acumulado
  - Botón: "Procesar Salida"

## Filtros y Búsqueda
- Campo de búsqueda: Buscar por patente o número de slot
- Filtros rápidos:
  - Ver todos
  - Solo disponibles
  - Solo ocupados
  - Por tipo de vehículo (auto / moto / camioneta)
  - Por rango de tiempo de estadía
- Ordenamiento:
  - Por número de slot (ascendente/descendente)
  - Por tiempo de estadía (mayor a menor / menor a mayor)
  - Por monto acumulado

## Estadísticas Rápidas (Panel Lateral)
- Total de slots configurados
- Slots ocupados (número y porcentaje)
- Slots disponibles (número y porcentaje)
- Tasa de rotación promedio del día
- Tiempo promedio de estadía actual
- Vehículo con mayor tiempo de estadía (alerta visual)

## Acciones de Administración (solo para administrador)
- Botón: "Configurar Layout" (agregar/eliminar slots, cambiar numeración)
- Botón: "Exportar Estado Actual" (descarga CSV o PDF del estado actual del estacionamiento)
- Botón: "Ver Cámaras de Seguridad" (redirige a vista de integración con CCTV)
