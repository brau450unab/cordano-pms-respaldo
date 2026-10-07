import { AppScreen } from '../types';

export interface RouteConfig {
  screen: AppScreen;
  path: string;
  title: string;
  category: 'Acceso' | 'Principal' | 'Operación' | 'Reportes' | 'Configuración';
  description: string;
  badge?: string;
  isPublic?: boolean;
  requiresAdmin?: boolean;
}

export const APP_ROUTES: Record<AppScreen, RouteConfig> = {
  menu: {
    screen: 'menu',
    path: '/menu',
    title: 'Menú Principal & Control de Turno',
    category: 'Principal',
    description: 'Centro de operaciones, KPIs del turno y checklist de apertura',
    isPublic: false,
  },
  pos: {
    screen: 'pos',
    path: '/pos',
    title: 'Punto de Venta Garita (POS)',
    category: 'Operación',
    description: 'Ingreso orden de llegada, liquidación y libro de caja diario',
    isPublic: false,
  },
  map: {
    screen: 'map',
    path: '/map',
    title: 'Plano de Slots & Analítica Global',
    category: 'Operación',
    description: 'Monitoreo de 30 plazas en tiempo real, franjas horarias y RevPAS',
    isPublic: false,
  },
  reports: {
    screen: 'reports',
    path: '/reports',
    title: 'Reportes, Cortes Z & Auditoría',
    category: 'Reportes',
    description: 'Cortes de caja, arqueos ciegos, bitácora de auditoría y base de datos',
    isPublic: false,
  },
  clients: {
    screen: 'clients',
    path: '/clients',
    title: 'Abonados & Convenios',
    category: 'Operación',
    description: 'Gestión de convenios corporativos mensuales, tarifas planas y renovaciones',
    isPublic: false,
  },
  settings: {
    screen: 'settings',
    path: '/settings',
    title: 'Configuración del Sistema',
    category: 'Configuración',
    description: 'Ajustes de tarifas bases, credenciales SII DTE y hardware',
    isPublic: false,
  },
  support: {
    screen: 'support',
    path: '/support',
    title: 'Centro de Ayuda & SOPs',
    category: 'Principal',
    description: 'Manuales operativos, protocolos de emergencia y base de conocimiento',
    isPublic: false,
  },
  login: {
    screen: 'login',
    path: '/login',
    title: 'Portal de Autenticación Garita',
    category: 'Acceso',
    description: 'Inicio de sesión con perfil de Operador o Administrador',
    isPublic: true,
  },
  landing: {
    screen: 'landing',
    path: '/landing',
    title: 'Menú Principal',
    category: 'Principal',
    description: 'Menú principal de garita',
    isPublic: false,
  },
  inicio: {
    screen: 'inicio',
    path: '/inicio',
    title: 'Inicio / Garita Central',
    category: 'Principal',
    description: 'Panel de control principal con KPIs y acceso a módulos',
    isPublic: false,
  },
  operacion_ingreso: {
    screen: 'operacion_ingreso',
    path: '/operacion/ingreso',
    title: 'Ingreso & Barrera',
    category: 'Operación',
    description: 'Registro de patentes, validación Anti-Passback y emisión de ticket',
    isPublic: false,
  },
  operacion_salida: {
    screen: 'operacion_salida',
    path: '/operacion/salida',
    title: 'Punto de Venta / Salida & Caja',
    category: 'Operación',
    description: 'Liquidación de tiempo, cálculo de tarifas, vuelto y cobro POS',
    isPublic: false,
  },
  operacion_layout: {
    screen: 'operacion_layout',
    path: '/operacion/layout',
    title: 'Layout en Tiempo Real',
    category: 'Operación',
    description: 'Mapa interactivo de slots y monitoreo gráfico de ocupación',
    isPublic: false,
  },
  operacion_cierre: {
    screen: 'operacion_cierre',
    path: '/operacion/cierre',
    title: 'Cierre de Caja Ciego',
    category: 'Operación',
    description: 'Arqueo físico imparcial y cuadre de turnos operativos',
    isPublic: false,
  },
  operacion_convenios: {
    screen: 'operacion_convenios',
    path: '/operacion/convenios',
    title: 'Convenios & Abonados Mensuales',
    category: 'Operación',
    description: 'Módulo complementario para gestión de clientes corporativos',
    isPublic: false,
  },
  reportes_dashboard: {
    screen: 'reportes_dashboard',
    path: '/reportes/dashboard',
    title: 'Dashboard Analítico',
    category: 'Reportes',
    description: 'Métricas de recaudación, curvas de ocupación y análisis de ingresos',
    isPublic: false,
  },
  reportes_auditoria: {
    screen: 'reportes_auditoria',
    path: '/reportes/auditoria',
    title: 'Bitácora de Auditoría',
    category: 'Reportes',
    description: 'Trazabilidad de autorizaciones, descuentos y eventos de seguridad',
    isPublic: false,
  },
  reportes_database: {
    screen: 'reportes_database',
    path: '/reportes/base-datos',
    title: 'Base de Datos (11 Tablas & Google Sheets)',
    category: 'Reportes',
    description: 'Catálogo de las 11 entidades relacionales y exportador de hojas de cálculo',
    isPublic: false,
  },
  config_tarifas: {
    screen: 'config_tarifas',
    path: '/configuracion/tarifas',
    title: 'Configuración de Tarifas',
    category: 'Configuración',
    description: 'Valores por minuto/vehículo, minutos de gracia y recargos',
    isPublic: false,
  },
  config_sistema: {
    screen: 'config_sistema',
    path: '/configuracion/sistema',
    title: 'Parámetros del Recinto & RBAC',
    category: 'Configuración',
    description: 'Datos tributarios, hardware de impresión y roles de usuario',
    isPublic: false,
  },
};

