# Prompt Estructural: Flujo de Turnos, Arqueo de Caja y Control Antifraude

Este documento contiene un prompt maestro, altamente estructurado, diseñado para ser proporcionado a cualquier modelo de IA (Gemini, Claude, GPT) o equipo de desarrollo. Su objetivo es asegurar que la implementación del ciclo de vida del turno y caja respete las directrices operacionales y de seguridad del ParkOps PMS.

---

**Copia y pega el siguiente texto en tu asistente de IA para generar o auditar la estructura de turnos:**

```markdown
Actúa como Arquitecto de Software y Especialista UX/UI en sistemas ERP/POS de misión crítica. Tu tarea es diseñar, estructurar y/o codificar el **Módulo de Gestión de Turnos, Arqueo de Caja y Control Antifraude** para la plataforma "ParkOps PMS" (Serrano 447).

Debes generar la lógica, componentes React (o especificación de UI) y flujos de estado para los siguientes procedimientos, respetando estrictamente las Reglas de Dominio:

### 1. Fase de Inicio: Apertura de Turno y Caja
- **Regla de Negocio:** Ningún operador puede acceder al POS (Garita) sin haber aperturado un turno activo.
- **UI Requerida:** 
  - Modal o Pantalla inicial de "Apertura de Turno".
  - Selector de Usuario (Operador). *Nota: Los perfiles Administrador tienen bloqueada la apertura de caja.*
  - Campo obligatorio: "Fondo Inicial de Sencillo" (Input numérico, tipografía `tabular-nums`, por defecto `$50.000 CLP`).
  - Checklist visual de 6 puntos operativos (Ej. Cámaras OK, Limpieza OK, Papel térmico OK) que debe marcarse antes de habilitar el botón "Firmar Apertura".
- **Acción:** Al confirmar, se dispara el endpoint `POST /api/shifts` (acción OPEN) y el sistema desbloquea los atajos de teclado (F1 a F9).

### 2. Control de Descuentos y Cobros Parciales (Operador)
- **Regla de Negocio:** Todo descuento sobre la tarifa oficial por minuto (Sedán $25, SUV $30, Moto $15) requiere justificación y firma.
- **UI Requerida:** 
  - Pop-up (Modal) de Autorización de Descuento.
  - Indicador visual de contexto: **Color Verde** (borde o badge).
  - Campo 1: Justificación obligatoria (>10 caracteres).
  - Campo 2: PIN del Operador (Ej. 1234, input tipo `password` con letras grandes y espaciadas).
- **Acción:** Al procesar, el sistema registra el ticket con el monto ajustado y graba un evento en la bitácora inmutable (`/api/audit`) catalogado como 'VERDE'.

### 3. Anulaciones y Recargo por Ticket Extraviado (Administrador)
- **Regla de Negocio:** La eliminación de cobros (Fugas) o la aplicación de la multa por ticket perdido ($8.000 CLP) exigen autorización de nivel superior.
- **UI Requerida:**
  - Pop-up (Modal) de Excepción Antifraude.
  - Indicador visual de contexto: **Color Rojo** (alerta de riesgo).
  - Campo 1: Motivo de la excepción (Ej. "Cliente extravió ticket, presenta padrón").
  - Campo 2: PIN del Administrador (Ej. 9999).
- **Acción:** El sistema audita el evento como 'ROJO', aplica las tarifas correspondientes o anula el registro, y graba el evento crítico en la bitácora.

### 4. Fase de Término: Cierre Ciego y Arqueo (Pop-up de Cierre)
- **Regla de Negocio:** El cierre de caja opera bajo el principio de "Arqueo Ciego" para evitar el cuadre forzado por el operador.
- **UI Requerida:** Un Modal de Cierre de Turno (`[F9]`) estructurado en 3 pasos secuenciales:
  - **Paso 1 (Declaración Física):** El operador cuenta los billetes y monedas de la gaveta, y digita el monto total en un campo grande (`tabular-nums`). *Importante: En este paso, la UI NO muestra cuánto dinero debería haber.*
  - **Paso 2 (Conciliación y Auditoría IA):** Una vez declarado el efectivo físico, el sistema revela:
    1. Efectivo Declarado (Paso 1).
    2. Efectivo Esperado en Sistema (Fondo inicial + Tickets pagados en efectivo).
    3. Diferencia (Sobrante/Faltante).
    - Se invoca `/api/ai/shift-audit`, mostrando un "Dictamen Financiero IA" (Riesgo BAJO, MEDIO o ALTO).
    - Se genera y muestra un Sello Criptográfico `SHA-256`.
  - **Paso 3 (Confirmación y Z):** Botón rojo final "Emitir Corte Z y Cerrar Sesión".
- **Acción:** Invocación de `POST /api/shifts` (acción CLOSE) que finaliza el turno, inyecta los datos en la base de datos (Firestore/Datastore) y retorna a la pantalla de login.

### Restricciones Técnicas y de Estilo
- Usa componentes estéticos tipo Linear/Vercel: fondos limpios (`bg-white`), bordes sutiles (`border-slate-200`), y sombras refinadas.
- Todas las cifras monetarias deben utilizar la clase `font-mono tabular-nums`.
- Las interacciones de los pop-ups deben ser operables mediante teclado (Enter para confirmar, Esc para cancelar).
- Proporciona el código de los modales (React/Tailwind) y las llamadas fetch simuladas a los endpoints correspondientes.
```
