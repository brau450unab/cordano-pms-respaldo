import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('flujo operativo garita: apertura de turno, ingreso vehicular con ticket y cobro de salida', async ({ app, screen }) => {
  await app.open('/');

  // 1. AUTENTICACIÓN OPERADOR EN GARITA
  await screen.getByRole('button', 'Acceso Garita / POS').click();
  const loginModal = screen.getByTestId('login-modal');
  await loginModal.getByPlaceholder('braulio@automatizable.cl o braulio').fill('cajero');
  await loginModal.getByPlaceholder('••••••••').fill('cajero123');
  await loginModal.getByRole('button', 'Ingresar al Turno').click();

  // 2. APERTURA DE CAJA CON FONDO REGLAMENTARIO DE $50.000 CLP
  await screen.getByRole('button', '🚀 Iniciar Turno').click();
  await expect(screen.getByRole('heading', 'Apertura Oficial de Turno')).toBeVisible();
  await expect(screen.getByText('Declaración de Fondo Inicial en Gaveta (Sencillo)')).toBeVisible();

  // Continuar al Checklist de Garita
  await screen.getByRole('button', 'Continuar a Checklist →').click();
  await expect(screen.getByText('0/5 Verificados')).toBeVisible();

  // Marcar todas las verificaciones físicas (Impresora, Barrera, POS, Gaveta, CCTV)
  await screen.getByRole('button', '✓ Marcar todas como revisadas').click();

  // Desmarcar checkbox de descarga automática de PDF durante el test para evitar diálogos del navegador
  const downloadActaCheckbox = screen.getByRole('checkbox', 'Descargar Acta A4 de Recepción');
  if (await downloadActaCheckbox.isChecked()) {
    await downloadActaCheckbox.click();
  }

  // Iniciar turno y desbloquear POS
  await screen.getByRole('button', '🚀 Iniciar Turno & Desbloquear POS').click();

  // Navegar a Garita POS desde el menú principal
  await screen.getByRole('button', 'Garita POS').click();

  // 3. INGRESO DE VEHÍCULO (CHECK-IN)
  // Scoping dentro de desktop-pos-panel para evitar colisión con el formulario móvil
  const posPanel = screen.getByTestId('desktop-pos-panel');
  await posPanel.getByPlaceholder('AAAABB o AABB11').fill('BBCL10');
  await posPanel.getByPlaceholder('Particular / Nombre...').fill('Carlos Mendoza');
  await posPanel.getByPlaceholder('+56 9 1234 5678').fill('+56 9 9123 4567');
  await posPanel.getByRole('button', 'Emitir Ticket').click();

  // 4. VISTA PREVIA Y CONFIRMACIÓN DE TICKET (80MM / CODE 128)
  await expect(screen.getByText('Vista Previa del Ticket (Térmica 80mm)')).toBeVisible();
  await expect(screen.getByText('BBCL10')).toBeVisible();

  // Confirmar ingreso formal en el sistema
  await screen.getByRole('button', '🚀 Confirmar Ingreso en Sistema').click();

  // Finalizar y cerrar modal de ticket
  await screen.getByRole('button', '✅ Finalizar').click();

  // 5. COBRO DE SALIDA (CHECK-OUT)
  // Cambiar a pestaña de Cobro (Salida) en el panel POS
  await posPanel.getByRole('button', 'Cobro (Salida)').click();

  // Buscar el vehículo por patente
  const exitSearchInput = posPanel.getByPlaceholder('Buscar por Patente...');
  await exitSearchInput.fill('BBCL10');

  // Seleccionar vehículo para cobrar
  await posPanel.getByRole('button', 'Cobrar').click();

  // Verificar que se visualice el detalle del vehículo y el Total a Pagar
  await expect(posPanel.getByText('Total a Pagar')).toBeVisible();

  // Seleccionar medio de pago tarjeta
  await posPanel.getByRole('button', 'tarjeta').click();

  // Confirmar cobro y apertura de barrera
  await posPanel.getByRole('button', 'Confirmar Cobro & Emitir Boleta SII').click();

  // Verificar que el vehículo ya fue liquidado y no aparezca pendiente de cobro
  await exitSearchInput.fill('BBCL10');
  await expect(posPanel.getByText('No se encontraron vehículos.')).toBeVisible();
});
