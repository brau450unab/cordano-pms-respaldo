# Flujo Operativo Paso a Paso: Perfil Operador de Garita
## ParkOps PMS & ERP — Cordano Inversiones Inmobiliarias Ltda. (Serrano 447)
**Versión**: 2.0 Canónica | **Rol**: Operador / Cajero

---

## 1. Diagrama de Flujo Operativo (Jornada Diaria del Operador)

```mermaid
flowchart TD
    %% Estilos Semánticos
    classDef fase fill:#F9F9FB,stroke:#80093A,stroke-width:2px,color:#1D1D1F,font-weight:bold;
    classDef accion fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#334155;
    classDef decision fill:#fffbeb,stroke:#f59e0b,stroke-width:1px,color:#92400e;
    classDef fin fill:#f0fdf4,stroke:#10b981,stroke-width:2px,color:#065f46;
    
    A([Fase 1: Inicio de Turno]) ::: fase --> B[Autenticación PIN en /login] ::: accion
    B --> C{¿Rol Operador?} ::: decision
    C -- Sí --> D[Declarar Fondo Inicial Sencillo] ::: accion
    C -- No (Admin) --> X((Bloqueo de Caja)) ::: decision
    
    D --> E([Fase 2: Ingreso y Ticket]) ::: fase
    E --> F[F2: Autofoco y Digitar Patente] ::: accion
    F --> G[Asignar Plaza en Matriz 7x5] ::: accion
    G --> H[F8: Imprimir Ticket 80mm Dual] ::: accion
    H --> I[F9: Abrir Barrera Entrada] ::: accion
    
    I -.-> J([Fase 3: Servicios Paralelos]) ::: fase
    J --> K[F3: Registrar Convenio / Noche] ::: accion
    K --> L[Bloquea Plaza sin sumar a Caja Transitoria] ::: accion
    
    I --> M([Fase 4: Salida y Cobro]) ::: fase
    M --> N[F2: Escanear Ticket o Digitar Patente] ::: accion
    N --> O{¿Tiempo <= 10 min?} ::: decision
    O -- Sí (Gracia) --> P[Cobro $0 CLP] ::: accion
    O -- No --> Q[Cálculo Tarifa ($30/min o Jornada)] ::: accion
    
    Q --> R([Fase 5: Excepciones]) ::: fase
    R --> S{¿Requiere Excepción?} ::: decision
    S -- Descuento (F6) --> T[PIN Operador + Justificación] ::: accion
    S -- Ticket Perdido (F7) --> U[PIN Administrador] ::: accion
    S -- Pago Normal --> V[Cobro Efectivo/Tarjeta] ::: accion
    T --> V
    U --> V
    
    V --> W[F9: Abrir Barrera Salida] ::: accion
    W --> Y([Fase 6: Cierre de Turno]) ::: fase
    Y --> Z[Arqueo de Caja Ciega] ::: accion
    Z --> AA[Ingresar Efectivo Físico Recontado] ::: accion
    AA --> BB[Sistema revela Cuadre/Diferencia] ::: accion
    BB --> CC(((Emisión Reporte Z SHA-256))) ::: fin
```

---

## 2. Descripción Detallada de Fases y Herramientas del Operador

### Fase 1: Apertura de Turno (Auditoría Inicial)
- **Herramienta Principal**: Pantalla `/login` y Modal de Apertura de Caja (`backdrop-blur`).
- **Acciones**:
  1. El Operador selecciona su perfil e ingresa su **PIN de 4 dígitos** (`font-mono`).
  2. El sistema despliega el **Modal de Fondo Inicial**.
  3. El Operador declara físicamente el dinero sencillo en gaveta (ej. `$50.000 CLP`) para dar vueltos. Sin este paso, la consola POS queda bloqueada.

### Fase 2: Ingreso de Vehículos y Ticket Térmico
- **Herramienta Principal**: Consola POS 40/60 (Atajos de teclado `F1` a `F9`) y Matriz 7x5.
- **Acciones**:
  1. Vehículo llega a la barrera de entrada.
  2. Operador presiona **`F2`** (Autofoco en campo de patente) e ingresa la matrícula (ej. `ABCD-12`).
  3. El sistema asigna automáticamente una plaza (o el operador la selecciona en la Matriz derecha).
  4. Presiona **`F8`** para emitir Ticket Térmico 80mm con Código de Barras `Code 128` y `QR` dual.
  5. Presiona **`F9`** para accionar el pulso del relé y abrir la barrera.

### Fase 3: Servicios Paralelos (Convenios y Noche)
- **Herramienta Principal**: Submódulo de Convenios (Atajo **`F3`**).
- **Acciones**:
  1. Si llega un cliente de Notaría (mensual) o Huésped de Hotel (pernocta), el Operador no emite un ticket transitorio normal.
  2. Presiona `F3` y lo registra en la tabla de **Convenios y Noche**.
  3. Esto bloquea la plaza en la matriz (color **Ámbar `#F59E0B`** o **Azul `#3B82F6`**) asegurando el espacio, pero aislando el cobro para no ensuciar la recaudación rotativa por minuto de la caja del turno.

### Fase 4: Salida, Regla de Gracia y Cobro
- **Herramienta Principal**: Lector Láser y Panel de Liquidación POS.
- **Acciones**:
  1. Vehículo llega a barrera de salida.
  2. Operador pistolea el código de barras (el cursor siempre está en Autofoco `F2`).
  3. El sistema calcula en vivo en el "Recibo Digital".
  4. Si la estadía es **<= 10 minutos** (Regla de Gracia), el total es `$0 CLP`.
  5. Si es superior, aplica la tarifa parametrizada (ej. `$30/min`).
  6. Se selecciona método de pago: Efectivo (`Enter`) o Tarjeta/Débito (`F4`).

### Fase 5: Excepciones Antifraude
- **Herramienta Principal**: Popups de Autorización con PIN (`F6` y `F7`).
- **Acciones**:
  - **Descuento Comercial (`F6` - Verde)**: Si el operador aplica un descuento (ej. promoción), el sistema levanta un modal verde. Requiere su propio **PIN de Operador** y escribir una justificación obligatoria (>10 caracteres).
  - **Ticket Extraviado / Anulación (`F7` - Rojo)**: Si el cliente pierde el ticket, la multa es `$8.000 CLP`. El operador **NO** puede autorizar esto solo; requiere que un Administrador o Supervisor digite su **PIN de Admin** directamente en el modal rojo de la garita.

### Fase 6: Arqueo de Caja Ciega y Cierre Z
- **Herramienta Principal**: Modal de Cierre de Turno.
- **Acciones**:
  1. Al finalizar su horario, el operador inicia el cierre de turno.
  2. **Caja Ciega**: El sistema *oculta* cuánto dinero debería haber (`Efectivo Sistema`).
  3. El operador cuenta los billetes y monedas físicos de la gaveta e ingresa el monto total.
  4. Solo después de confirmar, el sistema revela el desglose y la **Diferencia/Cuadre**.
  5. Se emite el Reporte Z firmado con hash inmutable **SHA-256** y finaliza la sesión.
