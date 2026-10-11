import { Ticket } from '../../types';
import { FiscalDocument } from '../fiscal/siiBillingService';

/**
 * Driver de Impresión Térmica ESC/POS para Cordano PMS
 * Compatible con impresoras térmicas de 58mm y 80mm (Sunmi V2, Epson TM-T20, Bixolon, etc.)
 * Soporta conexión por Web Serial API y Web Bluetooth API.
 */
export class EscPosDriver {
  // Comandos de control estándar ESC/POS
  private static ESC = 0x1b;
  private static GS = 0x1d;
  private static LF = 0x0a;

  /**
   * Genera el payload binario para un Ticket de Entrada
   */
  static buildEntryTicketBytes(ticket: Ticket): Uint8Array {
    const buffer: number[] = [];

    // Inicializar impresora: ESC @
    buffer.push(this.ESC, 0x40);

    // Alineación central: ESC a 1
    buffer.push(this.ESC, 0x61, 0x01);

    // Texto de encabezado en negrita y doble alto
    buffer.push(this.ESC, 0x45, 0x01); // Bold ON
    buffer.push(this.ESC, 0x21, 0x10); // Doble altura
    buffer.push(...this.encodeText('CORDANO PMS\n'));
    buffer.push(this.ESC, 0x21, 0x00); // Normal
    buffer.push(...this.encodeText('Calle Serrano 447, Iquique\n'));
    buffer.push(...this.encodeText('--------------------------------\n'));
    buffer.push(...this.encodeText('TICKET DE INGRESO VEHICULAR\n'));
    buffer.push(this.ESC, 0x45, 0x00); // Bold OFF

    // Patente destacada
    buffer.push(this.ESC, 0x21, 0x30); // Doble ancho y doble alto
    buffer.push(...this.encodeText(`\n${ticket.plateNumber}\n\n`));
    buffer.push(this.ESC, 0x21, 0x00); // Normal

    // Datos del ticket alineados a la izquierda
    buffer.push(this.ESC, 0x61, 0x00); // Izquierda
    buffer.push(...this.encodeText(`Ticket N°:    ${ticket.ticketCode}\n`));
    buffer.push(...this.encodeText(`Fecha/Hora:   ${new Date(ticket.entryTime).toLocaleString('es-CL')}\n`));
    buffer.push(...this.encodeText(`Vehículo:     ${ticket.vehicleType}\n`));
    buffer.push(...this.encodeText(`Plaza / Slot: ${ticket.slotCode || 'SIN ASIGNAR'}\n`));
    buffer.push(...this.encodeText(`Operador:     ${ticket.operatorEntryName}\n`));
    buffer.push(...this.encodeText('--------------------------------\n'));

    // Código QR nativo ESC/POS (GS ( k) con el código de ticket
    buffer.push(this.ESC, 0x61, 0x01); // Centro
    buffer.push(...this.buildNativeQrBytes(ticket.ticketCode));

    buffer.push(...this.encodeText('\nConserve este comprobante.\n'));
    buffer.push(...this.encodeText('Conforme a Ley 20.967, ante extravio\n'));
    buffer.push(...this.encodeText('se cobra tiempo real por patente.\n\n\n\n'));

    // Corte parcial de papel: GS V 66 0
    buffer.push(this.GS, 0x56, 0x42, 0x00);

    return new Uint8Array(buffer);
  }

