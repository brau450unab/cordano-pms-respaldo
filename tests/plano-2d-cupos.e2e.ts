import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('plano 2D: renderiza matriz de 30 cupos en sectores A y B', async ({ app, screen }) => {
  await app.open('/');

  // Autenticación de operador en modal
  await screen.getByRole('button', 'Acceso Garita / POS').click();
  const modal = screen.getByTestId('login-modal');
  await modal.getByPlaceholder('braulio@automatizable.cl o braulio').fill('cajero');
  await modal.getByPlaceholder('••••••••').fill('cajero123');
  await modal.getByRole('button', 'Ingresar al Turno').click();

  // Navegar al módulo Plano 2D desde la barra superior
  await screen.getByRole('navigation').getByRole('button', 'Plano 2D').click();

  // Verifica encabezado de matriz física de 30 plazas y distribución canónica
  await expect(screen.getByRole('heading', 'Matriz Semántica de Serrano 447 (30 Espacios)')).toBeVisible();
  await expect(screen.getByText('Sector A: 01-15 | Sector B: 16-30', { exact: false })).toBeVisible();

  // Verifica inspector de plaza A-01 y slot final B-30 de la matriz
  await expect(screen.getByRole('heading', 'Inspector de Plaza A-01')).toBeVisible();
  await expect(screen.getByText('B-30')).toBeVisible();
});
