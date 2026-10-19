# UI Design Brief: ParkOps PMS & ERP (Serrano 447, Iquique)

- **Goal**: Proporcionar una estación de trabajo de garita y ERP ultra-eficiente, sin scroll en 1080p, con navegación lateral colapsable estilo Dock ERP, operación 100% determinista sin dependencias de IA en el flujo operativo crítico, y sincronización resiliente offline-first.
- **Primary User & Task**:
  - *Operador de Garita*: Registrar ingresos de vehículos en < 4 segundos (`F2`), liquidar salidas con cálculo de vuelto tabular en CLP (`F4`), operar barrera (`F9` / `F8`) y realizar arqueo de caja ciego al fin de turno.
  - *Supervisor / Administrador*: Gestionar convenios en submódulo paralelo (`F3`), auditar bitácora antifraude (`VERDE`/`ROJO`), configurar tarifas Ley 20.967 y supervisar telemetría de Cloud Run.
- **Lead Element**: 
  - En POS (`#view-pos`): El campo de patente vehicular de alto contraste con autofoco inmediato y chip visual `.license-plate-chip`.
  - En Navegación Global: Sidebar lateral colapsable (Dock ERP) con atajos visibles (`F1` a `F9`) e iconos SVG minimalistas, complementado por la barra de estado superior de alta densidad (reloj de turno, badge offline `-O`, gatillo de barrera).
- **Content Realities**:
  - *Capacidad Física*: Exactamente 30 plazas demarcadas (`A-01` a `A-15`, `B-16` a `B-30`) + 5 cupos de sobrecupo (`SC-01` a `SC-05`).
  - *Volumen de Datos*: Desde 0 vehículos (garita vacía con empty-state amigable) hasta 30+ ocupados simultáneamente en patio. Lista compacta lateral con scroll interno si supera la altura de pantalla.
  - *Valores Monetarios*: Formato estricto CLP (`$4.500 CLP`), números tabulares (`font-mono tabular-nums`), base de 30 minutos y 0 minutos de gracia.
- **Destructive Actions**:
  - *Anulación de Tickets y Ticket Extraviado ($8.000 CLP)*: Exigen PIN de Administrador (`9999`) y confirmación modal explícita en contexto rojo.
  - *Descuentos Comerciales*: Exigen PIN de Operador (`1234`), monto y justificación obligatoria $\ge 10$ caracteres en contexto verde.
  - *Cierre de Turno*: Bloqueo irreversible del turno con cálculo ciego de discrepancia y emisión de sello criptográfico `SHA-256`.
- **Theme & Platform**:
  - *Estética*: Linear App / Vercel Dashboard minimalista de alta densidad (fondos `#f4f6f9`, tarjetas `#ffffff`, bordes `#e8ecf0`, tipografía `Plus Jakarta Sans` y monoespacio `JetBrains Mono`).
  - *Resolución Objetivo*: Optimizado para garita de escritorio en 1080p (1920x1080) sin scroll vertical en el POS; adaptable a laptops y tablets.
  - *Conmutador Visual*: Conmutador permanente en cabecera para alternar entre Renders 8K IA (modo presentación) y Wireframes delimitados (modo auditoría técnica).
  - *Accesibilidad*: Cumplimiento WCAG 2.2 AA, contraste $\ge 4.5:1$, estados de foco nativos visibles y navegación íntegra por teclado.
- **Scope Limits**:
  - **EXCLUSIÓN DE IA EN EL FLUJO OPERATIVO CRÍTICO**: Por directriz expresa del usuario, el proceso operativo de garita (ingreso, cobro, barrera, arqueo de caja) es **100% determinista, manual/óptico y sin componentes de IA obligatorios o bloqueantes**. No se requiere LPR IA, Peritaje IA ni Auditoría IA para operar el estacionamiento en tiempo real.
  - La IA (Gemini 2.5) queda relegada exclusivamente a módulos de consulta y soporte auxiliar (`#view-support`), simuladores de super-resolución (`#view-settings`) o herramientas desconectadas del paso operativo.
  - No se realizan despliegues remotos ni `git push` no autorizados; el trabajo se mantiene local y compatible con Google AI Studio.
- **Recorded Assumptions**:
  1. *Sidebar Colapsable*: Se implementa como una barra lateral izquierda expandible/colapsable (ancho 64px colapsado con iconos y tooltips de atajos / ancho 220px expandido con etiquetas completas), maximizando el espacio vertical del POS.
  2. *POS Split-Screen*: El POS conserva la vista dividida en dos columnas: formulario de acción a la izquierda (Ingreso o Cobro) y lista visual/matriz de vehículos en patio a la derecha.
  3. *Sincronización Offline en Background*: La persistencia local en `IndexedDB` encola automáticamente las transacciones con sufijo `-O` y las envía al endpoint `/api/health` / `/api/shifts` sin interrumpir la digitación del operador.
  4. *Segregación RBAC Inviolable*: Los administradores pueden auditar pero no abrir caja directa; los operadores manejan caja pero no autorizan pérdidas de ticket sin PIN de supervisor.
