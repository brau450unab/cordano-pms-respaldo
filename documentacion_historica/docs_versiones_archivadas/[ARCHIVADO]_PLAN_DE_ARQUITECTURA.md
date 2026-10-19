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


# Plan de Arquitectura de la Aplicación — ParkOps / PMS
**Sistema de Gestión de Estacionamiento (Iquique, Chile)**

---

## 1. Visión General del Sistema

El sistema implementa una arquitectura de **Monolito Modular** con separación clara de dominios, soportando operación sincrónica de escritorio y móvil, alta disponibilidad local para el módulo POS (offline-first) y sincronización a la nube.

### Stack Tecnológico Recomendado
* **Frontend:** Next.js / React (Progressive Web App - PWA), Tailwind CSS, shadcn/ui, Radix UI.
* **Estado & Offline Cache:** React Query (servidor), Zustand (estado POS/sesión), IndexedDB (caché local en cliente para soporte offline).
* **Backend API:** Node.js con Express o Next.js API Routes.
* **Base de Datos:** PostgreSQL (Neon Serverless / Prisma ORM).
* **Colas y Sincronización:** Redis Queue / RabbitMQ (para sincronización offline y notificaciones).
* **Servicios Externos:** WhatsApp Cloud API / Twilio, Pasarela Transbank Webpay / Stripe, Proxy de Impresión Térmica Local (USB/Network), Enlaces de visores CCTV (RTSP/HTTP).

---

## 2. Modelo de Datos (Entidades Principales)

```prisma
// Esquema conceptual del Modelo de Datos (Prisma / Postgres)

enum Role {
  ADMIN
  OPERATOR
  AUDITOR
}

enum VehicleType {
  CAR
  MOTORCYCLE
  TRUCK
  OTHER
}

enum SlotStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
}

enum TicketStatus {
  ACTIVE
  PAID
  LOST
  CANCELLED
}

enum PaymentType {
  CASH
  CARD
  ACCOUNT
  PROMO
  LOST_TICKET_FEE
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role     @default(OPERATOR)
  isActive  Boolean  @default(true)
  phone     String?
  createdAt DateTime @default(now())
  turns     Turn[]
  auditLogs AuditTrail[]
}

model Vehicle {
  id           String      @id @default(uuid())
  plate        String      @unique
  driverPhone  String?
  vehicleType  VehicleType @default(CAR)
  favorite     Boolean     @default(false)
  tickets      Ticket[]
}

model ParkingSlot {
  id                String      @id @default(uuid())
  number            Int         @unique
  status            SlotStatus  @default(AVAILABLE)
  assignedVehicleId String?
  tickets           Ticket[]
}

model Ticket {
  id                String       @id @default(uuid())
  code              String       @unique
  vehicleId         String
  vehicle           Vehicle      @relation(fields: [vehicleId], references: [id])
  slotId            String
  slot              ParkingSlot  @relation(fields: [slotId], references: [id])
  entryTime         DateTime     @default(now())
  exitTime          DateTime?
  estimatedExitTime DateTime?
  status            TicketStatus @default(ACTIVE)
  issuedById        String
  issuedBy          User         @relation(fields: [issuedById], references: [id])
  paymentType       PaymentType?
  amountDue         Decimal?     @db.Decimal(10, 2)
  amountPaid        Decimal?     @db.Decimal(10, 2)
  lostReported      Boolean      @default(false)
  turnId            String?
  turn              Turn?        @relation(fields: [turnId], references: [id])
  createdAt         DateTime     @default(now())
}

model Tariff {
  id             String      @id @default(uuid())
  vehicleType    VehicleType
  validDays      Int[]       // 0-6 (Domingo a Sábado)
  fromHour       Int         // 0-23
  toHour         Int         // 0-23
  pricePerMinute Decimal     @db.Decimal(10, 2)
  graceMinutes   Int         @default(5)
  lostTicketFee  Decimal     @db.Decimal(10, 2)
  active         Boolean     @default(true)
  createdAt      DateTime    @default(now())
}

model Turn {
  id                 String    @id @default(uuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id])
  startTime          DateTime  @default(now())
  endTime            DateTime?
  blindDeclaredCash  Decimal?  @db.Decimal(10, 2)
  systemCashTotal    Decimal?  @db.Decimal(10, 2)
  blindReconciled    Boolean   @default(false)
  details            Json?     // Desglose por medio de pago
  status             String    @default("OPEN") // OPEN, CLOSED, AUDITED
  tickets            Ticket[]
}

model AuditTrail {
  id                    String   @id @default(uuid())
  action                String
  targetType            String   // ticket, user, config, slot, turn
  targetId              String
  userId                String
  user                  User     @relation(fields: [userId], references: [id])
  oldValue              Json?
  newValue              Json?
  timestamp             DateTime @default(now())
  requiresAdminOverride Boolean  @default(false)
}

model CCTVFeed {
  id       String  @id @default(uuid())
  name     String
  url      String
  isActive Boolean @default(true)
}
```

---

## 3. Especificación de la API (RESTful Endpoints)

### Autenticación y Usuarios
* `POST /api/auth/login`: Autenticación con credenciales -> Retorna JWT token.
* `POST /api/auth/logout`: Cierre de sesión.
* `GET /api/users/me`: Perfil del usuario actual y rol.

### Vehículos y Tickets
* `POST /api/vehicles`: Registro o actualización de vehículo por patente.
* `POST /api/tickets`: Generación de ticket de entrada (Check-in).
* `GET /api/tickets/active`: Obtención de vehículos activos y tiempos de permanencia.
* `POST /api/tickets/exit`: Simulación / Cálculo de monto a cobrar en salida.
* `POST /api/tickets/pay`: Registro de pago, emisión de comprobante y liberación de slot.
* `POST /api/tickets/lost`: Declaración de ticket perdido con recargo y autorización admin.

### Layout y Slots
* `GET /api/slots`: Estado actual de los ~30 slots de estacionamiento.
* `POST /api/slots/update`: Cambio manual de estado o asignación de slot.

### Caja y Turnos
* `POST /api/turns/start`: Inicio de turno de operador.
* `POST /api/turns/close`: Cierre de turno ciego (declaración física de efectivo y tarjeta).
* `GET /api/turns/history`: Historial de cierres de caja y auditoría de descuadres.

### Tarifas y Reportes
* `GET /api/tariffs` & `POST /api/tariffs`: Gestión de tarifas dinámicas.
* `GET /api/audit-trail`: Registro inmutable de eventos sensibles.
* `GET /api/reports/occupancy`: Reportes de ocupación y mapas de calor (Heatmaps).

---

## 4. Despliegue e Infraestructura

* **Hosting Frontend:** Vercel (PWA Edge distribution).
* **Backend API:** Railway / Fly.io (Node.js runtime).
* **Database:** Neon PostgreSQL Serverless con backups diarios.
* **Monitoreo & Logs:** Sentry para errores en cliente/servidor y PostHog para analítica de uso.
