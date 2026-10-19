## Objetivo
Rescatar el contenido de valor de las versiones anteriores de la Landing Page (Preguntas Frecuentes, Ubicación, Información del Local y Funcionalidades) e integrarlo de forma armónica dentro del nuevo diseño fluido (Canvas Style). Adicionalmente, proponer optimizaciones visuales, animaciones interactivas y *showcases* para darle un aspecto de producto tecnológico "premium".

## ⚠️ Requiere Revisión
> [!IMPORTANT] Enfoque Visual vs. Rendimiento
> Añadir muchas animaciones y *blobs* interactivos puede recargar la página. La propuesta se centra en usar CSS puro (SVG y `@keyframes`) e *Intersection Observers* para mantener la página ultraligera y rápida, evitando librerías pesadas como Framer Motion a menos que sea estrictamente necesario.

## Preguntas Abiertas
1. Para la **Ubicación (Serrano 447)**, ¿prefieres mostrar un mapa estilizado tipo Google Maps, o una ilustración isométrica del edificio/estacionamiento?
2. En las **Preguntas Frecuentes**, la versión anterior tenía un buscador que exigía inicio de sesión para ver respuestas ("Contenido Protegido"). ¿Mantenemos esa mecánica de buscador bloqueado para operadores, o hacemos un acordeón tradicional abierto al público?

---

## Propuesta de Cambios e Integraciones

### 1. Reintegración de Contenidos Antiguos

* **Centro de Ayuda (FAQ) + Buscador:** 
  Se reincorporará la sección de preguntas frecuentes utilizando fondos curvos blancos y grises, pero con cajas de búsqueda que floten sobre los *blobs*.
* **Ubicación (Serrano 447, Iquique):**
  Se añadirá una sección oscura (Night Mode) contrastante que muestre la dirección, horario de operación, y métricas del local (30 Plazas, Tarifas Base).

### 2. Optimizaciones Visuales (Showcases y Animaciones)

* **Animaciones de Entrada (Scroll Animations):**
  Implementar clases utilitarias de Tailwind como `animate-fade-in-up` combinadas con un `IntersectionObserver` básico en React, para que las tarjetas de "Monitoreo" y "Convenios" vayan apareciendo suavemente a medida que el usuario baja por la página (Reveal on Scroll).
* **Mockup Interactivo del POS (Caja):**
  En la sección de "Funcionalidades", en lugar de solo listar "Arqueo ciego" y "Cálculo de vuelto", construir un mini *showcase* animado de CSS (un recibo térmico que "sale" de la pantalla o un teclado numérico) para darle dinamismo a la tecnología del PMS.
* **Microinteracciones en el Formulario de Convenios:**
  Mejorar los estados de `hover` y `focus` en el formulario para que los bordes brillen (Ring effect) de forma más notoria.

---

### Detalles Técnicos de Implementación en `LandingView.tsx`

#### [MODIFY] `src/components/pms/LandingView.tsx`
- **Nuevas Clases de Animación:** Se inyectarán clases personalizadas en el archivo `index.css` local para manejar las transiciones.
- **Sección FAQ (Insertar al final):**
  ```tsx
  {/* SECCIÓN FAQ RESCATADA */}
  <section id="faq" className="py-24 bg-white relative overflow-hidden">
     {/* Blob decorativo */}
     <div className="absolute right-0 bottom-0 opacity-5 text-[#E2498A]">...</div>
     <div className="max-w-[800px] mx-auto px-6 text-center z-10 relative">
        <h2 className="text-4xl font-black mb-6">Centro de Ayuda y FAQ</h2>
        <div className="bg-slate-50 p-2 rounded-3xl shadow-inner flex relative">
           <input type="text" placeholder="Buscar procedimiento..." className="w-full bg-transparent p-4 outline-none font-medium" />
           <button className="bg-[#E2498A] text-white px-8 rounded-2xl font-bold">Buscar</button>
        </div>
        {/* Lógica de resultados de la versión anterior */}
     </div>
  </section>
  ```
- **Sección Ubicación (Insertar después del Hero):**
  ```tsx
  {/* SECCIÓN SERRANO 447 */}
  <section id="ubicacion" className="py-12 bg-slate-900 text-white">
     <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
        <div>
           <h3 className="text-2xl font-black">Serrano 447, Iquique</h3>
           <p className="text-slate-400">Capacidad Total: 30 Plazas • Operación 24/7</p>
        </div>
        <div className="text-right">
           <div className="text-[#E2498A] font-black text-4xl">100%</div>
           <div className="text-sm font-bold uppercase tracking-wider text-slate-500">Automatizado</div>
        </div>
     </div>
  </section>
  ```

## Plan de Verificación

### Verificación Manual (Local)
1. Abrir `http://localhost:3000/` y hacer *scroll* hasta el fondo.
2. Confirmar que los bloques de FAQ y Ubicación mantienen la armonía de diseño fluido.
3. Verificar que las animaciones al hacer scroll se disparen correctamente y no ralenticen el navegador.