/**
 * Normalizes URL path to AppScreen
 */
export function getScreenFromPath(pathname: string): AppScreen {
  const cleanPath = pathname.toLowerCase().replace(/\/$/, '') || '/';

  if (cleanPath === '/landing' || cleanPath === '/portal') return 'landing';
  if (cleanPath === '/' || cleanPath === '/menu' || cleanPath === '/inicio' || cleanPath === '/home' || cleanPath === '/hub') return 'menu';
  if (cleanPath === '/pos' || cleanPath === '/operacion/salida' || cleanPath === '/salida' || cleanPath === '/caja' || cleanPath === '/operacion/ingreso') return 'pos';
  if (cleanPath === '/map' || cleanPath === '/analitica' || cleanPath === '/rendimiento' || cleanPath === '/operacion/layout' || cleanPath === '/layout') return 'map';
  if (cleanPath === '/reports' || cleanPath === '/reportes' || cleanPath === '/reportes/dashboard' || cleanPath === '/reportes/auditoria' || cleanPath === '/reportes/base-datos') return 'reports';
  if (cleanPath === '/clients' || cleanPath === '/clientes' || cleanPath === '/abonados' || cleanPath === '/convenios' || cleanPath === '/operacion/convenios') return 'clients';
  if (cleanPath === '/settings' || cleanPath === '/configuracion' || cleanPath === '/ajustes' || cleanPath === '/configuracion/tarifas' || cleanPath === '/configuracion/sistema') return 'settings';
  if (cleanPath === '/support' || cleanPath === '/ayuda' || cleanPath === '/soporte') return 'support';
  if (cleanPath === '/cierre' || cleanPath === '/operacion/cierre' || cleanPath === '/arqueo') return 'operacion_cierre';
  if (cleanPath === '/login' || cleanPath === '/auth') return 'login';

  return 'menu';
}

/**
 * Retrieves path URL string from AppScreen
 */
export function getPathFromScreen(screen: AppScreen): string {
  return APP_ROUTES[screen]?.path || '/menu';
}
