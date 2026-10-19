# Flujo Operativo Diario: Operador ParkOps

El siguiente diagrama detalla el paso a paso estricto de las operaciones diarias de un Cajero/Operador de Garita utilizando la arquitectura modular de ParkOps, respetando la separación entre Sesión (Autenticación) y Turno (Responsabilidad de Caja).

```mermaid
flowchart TD
    %% Estilos
    classDef auth fill:#f9f9f9,stroke:#333,stroke-width:2px,color:#333
    classDef turno fill:#e6f4ff,stroke:#0059b5,stroke-width:2px,color:#0059b5
    classDef accion fill:#10B981,stroke:#047857,stroke-width:2px,color:#fff
    classDef decision fill:#fff3cd,stroke:#ffc107,stroke-width:2px,color:#333
    classDef excepcion fill:#ffebee,stroke:#ef4444,stroke-width:2px,color:#b91c1c
    classDef reporte fill:#f3e8ff,stroke:#8b5cf6,stroke-width:2px,color:#4c1d95

    %% Nodos
    A([1. Iniciar Sesión]):::auth
    B{¿Hay un Turno Activo?}:::decision
    C[2. Iniciar Turno\n- Declarar Fondo Inicial (Sencillo)\n- Descargar PDF Apertura]:::turno
    
    D[[3. Operación en Garita]]:::accion
    D1(Ingreso de Vehículo\n- Leer Patente\n- Emitir Ticket Rollo 80mm)
    D2(Salida de Vehículo\n- Leer Ticket/Patente\n- Cobrar y Emitir Comprobante)
    
    E{¿Situación Excepcional?}:::decision
    E1[Aplicar Multa Ticket Perdido\no Anulación / Fuga]:::excepcion
    E2((Aprobación TOTP\nSupervisor Requerida)):::excepcion
    
    F[4. Proceso de Cierre de Caja]:::turno
    F1[Revisión Visual\n- Confirmar Vehículos en Patio\n- Traspaso al siguiente turno]:::accion
    F2[Arqueo Ciego\n- Contar Efectivo Físico\n- Sumar Vouchers Transbank\n- Declarar montos SIN VER el sistema]:::turno
    
    G{¿Cuadra con Sistema?}:::decision
    G1[Aprobación Automática\nDescuadre dentro de Tolerancia]:::accion
    G2((Aprobación TOTP\nSupervisor Requerida por Descuadre)):::excepcion
    
    H[5. Reporte Z\n- Descargar Reporte Cierre PDF\n- Firma Criptográfica SHA-256]:::reporte
    I([6. Cerrar Sesión (Opcional)]):::auth

    %% Conexiones
    A --> B
    B -- Sí --> D
    B -- No --> C
    C --> D
    
    D --> D1
    D --> D2
    D --> E
    
    E -- Sí --> E1
    E1 --> E2
    E2 --> D
    E -- No --> D
    
    D ====> F
    F --> F1
    F1 --> F2
    F2 --> G
    
    G -- Cuadra --> G1
    G -- No Cuadra --> G2
    
    G1 --> H
    G2 --> H
    
    H --> I
```

### Hitos Críticos del Proceso
1. **Separación de Estados:** El cajero ingresa al sistema (Sesión) pero no puede realizar operaciones financieras ni levantar la barrera hasta que no declare la **Apertura de Turno** y declare su base de sencillo.
2. **Caja Ciega (Blind Close):** Durante el paso 4, la interfaz exige al operador escribir cuánto dinero físico tiene en la mano, bloqueando la información de cuánto "debería haber". Esto elimina intentos de "cuadrar la caja a la fuerza" (robo hormiga).
3. **Aprobaciones Remotas (TOTP):** Toda acción destructiva o descuadre mayor requiere un token de 6 dígitos que solo un administrador posee en su app de Authenticator (Paso 3 y Paso 4).
4. **Firma Criptográfica (Reporte Z):** El paso final asegura que el PDF generado por el operador no puede ser alterado posteriormente, ya que su estado queda estampado con SHA-256 en la nube (Firestore).
