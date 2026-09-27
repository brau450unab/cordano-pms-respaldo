# Arquitectura Funcional & Especificación de Dominio: ParkOps PMS & ERP

**Instalación:** Serrano 447, Iquique, Chile  
**Entorno Cloud Run:** `cordano-pms-v1` | us-west1 | Puerto 8080  
**Estado:** Frontend Desacoplado / Core Funcional Puro (Wireframe Arquitectónico)

---

## 1. Declaración de Estado

Toda la capa de estilos gráficos y decorativos anteriores ha sido neutralizada para exponer de forma diáfana la **lógica de negocio, modelo de datos y contratos de integración**.

El frontend opera actualmente en modo **Wireframe Estructural Limpio**, manteniendo:
1. Las 13 rutas de API en `src/app/api/**`.
2. El modelo de datos en `src/types/index.ts`.
3. El motor de cálculo y persistencia en `src/lib/pmsStore.ts`.
4. El mapa de 30 plazas de Serrano 447 + 5 de sobrecupo con su código semántico de colores.
5. El protocolo de caja ciega con firma criptográfica SHA-256 y auditoría antifraude por PIN.

---

## 2. Paleta Semántica Funcional de Plazas

- **Disponible**: `#10B981` (Verde Esmeralda)
- **Ocupada**: `#64748B` (Gris Pizarra)
- **Reservada**: `#F59E0B` (Ámbar)
- **Abonado / VIP**: `#3B82F6` (Azul)
- **PMR (Movilidad Reducida)**: `#06B6D4` (Cian)
- **Punto de Carga EV**: `#8B5CF6` (Violeta)
- **Sobrestadía / Alerta**: `#EF4444` (Rojo)
