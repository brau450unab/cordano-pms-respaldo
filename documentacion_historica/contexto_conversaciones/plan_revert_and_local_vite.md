## Objetivo
Corregir el error de despliegue donde los cambios estéticos y de navegación se aplicaron a la plantilla base de Next.js en lugar de la aplicación principal Vite (`cordano-pms-version-publicada`). Vamos a aplicar correctamente el nuevo diseño y corregir la navegación en la versión local real (`http://localhost:3000`), para luego publicarla cuando sea validada.

## ⚠️ Requiere Revisión (User Review Required)
> [!WARNING] Desincronización de Entornos
> En la interacción anterior apliqué los cambios en el proyecto raíz (Next.js) en vez del proyecto Vite (`cordano-pms-version-publicada`) que es el que utilizas para producción y local. Debido a esto, los cambios no se reflejaron en tu entorno local (puerto 3000) ni en la versión publicada.

> [!IMPORTANT] Acciones Inmediatas
> 1. Detendré el servidor Next.js que inicié erróneamente en el puerto 3000.
> 2. Iniciaré tu aplicación Vite (`npm run dev:vite`) para que retomes el control de tu entorno en `localhost:3000`.
> 3. Migraré el nuevo diseño de la **Landing Page (Canvas Design)**, el **Buscador FAQ** y el **Formulario de Convenios** a `cordano-pms-version-publicada/src/components/pms/LandingView.tsx`.

## Preguntas Abiertas (Open Questions)
¿Hay algún otro componente dentro de la versión publicada (además del menú lateral o Navbar) al que desees que le aplique explícitamente el nuevo color de fondo `#FAFAF5` (blanco invierno) para unificar la estética de la landing con la del POS?

## Cambios Propuestos

---

### Entorno y Servidor Local
Se matará el proceso Node actual en el puerto 3000 (Next.js) y se iniciará el servidor Vite (`npm run dev:vite` o `vite dev`) correspondiente a `cordano-pms-version-publicada`.

### Módulo: `LandingView.tsx` (App Vite)
Se aplicará el código de la nueva estética a `cordano-pms-version-publicada/src/components/pms/LandingView.tsx`.
- **Nuevo Layout:** Distribución lado a lado (Banner Hero a la izquierda, Login Inmediato a la derecha sin popup).
- **Mockup Vectorial:** Nueva visualización gráfica simulando los slots de estacionamiento.
- **Convenios:** Formulario flotante de contacto corporativo con mensaje de éxito integrado.
- **FAQ:** Buscador que exige inicio de sesión interactivo.

#### [MODIFY] `cordano-pms-version-publicada/src/components/pms/LandingView.tsx`
```tsx
// Se reestructurará el return para incluir la nueva estética canvas-design:
<div className="min-h-screen bg-[#FAFAF5] text-slate-900 font-sans">
  <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-24">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">
      {/* Lado Izquierdo: Hero y Mockups */}
      <div className="lg:col-span-7 space-y-12 relative z-10">...</div>
      
      {/* Lado Derecho: Acceso directo (sin popup) */}
      <div className="lg:col-span-5 relative">
        <div className="bg-white rounded-[2rem] p-8 lg:p-12 shadow-[0_20px_40px_-15px_rgba(0,89,181,0.15)] relative z-10">
           {/* Formulario de Login */}
        </div>
      </div>
    </div>
  </div>
</div>
```

### Módulo: `App.tsx` y Redirección de Login
Se corregirá el bug de navegación de la sesión.
Actualmente el login te dejaba en la página principal o en el menú (`onNavigate('menu')`). Se forzará la redirección hacia el panel principal operativo del POS.

#### [MODIFY] Lógica de Autenticación (`LandingView.tsx` / `App.tsx`)
```tsx
const handleLogin = (e) => {
  e.preventDefault();
  // Validaciones...
  setIsLoggedIn(true);
  // Redirección forzada hacia el ecosistema principal en lugar de quedarse atascado:
  onNavigate('pos');
  onLoginSuccess('pos');
}
```

## Plan de Verificación

### Verificación Manual (Usuario)
1. Abrir `http://localhost:3000` en el navegador.
2. Confirmar visualmente la nueva estética de la Landing Page.
3. Iniciar sesión usando las credenciales del operador.
4. Confirmar que el sistema redirige inmediatamente a la consola POS y abre la interfaz principal, solucionando el error anterior.
5. Una vez confirmado que la versión local funciona perfectamente, debes darme la orden (ej: "Todo correcto, procede a publicar") para que yo ejecute `node ecosystem-manager.mjs deploy` y empuje estos cambios a la versión en línea (`https://cordanopms.ai.studio/`).
