# CORDANO PMS — DIRECTRICES CANÓNICAS & MARCO DE REFERENCIA DEL PROYECTO

> **DOCUMENTO MAESTRO DE CONTINUIDAD OPERATIVA, ARQUITECTURA & PROTOCOLO ANTIGRAVITY**  
> *Este documento es la directriz inicial canónica de referencia para cualquier nueva sesión, agente o desarrollador que trabaje en CORDANO PMS (ParkOps).*  
> **Fecha de Actualización:** Octubre 2026  
> **Entidad:** Cordano Inversiones Inmobiliarias Ltda. · Garita Serrano 447, Iquique, Chile.

---

## 1. MAPA DEL ECOSISTEMA (6 ENTORNOS E INSTANCIAS)

El proyecto CORDANO PMS se compone de seis instancias formalmente catalogadas con roles técnicos específicos:

| # | Instancia / Recurso | Identificador / URL | Rol y Naturaleza |
|---|---------------------|---------------------|-------------------|
| **1** | **Producción Publicada Online** | `https://cordanopms.ai.studio` / `https://cordano-pms-349577440002.us-west1.run.app` | **Versión pública final oficial.** Es la instancia desplegada en la nube accesible a garita y usuarios. |
| **2** | **Google AI Studio App** | `https://aistudio.google.com/app/apps/e1c08131-a20e-48b9-8ee7-ee1d6aede812?showAssistant=true&showPreview=true` | **Entorno de prototipado y ajustes visuales.** Permite iteraciones visuales y de diseño previas a la publicación. Los cambios aquí realizados se solicitan para actualizar en local host. |
| **3** | **Google Cloud Infrastructure** | GCP Project: `gen-lang-client-0862587160` · Cloud Run: `cordano-pms` (`us-west1`, puerto 8080) | **Infraestructura integral Cloud Run / Full Stack.** Recibe las actualizaciones y despliegues autorizados de la plataforma. |
| **4** | **GitHub Respaldo (Restauración)** | [`https://github.com/brau450unab/cordano-pms-respaldo`](https://github.com/brau450unab/cordano-pms-respaldo) | **Punto de restauración de emergencia.** Su versión actual es idéntica a la publicada en producción (`checkpoint-restauracion-cordanopms-ai-studio`). **NO se modifica** en el desarrollo continuo; solo se actualiza cuando el usuario solicita explícitamente crear un nuevo punto de restauración con versiones estables. |
| **5** | **GitHub Oficial (Actualizaciones)** | [`https://github.com/brau450unab/cordano-pms-oficial`](https://github.com/brau450unab/cordano-pms-oficial) | **Repositorio oficial de código vivo.** Rama `main` y rama fijada `punto-fijado-cordanopms-ai-studio`. Recibe de manera continua los cambios evolutivos del proyecto únicamente bajo orden explícita. |
| **6** | **Localhost (Desarrollo Activo Centralizado)** | `http://localhost:3000` (Directorio oficial único: `C:\Users\BraulioAM\OneDrive - UNIVERSIDAD ANDRES BELLO\PROYECTOS ANTIGRAVITY\PROYECTO CORDANO ENTREGABLE`) | **Única carpeta local activa y fuente de la verdad para ANTIGRAVITY.** Todas las carpetas previas están formalmente purgadas y eliminadas. |

---

## 2. REGLAS DE TRABAJO MEDIANTE ANTIGRAVITY

1. **Local-First Estricto en Carpeta Centralizada:**
   - Todos los cambios, mejoras y actualizaciones solicitados en ANTIGRAVITY se aplican **directa y únicamente a la versión de `localhost` en `PROYECTO CORDANO ENTREGABLE`**.
   - Quedan terminantemente invalidadas y fuera del ciclo de actualización las carpetas `Downloads\cordano-pms-version-publicada` y `NUEVO PMS CORDANO` (purgadas y eliminadas).
   - Al terminar cualquier cambio en local, ANTIGRAVITY **debe preguntar obligatoriamente** al usuario si desea actualizar otra instancia, presentando las opciones de actualización (Google AI Studio, GitHub Oficial, Cloud Run, etc.).
2. **Prototipado Visual en Google AI Studio:**
   - Cuando el desarrollo local continúe de manera correcta, el usuario podrá solicitar aplicar los cambios en Google AI Studio (`https://aistudio.google.com/app/apps/e1c08131-a20e-48b9-8ee7-ee1d6aede812?showAssistant=true&showPreview=true`) con el fin de realizar mejoras visuales y pruebas interactivas.
3. **Sincronización Bidireccional AI Studio ↔ Localhost:**
   - Si el usuario realiza modificaciones y ajustes en Google AI Studio, posteriormente solicitará que se apliquen a `localhost`.
   - Si ANTIGRAVITY detecta cambios en Google AI Studio que no están en `localhost`, **debe preguntar si se desean actualizar**, analizando exhaustivamente el contexto y el código modificado antes de proceder.
4. **GitHub Oficial Bajo Autorización Explícita:**
   - La versión de GitHub Oficial (`brau450unab/cordano-pms-oficial`) **solamente se actualiza de manera explícita** por orden directa del usuario.
5. **GitHub Respaldo Congelado para Checkpoints Estables:**
   - La versión de GitHub Respaldo (`brau450unab/cordano-pms-respaldo`) **no se actualiza en el flujo regular**. Únicamente se modifica cuando el usuario solicite explícitamente generar un nuevo punto de restauración, preservando un histórico seguro de versiones estables.
6. **Ciclo de Verificación y Agilidad Local:**
   - Todo cambio solicitado sin indicación especial se efectúa en primera instancia en `localhost` (`PROYECTO CORDANO ENTREGABLE`), y a continuación se pregunta si se desea replicar en Google AI Studio.
   - Si el usuario solicita hacer esos cambios en Google AI Studio, en la **siguiente indicación que envíe**, ANTIGRAVITY debe **primero solicitar verificar si el usuario desea descargar los nuevos cambios de Google AI Studio** para incorporarlos a `localhost`.
   - *Objetivo:* Evitar que el agente consuma tiempo excesivo en solicitudes o sincronizaciones en línea innecesarias, garantizando la máxima agilidad de desarrollo local.

---

## 3. CONTEXTO CANÓNICO Y CONVERSACIONES DE REFERENCIA

### 3.1 Archivo Histórico Centralizado (`documentacion_historica/`)
Toda la documentación conceptual, PRDs, diagramas y especificaciones de versiones anteriores se encuentra resguardada en:
- `documentacion_historica/docs_arquitectura_y_prds/`
- `documentacion_historica/contexto_conversaciones/`
- `documentacion_historica/docs_versiones_archivadas/`

### 3.2 Conversación DOCUMENTACIÓN (`33563bff-fe19-497c-b065-97d247aa58f8`)
- **Propósito:** Centralización de PRDs, especificaciones funcionales, roles (Operador vs. Supervisor/Admin), estructura de base de datos híbrida (Offline-First / IndexedDB + Cloud Firestore) y modelo de negocio del recinto.
- **Instalación:** Serrano 447, Iquique, Chile (~700 m², 30 plazas: Sector A 01–15, Sector B 16–30).
- **Aprobaciones Express Diferidas (Antifraude):**
  - Ante excepciones en garita (ticket extraviado `$8.000 CLP`, fuga, descuentos especiales), para no bloquear la salida de clientes ni entorpecer la fluidez vehicular, el operador ingresa una justificación obligatoria (>30 caracteres) y libera el ticket en estado `excepcion_pendiente`.
  - **Bloqueo al Cierre:** Al intentar cerrar el turno (`F9`), el sistema intercepta el arqueo y exige que el Supervisor/Admin valide el lote de excepciones pendientes mediante PIN/TOTP antes de permitir contar la caja.

### 3.3 Conversación INTERFAZ (`6eeff568-afba-40ff-994d-eab716bddd53`)
- **Propósito:** Definición de la experiencia de usuario (UX/UI), ergonomía de garita y sistema de diseño unificado.
- **Identidad Visual Corporativa:**
  - Rosa Cordano oficial: `#E2498A` / `#C83472`
  - Fondos limpios y neutros: Slate claro `#F8FAFC`, dark mode refinado `#1E1E2F` y `#2D2D44`.
  - Cero colores residuales o inconsistentes (cyanes, morados o azules no corporativos).
- **Cockpit de Garita:**
  - Split-Screen Check-in (Ingreso con lectura de patente y ticket 80mm) y Check-out (Cobro con desglose y ticket fiscal).
  - Atajos rápidos de teclado (`F1` a `F10`), navegación accesible por teclado (Enter para confirmar, Esc para cerrar).
  - Optimización táctil para terminales Chromebook, tablets y monitores táctiles.

---

## 4. REGLAS DE NEGOCIO Y DOMINIO OBLIGATORIAS

1. **Apertura de Turno Mandatoria:**
   - Al iniciar sesión el operador, el punto de venta (POS) y el registro de vehículos permanecen estrictamente bloqueados.
   - El operador debe pulsar "Iniciar Turno", declarar el Fondo Inicial de Sencillo ($50.000 CLP por defecto) y marcar el checklist de garita (papel térmico, cámaras, aseo).
   - Solo tras confirmar el fondo inicial se habilita el POS y **recién en ese instante comienza a correr el temporizador del turno**.
2. **Formato Monetario Nacional (CLP):**
   - Todo monto monetario en pesos chilenos debe llevar el símbolo `$` y **punto como separador de miles**: `$ 1.500`, `$ 8.000`, `$ 50.000`.
   - Se debe utilizar siempre tipografía numérica tabular/monoespaciada (`font-mono tabular-nums`).
3. **Cierre de Caja Ciego Puro (Arqueo):**
   - El operador declara el efectivo recontado y vouchers **sin conocer el monto acumulado en el sistema** (la UI no muestra "descuadre" ni "diferencia" al cajero).
   - El cajero declara: (1) Fondo de sencillo que permanece en gaveta para el turno entrante y (2) Efectivo a entregar en el sobre de depósito.
   - El cierre es síncrono y definitivo con sello hash `SHA-256`, detiene el temporizador y expulsa/bloquea el POS de inmediato sin dejar el turno abierto.
4. **Documentos Imprimibles y Reporte Z:**
   - Todos los reportes fiscales de turno se formatean en **hoja A4 estándar** corporativa.
   - Incluyen obligatoriamente casillas para **dos firmas físicas al pie**: Operador de Turno y Administrador/Supervisor.
   - Emisión y exportación automática en **dos copias** (Copia Garita y Copia Administración).
5. **Tarifas, Tolerancia y Contingencias:**
   - Período de gracia: 15 minutos sin cobro.
   - Multa por ticket extraviado: `$ 8.000 CLP` con registro de auditoría diferida.

---

## 5. CHECKLIST OBLIGATORIO PARA CADA INTERACCIÓN DE ANTIGRAVITY

- [ ] ¿El cambio se está implementando en `PROYECTO CORDANO ENTREGABLE`?
- [ ] ¿Se respetó el formato monetario `$ X.XXX` y `font-mono tabular-nums`?
- [ ] ¿Se respetaron los colores oficiales (Rosa Cordano `#E2498A`, Slate `#F8FAFC`, Dark `#1E1E2F`)?
- [ ] Al finalizar, ¿se preguntó al usuario qué otra instancia desea actualizar?
- [ ] Si se actualizará Google AI Studio, ¿se tiene presente verificar la descarga hacia local host en la siguiente interacción?
- [ ] ¿Se abstuvo de ejecutar `git push` a `cordano-pms-oficial` o `cordano-pms-respaldo` sin orden explícita?
