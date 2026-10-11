# CORDANO PMS — DIRECTRICES CANÓNICAS & MARCO DE REFERENCIA DEL PROYECTO

> **DOCUMENTO MAESTRO DE CONTINUIDAD OPERATIVA Y ARQUITECTURA**  
> *Este documento es la directriz inicial de referencia para cualquier nueva sesión, agente o desarrollador que trabaje en CORDANO PMS (ParkOps).*  
> **Fecha de Consolidación:** Octubre 2026  
> **Entidad:** Cordano Inversiones Inmobiliarias Ltda. · Garita Serrano 447, Iquique, Chile.

---

## 1. GESTIÓN DE VERSIONES Y FUENTE ÚNICA DE LA VERDAD (SINGLE SOURCE OF TRUTH)

### 1.1 Versión Oficial Única (Producción y Código Vivo)
* **Nombre Oficial:** CORDANO PMS V1 (`cordanopms.ai.studio`)
* **URL Pública Oficial:** `https://cordanopms.ai.studio` / `https://cordano-pms-349577440002.us-west1.run.app`
* **Google Cloud Project:** `gen-lang-client-0862587160` (Cloud Run `us-west1`, puerto 8080)
* **Repositorio Oficial Único:** [`https://github.com/brau450unab/cordano-pms-oficial`](https://github.com/brau450unab/cordano-pms-oficial)
  * **Rama Principal:** `main`
  * **Rama Fijada de Seguridad:** `punto-fijado-cordanopms-ai-studio`
  * **Regla Mandatoria:** Este es el **ÚNICO** repositorio que recibirá actualizaciones, mejoras y nuevos desarrollos de aquí en adelante.

### 1.2 Repositorio de Respaldo Canónico
* **Repositorio:** [`https://github.com/brau450unab/cordano-pms-respaldo`](https://github.com/brau450unab/cordano-pms-respaldo)
* **Rama de Punto de Restauración:** `checkpoint-restauracion-cordanopms-ai-studio`
* **Propósito:** Copia congelada como punto de restauración de emergencia idéntica a la versión desplegada en `cordanopms.ai.studio`.

### 1.3 Clasificación de Entornos Locales
1. **`(cordano version descargada)`**:
   * **Ruta:** `C:\Users\BraulioAM\Downloads\cordano-pms-version-publicada`
   * **Propósito:** Entorno local actualmente en ejecución en `http://localhost:3000` (y red Wi-Fi `http://192.168.1.33:3000`) para verificación del usuario.
2. **`(cordano blanco y negro respaldada)`**:
   * **Ruta:** `C:\Users\BraulioAM\OneDrive - UNIVERSIDAD ANDRES BELLO\PROYECTOS ANTIGRAVITY\NUEVO PMS CORDANO\cordano-pms-version-publicada`
   * **Estado:** **NO ACTIVA / NO PUBLICABLE / OBSOLETA**. Etiquetada formalmente para evitar confusión o despliegues erróneos.
3. **Versiones Eliminadas del Proyecto:**
   * Archivo monolítico de pruebas `PARKOPS_FRONTEND_GOOGLE_AI_STUDIO.html` (Eliminado).
   * Carpetas y archivos zip de prototipos Google Stitch (`stitch mejoras`, `stitch_nuevo_pms...`, `stitch_proyecto...`) (Eliminados).

---

## 2. REGLAS DE NEGOCIO Y DOMINIO OPERATIVO CONSOLIDADAS

### 2.1 Flujo de Inicio de Turno y Garita
1. Al iniciar sesión el operador, el punto de venta (POS) y el patio de vehículos permanecen **estrictamente bloqueados**.
2. No se permite emitir tickets ni registrar patentes hasta realizar la apertura formal del turno.
3. El operador debe presionar el botón obligatorio **"Iniciar Turno"** y declarar en el modal el **fondo inicial de sencillo para dar vuelto** (por defecto `$50.000` CLP).
4. Solo tras confirmar este fondo inicial, el sistema habilita el ingreso de vehículos y **recién en ese momento comienza a correr el temporizador del turno**.

### 2.2 Formato de Moneda Nacional (CLP)
* Todo monto en pesos chilenos debe expresarse con el símbolo de moneda y **separador de miles con punto**:  
  Ejemplo: `$ 1.500`, `$ 8.000`, `$ 50.000`.
* Se debe usar tipografía numérica monoespaciada/tabular (`font-mono tabular-nums`) para evitar saltos visuales durante la actualización de contadores y tablas.

### 2.3 Cierre Ciego de Caja (Arqueo) y Bloqueo Definitivo
1. **Arqueo Ciego:** El operador declara el efectivo físico recontado sin conocer previamente el total acumulado en el sistema.
2. **Desconexión y Bloqueo:** El cierre de turno es síncrono y definitivo. Al confirmar el arqueo ciego:
   * El turno queda formalmente cerrado (`status: 'cerrado'`).
   * El temporizador de turno se detiene y se resetea.
   * La sesión del operador se cierra, expulsando a la pantalla de acceso o bloqueando el POS de manera inmediata para evitar que el turno continúe figurando como "abierto".
3. **Seguridad Criptográfica:** El arqueo genera un hash de integridad `SHA-256` para auditoría antifraude.

### 2.4 Documentos Imprimibles y Reporte Z
* **Formato Estándar:** Todos los reportes de turno (Reporte Z, comprobantes de arqueo y resúmenes financieros) se formatean en **hoja A4 estándar**.
* **Identidad Visual:** Incorporan el diseño corporativo de Cordano PMS (paleta oficial, tipografía, logo vectorial, tabla de métricas).
* **Firmas Requeridas:** Cada documento A4 incluye dos casillas físicas al pie para firma manual:
  1. Firma del **Operador de Turno**.
  2. Firma del **Administrador / Supervisor**.
* **Doble Emisión:** El reporte se genera y exporta en **dos copias automáticas** (Copia Garita y Copia Administración).

### 2.5 Tarifas, Tolerancia y Contingencias
* Tarifa por minuto fraccionada por vehículo (Sedán, Camioneta/SUV, Motocicleta).
* Período de gracia/tolerancia: 15 minutos sin costo.
* Pérdida de ticket: Tarifa fija de `$ 8.000` CLP con requerimiento de autorización de Supervisor.

---

## 3. DIRECTIVA DE TRABAJO LOCAL-FIRST

1. **Desarrollo y Pruebas Exclusivamente Locales:** Todas las iteraciones se construyen y prueban localmente en `http://localhost:3000`.
2. **Prohibición de Despliegue No Autorizado:** Queda estrictamente prohibido ejecutar comandos de despliegue (`gcloud run deploy`, `node ecosystem-manager.mjs deploy`, `git push origin main`) a la nube o a GitHub sin una orden expresa y directa del usuario.
3. **Acceso LAN para Pruebas Multidispositivo (Chromebook / Tablet):**
   * App CORDANO PMS: `http://192.168.1.33:3000`
   * Consola Antigravity (puente proxy): `http://192.168.1.33:52399`

---

## 4. CHECKLIST PARA NUEVAS CONVERSACIONES Y AGENTES

Antes de modificar cualquier archivo en una nueva sesión, el agente debe verificar:
- [ ] Tomar como base de código el proyecto oficial sincronizado con `brau450unab/cordano-pms-oficial`.
- [ ] NO tocar ni resucitar la carpeta `(cordano blanco y negro respaldada)`.
- [ ] Asegurarse de que cualquier cálculo monetario use el formateador `$ X.XXX`.
- [ ] Respetar que el flujo de apertura de turno requiere fondo de caja previo al desbloqueo.
- [ ] Respetar que el Reporte Z es A4 con 2 copias y firmas duales.
- [ ] Trabajar en Local-First sin pushear a producción sin orden explícita.
