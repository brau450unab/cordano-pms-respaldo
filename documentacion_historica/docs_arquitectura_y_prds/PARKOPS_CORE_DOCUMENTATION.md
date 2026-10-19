# ParkOps PMS & ERP - Documentación Central Consolidada

Este documento consolida el estado actual y las reglas del proyecto "NUEVO PMS CORDANO", eliminando especificaciones obsoletas o diseños antiguos, y enfocándose en la versión funcional actual.

## 1. Directivas de Desarrollo
- **Desarrollo Estrictamente Local:** Todas las modificaciones se realizan de forma exclusiva en el entorno local (puerto 3000) dentro de la carpeta `cordano-pms-version-publicada`. No se deben alterar los repositorios online ni versiones publicadas sin instrucción expresa.
- **Arquitectura Funcional y Minimalista:** La interfaz se maneja sin excesos gráficos que interrumpan el flujo. Los colores están designados por significado semántico (e.g. verde disponible, rojo sobrestadía).

## 2. Flujos Funcionales Actuales
- **Portal de Acceso (Landing Page):**
  - Presenta un showcase del sistema y módulos disponibles (Control de Turnos, Reportes, Contratos, etc.).
  - Búsqueda integrada que redirige a la base de conocimiento (Soporte).
- **Control de Turnos (Shift Management):**
  - El sistema depende de aperturas de turno (`currentShift`) y controla ingresos/retiros de efectivo.
  - El cierre de caja es "ciego" (se declaran montos sin conocer los reportes exactos previamente) y genera firmas criptográficas `SHA-256`.
- **Operatividad (POS):**
  - **Keyboard-first:** Toda la garita está diseñada para ser operable mediante el teclado numérico y atajos, sin necesidad de ratón o scroll.
  - **Tipografía Tabular:** Todos los tiempos y valores monetarios utilizan fuente monoespaciada/tabular para evitar saltos de layout durante su actualización.
- **Contratos Mensuales:**
  - Existe un submódulo aparte que congela las plazas de abonados sin interferir con la contabilización por minuto de transitorios.
- **Autorizaciones TOTP:**
  - Ciertas anulaciones o exenciones (como ticktes perdidos) requieren la autorización remota con TOTP por parte de un administrador.

## 3. Pila Tecnológica
- **Frontend:** React + TypeScript + Vite. 
- **Estilos:** Tailwind CSS (`tailwind.config.ts`).
- **Estado Global:** Context API (`ParkingContext`).
- **Arquitectura:** Desacoplada (Frontend sin depender directamente de un Backend de Firebase para el modo Offline, guardando estados en localStorage o IndexedDB según se requiera).

*Nota: Toda la documentación antigua, wireframes, prompts y flujos archivados se han movido a la carpeta `docs_archive` para mantener este espacio limpio.*
