# Contrato de API y Rutas - ParkOps Iquique (CORDANO PMS)

## Endpoints Core
- `POST /api/checkin`: Validación anti-passback (<100ms), asignación de slot, emisión de ID canónico.
- `POST /api/checkout`: Cálculo de cobro con versión de tarifa congelada y calculador de vuelto.
- `POST /api/shifts/close`: Cierre de caja ciego y cálculo de diferencias en backend.

## Matriz de Rutas RBAC
- `/login`: Autenticación y redirección por rol.
- `/pos/checkin`: Ingreso rápido (<10s).
- `/pos/checkout`: Cobro y cálculo de vuelto.
- `/pos/shift-close`: Declaración de caja a ciegas.
- `/pos/my-tasks`: Tareas operacionales del turno.
- `/dashboard/live`: Monitoreo en vivo de los 30 slots y recaudación.
- `/dashboard/kanban`: Gestión de tareas operacionales.
- `/dashboard/audit`: Bitácora inmutable y autorizaciones con PIN.
