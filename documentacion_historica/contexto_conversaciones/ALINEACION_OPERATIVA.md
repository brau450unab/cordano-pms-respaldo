# Análisis de Alineación (idea-os) - ParkOps Serrano 447

Basado en las respuestas operativas, hemos detectado diferencias críticas entre el diseño tradicional de un PMS y la realidad física de tu operación. El sistema actual requiere ajustes para **no entorpecer la agilidad de la garita**.

---

## FASE 3: Insights y Brechas Operativas (Research)

1. **El Mito de la Barrera Física:** Al no existir una barrera física restrictiva, el sistema actúa como un auditor de permanencia y caja, no como un controlador de acceso de hardware. Los vehículos de convenio operan en modo "confianza" visual, por lo que el POS debe enfocarse al 100% en la velocidad del flujo de transitorios.
2. **Fricción por TOTP Diferida:** Bloquear la salida de un cliente esperando que el supervisor envíe un PIN por WhatsApp genera un cuello de botella inaceptable. La decisión de permitir la excepción (fuga, ticket perdido, rebaja) y **trasladar la rendición de cuentas al Cierre de Turno** es una decisión de diseño de alto nivel (Agilidad > Control inmediato).
3. **Caja Ciega Pura:** El operador nunca debe saber si le sobra o le falta dinero. Si la diferencia es mayor a $2.000, el sistema simplemente lo deja pasar en la interfaz del cajero, pero emite una alerta silenciosa o lo registra en rojo en el Reporte Z del administrador. 
4. **Fondo de Sencillo Estático vs. Retiro:** El cajero no deja la caja en cero; separa el fondo de sencillo (ej. $50.000) y declara el "Efectivo a Entregar/Depositar". El fondo de sencillo se traspasa al siguiente turno.

---

## FASE 4: Refinamiento del PRD (Reglas y Non-Goals)

### Reglas de Negocio Actualizadas
- **Transacciones en Suspenso:** Las anulaciones o cobros de ticket perdido se procesan de inmediato en el POS para liberar el flujo. El ticket queda con estado `excepcion_pendiente`.
- **Cierre de Turno Condicionado:** Al intentar cerrar el turno, si existen tickets en estado `excepcion_pendiente`, el sistema exigirá al cajero ingresar la justificación y, **en ese momento**, el código TOTP del supervisor para validar las excepciones acumuladas.
- **Opacidad del Arqueo:** El modal de Cierre de Caja Ciego **no debe mostrar la palabra "Descuadre" ni el monto de la diferencia al operador**. Solo muestra lo que el operador digitó.
- **Offline Aware:** El sistema debe capturar el estado `navigator.onLine` en el momento del cierre. Si está offline, guarda el cierre en IndexedDB (local) y permite al cajero irse.

### Non-Goals (Lo que NO vamos a construir)
- No vamos a integrar control de hardware de barreras (LPR/Talanqueras).
- No vamos a exigir TOTP en tiempo real con el cliente esperando frente al cajero.
- No vamos a mostrar alertas de descuadre al cajero (evita manipulación posterior de datos).

---

## FASE 5: Plan de Ejecución (Siguientes Pasos en el Código)

Para alinear el código fuente con esta realidad operativa, debemos ejecutar los siguientes pasos técnicos:

### Fase A: Refactorización de la Caja Ciega
1. **Modificar `CierreCajaCiego.tsx`:**
   - Ocultar la columna o texto de "Diferencia" / "Descuadre" para el perfil Operador. 
   - Añadir un campo de "Fondo de Sencillo a dejar en caja" (cuyo valor esperado viene de `ConfiguracionTarifas`).
   - El Operador digita: (1) Sencillo que queda en caja y (2) Efectivo que entrega en el sobre/bolsa.

### Fase B: Excepciones Diferidas (TOTP asíncrono)
2. **Modificar `PuntoVentaSalida.tsx` / `TicketModal.tsx`:**
   - Remover el bloqueo de TOTP al aplicar una multa por "Ticket Perdido". Permitir que se procese, pero marcar el ticket con `requiere_auditoria: true`.
3. **Modificar el Flujo de Cierre:**
   - Antes de abrir el arqueo de billetes, el sistema revisa si hay tickets con `requiere_auditoria`. Si los hay, abre la ventana de autorización TOTP para que el supervisor libere el cierre.

### Fase C: Cierre Offline y Reporte Z
4. **Modificar `pdfGenerator.ts`:**
   - Adaptar el PDF del Reporte Z para reflejar claramente el "Efectivo Entregado" vs "Fondo de Sencillo Traspasado".

> **¿Procedemos con la Fase A y Fase B para modificar el código fuente de los componentes `CierreCajaCiego` y el POS?** (Puedes aprobarlo haciendo clic en Proceed o dándome instrucciones adicionales).
