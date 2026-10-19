import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('operatividad de fase de datos: auditoría de 11 tablas relacionales, catálogo canónico y sincronización Google Sheets', async ({ app, screen }) => {
  await app.open('/');

  // 1. AUTENTICACIÓN ADMINISTRADOR (Perfil con acceso a la capa completa de datos y auditoría)
  await screen.getByRole('button', 'Acceso Garita / POS').click();
  const modal = screen.getByTestId('login-modal');
  await modal.getByPlaceholder('braulio@automatizable.cl o braulio').fill('admin');
  await modal.getByPlaceholder('••••••••').fill('admin123');
  await modal.getByRole('button', 'Ingresar al Turno').click();

  // 2. NAVEGACIÓN A MÓDULO DE AUDITORÍA & REPORTES
  const nav = screen.getByRole('navigation');
  await expect(nav.getByRole('button', 'Auditoría')).toBeVisible();
  await nav.getByRole('button', 'Auditoría').click();

  // Verificar encabezado ejecutivo del panel de administración
  await expect(screen.getByRole('heading', 'Control Histórico & Auditoría de Operación')).toBeVisible();

  // 3. ACCESO A LA PESTAÑA 4: BASE DE DATOS (11 TABLAS) & GOOGLE SHEETS
  const dbTabButton = screen.getByRole('button', /4\. Base de Datos/);
  await expect(dbTabButton).toBeVisible();
  await dbTabButton.click();

  // Verificar títulos y catálogo canónico
  await expect(screen.getByRole('heading', 'Ecosistema Google Sheets & Respaldo de Base de Datos')).toBeVisible();
  await expect(screen.getByText('Catálogo Canónico (11 Entidades Normalizadas):')).toBeVisible();

  // 4. VERIFICACIÓN Y AUDITORÍA DE ENTIDADES CANÓNICAS
  // A) Plazas de estacionamiento (5_SLOTS - 30 cupos físicos Serrano 447)
  await screen.getByRole('button', /5_SLOTS/).click();
  await expect(screen.getByRole('heading', 'Infraestructura de 30 Slots')).toBeVisible();
  await expect(screen.getByText('columnas', { exact: false })).toBeVisible();

  // B) Filtrado reactivo en data grid
  const searchInput = screen.getByPlaceholder('Filtrar en tabla...');
  await searchInput.fill('A-01');
  await expect(screen.getByText('A-01')).toBeVisible();
  await searchInput.clear();

  // C) Tickets de operación (6_TICKETS - Ley 20.967)
  const ticketsBtn = screen.getByRole('button', /6_TICKETS/);
  await ticketsBtn.click();
  await expect(screen.getByRole('heading', 'Tickets y Estadías Transaccionales')).toBeVisible();

  // D) Turnos de caja y arqueos ciegos (9_TURNOS_CAJA)
  const shiftsBtn = screen.getByRole('button', /9_TURNOS_CAJA/);
  await shiftsBtn.click();
  await expect(screen.getByRole('heading', 'Control de Turnos y Arqueo Ciego')).toBeVisible();

  // E) Cola de sincronización offline outbox (11_SYNC_OFFLINE)
  const syncBtn = screen.getByRole('button', /11_SYNC_OFFLINE/);
  await syncBtn.click();
  await expect(screen.getByRole('heading', 'Cola de Sincronización PWA Offline')).toBeVisible();

  // 5. VERIFICACIÓN DE BOTONES DE EXPORTACIÓN Y GOOGLE SHEETS
  await expect(screen.getByRole('button', 'Conectar & Crear Google Sheets (11 Hojas)')).toBeVisible();
  await expect(screen.getByRole('button', 'Respaldo JSON Completo')).toBeVisible();
  await expect(screen.getByTestId('view-database-sheets').getByRole('button', 'Exportar CSV')).toBeVisible();
});
