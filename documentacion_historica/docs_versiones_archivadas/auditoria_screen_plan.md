# Auditoría
Pantalla de consulta y análisis de la bitácora de auditoría completa, donde se registran todas las acciones sensibles, eventos críticos y operaciones que requieren trazabilidad para fines de control y cumplimiento.

Layout Hierarchy:
- Header (Full-width):
  - Top Navigation Bar
- Content Container (Positioned below the header):
  - Filters Panel (Left sidebar)
  - Main Content Area (tabla de eventos de auditoría)

## Top Navigation Bar
- Botón "Volver al Dashboard"
- Título de la página: "Bitácora de Auditoría"
- Botón: "Exportar Registros Filtrados" (descarga CSV o PDF)
- Indicador de total de registros mostrados

## Panel de Filtros (Left Sidebar)
- Filtro: Rango de fechas
  - Selector de fecha desde
  - Selector de fecha hasta
  - Atajos rápidos: Hoy / Última semana / Último mes / Rango personalizado
- Filtro: Tipo de evento
  - Checkbox: Anulación de ticket
  - Checkbox: Descuento manual aplicado
  - Checkbox: Ticket perdido procesado
  - Checkbox: Apertura/cierre de turno
  - Checkbox: Liberación manual de slot
  - Checkbox: Cambio de configuración (tarifas, usuarios, slots)
  - Checkbox: Autorización de administrador
  - Checkbox: Eventos de sincronización (modo offline)
  - Checkbox: Errores de sistema
- Filtro: Usuario responsable
  - Selector múltiple de usuarios (operadores y administradores)
  - Opción: "Todos los usuarios"
- Filtro: Nivel de criticidad
  - Baja (eventos informativos)
  - Media (eventos que requieren revisión)
  - Alta (eventos críticos que afectan dinero o seguridad)
  - Crítica (eventos que requieren autorización de administrador)
- Filtro: Requiere revisión
  - Toggle: Mostrar solo eventos pendientes de revisión
- Botón: "Aplicar Filtros"
- Botón: "Limpiar Filtros"

## Tabla de Eventos de Auditoría (Main Content)
- Tabla con las siguientes columnas:
  - Columna 1: Timestamp (fecha y hora exacta con precisión de segundos)
  - Columna 2: Tipo de evento (con icono visual según categoría)
  - Columna 3: Usuario responsable (operador o administrador)
  - Columna 4: Descripción del evento (breve)
  - Columna 5: Entidad afectada (número de ticket, patente, slot, configuración)
  - Columna 6: Nivel de criticidad (badge con color: verde/amarillo/naranja/rojo)
  - Columna 7: Estado de revisión (Pendiente / Revisado / Resuelto)
  - Columna 8: Acciones (Botón "Ver Detalle")
- Paginación: 25 / 50 / 100 registros por página
- Ordenamiento: Por timestamp (descendente por defecto), usuario, tipo de evento, criticidad

## Modal de Detalle de Evento (aparece al hacer clic en "Ver Detalle")
- Header del modal:
  - Tipo de evento destacado
  - Timestamp exacto
  - Nivel de criticidad con icono
- Información del evento:
  - Usuario que realizó la acción (nombre completo, rol)
  - Descripción completa del evento
  - Entidad afectada (con enlace para ver detalle si aplica)
  - IP o dispositivo desde el cual se realizó la acción
- Cambios realizados (si aplica):
  - Valores anteriores (formato JSON o tabla legible)
  - Valores nuevos (formato JSON o tabla legible)
  - Diff visual destacando cambios
- Contexto adicional:
  - Ticket relacionado (si aplica, con enlace)
  - Turno en el que ocurrió
  - Comentarios o justificación ingresados por el usuario
- Autorización (si requirió autorización de administrador):
  - Administrador que autorizó
  - Timestamp de autorización
  - Comentarios del administrador
- Acciones disponibles en el modal:
  - Botón: "Marcar como Revisado"
  - Botón: "Agregar Comentario de Revisión"
  - Botón: "Descargar Registro Completo" (JSON)
  - Botón: "Cerrar"

## Sección de Alertas Críticas (Panel Superior)
- Notificaciones destacadas de eventos críticos recientes que requieren atención inmediata:
  - Número de eventos críticos sin revisar en las últimas 24 horas
  - Último descuadre de caja significativo sin resolver
  - Tickets perdidos procesados recientemente (últimas 48 horas)
  - Anulaciones de tickets del día (con monto total anulado)
  - Errores de sincronización no resueltos
- Cada alerta con botón: "Revisar Ahora" (aplica filtro correspondiente en la tabla)

## Estadísticas Rápidas (Panel Superior)
- Total de eventos registrados en el período seleccionado
- Eventos críticos (número y porcentaje)
- Eventos pendientes de revisión
- Gráfico de líneas: Evolución de eventos por día
- Gráfico de barras: Distribución de eventos por tipo
- Top 5 usuarios con más eventos generados (para identificar patrones)

## Búsqueda Avanzada
- Campo de búsqueda de texto libre (busca en descripción, usuario, entidad afectada, comentarios)
- Sugerencias de búsqueda comunes:
  - "ticket perdido"
  - "anulación"
  - "descuento manual"
  - patente específica
  - número de ticket específico
