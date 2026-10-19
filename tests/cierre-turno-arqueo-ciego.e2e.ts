import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('cierre ciego de turno: protocolo de 5 pasos, arqueo físico, sellado SHA-256 y Reporte Z A4', async ({ app, screen }) => {
  await app.open('/');

  // 1. AUTENTICACIÓN OPERADOR
  await screen.getByRole('button', 'Acceso Garita / POS').click();
  const loginModal = screen.getByTestId('login-modal');
  await loginModal.getByPlaceholder('braulio@automatizable.cl o braulio').fill('cajero');
  await loginModal.getByPlaceholder('••••••••').fill('cajero123');
  await loginModal.getByRole('button', 'Ingresar al Turno').click();

  // 2. APERTURA DE TURNO PREVIA
  await screen.getByRole('button', '🚀 Iniciar Turno').click();
  await screen.getByRole('button', 'Continuar a Checklist →').click();
  await screen.getByRole('button', '✓ Marcar todas como revisadas').click();

  const downloadActaCheckbox = screen.getByRole('checkbox', 'Descargar Acta A4 de Recepción');
  if (await downloadActaCheckbox.isChecked()) {
    await downloadActaCheckbox.click();
  }
  await screen.getByRole('button', '🚀 Iniciar Turno & Desbloquear POS').click();

  // 3. NAVEGAR A ARQUEO CIEGO / CIERRE DE TURNO
  // Pulsar botón de Cerrar Turno en la barra superior
  await screen.getByRole('button', '🔒 Cerrar Turno').click();

  // 4. FASE 1: APROBACIONES & CONTROL PREVIO
  await expect(screen.getByText('FASE 1 DE 5 • CONTEXTO OPERATIVO')).toBeVisible();
  await screen.getByRole('button', 'Continuar al Paso 2: Control de Patio').click();

  // 5. FASE 2: CONTROL DE PATIO & TRASPASO
  await expect(screen.getByText('FASE 2 DE 5 • RECINTO FÍSICO')).toBeVisible();
  await screen.getByRole('button', 'Continuar al Paso 3: Vouchers POS').click();

  // 6. FASE 3: CONCILIACIÓN DE VOUCHERS POS & TRANSFERENCIAS
  await expect(screen.getByText('FASE 3 DE 5 • DINERO ELECTRÓNICO')).toBeVisible();
  // Autocompletar con los registros del sistema
  await screen.getByRole('button', 'Autocompletar con Registros').click();
  await screen.getByRole('button', 'Continuar al Paso 4: Arqueo de Efectivo').click();

  // 7. FASE 4: ARQUEO FÍSICO CIEGO (DECLARACIÓN DE GAVETA)
  await expect(screen.getByText('FASE 4 DE 5 • CONTEO FÍSICO ESTRICTO')).toBeVisible();
  // Cambiar a Total Directo para ingreso ágil
  await screen.getByRole('button', 'Total Directo').click();
  // Declarar los $50.000 de fondo reglamentario
  await screen.getByTestId('declared-cash-total-input').fill('50000');
  await screen.getByRole('button', 'Continuar al Paso 5: Certificación Z').click();

  // 8. FASE 5: CERTIFICACIÓN Z & SELLADO CRIPTOGRÁFICO
  await expect(screen.getByText('FASE 5 DE 5 • CIERRE DEFINITIVO')).toBeVisible();
  await expect(screen.getByText('TOTAL GENERAL DECLARADO')).toBeVisible();

  // Ejecutar el arqueo ciego definitivo
  await screen.getByRole('button', 'EJECUTAR ARQUEO CIEGO & SELLAR TURNO').click();

  // 9. VERIFICAR CUADRATURA REVELADA Y REPORTE Z
  await expect(screen.getByText('CUADRATURA REVELADA (REPORTE Z)')).toBeVisible();
  await expect(screen.getByText('Imprimir Acta A4 (2 Copias)')).toBeVisible();
});
