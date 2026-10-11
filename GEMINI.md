# CORDANO PMS — Reglas de Arquitectura & Contexto Canónico del Proyecto

## 0. [DIRECTIVA PRIMARIA] FUENTE ÚNICA DE LA VERDAD Y GESTIÓN DE VERSIONES
1. **Versión Oficial Única**: CORDANO PMS V1 desplegada en `https://cordanopms.ai.studio`.
2. **Repositorio Oficial Único para Actualizaciones**: [`https://github.com/brau450unab/cordano-pms-oficial`](https://github.com/brau450unab/cordano-pms-oficial) (rama `main` y rama fijada `punto-fijado-cordanopms-ai-studio`).
   - **Regla Estricta:** Este es el **ÚNICO** repositorio que recibe cambios y nuevos desarrollos de aquí en adelante.
3. **Repositorio de Respaldo**: [`https://github.com/brau450unab/cordano-pms-respaldo`](https://github.com/brau450unab/cordano-pms-respaldo) (rama `checkpoint-restauracion-cordanopms-ai-studio` como punto de restauración de emergencia).
4. **Estado de Entornos Locales**:
   - `(cordano version descargada)` en `C:\Users\BraulioAM\Downloads\cordano-pms-version-publicada`: En verificación activa en `http://localhost:3000`.
   - `(cordano blanco y negro respaldada)` en `OneDrive\...\cordano-pms-version-publicada`: **NO ACTIVA / NO PUBLICABLE / OBSOLETA**. No modificar ni desplegar.
   - Archivo monolito `PARKOPS_FRONTEND_GOOGLE_AI_STUDIO.html` y carpetas de Stitch: **ELIMINADOS**.
5. **Flujo Local-First Estricto**: Todo cambio se valida localmente antes de cualquier despliegue a la nube. Prohibido ejecutar comandos de deploy o git push sin orden expresa del usuario.

---

## 1. Identificación del Ecosistema
- **Nombre Oficial**: CORDANO PMS (Cordano Parking Ops)
- **Google Cloud Project ID**: `gen-lang-client-0862587160` (CORDANO PMS V1)
- **Cloud Run Host Region**: `us-west1` (puerto 8080)
- **Dominio de Producción**: `https://cordanopms.ai.studio` / `https://cordano-pms-349577440002.us-west1.run.app`
- **Instalación Física**: Serrano 447, Iquique, Chile (~700 m², 30 plazas: Sector A 01–15, Sector B 16–30).

---

## 2. Reglas de Negocio y Dominio Obligatorias
1. **Apertura de Turno**: Al ingresar el operador, la garita y el POS están **bloqueados**. El operador debe pulsar "Iniciar Turno", declarar el fondo de caja inicial ($50.000 CLP) y recién entonces se desbloquea el ingreso de vehículos y arranca el contador del turno.
2. **Formato Monetario Nacional (CLP)**: Todo monto en moneda debe usar el símbolo `$` y **punto como separador de miles** (ej. `$ 1.500`, `$ 50.000`), con fuente tabular monoespaciada (`font-mono tabular-nums`).
3. **Cierre Ciego de Turno**: El cierre es síncrono y definitivo. Al confirmar el arqueo ciego con firma `SHA-256`, el turno se cierra definitivamente, se resetea el contador y se desautentica/bloquea el POS sin quedar en bucle de "turno abierto".
4. **Documentos Imprimibles y Reporte Z**:
   - Formato de impresión en **hoja A4 estándar** con diseño oficial corporativo.
   - Casillas para **dos firmas físicas al pie**: Operador de turno y Administrador/Supervisor.
   - Emisión obligatoria en **dos copias** (Garita y Administración).
5. **Tolerancia y Pérdida de Ticket**: Gracia de 15 minutos; recargo por pérdida de ticket `$ 8.000` CLP con autorización TOTP.
