import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('autenticación de operador y acceso al panel operacional', async ({ app, screen }) => {
  await app.open('/');

  // Abrir modal de acceso a garita
  await screen.getByRole('button', 'Acceso Garita / POS').click();

  // Localizar modal de login completando credenciales del operador
  const modal = screen.getByTestId('login-modal');
  await modal.getByPlaceholder('braulio@automatizable.cl o braulio').fill('cajero');
  await modal.getByPlaceholder('••••••••').fill('cajero123');
  await modal.getByRole('button', 'Ingresar al Turno').click();

  // Verifica que tras autenticarse se visualicen los módulos operacionales en la barra de navegación
  await expect(screen.getByRole('navigation').getByRole('button', 'Garita POS')).toBeVisible();
  await expect(screen.getByRole('navigation').getByRole('button', 'Plano 2D')).toBeVisible();
});
