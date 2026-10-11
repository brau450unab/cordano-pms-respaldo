import { Ticket, TaxDocumentType, Shift } from '../../types';

export interface FiscalDocument {
  folio: string;
  documentType: TaxDocumentType; // 39: Afecta, 41: Exenta
  emittedAt: string; // ISO
  emisorRut: string;
  emisorRazonSocial: string;
  emisorGiro: string;
  emisorDireccion: string;
  emisorComuna: string;
  receptorRut: string;
  receptorRazonSocial: string;
  netAmount: number;
  ivaAmount: number; // 19% si tipo 39, 0 si tipo 41
  totalAmount: number;
  plateNumber: string;
  stayMinutes: number;
  tedXml: string; // XML Timbre Electrónico DTE
  qrCodeData: string; // Payload para imprimir en QR térmico
}

export interface DailySalesReportRVD {
  folioRvd: string;
  fechaEmision: string;
  shiftId: string;
  rutEmisor: string;
  cantidadBoletas39: number;
  montoAfecto39: number;
  ivaDebito39: number;
  cantidadBoletas41: number;
  montoExento41: number;
  totalVentas: number;
  rangoFolios: {
    inicial: string;
    final: string;
  };
  xmlRvd: string;
  status: 'GENERADO' | 'ENVIADO_SII_SIMULADO';
}

const CORDANO_EMISOR = {
  rut: '76.840.123-K',
  razonSocial: 'ESTACIONAMIENTOS CORDANO SPA',
  giro: 'EXPLOTACION Y ADMINISTRACION DE PLAYAS DE ESTACIONAMIENTO',
  direccion: 'Calle Serrano 447',
  comuna: 'Iquique',
  ciudad: 'Iquique',
};

// Generador de Timbre Electrónico DTE (<TED>)
export function generateTedXml(params: {
  tipoDte: TaxDocumentType;
  folio: string;
  fecha: string;
  montoTotal: number;
  patente: string;
}): { tedXml: string; qrData: string } {
  const { tipoDte, folio, fecha, montoTotal, patente } = params;
  const fechaYmd = fecha.slice(0, 10);
  const timeStamp = new Date().toISOString();

  // Simulación de firma digital con clave RSA autorizada por SII
  const dummySignature = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${Math.random().toString(36).substring(2, 15)}==`;

  const tedXml = `<TED version="1.0">
  <DD>
    <RE>${CORDANO_EMISOR.rut}</RE>
    <TD>${tipoDte}</TD>
    <F>${folio}</F>
    <FE>${fechaYmd}</FE>
    <RR>66666666-6</RR>
    <RSR>CLIENTE CONTADO</RSR>
    <MNT>${montoTotal}</MNT>
    <IT1>ESTADIA VEHICULAR PATENTE ${patente}</IT1>
    <CAF version="1.0">
      <DA>
        <RE>${CORDANO_EMISOR.rut}</RE>
        <RS>${CORDANO_EMISOR.razonSocial}</RS>
        <TD>${tipoDte}</TD>
        <RNG><D>10001</D><H>99999</H></RNG>
        <FA>${fechaYmd}</FA>
      </DA>
    </CAF>
    <TSTED>${timeStamp}</TSTED>
  </DD>
  <FRMT algoritmo="SHA1withRSA">${dummySignature}</FRMT>
</TED>`;

  // Payload estándar para Código QR según normativa SII (Chile)
  const qrData = `https://www.sii.cl/consulta_dte?re=${CORDANO_EMISOR.rut}&td=${tipoDte}&f=${folio}&m=${montoTotal}&fe=${fechaYmd}&t=${Math.floor(Date.now() / 1000)}`;

  return { tedXml, qrData };
}

/**
 * Emite una Boleta Electrónica (Tipo 39 Afecta o 41 Exenta) para un ticket cobrado
 */
export function emitFiscalDte(ticket: Ticket, documentType: TaxDocumentType = 39): FiscalDocument {
  const totalAmount = ticket.totalAmount || 0;
  let netAmount = totalAmount;
  let ivaAmount = 0;

  if (documentType === 39) {
    // 19% IVA Incluido: Neto = Total / 1.19
    netAmount = Math.round(totalAmount / 1.19);
    ivaAmount = totalAmount - netAmount;
  }

  // Generar folio correlativo único
  const folio = ticket.invoiceFolio || `BOL-${Math.floor(100000 + Math.random() * 900000)}`;
  const emittedAt = new Date().toISOString();

  const { tedXml, qrData } = generateTedXml({
    tipoDte: documentType,
    folio,
    fecha: emittedAt,
    montoTotal: totalAmount,
    patente: ticket.plateNumber,
  });

  return {
    folio,
    documentType,
    emittedAt,
    emisorRut: CORDANO_EMISOR.rut,
    emisorRazonSocial: CORDANO_EMISOR.razonSocial,
    emisorGiro: CORDANO_EMISOR.giro,
    emisorDireccion: CORDANO_EMISOR.direccion,
    emisorComuna: CORDANO_EMISOR.comuna,
    receptorRut: '66666666-6',
    receptorRazonSocial: ticket.customerName || 'CLIENTE FINAL CONTADO',
    netAmount,
    ivaAmount,
    totalAmount,
    plateNumber: ticket.plateNumber,
    stayMinutes: ticket.durationMinutes || 0,
    tedXml,
    qrCodeData: qrData,
  };
}

