# Product Charter — Sistema de Gestión de Estacionamiento Iquique

## 1) Posicionamiento del Producto

Ofrecemos una plataforma integral de gestión operativa para pequeñas empresas de estacionamiento en Chile que necesitan digitalizar sus procesos de control, venta y supervisión. El sistema transforma operaciones basadas en papel en flujos digitales confiables, reduciendo pérdidas por errores, fortaleciendo la transparencia en el manejo de efectivo y mejorando la experiencia tanto de operadores como de conductores. A diferencia de soluciones genéricas de punto de venta, nuestro sistema está diseñado específicamente para las particularidades del negocio de estacionamiento: cálculo dinámico de tarifas, control anti-fraude, monitoreo en tiempo real de espacios, y gestión de turnos con cierre de caja ciego.

## 2) Palabras Clave de Marca

- **Confiabilidad** — El sistema funciona sin interrupciones incluso sin conexión a internet, garantizando continuidad operativa en cualquier circunstancia
- **Transparencia** — Cada transacción, ajuste y evento sensible queda registrado en una bitácora de auditoría inmutable que protege tanto al negocio como al personal
- **Eficiencia** — Los flujos de registro de entrada y salida están optimizados para completarse en menos de 10 segundos, minimizando tiempos de espera
- **Claridad** — Las interfaces priorizan información crítica con diseño de alto contraste y tipografía legible, facilitando decisiones rápidas bajo presión
- **Modularidad** — La arquitectura permite integrar servicios externos (cámaras, lectores de patentes, pasarelas de pago) sin reescribir el núcleo del sistema

## 3) Problema Central / JTBD

Cuando un operador de estacionamiento en Iquique necesita controlar entradas, calcular cobros y cerrar turnos de forma confiable, se enfrenta a procesos manuales propensos a errores humanos, falta de trazabilidad en el manejo de efectivo, y ausencia de visibilidad en tiempo real sobre ocupación y recaudación. Los sistemas de papel generan riesgos de pérdida de tickets, descuadres de caja sin explicación, y dificultan la supervisión remota por parte del administrador. El resultado son mermas en los ingresos, conflictos laborales por descuadres no auditables, y pérdida de oportunidades para optimizar tarifas y ocupación basándose en datos reales de operación.

## 4) Metas & Misión

- **Misión:** Empoderar a pequeñas empresas de estacionamiento con tecnología profesional que elimine pérdidas operativas, fortalezca la confianza entre administradores y personal, y proporcione datos precisos para la toma de decisiones estratégicas.

- **Resultados Deseados (descriptivos):**
  - Los operadores completan registros de entrada y salida con confianza, sin temor a cometer errores que afecten su evaluación o la caja
  - Los administradores acceden en tiempo real al estado del negocio desde cualquier dispositivo, identificando patrones de ocupación y oportunidades de mejora
  - Los descuadres de caja se reducen drásticamente gracias al método de cierre ciego y la trazabilidad automática de cada transacción
  - El sistema continúa operando durante cortes de internet, sincronizándose automáticamente al recuperar conexión
  - Cada acción sensible (anulaciones, descuentos manuales, sobrescrituras) requiere autorización y queda registrada con usuario, fecha y hora
  - Las tarifas se adaptan dinámicamente según tipo de vehículo, día de la semana y hora, maximizando ingresos sin perder competitividad

## 5) Soluciones que Ofrecemos

### Control de Ingreso y Salida de Vehículos

- **Qué resuelve:** Elimina el registro manual propenso a errores y pérdida de información, garantizando trazabilidad completa de cada vehículo desde su entrada hasta la consolidación del pago.
- **Flujo típico:** El operador ingresa la patente y tipo de vehículo; el sistema valida que no exista un ingreso activo previo (anti-passback), asigna un slot disponible, calcula tarifas aplicables y emite ticket físico y/o digital vía WhatsApp. Al salir, el operador escanea o ingresa el código del ticket, el sistema calcula el monto según tiempo de estadía y tarifas vigentes, y procesa el pago.
- **Resultado para el usuario:** Registro completo y automático de cada transacción con trazabilidad, eliminación de fraudes por reingresos duplicados, y cálculo preciso de montos a cobrar.
- **Límites:** No incluye lectura automática de patentes (LPR) en el MVP; el operador debe ingresar manualmente la información del vehículo.
- **Principios rectores:** Velocidad / Prevención de fraude / Trazabilidad total
- **Referencias:** Flujo de 4 fases (Ingreso → Estadía → Salida/Cobro → Cierre de Turno)

### Punto de Venta (POS) con Cálculo Inteligente de Tarifas

