> [!WARNING]
> **DOCUMENTO HISTÓRICO ARCHIVADO — VERSIÓN ANTERIOR**
> Este documento contiene especificaciones previas o parciales generadas en etapas iniciales del proyecto.
> Ha sido preservado exclusivamente para fines de trazabilidad y auditoría histórica.
> 
> **Documentación Vigente Oficial (V2.0 Canónica)**:
> - PRD Maestro: [PRD_SISTEMA_DE_PARKING.md](file:///docs/PRD_SISTEMA_DE_PARKING.md)
> - Especificaciones Técnicas: [PARKOPS_ESPECIFICACIONES_TECNICAS_V2.md](file:///docs/PARKOPS_ESPECIFICACIONES_TECNICAS_V2.md)
> - Diseño, Flujos y Landing: [ESPECIFICACION_DISENO_FLUJO_Y_LANDING.md](file:///docs/ESPECIFICACION_DISENO_FLUJO_Y_LANDING.md)
> - Mapa de Sitio y Navegación: [MAPA_DE_SITIO_Y_ARQUITECTURA.md](file:///docs/MAPA_DE_SITIO_Y_ARQUITECTURA.md)
> - Índice General: [INDICE_DOCUMENTACION.md](file:///docs/INDICE_DOCUMENTACION.md)
> 
> ---


# Procedimiento Operativo Estándar (SOP): Jornada Diaria del Operador de Garita

**Sistema**: ParkOps PMS & ERP — Cordano Inversiones Inmobiliarias Ltda.  
**Instalación**: Serrano 447, Iquique, Chile (~700 m², 30 plazas canónicas)  
**Propósito**: Guía canónica del flujo de trabajo secuencial paso a paso del cajero de garita desde la apertura hasta el arqueo final.

---

## 1. Diagrama de Flujo de la Jornada Operativa (End-to-End)

```mermaid
flowchart TD
    subgraph F1["FASE 1: Inicio de Sesión & Caja Base"]
        A1["1.1 Login en Navegador<br/>(/login con credenciales)"] --> A2["1.2 Iniciar Turno<br/>(Dispositivo = Caja Activa)"]
        A2 --> A3["1.3 Declaración Inicial<br/>(Fondo de cambio sencillo + vouchers)"]
        A3 --> A4["1.4 Verificación de Arrastre<br/>(Auditoría física vs autos 'In-Parking')"]
    end

    subgraph F2["FASE 2: Ingreso de Vehículos (Check-in <10s)"]
        B1["2.1 Captura Patente<br/>(Chilena asistida o F4 Extranjera)"] --> B2{"2.2 Anti-Passback<br/>¿Patente activa?"}
        B2 -- Sí: Duplicada --> B2_ERR["Alerta Bloqueo<br/>(Forzar ingreso con PIN o Cancelar)"]
        B2 -- No: Libre --> B3["2.3 Tipo de Vehículo<br/>(Auto, SUV, Camioneta, Moto)"]
        B3 --> B4["2.4 Datos Cliente Opcional<br/>(Abonado / +569 / 'No da info')"]
        B4 --> B5{"2.5 Asignación Slot<br/>¿Disponibles ≤ 6?"}
        B5 -- Sí --> B5_SUG["Sugerencia Automática<br/>(Slot óptimo en Ámbar)"]
        B5 -- No --> B5_LIB["Selección Libre<br/>(Operador o conductor)"]
        B5_SUG --> B6["2.6 Emisión de Ticket<br/>(Code 128 térmico + Levantar barrera)"]
        B5_LIB --> B6
        B6 --> B7["Estado: In-Parking"]
    end

    subgraph F3["FASE 3: Estadía & Monitoreo"]
        C1["3.1 Layout 2D & Kanban<br/>(30 Plazas en tiempo real)"]
        C2["3.2 Cronómetro Continuo<br/>(Alertas: >4h Ámbar, >24h Rojo)"]
        C3["3.3 Variantes en Estadía<br/>(Reubicación de slot con bitácora)"]
        C4["3.4 Modo Offline<br/>(IndexedDB local con sufijo 'O')"]
    end

    subgraph F4["FASE 4: Salida & Proceso de Pago (<15s)"]
        D1["4.1 Búsqueda de Ticket<br/>(Pistola láser Code 128 o Patente)"] --> D2["4.2 Liquidación Automática<br/>(Gracia 30m + Tarifa congelada)"]
        D2 --> D2_CHK{"¿Estadía < 5 min?"}
        D2_CHK -- Sí --> D2_WARN["Alerta Temprana<br/>(Confirmar salida rápida)"]
        D2_CHK -- No --> D3["4.3 Visor Gigante de Monto"]
        D2_WARN --> D3
        D3 --> D4{"4.4 Medio de Pago"}
        D4 -- Efectivo --> D4_EFECTIVO["Calculadora de Vuelto Gigante<br/>(Entrega exacta)"]
        D4 -- Tarjeta / Transbank --> D4_TRANSBANK["Terminal POS Externo<br/>(Registro de voucher en PMS)"]
        D4 -- Transferencia --> D4_TRANSF["Verificación de Folio Bancario"]
        D4 -- Conflicto Tarifa --> D4_PIN["Cobro Parcial / Descuento<br/>(PIN de 4 dígitos + Motivo)"]
        D4_EFECTIVO --> D5["4.5 Cierre de Ciclo<br/>(Ticket 'Pagado', recibo wa.me, slot liberado)"]
        D4_TRANSBANK --> D5
        D4_TRANSF --> D5
        D4_PIN --> D5
    end

    subgraph F5["FASE 5: Escenarios & Excepciones"]
        E1["5.1 Ticket Perdido"] --> E1_COND{"¿Patente legible?"}
        E1_COND -- Sí --> E1_OK["Cobro normal por sistema"]
        E1_COND -- No --> E1_MULTA["Multa fija $10.000 + PIN"]
        E2["5.2 Fuga de Vehículo"] --> E2_ACT["Salida manual forzada + PIN<br/>(Auditoría Roja sin afectar caja)"]
        E3["5.3 Falla Impresora"] --> E3_ACT["Alerta en pantalla + WhatsApp"]
        E4["5.4 Apertura Manual Barrera"] --> E4_ACT["Registro automático + Justificación"]
    end

    subgraph F6["FASE 6: Cierre de Turno & Auditoría"]
        F_INIT["6.1 Clic 'Cerrar Turno'<br/>(Protección de sesión activa)"] --> F_BLIND["6.2 Cierre Ciego<br/>(Ocultamiento de totales calculados)"]
        F_BLIND --> F_COUNT["6.3 Conteo Físico por Denominación<br/>($20k, $10k, $5k, $2k, $1k y monedas)"]
        F_COUNT --> F_COMPARE["6.4 Cuadratura 3 Columnas<br/>(Esperado vs Declarado = Cuadre)"]
        F_COMPARE --> F_SEAL["6.5 Sello SHA-256 & Reporte Z<br/>(Cierre formal inmutable)"]
    end

    A4 --> B1
    B7 --> C1
    C1 --> D1
    D1 -. Excepción .-> E1
    D1 -. Excepción .-> E2
    D5 --> F_INIT

    classDef f1 fill:#e0f2fe,stroke:#0369a1,color:#082f49;
    classDef f2 fill:#f0fdf4,stroke:#15803d,color:#14532d;
    classDef f3 fill:#fefce8,stroke:#a16207,color:#713f12;
    classDef f4 fill:#fdf4ff,stroke:#80093A,color:#4a044e;
    classDef f5 fill:#fff1f2,stroke:#be123c,color:#881337;
    classDef f6 fill:#f8fafc,stroke:#334155,color:#0f172a;

    class A1,A2,A3,A4 f1;
    class B1,B2,B2_ERR,B3,B4,B5,B5_SUG,B5_LIB,B6,B7 f2;
    class C1,C2,C3,C4 f3;
    class D1,D2,D2_CHK,D2_WARN,D3,D4,D4_EFECTIVO,D4_TRANSBANK,D4_TRANSF,D4_PIN,D5 f4;
    class E1,E1_COND,E1_OK,E1_MULTA,E2,E2_ACT,E3,E3_ACT,E4,E4_ACT f5;
    class F_INIT,F_BLIND,F_COUNT,F_COMPARE,F_SEAL f6;
```

---

## 2. Matriz de Traducción Funcional: Del Paso Operativo a la Pantalla de Software

| Paso del Operador | Acción Física en Garita | Comportamiento del Software ParkOps | Pantalla / Componente Asignado |
| :--- | :--- | :--- | :--- |
| **1.1 Login** | Abre Chrome y digita usuario/clave | Valida credenciales, comprueba estado de red y prepara el entorno. | `/login` (Selector Perfil + PIN 4 dígitos) |
| **1.2 Iniciar Turno** | Clic en botón "Iniciar Turno" | Registra la terminal como **Caja Activa (Single-Writer)** e inicia el reloj NTP. | Hub de Inicio / Modal de Turno |
| **1.3 Apertura Caja** | Cuenta el sencillo físico en gaveta (\$50.000) | Registra el fondo base y comprobantes heredados como saldo inicial. | `ShiftModal` (Apertura de Turno) |
| **1.4 Arrastre** | Mira los autos en el patio y la pantalla | Muestra lista de autos `In-Parking` de la noche. Permite depurar errores con PIN. | `/operacion/layout` (Tablero Kanban inicial) |
| **2.1 Patente** | Conductor llega; digita patente | Autofoco, formateo automático chileno (AB·CD·12) o switch `F4` extranjera. | `PosCheckin` (Input principal) |
| **2.2 Anti-Passback** | Sistema valida en <100ms | Si la patente está adentro, bloquea con pop-up: "¿Desea forzar ingreso?". | `PosCheckin` (Modal Anti-Passback) |
| **2.3 Tipo Auto** | Selecciona Auto/SUV/Moto | Carga tarifa vigente al ingreso y calcula tiempo de gracia (30m). | `PosCheckin` (Selector de Categoría) |
| **2.4 Datos Cliente** | Pregunta teléfono para ticket digital | Prefijo `+569` fijo; si el cliente dice que no, clic en "No da información". | `PosCheckin` (Campos Opcionales) |
| **2.5 Slot** | Verifica disponibilidad | Si quedan ≤6 espacios libres, sugiere plaza óptima en Ámbar. | `PosCheckin` & `SlotMap` |
| **2.6 Ticket** | Entrega ticket al cliente | Imprime ticket térmico con código de barras Code 128 (sin QR). Levanta barrera. | Impresora 80mm / `window.print()` |
| **3.1 Layout 2D** | Supervisa espacios libres y ocupados | Actualiza en vivo la grilla de 30 plazas con código semántico de colores. | `SlotMap` (Vista 2D Serrano 447) |
| **3.2 Cronómetro** | Detecta autos de larga estadía | Tarjetas Kanban con badges: Ámbar (>4h) y Rojo (>24h alerta de abandono). | `SlotMap` (Vista Kanban) |
| **3.3 Cambio Slot** | Auto se mueve de plaza | Operador arrastra tarjeta al nuevo slot; el sistema audita la reubicación. | `SlotMap` (Drag & Drop con bitácora) |
| **3.4 Sin Internet** | Cae fibra óptica en Iquique | Sistema pasa a modo offline local (IndexedDB) emitiendo tickets con sufijo `O`. | Store PWA Offline-First |
| **4.1 Salida** | Cliente entrega ticket | Pistola láser lee el código de barras o digita patente en buscador rápido. | `PosCheckout` (Input de Búsqueda) |
| **4.2 Cálculo** | Sistema liquida automáticamente | Aplica gracia 30m, redondeo hacia arriba y tarifa congelada al ingreso. | `PosCheckout` (Motor de Cálculo) |
| **4.3 Vuelto** | Cliente paga con \$20.000 en efectivo | Digita \$20.000; la pantalla despliega el **vuelto en números gigantes**. | `PosCheckout` (Calculadora de Vuelto) |
| **4.4 Transbank** | Cliente paga con tarjeta de débito | Digita monto en maquinita Transbank física; confirma en PMS. | `PosCheckout` (Selector Transbank) |
| **4.5 Conflicto** | Cliente reclama demora involuntaria | Operador usa "Cobro Parcial", digita monto acordado, su PIN y motivo. | `PosCheckout` (Modal Cobro Parcial PIN) |
| **4.6 Liberación** | Cobro finalizado | Slot se libera a Verde inmediatamente; ticket pasa a `PAGADO` y `ENTREGADO`. | Store / Layout en Tiempo Real |
| **5.1 Extravío** | Conductor perdió el ticket de papel | Busca por patente; si existe, cobra tiempo real + \$10.000 CLP de multa. | `PosCheckout` (Modal Ticket Extraviado) |
| **5.2 Fuga** | Auto acelera y evade el cobro | Marca salida manual con PIN. Ticket queda anulado en auditoría roja. | `PosCheckout` (Modal Fuga con PIN) |
| **6.1 Cierre** | Termina la jornada laboral | Clic en "Cerrar Turno"; el sistema bloquea nuevas ventas en esa caja. | `ShiftModal` (Protocolo Cierre Ciego) |
| **6.2 Conteo** | Cuenta efectivo en la gaveta | Digita piezas de billetes (\$20k, \$10k, \$5k, etc.) y monedas a ciegas. | `ShiftModal` (Desglose CLP) |
| **6.3 Cuadre** | Envía su declaración física | Sistema revela las 3 columnas: Esperado vs Declarado = Cuadre. Sella SHA-256. | `ShiftModal` (Tabla Cuadratura + Reporte Z) |

---

## 3. Análisis de Valor: Por qué este Esquema es Superior

1. **Eliminación del Estrés Cognitivo**: El cajero nunca tiene que calcular mentalmente fracciones de hora, redondeos a la decena ni vueltos de billetes grandes; el software lo asiste en milisegundos.
2. **Protección Legal y Laboral para el Operador**:
   - Si falta dinero por una fuga o por un cobro parcial autorizado, el operador ingresa su PIN y el sistema lo etiqueta como incidencia justificada, protegiéndolo de descuentos salariales arbitrarios.
3. **Control Ciego Incorruptible para la Propiedad**:
   - El cajero no puede "acomodar" el efectivo antes de cerrar porque el sistema oculta el saldo teórico. La declaración física previa es obligatoria e inmutable.
4. **Resiliencia Total Ante Fallas Externas**:
   - Si falla la impresora: el pago ya está registrado y se envía WhatsApp.
   - Si falla internet: se opera con IndexedDB local y sufijo "O".
   - Si falla Transbank: se conmuta a efectivo o transferencia sin reiniciar el ticket.