/**
 * Genera el Resumen de Ventas Diarias (RVD) requerido por el SII al cierre de turno o fin del día
 */
export function generateDailySalesReportRVD(shift: Shift, paidTickets: Ticket[]): DailySalesReportRVD {
  const folios: number[] = [];
  let cantidadBoletas39 = 0;
  let montoAfecto39 = 0;
  let ivaDebito39 = 0;

  let cantidadBoletas41 = 0;
  let montoExento41 = 0;
  let totalVentas = 0;

  paidTickets.forEach((t) => {
    const total = t.totalAmount || 0;
    totalVentas += total;
    if (t.dteFolio) {
      const match = t.dteFolio.match(/\d+/);
      if (match) folios.push(parseInt(match[0], 10));
    }

    if (t.dteType === 41) {
      cantidadBoletas41 += 1;
      montoExento41 += total;
    } else {
      // Por defecto tipo 39 afecta
      cantidadBoletas39 += 1;
      const net = Math.round(total / 1.19);
      montoAfecto39 += net;
      ivaDebito39 += (total - net);
    }
  });

  const folioMin = folios.length > 0 ? `BOL-${Math.min(...folios)}` : 'BOL-000000';
  const folioMax = folios.length > 0 ? `BOL-${Math.max(...folios)}` : 'BOL-000000';
  const folioRvd = `RVD-${shift.id}-${Date.now().toString().slice(-6)}`;
  const fechaEmision = new Date().toISOString();

  const xmlRvd = `<?xml version="1.0" encoding="ISO-8859-1"?>
<RVD version="1.0">
  <Encabezado>
    <IdDoc>
      <Folio>${folioRvd}</Folio>
      <FchEmis>${fechaEmision.slice(0, 10)}</FchEmis>
      <TurnoId>${shift.id}</TurnoId>
      <Operador>${shift.operatorName}</Operador>
    </IdDoc>
    <Emisor>
      <RUTEmisor>${CORDANO_EMISOR.rut}</RUTEmisor>
      <RznSoc>${CORDANO_EMISOR.razonSocial}</RznSoc>
      <GiroEmis>${CORDANO_EMISOR.giro}</GiroEmis>
      <DirOrigen>${CORDANO_EMISOR.direccion}</DirOrigen>
      <CmnaOrigen>${CORDANO_EMISOR.comuna}</CmnaOrigen>
    </Emisor>
  </Encabezado>
  <ResumenVentas>
    <BoletasAfectas39>
      <CantidadDoc>${cantidadBoletas39}</CantidadDoc>
      <MntNeto>${montoAfecto39}</MntNeto>
      <MntIVA>${ivaDebito39}</MntIVA>
      <MntTotal>${montoAfecto39 + ivaDebito39}</MntTotal>
    </BoletasAfectas39>
    <BoletasExentas41>
      <CantidadDoc>${cantidadBoletas41}</CantidadDoc>
      <MntExento>${montoExento41}</MntExento>
      <MntTotal>${montoExento41}</MntTotal>
    </BoletasExentas41>
    <TotalesGenerales>
      <TotalTransacciones>${cantidadBoletas39 + cantidadBoletas41}</TotalTransacciones>
      <TotalRecaudadoCLP>${totalVentas}</TotalRecaudadoCLP>
      <RangoFolioInicial>${folioMin}</RangoFolioInicial>
      <RangoFolioFinal>${folioMax}</RangoFolioFinal>
    </TotalesGenerales>
  </ResumenVentas>
</RVD>`;

  return {
    folioRvd,
    fechaEmision,
    shiftId: shift.id,
    rutEmisor: CORDANO_EMISOR.rut,
    cantidadBoletas39,
    montoAfecto39,
    ivaDebito39,
    cantidadBoletas41,
    montoExento41,
    totalVentas,
    rangoFolios: {
      inicial: folioMin,
      final: folioMax,
    },
    xmlRvd,
    status: 'GENERADO',
  };
}