- **Qué resuelve:** Automatiza el cálculo de cobros según reglas de negocio complejas (tiempo de gracia, tarifa por minuto segmentada por tipo de vehículo y horario), elimina errores de cálculo manual y facilita el manejo de múltiples medios de pago con cálculo automático de vuelto.
- **Flujo típico:** Al procesar una salida, el sistema recupera el ticket, calcula automáticamente el tiempo de estadía, aplica las tarifas correspondientes (considerando tiempo de gracia, horarios especiales, multas por ticket perdido), muestra el monto total y permite seleccionar medio de pago (efectivo, tarjeta, cuenta de cliente). Para pagos en efectivo, calcula y muestra el vuelto en pantalla grande.
- **Resultado para el usuario:** Cobros precisos sin cálculos mentales, transparencia total para el cliente, reducción de errores de cambio, y soporte para estrategias de precios dinámicos.
- **Límites:** Integración con pasarelas de pago será manual en MVP; no incluye pagos contactless o apps de terceros inicialmente.
- **Principios rectores:** Precisión / Transparencia / Rapidez
- **Referencias:** Módulo de tarifas dinámicas, políticas de tiempo de gracia y multa por ticket perdido

### Dashboard en Tiempo Real y Layout Visual del Estacionamiento

- **Qué resuelve:** Proporciona visibilidad instantánea del estado operativo (espacios ocupados/disponibles, vehículos activos, monto recaudado en el turno) y permite supervisión remota sin necesidad de estar físicamente en el sitio.
- **Flujo típico:** El administrador o el operador accede al dashboard desde cualquier dispositivo y visualiza un mapa interactivo con cada slot numerado y su estado. Al hacer clic en un slot, aparece un pop-up con detalles del vehículo y tiempo de estadía. Una vista tipo Kanban agrupa vehículos por lapsos de permanencia (últimos 30 min, 1-2 horas, +2 horas), y un panel de métricas muestra espacios disponibles, recaudación del turno actual y alertas operativas.
- **Resultado para el usuario:** Control visual inmediato del negocio, capacidad de identificar slots problemáticos o vehículos con estadía prolongada, y datos para decisiones estratégicas (ajustar tarifas, promover horarios de baja demanda).
- **Límites:** No incluye proyecciones predictivas ni análisis de demanda avanzado en MVP; el heat map de ocupación será retrospectivo basado en datos históricos.
- **Principios rectores:** Visibilidad instantánea / Claridad visual / Accesibilidad multi-dispositivo
- **Referencias:** Integración opcional con cámaras de circuito cerrado (links directos dentro del sistema)

### Cierre de Caja Ciego y Auditoría Completa

- **Qué resuelve:** Elimina la opción de manipulación de cifras por parte del operador al forzar la declaración del efectivo físico antes de revelar el monto esperado por el sistema, y proporciona trazabilidad completa de eventos sensibles para proteger al negocio de irregularidades.
- **Flujo típico:** Al finalizar el turno, el operador activa el cierre de caja e ingresa el total físico por cada medio de pago (efectivo, transferencias, tarjetas) sin ver el monto que el sistema calculó. Una vez declarado, el sistema genera un reporte comparativo mostrando diferencias, y ambas partes (operador y administrador) reciben una copia digital del resumen del turno. Paralelamente, el sistema registra automáticamente en la bitácora de auditoría todas las acciones sensibles: anulaciones de tickets, descuentos manuales, aperturas de paso sin ticket (requieren clave de administrador), con fecha, hora y usuario responsable.
- **Resultado para el usuario:** Transparencia total en el manejo del efectivo, reducción de conflictos laborales por descuadres, y capacidad de rastrear cualquier irregularidad hasta el usuario y momento exacto en que ocurrió.
- **Límites:** No incluye detección automática de patrones de fraude mediante IA en MVP; el administrador debe revisar manualmente la bitácora y reportes de turno.
- **Principios rectores:** Transparencia absoluta / No repudio / Protección legal
- **Referencias:** Audit trail inmutable, método de cierre de caja ciego, permisos granulares por rol (admin/operador)

### Modo Offline y Sincronización Automática

- **Qué resuelve:** Garantiza continuidad operativa durante cortes de internet, evitando pérdida de ventas o interrupciones del servicio al cliente.
- **Flujo típico:** El sistema detecta la pérdida de conexión y activa automáticamente el modo offline, permitiendo que el POS continúe registrando entradas, salidas y emitiendo tickets mediante almacenamiento local (IndexedDB). Al recuperar la conexión, sincroniza automáticamente todas las transacciones pendientes con el servidor en la nube, actualizando dashboards y bitácoras.
- **Resultado para el usuario:** Operación ininterrumpida del punto de venta, protección contra pérdida de datos, y confianza en que el sistema siempre estará disponible cuando se necesite.
- **Límites:** Funcionalidad offline limitada a operaciones críticas (registro, cobro, emisión de tickets); reportes y configuración avanzada requieren conexión.
- **Principios rectores:** Resiliencia / Continuidad operativa / Sincronización transparente
- **Referencias:** Arquitectura PWA con almacenamiento local, cola de sincronización automática
