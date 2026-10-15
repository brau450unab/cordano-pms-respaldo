import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('control de turno: muestra indicador de turno y abre modal con fondo de $50.000 CLP', async ({ app, screen }) => {
  await app.open('/');

  // Autenticación de operador en modal
  await screen.getByRole('button', 'Acceso Garita / POS').click();
  const modal = screen.getByTestId('login-modal');
  await modal.getByPlaceholder('braulio@automatizable.cl o braulio').fill('cajero');
  await modal.getByPlaceholder('••••••••').fill('cajero123');
  await modal.getByRole('button', 'Ingresar al Turno').click();

  // En la barra superior, pulsar "🚀 Iniciar Turno"
  await screen.getByRole('button', '🚀 Iniciar Turno').click();

  // Verifica que el modal de apertura aparezca con sus títulos oficiales
  await expect(screen.getByRole('heading', 'Apertura Oficial de Turno')).toBeVisible();
  await expect(screen.getByText('Declaración de Fondo Inicial en Gaveta (Sencillo)')).toBeVisible();
});
