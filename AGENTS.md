# Directrices del Proyecto: ParkOps PMS & ERP (Cordano Inversiones Inmobiliarias Ltda.)

Este archivo establece las directrices permanentes para el desarrollo del software de gestión de estacionamientos y módulos ERP en este espacio de trabajo.

---

## 1. Entorno de Ejecución, Jerarquía Mayor e Infraestructura Cloud Run

- **Proyecto Jerarquía Mayor**: `CORDANO-PMS-2026`
- **Proyecto GCP**: `gen-lang-client-0862587160` (N° `349577440002`) | Región: `us-west1`
- **Microservicio Cloud Run**: `cordano-pms` en puerto 8080 (URL: `https://cordano-pms-349577440002.us-west1.run.app` / Dominio: `https://cordanopms.ai.studio`)
- **Imagen Base de Producción**: `gcr.io/gen-lang-client-0862587160/cordano-pms-2026:latest` (y `cordano-pms:ai-studio-latest`)
- **Google Stitch Project**: `projects/10292600008632163693` (*ParkOps Parking ERP* - `https://stitch.withgoogle.com/projects/10292600008632163693`)
- **Repositorio Oficial GitHub**: `brau450unab/cordano-pms-oficial` (Sincronizado con Antigravity, AI Studio y Stitch)
- **Repositorio Respaldo GitHub**: `brau450unab/cordano-pms-respaldo` (Puntos de restauración y checkpoints históricos)
- **Benchmarking UI/UX Mobbin**: Cuenta `promarketing6@gmail.com` (Patrones de diseño iOS/Web para POS, Turnos y Matriz)
- **Instalación Física**: Serrano 447, Iquique, Chile (~700 m², 30 plazas: Sector A 01–15, Sector B 16–30 + Sobrecupo SC-01..05)
- **Persistencia**: Monolito Modular Next.js / Vite SPA con soporte Offline-First (IndexedDB local) y sincronización con Cloud Run y Firebase.

---

## 2. Estado de la Arquitectura: Frontend Desacoplado & Core Funcional Puro

> [!NOTE]
> **Estado Actual del Frontend**: Toda la interfaz decorativa anterior (estilos pesados, degradados, fondos fotográficos y visores de mockups) ha sido **desacoplada y neutralizada**. El frontend actual opera como una **Arquitectura Funcional Pura / Wireframe Estructural Limpio**, exponiendo claramente los contratos de datos, formularios, atajos y flujos de negocio sin interferencias cosméticas, listo para recibir un nuevo diseño de interfaz en futuras iteraciones.

---

## 3. Reglas Obligatorias de Dominio y Lógica de Negocio

1. **Ergonomía de Garita (Keyboard-First & Sin Scroll)**:
   - Toda acción operativa crítica (apertura de barrera, búsqueda de patente, selección de cobro, impresión) cuenta con atajos de teclado primarios (`F1` a `F9`, `Enter`, `Esc`).
   - El campo de matrícula/ticket en las vistas de cobro tiene autofoco inmediato.
   - En pantallas de escritorio de garita (1080p / 4K), el flujo operativo principal opera **sin scroll vertical ni horizontal**.

2. **Tipografía Numérica Tabular**:
   - Todo valor monetario en CLP (`$4.500`), contador de tiempo, porcentaje de ocupación o patente utiliza `tabular-nums` y tipografía monoespaciada fija (`font-mono`) para evitar saltos visuales durante actualizaciones en tiempo real.

3. **Código Semántico de Colores para Plazas**:
   - **Disponible**: Verde Esmeralda (`#10B981`)
   - **Ocupada**: Gris Pizarra (`#64748B`)
   - **Reservada**: Ámbar (`#F59E0B`)
   - **Abonado / VIP**: Azul (`#3B82F6`)
   - **PMR (Movilidad Reducida)**: Cian (`#06B6D4`)
   - **Punto de Carga EV**: Violeta (`#8B5CF6`)
   - **Sobrestadía / Alerta**: Rojo (`#EF4444`)

4. **Identificación de Tickets y Modo Offline**:
   - Formato estándar de ticket: `TKT-AAAAMMDD-T0X-XXXX`.
   - Si el ticket fue emitido en contingencia offline, añade el sufijo **`O`** (`TKT-AAAAMMDD-T0X-XXXXO`).
   - Identificación dual en ticket térmico (80mm): **Código QR** (para escaneo 2D o móvil) y **Código lineal (Code 128)** con correlativo alfanumérico visible para escaneo láser o digitación manual.
   - Leyenda legal de advertencia obligatoria sobre el recargo por pérdida de ticket (`$8.000 CLP`).

5. **Auditoría Antifraude y Caja Ciega**:
   - Apertura obligatoria de turno declarando fondo inicial de sencillo para dar vuelto.
   - Descuentos comerciales exigen **PIN individual del operador** y justificación escrita obligatoria (>10 caracteres).
   - Anulaciones de tickets o cobro por ticket extraviado exigen **PIN de Administrador**.
   - Resaltado en auditoría: **Verde** para descuentos autorizados y **Rojo** para recargos/ticket perdido.
   - En arqueo ciego, desglosar: `Efectivo Sistema` vs `Efectivo Recontado Físico` = `Diferencia / Cuadre` + firma criptográfica `SHA-256`.

6. **Estructura Minimalista y Comprensible**:
   - Interfaz limpia, accesible y despojada de adornos innecesarios para facilitar la inspección de la lógica de negocio y las llamadas a los 13 endpoints de API.

7. **Segregación de Roles y Servicios Especiales en Paralelo**:
   - **Incompatibilidad de Caja para Administradores**: El rol de Administrador audita y configura, pero **no puede abrir turnos de caja** directamente (debe utilizar perfil de Operador para salvaguardar la trazabilidad de arqueo).
   - **Servicios Paralelos (Noche / Convenios)**: Los vehículos que pernoctan o pertenecen a convenios mensuales se registran en un submódulo paralelo, bloqueando su plaza en la matriz pero sin ingresar a la lista de transitorios ni alterar la contabilidad rotativa por minuto del día.
