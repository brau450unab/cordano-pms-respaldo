# Documentación Centralizada: Operaciones y Gestión de Turnos ParkOps

## 1. Conceptos Fundamentales: Sesión vs. Turno

En la arquitectura de **ParkOps**, existe una estricta separación entre el estado de Autenticación (Sesión) y el estado Operativo (Turno).

- **Sesión de Usuario (Login/Logout):** Define quién está utilizando el sistema. Un usuario (Administrador u Operador) puede estar conectado (sesión activa) sin necesidad de tener un turno abierto. La sesión controla el acceso a los módulos (Configuración, Reportes, Dashboard).
- **Turno Operativo (Caja Activa):** Define el periodo durante el cual se registran transacciones financieras, se abren barreras y se reciben pagos. El turno está ligado a una caja física y a la responsabilidad sobre el efectivo. 

> **Regla de Negocio:** Cerrar un turno **no** cierra la sesión del usuario. Iniciar sesión **no** abre un turno automáticamente. 

## 2. Proceso de Apertura de Turno

1. **Requisito Previo:** El usuario debe iniciar sesión. Si no hay un turno activo, el sistema mostrará el botón "Iniciar Turno".
2. **Declaración de Fondo Inicial:** El operador debe declarar el monto en efectivo físico real con el que recibe la caja (sencillo para dar vuelto). 
3. **Generación de Respaldo:** Al confirmar, se genera el registro del turno y el operador puede descargar el **PDF de Apertura de Turno** que documenta el fondo inicial y el ID del turno, firmado criptográficamente.

## 3. Temporizador Operativo

El temporizador visible en la barra superior (Navbar) refleja **exclusivamente el tiempo del Turno Operativo**, no el de la sesión de inicio. 
- Si el turno está cerrado, el temporizador muestra `Turno Inactivo` (00:00:00).
- Al abrir el turno, el temporizador comienza a contar el tiempo de responsabilidad de caja.

## 4. Proceso de Cierre de Caja Ciego

ParkOps utiliza un modelo de **Arqueo Ciego** para garantizar la integridad financiera.

1. **Revisión de Recinto:** El operador debe confirmar visualmente los vehículos que aún permanecen dentro del recinto y que se traspasarán al siguiente turno.
2. **Declaración Ciega:** El operador debe contar el dinero físico y los comprobantes de Transbank y declararlos en el sistema, *sin saber previamente cuánto espera el sistema que haya*.
3. **Cuadratura y Tolerancia:** El sistema compara lo declarado con lo esperado.
   - Si la diferencia (descuadre) es menor a la tolerancia configurada (ej. $2.000 CLP), se acepta el cierre automáticamente.
   - Si excede la tolerancia, requiere **Autorización de Supervisor (PIN o TOTP)**.
4. **Emisión del Reporte Z (PDF):** Al cerrar exitosamente, el turno cambia a estado `cerrado`. En la pantalla de resultados, el operador debe generar y descargar el **Reporte Z en PDF**, el cual detalla los ingresos esperados vs. declarados, diferencias netas, y cuenta con una firma SHA-256 inalterable.
5. **Respaldo en la Nube:** Toda la data del turno cerrado, incluyendo las diferencias y el hash, se sincroniza en Firebase Firestore en tiempo real para auditoría centralizada.

## 5. Respaldo de Transacciones (Tickets)

Todos los tickets generados durante el turno pueden ser exportados a PDF. El formato del ticket PDF simula el rollo térmico (80mm o 58mm) e incluye los datos del vehículo, hora de ingreso/salida y monto total, asegurando que el cliente reciba un comprobante válido incluso sin impresión física.
