# ParkOps Iquique (Serrano 447) - Core Business Rules & Invariants

## 1. Identificadores & SLA
- Check-in: < 10 segundos (Anti-passback indexado < 100ms).
- Check-out: < 60 segundos con calculador de vuelto.
- Ticket ID Online: TKT-AAAAMMDD-T0X-XXXX
- Ticket ID Offline: TKT-AAAAMMDD-T0X-XXXX-O

## 2. Segregación de Roles
- SUPERVISOR: Monitoreo en vivo (ocupación, ingresos, operador activo), gestión de tareas (Kanban), autorización vía PIN.
- OPERATOR: Single Writer en POS, apertura y declaración de Caja Ciega.

## 3. Esquemas de Datos Firestore
- Users: id_usuario, nombre_completo, email, rol, pin_autorizacion, activo, permisos.
- Tasks: id_tarea, titulo, descripcion, estado (TODO, IN_PROGRESS, DONE), prioridad, asignado_a.
- Tickets: id_ticket, patente_normalizada, driver_phone, fecha_hora_ingreso, fecha_hora_salida, duracion_total_minutos, monto_total_cobrado, estado_ticket, id_version_tarifa.
- Shifts: id_turno, id_usuario, monto_inicial, monto_declarado, monto_esperado, diferencia, estado, fecha_apertura, fecha_cierre.
- AuditTrail: id_auditoria, accion, id_usuario, autorizador_pin, fecha_hora, motivo, metadatos.
