# Parking Ops — Cordano Parking Management System (PMS)
> **Recinto Operativo Oficial**: Serrano 447, Iquique, Región de Tarapacá, Chile  
> **Capacidad Oficial**: 30 Plazas (Sector A: 01–15 Techado · Sector B: 16–30 General)  
> **Versión Canónica Activa**: `v2.0.0 (Master Release)`

---

## 🌐 Enlaces y Producción en Línea
- **Producción Online Oficial**: [https://cordanopms.ai.studio](https://cordanopms.ai.studio)
- **Infraestructura Cloud Run**: [https://cordano-pms-349577440002.us-west1.run.app](https://cordano-pms-349577440002.us-west1.run.app) (Revisión 11 `cordano-pms-00011-z8v`, 100% de tráfico).
- **Repositorio GitHub Oficial**: [https://github.com/brau450unab/cordano-pms-oficial](https://github.com/brau450unab/cordano-pms-oficial) (Ramas `main` y `punto-fijado-cordanopms-ai-studio`).
- **Repositorio GitHub de Respaldo**: [https://github.com/brau450unab/cordano-pms-respaldo](https://github.com/brau450unab/cordano-pms-respaldo) (Punto de restauración inmutable).

---

## 📂 Organización de este Directorio (`PROYECTO CORDANO ENTREGABLE`)

Este directorio ha sido **centralizado y consolidado** como la raíz única del proyecto:

1. **`PROYECTO CORDANO ENTREGABLE/` [RAÍZ ÚNICA CANÓNICA]**:
   - Contiene el **100% del código fuente oficial**, dependencias, configuración de Cloud Run, Dockerfile, tests E2E y documentación histórica.
   - Es la **única carpeta de trabajo** para desarrollo local, ejecución (`npm run dev`) y despliegues.
2. **Carpetas Anteriores (`cordano-pms-version-publicada/`, `NUEVO PMS CORDANO/`)**:
   - Purgadas y eliminadas definitivamente. Todo su contenido histórico y técnico fue respaldado en `documentacion_historica/`.

---

## 🚀 Puesta en Marcha Local
Para ejecutar la aplicación en el puerto local predeterminado (3000):

```bash
npm install
npm run dev
```

La aplicación abrirá en `http://localhost:3000`.

---

## 📋 Reglas de Dominio y Negocio
1. **Control de Turno Estricto**: La garita y el POS permanecen bloqueados hasta que el cajero inicia turno con la declaración del fondo inicial ($50.000 CLP). Solo el cajero activo tiene potestad para realizar movimientos; otros usuarios son visualizadores.
2. **Ciclo Completo de Salida y Cobro**: Liquidación de tiempo conforme a la **Ley N° 20.967**, emisión de boleta/ticket térmico de 80mm con desglose de pago, vuelto, QR y envío instantáneo vía WhatsApp wa.me.
3. **Matriz 2D Interactiva**: Mapa espacial de 30 cupos con funcionalidad drag & drop nativa para reubicar o permutar vehículos entre plazas.
4. **Arqueo Ciego de Caja Z**: Cierre formal en stepper de 4 pasos con hash SHA-256 y acta de cierre en formato A4 con casillas de firma física para Cajero y Supervisor.
