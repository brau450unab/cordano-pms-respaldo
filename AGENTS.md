# CORDANO PMS — Reglas de Arquitectura & Contexto Canónico del Proyecto

## 0. [DIRECTIVA PRIMARIA] FUENTE ÚNICA DE LA VERDAD Y MAPA DEL ECOSISTEMA (6 ENTORNOS)
1. **Producción Publicada Online**: `https://cordanopms.ai.studio` / `https://cordano-pms-349577440002.us-west1.run.app` (Instancia pública final oficial).
2. **Google AI Studio App**: `https://aistudio.google.com/app/apps/e1c08131-a20e-48b9-8ee7-ee1d6aede812?showAssistant=true&showPreview=true` (Proyecto para iteraciones visuales y de diseño previas a publicación; cambios realizados aquí se solicitan para sincronizar a local host).
3. **Google Cloud Infrastructure (Cloud Run)**: GCP Project `gen-lang-client-0862587160`, Cloud Run `cordano-pms` (`us-west1`, puerto 8080) (Infraestructura integral full stack que recibe despliegues autorizados).
4. **GitHub Respaldo (Punto de Restauración)**: [`https://github.com/brau450unab/cordano-pms-respaldo`](https://github.com/brau450unab/cordano-pms-respaldo) (Rama `checkpoint-restauracion-cordanopms-ai-studio`). Respaldo exclusivo de restauración con versiones estables. **NO se modifica** en el flujo diario; solo se actualiza cuando se solicita explícitamente crear un nuevo punto de restauración.
5. **GitHub Oficial (Actualizaciones Continuas)**: [`https://github.com/brau450unab/cordano-pms-oficial`](https://github.com/brau450unab/cordano-pms-oficial) (Rama `main` y rama fijada `punto-fijado-cordanopms-ai-studio`). Recibe de forma continua las actualizaciones del proyecto **únicamente bajo orden explícita**.
6. **Localhost (Desarrollo Activo Centralizado)**: `http://localhost:3000` (Directorio oficial único: `C:\Users\BraulioAM\OneDrive - UNIVERSIDAD ANDRES BELLO\PROYECTOS ANTIGRAVITY\PROYECTO CORDANO ENTREGABLE`).
   - **Regla Estricta de Carpeta Centralizada**: Esta es la **ÚNICA** carpeta activa del proyecto para Antigravity y desarrollo local. Las carpetas anteriores (`cordano-pms-version-publicada`, `NUEVO PMS CORDANO`) han sido **PURGADAS Y ELIMINADAS**. Todo cambio, ejecución y actualización se realiza obligatoriamente en `PROYECTO CORDANO ENTREGABLE`.

### 0.1. VERSIÓN CANÓNICA ACTIVA: v2.0.0 (MASTER RELEASE)
- **Versión Vigente**: `v2.0.0` (Master Release - Directorio Oficial: `PROYECTO CORDANO ENTREGABLE`). Ver especificación completa en [VERSION_CANONICA_v2.0.md](file:///C:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/PROYECTO%20CORDANO%20ENTREGABLE/VERSION_CANONICA_v2.0.md).
- **Componentes Consolidados en v2.0.0**:
  - Garita Operativa POS Split-Screen (`PosView.tsx`, `LiveOperationsView.tsx`).
  - Matriz 2D Interactiva con Drag & Drop nativo y cambio rápido de plazas (`PatioMatrix2D.tsx`, `moveOrSwapVehicleSlot`).
  - Ciclo Completo de Salida, Cobro y Emisión de Ticket Térmico 80mm (`CheckoutReceiptModal.tsx`, `generateExitReceiptPdf`, WhatsApp, ESC/POS).
  - Cierre Ciego de Turno en Stepper de 4 etapas (`/operacion/cierre`, `CierreCajaCiego.tsx`, sellado SHA-256, Arqueo A4 con 2 firmas y 2 copias).
  - Control de Turno y RBAC Estricto (bloqueo previo a apertura de turno, dominio exclusivo del cajero de turno `isShiftOwner`, visor para el resto).
  - Notificaciones fijadas en esquina inferior izquierda (`bottom-4 left-4`).
- **Clasificación de Versiones Anteriores (Legacy / Deprecated)**:
  - `Downloads\cordano-pms-version-publicada`: **Versión Anterior v1.0.0 (Publicada previa)**. Congelada y obsoleta.
  - `NUEVO PMS CORDANO`: **Versión Prototipo v0.x**. Anulada.
  - Repositorios y ramas históricas: Puntos de restauración de versiones anteriores.

---

## 1. REGLAS DE TRABAJO MEDIANTE ANTIGRAVITY
1. **Local-First Estricto en Carpeta Centralizada & Consulta de Actualización**:
   - Todo cambio, mejora o actualización solicitada se aplica directa y únicamente en la versión de `localhost` en `PROYECTO CORDANO ENTREGABLE`.
   - Al terminar los cambios en local, ANTIGRAVITY **debe preguntar si se desea actualizar otra instancia**, presentando las opciones de actualización.
2. **Prototipado Visual en Google AI Studio**:
   - Si el proyecto avanza correctamente en local, el usuario solicitará reflejar los cambios en Google AI Studio (`https://aistudio.google.com/app/apps/e1c08131-a20e-48b9-8ee7-ee1d6aede812?showAssistant=true&showPreview=true`) para pruebas y mejoras visuales.
3. **Sincronización AI Studio ↔ Localhost**:
   - Si se hacen cambios en Google AI Studio, luego se solicitará aplicarlos a `localhost`.
   - Si ANTIGRAVITY detecta cambios en Google AI Studio ausentes en local, debe consultar si se desean actualizar analizando el contexto y código modificado.
4. **GitHub Oficial Solo Bajo Orden Explícita**:
   - La versión de GitHub Oficial solo se actualiza de manera explícita y previa confirmación.
5. **GitHub Respaldo Intocable Salvo Nuevo Punto de Restauración**:
   - Solo se actualiza al pedir explícitamente un nuevo checkpoint de respaldo, preservando copias de versiones estables.
6. **Ciclo de Verificación y Agilidad de Desarrollo**:
   - Por defecto, todo cambio va primero a `localhost`, y se pregunta si se desea llevar a Google AI Studio.
   - Si se aplicaron cambios en Google AI Studio, en la **siguiente indicación**, ANTIGRAVITY debe **primero verificar si se quieren descargar los nuevos cambios de AI Studio a localhost**. Se evita perder tiempo en sincronizaciones innecesarias para mantener la agilidad del trabajo local.

---

## 2. CONTEXTO CANÓNICO DE CONVERSACIONES Y ARCHIVO HISTÓRICO
- **DOCUMENTACIÓN (`33563bff-fe19-497c-b065-97d247aa58f8`)**: PRDs, roles (Operador vs. Admin), modelo de datos, recinto físico Serrano 447 (Iquique, 30 plazas: Sector A 01–15, Sector B 16–30), y flujo de **Aprobaciones Express Diferidas** (las excepciones en garita se liberan con justificación obligatoria del cajero y su validación con PIN de Supervisor se posterga en lote al Cierre de Turno para no trabar el flujo vehicular).
- **INTERFAZ (`6eeff568-afba-40ff-994d-eab716bddd53`)**: UX de garita en split-screen (Check-in/Check-out), atajos `F1`–`F10`, y paleta oficial Cordano: Rosa corporativo (`#E2498A` / `#C83472`), Slate claro (`#F8FAFC`) y Dark mode (`#1E1E2F` / `#2D2D44`). Sin colores arbitrarios.
- **ARCHIVO HISTÓRICO**: Centralizado íntegramente en la subcarpeta `documentacion_historica/` (`docs_arquitectura_y_prds/`, `contexto_conversaciones/`, `docs_versiones_archivadas/`).

---

## 3. REGLAS DE NEGOCIO Y DOMINIO OBLIGATORIAS
1. **Apertura de Turno**: Al autenticarse el operador, la garita y el POS están bloqueados. Debe pulsar "Iniciar Turno", declarar el fondo de caja inicial ($50.000 CLP) y recién entonces se desbloquea el POS y arranca el contador del turno.
2. **Formato Monetario Nacional (CLP)**: Símbolo `$` con **punto como separador de miles** (ej. `$ 1.500`, `$ 8.000`, `$ 50.000`), usando siempre tipografía tabular `font-mono tabular-nums`.
3. **Cierre Ciego de Turno**: El arqueo es ciego (la UI no muestra faltante/sobrante al cajero). El cajero declara el fondo que deja en gaveta + sobre entregado. El cierre es definitivo con hash `SHA-256`, detiene el temporizador y bloquea/desautentica el POS sin bucle de "turno abierto".
4. **Documentos Imprimibles y Reporte Z**: Formato en **hoja A4 estándar** corporativa, con **dos casillas para firmas físicas al pie** (Operador y Supervisor) y emisión obligatoria en **dos copias** (Garita y Administración).
5. **Tolerancia y Contingencias**: Gracia de 15 minutos; recargo por ticket extraviado `$ 8.000 CLP` con registro antifraude y validación diferida al cierre.