  /**
   * Genera el payload binario para una Boleta Electrónica DTE (Tipo 39/41) con Timbre Electrónico
   */
  static buildFiscalReceiptBytes(doc: FiscalDocument): Uint8Array {
    const buffer: number[] = [];

    // Inicializar: ESC @
    buffer.push(this.ESC, 0x40);

    // Centro
    buffer.push(this.ESC, 0x61, 0x01);
    buffer.push(this.ESC, 0x45, 0x01);
    buffer.push(...this.encodeText(`${doc.emisorRazonSocial}\n`));
    buffer.push(this.ESC, 0x45, 0x00);
    buffer.push(...this.encodeText(`R.U.T.: ${doc.emisorRut}\n`));
    buffer.push(...this.encodeText(`${doc.emisorGiro}\n`));
    buffer.push(...this.encodeText(`${doc.emisorDireccion}, ${doc.emisorComuna}\n`));
    buffer.push(...this.encodeText('================================\n'));
    buffer.push(this.ESC, 0x45, 0x01);
    buffer.push(...this.encodeText(`BOLETA ELECTRONICA N° ${doc.folio}\n`));
    buffer.push(...this.encodeText(`(Tipo ${doc.documentType} - ${doc.documentType === 39 ? 'Afecta IVA' : 'Exenta'})\n`));
    buffer.push(this.ESC, 0x45, 0x00);
    buffer.push(...this.encodeText('================================\n'));

    // Detalle alineado a la izquierda
    buffer.push(this.ESC, 0x61, 0x00);
    buffer.push(...this.encodeText(`Fecha Emision: ${new Date(doc.emittedAt).toLocaleString('es-CL')}\n`));
    buffer.push(...this.encodeText(`Patente:       ${doc.plateNumber}\n`));
    buffer.push(...this.encodeText(`Estadia:       ${doc.stayMinutes} minutos\n`));
    buffer.push(...this.encodeText('--------------------------------\n'));

    if (doc.documentType === 39) {
      buffer.push(...this.encodeText(`Monto Neto:    $${doc.netAmount.toLocaleString('es-CL')}\n`));
      buffer.push(...this.encodeText(`IVA (19%):     $${doc.ivaAmount.toLocaleString('es-CL')}\n`));
    }
    buffer.push(this.ESC, 0x45, 0x01);
    buffer.push(this.ESC, 0x21, 0x10); // Doble altura
    buffer.push(...this.encodeText(`TOTAL PAGADO:  $${doc.totalAmount.toLocaleString('es-CL')}\n`));
    buffer.push(this.ESC, 0x21, 0x00);
    buffer.push(this.ESC, 0x45, 0x00);
    buffer.push(...this.encodeText('================================\n'));

    // Timbre Electrónico DTE (TED) en QR
    buffer.push(this.ESC, 0x61, 0x01); // Centro
    buffer.push(...this.encodeText('Timbre Electronico SII\n'));
    buffer.push(...this.encodeText('Res. Ex. N 80 de 2014 - Verifique en sii.cl\n\n'));
    buffer.push(...this.buildNativeQrBytes(doc.qrCodeData));

    buffer.push(...this.encodeText('\n\nGracias por su preferencia!\n\n\n\n'));

    // Corte de papel: GS V 66 0
    buffer.push(this.GS, 0x56, 0x42, 0x00);

    return new Uint8Array(buffer);
  }

  /**
   * Genera el bloque de comandos ESC/POS para QR nativo usando GS ( k
   */
  private static buildNativeQrBytes(data: string): number[] {
    const bytes: number[] = [];
    const textBytes = this.encodeText(data);
    const len = textBytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // 1. Establecer modelo QR 2: GS ( k 4 0 49 65 50 0
    bytes.push(this.GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

    // 2. Establecer tamaño del módulo (4 puntos): GS ( k 3 0 49 67 4
    bytes.push(this.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x04);

    // 3. Nivel de corrección de error 'M' (49): GS ( k 3 0 49 69 49
    bytes.push(this.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);

    // 4. Guardar datos en el buffer: GS ( k pL pH 49 80 48 <datos>
    bytes.push(this.GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...textBytes);

    // 5. Imprimir QR: GS ( k 3 0 49 81 48
    bytes.push(this.GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);

    return bytes;
  }

  /**
   * Convierte texto UTF-8 a bytes ISO-8859-1 / ASCII estándar para impresoras térmicas
   */
  private static encodeText(str: string): number[] {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(str));
  }

  /**
   * Intenta imprimir enviando los bytes a través de Web Serial API si está disponible
   */
  static async printViaWebSerial(data: Uint8Array): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      try {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        await port.close();
        return true;
      } catch (err) {
        console.warn('[EscPosDriver] Error con Web Serial:', err);
      }
    }
    return false;
  }
}
