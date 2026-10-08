// Google Sheets & Drive API Integration Service for CORDANO PMS
import { CORDANO_11_TABLES_SCHEMA } from '../types/databaseSchema';

const CLIENT_ID = '349577440002.apps.googleusercontent.com'; // O provisto dinámicamente
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

export interface GoogleAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  userEmail: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
}

let tokenClient: any = null;

export const initGoogleTokenClient = (callback: (tokenResponse: any) => void) => {
  if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: callback,
    });
    return true;
  }
  return false;
};

export const requestGoogleAccessToken = (callback: (tokenResponse: any) => void) => {
  if (!tokenClient) {
    const initialized = initGoogleTokenClient(callback);
    if (!initialized) {
      console.warn('Google Identity Services SDK aún no cargado');
      return;
    }
  }
  tokenClient.requestAccessToken({ prompt: 'consent' });
};

// Crear una nueva planilla de cálculo completa con las 11 pestañas de CORDANO PMS
export const createCordanoSpreadsheet = async (
  accessToken: string,
  spreadsheetTitle: string = `CORDANO PMS — Registro Operacional (${new Date().toLocaleDateString('es-CL')})`
) => {
  const sheetsPayload = Object.values(CORDANO_11_TABLES_SCHEMA).map((table) => ({
    properties: {
      title: table.sheetName,
      gridProperties: {
        frozenRowCount: 1,
        columnCount: Math.max(table.columns.length + 2, 10),
      },
    },
  }));

  // 1. Crear Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: spreadsheetTitle,
      },
      sheets: sheetsPayload,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Error al crear la planilla de Google Sheets');
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // 2. Inicializar encabezados en cada hoja
  const valueRanges = Object.values(CORDANO_11_TABLES_SCHEMA).map((table) => ({
    range: `'${table.sheetName}'!A1`,
    values: [table.columns],
  }));

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueRanges,
    }),
  });

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
};

// Sincronizar / Volcar datos de una o todas las tablas a Google Sheets
export const syncTableToGoogleSheet = async (
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  rows: Record<string, any>[],
  columns: string[]
) => {
  const formattedRows = rows.map((r) =>
    columns.map((col) => {
      const val = r[col];
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return val ?? '';
    })
  );

  const valuesPayload = [columns, ...formattedRows];

  // Limpiar y sobrescribir datos de la hoja
  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A1:Z5000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: valuesPayload,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err.error?.message || `Error al actualizar hoja ${sheetName}`);
  }

  return await updateRes.json();
};
