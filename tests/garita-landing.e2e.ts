import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('landing page: muestra marca oficial Cordano Iquique y recinto Serrano 447', async ({ app, screen }) => {
  await app.open('/');

  // Verifica elementos de marca corporativa y recinto en la barra y encabezados
  await expect(screen.getByRole('navigation').getByText('Cordano Iquique')).toBeVisible();
  await expect(screen.getByRole('navigation').getByText('PARKING OPS')).toBeVisible();
  await expect(screen.getByText('Terminal Garita · Serrano 447')).toBeVisible();
});

test('landing page: formulario de autenticación para terminal de garita', async ({ app, screen }) => {
  await app.open('/');

  // Verifica campos del formulario de acceso al POS
  await expect(screen.getByRole('heading', 'Iniciar Sesión')).toBeVisible();
  await expect(screen.getByRole('button', 'Iniciar Sesión')).toBeVisible();
});
