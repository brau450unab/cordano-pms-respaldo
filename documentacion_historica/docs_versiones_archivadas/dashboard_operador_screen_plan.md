# Dashboard Operador
Pantalla principal del operador que proporciona acceso rápido a las funciones operativas críticas y muestra información en tiempo real sobre el estado del estacionamiento y el turno actual.

Layout Hierarchy:
- Header (Full-width):
  - Top Navigation Bar
- Content Container (Positioned below the header):
  - Main Content Area (divided into 3 zones)

## Top Navigation Bar
- Logo y nombre del sistema
- Indicador de estado de conexión (online/offline)
- Nombre del operador actual y turno activo
- Hora del sistema sincronizada
- Botón de cierre de sesión

## Resumen de Turno Actual
- Hora de inicio del turno
- Tiempo transcurrido
- Recaudación total acumulada (efectivo, tarjeta, cuenta)
- Número de vehículos ingresados en el turno
- Número de vehículos actualmente activos
- Número de vehículos que han salido (tickets cerrados)
- Botón de acceso rápido a "Cerrar Turno"

## Acciones Rápidas Operativas
- Botón destacado: "Registrar Nueva Entrada" (acción principal)
- Botón: "Buscar Vehículo / Procesar Salida"
- Botón: "Ver Layout en Tiempo Real"
- Campo de búsqueda rápida por patente o código de ticket
- Indicador de espacios disponibles vs ocupados

## Estado en Tiempo Real
- Lista de vehículos actualmente en el estacionamiento:
  - Patente del vehículo
  - Tipo de vehículo (auto, moto, camioneta)
  - Slot asignado
  - Hora de entrada
  - Tiempo de estadía (actualizado en tiempo real)
  - Monto acumulado hasta el momento
  - Botón rápido "Procesar Salida"
- Indicador visual de tiempo crítico (vehículos con estadía prolongada destacados)
- Filtros: Todos / Por tipo de vehículo / Por rango de tiempo de estadía

## Alertas Operativas
- Notificaciones de eventos críticos:
  - Impresora desconectada o sin papel
  - Modo offline activado
  - Tickets pendientes de sincronización
  - Vehículos con estadía superior a tiempo estimado
  - Solicitudes de autorización del administrador pendientes
