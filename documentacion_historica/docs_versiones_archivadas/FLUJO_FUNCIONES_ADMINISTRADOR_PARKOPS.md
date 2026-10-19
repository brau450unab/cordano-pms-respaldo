# Flujo de Funciones y Herramientas: Perfil Administrador
## ParkOps PMS & ERP — Cordano Inversiones Inmobiliarias Ltda. (Serrano 447)
**Versión**: 2.0 Canónica | **Rol**: Administrador / Gerencia

---

## 🔴 Regla de Segregación de Funciones (Incompatibilidad de Caja)
Por diseño de arquitectura antifraude, el perfil **Administrador (ADMIN)** tiene bloqueada la capacidad de abrir turnos de caja y operar la recaudación de la garita directamente. 
> *Si un Administrador necesita operar físicamente la barrera y cobrar como reemplazo, **debe cerrar sesión e iniciar con un perfil o credencial de OPERADOR**, asegurando así que el Arqueo de Caja Ciega no se contamine con privilegios gerenciales.*

---

## 1. Diagrama de Módulos y Responsabilidades del Administrador

```mermaid
flowchart TD
    %% Estilos Semánticos
    classDef admin fill:#F9F9FB,stroke:#80093A,stroke-width:2px,color:#1D1D1F,font-weight:bold;
    classDef modulo fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#334155;
    classDef dashboard fill:#f8fafc,stroke:#3b82f6,stroke-width:1px,color:#1e40af;
    
    A([Autenticación Admin /login]) ::: admin --> B{Launchpad /admin} ::: modulo
    
    B --> C[1. Panel de Control Ejecutivo /hub] ::: dashboard
    B --> D[2. Configuración y Motor Tarifario] ::: modulo
    B --> E[3. Reportes Z y Auditoría] ::: modulo
    B --> F[4. Usuarios y Roles RBAC] ::: modulo
    B --> G[5. Monitoreo CCTV LPR] ::: modulo
    B --> H[6. Autorización POS Presencial] ::: modulo
    
    C --> C1(Monitor KPIs en tiempo real)
    C --> C2(Control Remoto de Barreras)
    C --> C3(Insights IA Gemini)
    
    D --> D1(Ajuste Tarifa: ej. $30/min)
    D --> D2(Configurar Tiempo de Gracia)
    
    E --> E1(Exportar Historial SHA-256 a PDF/CSV)
    E --> E2(Auditar Excepciones: Verde vs Rojo)
    
    F --> F1(Crear/Bloquear Operadores)
    F --> F2(Asignar PINs Antifraude)
    
    G --> G1(Ver 4 cámaras IP RTSP)
    G --> G2(Validar Lectura de Patentes LPR)
    
    H --> H1(Digitar PIN en pantalla del Operador)
    H --> H2(Autorizar Multa Ticket Perdido / Anulación)
```

---

## 2. Descripción Detallada de Herramientas del Administrador

El Administrador interactúa principalmente con el **Menú Central (Launchpad)** al estilo macOS/Odoo (`/admin`), desde donde accede a todos los submódulos ejecutivos:

### 1. Panel de Control Ejecutivo (`/hub`)
- **Propósito**: Vista de halcón (bird's-eye view) de la operación en tiempo real.
- **Herramientas**:
  - **4 Tarjetas KPI (`tabular-nums`)**: Visualiza Recaudación Diaria, Porcentaje de Ocupación, Alertas de Barrera y Estado de Sincronización Cloud Run.
  - **Control Remoto**: Capacidad para forzar la apertura/cierre de las barreras de acceso de Serrano 447 desde la oficina administrativa sin estar en la garita.
  - **Copiloto Gemini IA**: Widget que procesa telemetría y sugiere ajustes dinámicos (ej. *"Detectada alta ocupación, sugerimos derivar flujo al sector B"*).

### 2. Configuración y Motor Tarifario (`/configuracion`)
- **Propósito**: Parametrización central del modelo de negocio.
- **Herramientas**:
  - Ajuste del valor por minuto (Actualmente **$30 CLP**).
  - Modificación del periodo de gracia (Actualmente **10 minutos** no acumulables).
  - Establecimiento de Tarifas Planas (Jornada Diurna **$6.000**, Noche **$5.000**).
  - Fijación del monto de la multa por **Ticket Extraviado** (Actualmente **$8.000**).
  - Gestión de conexión de hardware (Impresora 80mm ESC/POS y endpoints Cloud Run `us-west1`).

### 3. Reportes Financieros y Auditoría (`/reportes`)
- **Propósito**: Trazabilidad y contabilidad.
- **Herramientas**:
  - **Auditoría Semántica**: Tabla de registro inmutable que muestra en **Verde** los descuentos menores aplicados por operadores (con su justificación) y en **Rojo** las anulaciones y tickets perdidos.
  - **Historial de Cierres Z**: Visualización de todos los Arqueos de Caja Ciega pasados. Cada cierre cuenta con un sello hash **SHA-256** que garantiza que los montos declarados no fueron alterados en la base de datos a posteriori.
  - Exportación directa de datos estructurados a **PDF** y **CSV** para contabilidad.

### 4. Gestión de Usuarios y Roles RBAC (`/admin/usuarios`)
- **Propósito**: Control de accesos y seguridad física/digital.
- **Herramientas**:
  - Alta, baja y suspensión de cuentas de Operadores y Supervisores.
  - Asignación y revocación de **PINs de 4 dígitos** individuales. (El PIN es la firma digital del empleado para cualquier excepción antifraude en el POS).

### 5. Centro de Monitoreo CCTV LPR (`/cctv`)
- **Propósito**: Seguridad visual y verificación de patentes.
- **Herramientas**:
  - Grilla de video 2x2 conectada a los flujos RTSP de las cámaras del estacionamiento.
  - Visualización del overlay de reconocimiento óptico de caracteres (LPR) que extrae la patente y su porcentaje de confianza directamente sobre el video en vivo.

### 6. Autorización Presencial en Garita (POS)
- **Propósito**: Desbloqueo de operaciones críticas in situ.
- **Herramientas**:
  - Cuando un Operador enfrenta una situación de alto riesgo (ej. cliente perdió el ticket y se niega a pagar, o se requiere anular un cobro mal emitido), el sistema de garita levanta un modal rojo.
  - El Administrador (o Supervisor) debe acercarse físicamente a la consola POS del operador y digitar su propio **PIN de Admin** para destrabar el flujo y autorizar la acción bajo su responsabilidad en la bitácora.
