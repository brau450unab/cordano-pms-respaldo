# Dashboard Administrador
Pantalla principal del administrador que proporciona visibilidad completa en tiempo real del negocio, con métricas operativas, financieras y de control, accesible desde cualquier dispositivo.

Layout Hierarchy:
- Header (Full-width):
  - Top Navigation Bar
- Content Container (Positioned below the header):
  - Sidebar de navegación principal
  - Main Content Area (dashboard con widgets y métricas)

## Top Navigation Bar
- Logo y nombre del sistema
- Selector de fecha/rango temporal (hoy / última semana / último mes / rango personalizado)
- Indicador de actualización en tiempo real (con timestamp de última actualización)
- Notificaciones pendientes (campana con badge de contador)
- Avatar y nombre del administrador
- Botón de cierre de sesión

## Sidebar de Navegación Principal
- Dashboard (actual, destacado)
- Layout en Tiempo Real
- Reportes
- Auditoría
- Configuración
- Gestión de Usuarios
- Integrations (CCTV, impresoras, pasarelas de pago)

## Métricas en Tiempo Real (Widgets Superiores)
- Widget: Estado del Estacionamiento
  - Espacios totales
  - Espacios ocupados (porcentaje y número)
  - Espacios disponibles
  - Tasa de ocupación actual (porcentaje con indicador visual tipo gauge)
- Widget: Turno Actual
  - Operador en turno
  - Hora de inicio del turno
  - Recaudación acumulada del turno (total y desglose por método de pago)
  - Número de transacciones procesadas
- Widget: Vehículos Activos
  - Cantidad de vehículos actualmente en el estacionamiento
  - Promedio de tiempo de estadía actual
  - Vehículo con mayor tiempo de estadía (alerta si supera umbral)

## Resumen Financiero del Período Seleccionado
- Recaudación total (número destacado con tamaño grande)
- Comparación con período anterior (porcentaje de crecimiento/decrecimiento con flecha visual)
- Gráfico de líneas: Evolución de recaudación diaria
- Desglose por método de pago:
  - Efectivo (monto y porcentaje del total)
  - Tarjeta (monto y porcentaje)
  - Transferencias (monto y porcentaje)
  - Cuenta de cliente (monto y porcentaje)
- Gráfico de torta: Distribución de ingresos por método de pago

## Análisis de Ocupación
- Gráfico de barras: Ocupación promedio por hora del día (identificación de horas punta)
- Gráfico de barras: Ocupación promedio por día de la semana
- Heat map de ocupación (calendario con intensidad de color según tasa de ocupación)
- Métricas clave:
  - Hora de mayor demanda
  - Día de mayor ocupación
  - Tasa de ocupación promedio del período

## Rendimiento Operativo
- Tabla de turnos cerrados (últimos 5-10 turnos):
  - Operador
  - Fecha y hora
  - Duración del turno
  - Recaudación total
  - Número de transacciones
  - Estado de reconciliación (cuadrada / descuadre menor / descuadre significativo)
  - Botón: "Ver detalle" → redirige al reporte completo del turno
- Indicadores de alertas:
  - Número de descuadres detectados en el período
  - Tickets perdidos procesados
  - Anulaciones de tickets realizadas

## Clientes Frecuentes
- Tabla de clientes con más visitas en el período:
  - Patente del vehículo
  - Número de visitas
  - Última visita (fecha y hora)
  - Recaudación total generada por este cliente
  - Promedio de estadía
  - Botón: "Ver historial completo"

## Alertas y Notificaciones Recientes
- Lista de eventos importantes pendientes de revisión:
  - Solicitudes de autorización pendientes (tickets perdidos, anulaciones)
  - Descuadres de caja significativos sin revisar
  - Eventos de auditoría que requieren atención
  - Problemas técnicos detectados (impresora offline, fallas de sincronización)
- Cada alerta con botón de acción rápida: "Revisar" o "Resolver"

## Accesos Rápidos a Funciones Clave
- Botón: "Ver Layout en Tiempo Real"
- Botón: "Generar Reporte Personalizado"
- Botón: "Configurar Tarifas"
- Botón: "Revisar Bitácora de Auditoría"
