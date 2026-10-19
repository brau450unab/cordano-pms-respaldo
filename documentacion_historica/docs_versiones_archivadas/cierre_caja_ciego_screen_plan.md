# Cierre de Caja Ciego
Pantalla para cerrar el turno del operador mediante método de cierre ciego, donde el vendedor declara el efectivo físico antes de que el sistema revele el monto esperado, garantizando transparencia en la reconciliación.

Layout Hierarchy:
- Header (Full-width):
  - Minimal Navigation Bar
- Content Container (Positioned below the header):
  - Wizard de cierre paso a paso

## Minimal Navigation Bar
- Título de la página: "Cierre de Turno"
- Indicador de turno a cerrar (operador y hora de inicio)
- Hora del sistema

## Paso 1: Resumen del Turno (Información Visible)
- Información del turno:
  - Operador responsable
  - Hora de inicio del turno
  - Hora de cierre (actual)
  - Duración total del turno
- Estadísticas operativas (visibles antes de la declaración):
  - Total de vehículos ingresados
  - Total de vehículos procesados (salidas completadas)
  - Vehículos aún activos (pendientes de salida)
  - Número de transacciones de efectivo
  - Número de transacciones con tarjeta
  - Número de transacciones con cuenta de cliente
- Advertencia destacada: "Ingrese los montos físicos ANTES de ver los totales del sistema"
- Botón: "Continuar a Declaración Ciega"

## Paso 2: Declaración Ciega de Efectivo y Pagos
- Instrucciones claras: "Cuente el efectivo y pagos físicos recibidos durante su turno, e ingrese los totales SIN consultar el sistema"
- Formulario de declaración (montos ocultos del sistema):
  - Campo obligatorio: Total en efectivo declarado (entrada numérica con formato de moneda CLP)
  - Campo: Total de transferencias bancarias registradas (entrada numérica)
  - Campo: Total de transacciones con tarjeta (entrada numérica)
  - Campo: Total de pagos con cuenta de cliente (entrada numérica, puede ser $0)
  - Campo de texto opcional: Comentarios u observaciones del turno
- Indicador visual: "Los montos del sistema se revelarán DESPUÉS de su declaración"
- Botón primario destacado: "Confirmar Declaración y Ver Comparación"
- Botón secundario: "Cancelar Cierre"

## Paso 3: Comparación y Reconciliación
- Tabla comparativa en dos columnas (aparece solo después de confirmar declaración):
  - Columna 1: "Monto Declarado por Operador"
    - Efectivo declarado
    - Transferencias declaradas
    - Tarjetas declaradas
    - Cuenta de cliente declarada
    - Total declarado
  - Columna 2: "Monto Calculado por el Sistema"
    - Efectivo esperado (según transacciones registradas)
    - Transferencias esperadas
    - Tarjetas esperadas
    - Cuenta de cliente esperada
    - Total esperado
  - Columna 3: "Diferencia"
    - Diferencia en efectivo (color: verde si es $0, rojo si hay descuadre)
    - Diferencia en transferencias
    - Diferencia en tarjetas
    - Diferencia en cuenta de cliente
    - Diferencia total
- Indicador visual de estado:
  - Verde: Caja cuadrada (diferencia = $0 o dentro de margen de tolerancia)
  - Amarillo: Descuadre menor (dentro de 1-2% del total)
  - Rojo: Descuadre significativo (requiere revisión)
- Desglose detallado de transacciones del turno:
  - Lista expandible de todos los tickets procesados
  - Filtros: Todos / Solo efectivo / Solo tarjeta / Solo transferencia
  - Botón: "Descargar reporte detallado (PDF)"

## Paso 4: Confirmación y Generación de Reporte
- Sección de firma digital (opcional):
  - Checkbox: "Confirmo que los montos declarados son correctos según mi conteo físico"
  - Campo de contraseña del operador para confirmar identidad
- Botones de acción:
  - Botón primario: "Finalizar Cierre de Turno y Generar Reporte"
  - Botón secundario: "Solicitar Revisión del Administrador" (si hay descuadre significativo)
- Al finalizar:
  - Generación automática de reporte resumen del turno (2 copias: operador y administrador)
  - Envío de notificación al administrador
  - Registro completo en bitácora de auditoría
  - Cierre del turno en el sistema
  - Redirección al Dashboard con mensaje de confirmación

## Alertas y Validaciones
- Validación: No permitir cierre si hay vehículos con transacciones de pago pendientes de confirmar
- Alerta: Si hay vehículos activos aún en el estacionamiento (informativo, no bloqueante)
- Alerta crítica: Si el descuadre supera el 5% del total esperado, solicitar revisión obligatoria del administrador antes de finalizar
