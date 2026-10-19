# Diseño de Flujo: Aprobación Express Diferida (Admin PIN)

## 1. El Problema Operativo
Actualmente, las acciones críticas (como registrar una fuga o cobrar un ticket extraviado por $8.000 CLP) exigen ingresar el **PIN del Administrador** en tiempo real. Si el Administrador no está físicamente en la garita o no contesta el teléfono, el operador no puede liberar el vehículo de la barrera ni limpiar la pantalla del POS, generando congestión en horas punta.

## 2. La Solución: Aprobación Express (Diferida)
Se introduce el concepto de **Acción Pendiente de Autorización**. El operador puede forzar la liberación de la acción crítica adjuntando una **justificación extensa obligatoria**, dejando la transacción en estado "Pendiente". 
Sin embargo, **el sistema bloqueará el Cierre de Turno** al final de la jornada hasta que el Administrador valide y firme digitalmente todas las acciones pendientes.

---

## 3. Impacto en la Interfaz de Usuario (UI/UX)

### A. Modal de Excepción Antifraude (Momento del Incidente)
Cuando el operador selecciona una acción restrictiva (Rojo - Ej. Fuga o Extravío), el modal de validación de PIN cambiará su estructura:

1. **Campo de Justificación (Expandido):** Se vuelve el elemento central. Si el operador va a usar la "Aprobación Diferida", debe escribir un mínimo de 30 caracteres (Ej. "Vehículo patente ABCD12 rompió barrera y se dio a la fuga, jefe no contesta").
2. **Botón Principal (Autorizar con PIN):** "Validar ahora (Admin)". Requiere ingresar el PIN de 4 dígitos.
3. **Botón Secundario (Aprobación Express):** "Liberar y Dejar Pendiente".
   - Al presionar este botón, el sistema advierte: *"Atención: Esta acción quedará registrada bajo tu responsabilidad y bloqueará el cierre de turno hasta ser visada por administración."*
   - Si se acepta, el ticket se cierra, la barrera se abre (si aplica) y la operación continúa.

### B. Notificador Global (Garita)
- En el **Menú Principal (`#view-menu`)** y en la barra superior (TopBar), aparecerá un badge ámbar intermitente: `[ 2 Aprobaciones Pendientes ]`.
- Esto alerta al operador de que tiene "deuda administrativa" que resolver antes del fin de turno.

### C. Bloqueo en el Cierre de Turno (`[F9]`)
Al presionar `F9` para iniciar el Arqueo Ciego, el sistema verifica si existen aprobaciones pendientes.
- **Si existen pendientes:** El Modal de Cierre de Caja **NO permite avanzar al Paso 1**.
- **Pantalla Interceptora (Muro de Aprobación):** Se despliega una lista de todas las transacciones diferidas del turno actual.
  - Cada ítem muestra: Hora, Patente, Tipo (Ej. TICKET PERDIDO), Monto involucrado, y la Justificación escrita por el operador.
  - El Administrador debe estar presente para revisar la lista y digitar su **PIN de Administrador (9999)** en un único input global llamado *"Firmar y Validar Lote"*.
- Una vez firmado el lote, todas las transacciones pasan a estado "Autorizado" y el operador puede proceder con el conteo de billetes (Paso 1).

---

## 4. Impacto en la Base de Datos y Backend

### Modificación en Entidad `AUDIT_LOGS`
Se añaden nuevos estados al campo de riesgo e identificación:
- `auth_status`: `AUTHORIZED` | `PENDING_ADMIN`.
- Si `auth_status === 'PENDING_ADMIN'`, el `risk_color` se marca temporalmente como `AMBAR_ALERTA`.

### Modificación en Endpoint `/api/checkout`
El endpoint aceptará el parámetro opcional `isDeferredApproval: true`. 
Si se envía `true` sin el PIN del Admin, el backend permitirá cerrar el ticket, pero generará el log de auditoría con `auth_status = 'PENDING_ADMIN'`.

### Modificación en Endpoint `/api/shifts` (Añadir `/api/shifts/approve-batch`)
Nuevo endpoint o acción que recibe:
- `shift_id`
- `admin_pin`
Verifica que el PIN sea de rol Administrador. De ser válido, busca todos los `AUDIT_LOGS` del turno con `PENDING_ADMIN` y los actualiza a `AUTHORIZED` asignando el `autorizador_pin` provisto, permitiendo que `/api/shifts` (CLOSE) pueda ser ejecutado.

---

## 5. Casos de Borde
- **¿Qué pasa si el Administrador no llega a la garita al cierre?**
  El sistema exigirá que el Administrador se contacte por teléfono y le dicte al operador un **PIN de Un Solo Uso (OTP)** o que el administrador ingrese remotamente desde su celular al sistema a través de la nube y apruebe el lote del turno desde su panel de control.
- **Diferencia de Caja:** Las multas diferidas (Ej. $8.000) ya se sumarán al "Efectivo Esperado del Sistema", por ende el operador tiene que tener esos $8.000 físicamente cobrados en su gaveta, o la caja arrojará descuadre al momento del dictamen de IA.
