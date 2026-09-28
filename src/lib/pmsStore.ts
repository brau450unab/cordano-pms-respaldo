import {
  Ticket,
  ParkingSlot,
  Shift,
  AuditLog,
  VehicleType,
  PaymentMethod,
  IncidenceType,
  CashDenominations,
  CloudRunConnectionInfo,
} from '@/types';

// Inicialización de las 30 plazas canónicas de Serrano 447, Iquique (~700 m²)
// más 5 plazas adicionales de sobrecupo (Total: 35 slots en 7 filas x 5 columnas)
const OFFICIAL_SLOTS = 30;
const EXTRA_SLOTS = 5;
const TOTAL_SLOTS = OFFICIAL_SLOTS + EXTRA_SLOTS;

function createInitialSlots(): ParkingSlot[] {
  const slots: ParkingSlot[] = [];
  for (let i = 1; i <= TOTAL_SLOTS; i++) {
    if (i <= 15) {
      const codigo = `A-${i.toString().padStart(2, '0')}`;
      let tipo: 'NORMAL' | 'PMR' | 'ELECTRICO' = 'NORMAL';
      if (i === 1 || i === 2) tipo = 'PMR';
      else if (i === 3) tipo = 'ELECTRICO';

      slots.push({
        id: i,
        codigo,
        sector: 'A',
        tipo,
        estado: 'DISPONIBLE',
      });
    } else if (i <= 30) {
      const codigo = `B-${i.toString().padStart(2, '0')}`;
      slots.push({
        id: i,
        codigo,
        sector: 'B',
        tipo: 'NORMAL',
        estado: 'DISPONIBLE',
      });
    } else {
      const numExtra = i - 30;
      const codigo = `SC-${numExtra.toString().padStart(2, '0')}`;
      slots.push({
        id: i,
        codigo,
        sector: 'SOBRECUPO',
        tipo: 'SOBRECUPO',
        estado: 'DISPONIBLE',
      });
    }
  }
  return slots;
}

class PmsDataStore {
  private slots: ParkingSlot[] = createInitialSlots();
  private tickets: Ticket[] = [];
  private currentShift: Shift | null = null;
  private auditLogs: AuditLog[] = [];
  private ticketSequence: number = 100;
  private isOfflineMode: boolean = false;
  private defaultGraceMinutes: number = 0;

  constructor() {
    // Inicializar turno activo en GARITA 01 con fondo inicial validado de $50.000
    this.openShift('OP-01', 'Juan Pérez', 50000);
    this.seedInitialPatioState();
    this.addAudit(
      'SISTEMA_INICIALIZADO',
      'SISTEMA',
      'GRIS',
      'SYSTEM',
      'Sistema PMS',
      'Servidor ParkOps PMS & ERP (Serrano 447, Iquique) iniciado en Cloud Run'
    );
  }

  private seedInitialPatioState() {
    const initialVehicles: Array<{
      slot: number;
      plate: string;
      tipo: VehicleType;
      rate: number;
      durationMin: number;
      client: string;
      phone: string;
      obs?: string;
    }> = [
      { slot: 1, plate: 'BBCL84', tipo: 'auto', rate: 25, durationMin: 75, client: 'Carlos Mena', phone: '+56 9 8412 9011', obs: 'Sin daños visibles' },
      { slot: 2, plate: 'KLPW29', tipo: 'camioneta', rate: 30, durationMin: 60, client: 'María Soto', phone: '+56 9 9123 4455' },
      { slot: 3, plate: 'HTRJ12', tipo: 'moto', rate: 15, durationMin: 50, client: 'Pedro Rojas', phone: '+56 9 7654 3210' },
      { slot: 4, plate: 'GHYU90', tipo: 'auto', rate: 25, durationMin: 45, client: 'Particular', phone: '' },
      { slot: 5, plate: 'LKJH44', tipo: 'camioneta', rate: 30, durationMin: 40, client: 'Gonzalo Silva', phone: '+56 9 8877 6655' },
      { slot: 6, plate: 'MNBV33', tipo: 'auto', rate: 25, durationMin: 35, client: 'Particular', phone: '' },
      { slot: 7, plate: 'POIU22', tipo: 'auto', rate: 25, durationMin: 30, client: 'Andrea Toro', phone: '+56 9 9988 7766' },
      { slot: 8, plate: 'ZXCV11', tipo: 'moto', rate: 15, durationMin: 25, client: 'Rodrigo Paz', phone: '' },
      { slot: 9, plate: 'QAZW99', tipo: 'auto', rate: 25, durationMin: 20, client: 'Particular', phone: '' },
      { slot: 10, plate: 'WSXE88', tipo: 'camioneta', rate: 30, durationMin: 18, client: 'Fernanda Leal', phone: '+56 9 6655 4433' },
      { slot: 11, plate: 'EDCR77', tipo: 'auto', rate: 25, durationMin: 15, client: 'Particular', phone: '' },
      { slot: 12, plate: 'RFVT66', tipo: 'auto', rate: 25, durationMin: 12, client: 'Cristián Mora', phone: '' },
      { slot: 13, plate: 'TGBY55', tipo: 'moto', rate: 15, durationMin: 10, client: 'Juan Vargas', phone: '' },
      { slot: 14, plate: 'YHN444', tipo: 'camioneta', rate: 30, durationMin: 8, client: 'Patricia Vera', phone: '' },
      { slot: 15, plate: 'UJM333', tipo: 'auto', rate: 25, durationMin: 6, client: 'Particular', phone: '' },
      { slot: 16, plate: 'IKM222', tipo: 'auto', rate: 25, durationMin: 4, client: 'Luis Arancibia', phone: '' },
      { slot: 17, plate: 'OLP111', tipo: 'camioneta', rate: 30, durationMin: 2, client: 'Particular', phone: '' },
      { slot: 18, plate: 'PLM999', tipo: 'auto', rate: 25, durationMin: 1, client: 'Mario Gómez', phone: '' },
    ];

    const now = Date.now();
    const dateStr = new Date(now).toISOString().slice(0, 10).replace(/-/g, '');

    for (const v of initialVehicles) {
      this.ticketSequence += 1;
      const seqStr = this.ticketSequence.toString().padStart(4, '0');
      const ticketId = `TKT-${dateStr}-T01-${seqStr}`;
      const entryDate = new Date(now - v.durationMin * 60000);

      const ticket: Ticket = {
        id_ticket: ticketId,
        patente: v.plate,
        vehiculo_tipo: v.tipo,
        slot_numero: v.slot,
        slot_codigo: v.slot <= 15 ? `A-${v.slot.toString().padStart(2, '0')}` : `B-${v.slot.toString().padStart(2, '0')}`,
        fecha_hora_ingreso: entryDate.toISOString(),
        estado_ticket: 'IN_PARKING',
        driver_name: v.client,
        driver_phone: v.phone,
        service_type: 'TRANSITORIO',
        tarifa_por_minuto: v.rate,
        tiempo_gracia_minutos: 0,
        reprint_count: 0,
        observaciones: v.obs,
      };

      const targetSlot = this.slots.find((s) => s.id === v.slot);
      if (targetSlot) {
        targetSlot.estado = 'OCUPADO';
        targetSlot.ticket_actual = ticket;
      }
      this.tickets.push(ticket);
    }

    // 2 plazas bloqueadas por Convenios Corporativos / Abonados en Paralelo (Slots 29 y 30)
    const slot29 = this.slots.find((s) => s.id === 29);
    const slot30 = this.slots.find((s) => s.id === 30);
    if (slot29) slot29.estado = 'RESERVADO';
    if (slot30) slot30.estado = 'RESERVADO';
  }

  // --- GESTIÓN DE MODO OFFLINE ---
  public setOfflineMode(offline: boolean) {
    this.isOfflineMode = offline;
    this.addAudit(
      offline ? 'MODO_OFFLINE_ACTIVADO' : 'MODO_ONLINE_RESTABLECIDO',
      'SISTEMA',
      offline ? 'ROJO' : 'VERDE',
      'SYSTEM',
      'Sistema PMS',
      offline
        ? 'Conexión a Internet interrumpida. Contingencia IndexedDB activa (Sufijo O)'
        : 'Conexión a Cloud Run restablecida. Cola sincronizada exitosamente.'
    );
  }

  public getIsOfflineMode(): boolean {
    return this.isOfflineMode;
  }

  // --- GESTIÓN DE TURNOS (SHIFT & BLIND CLOSE) ---
  public openShift(idOperador: string, nombreOperador: string, montoInicial: number): Shift {
    const shiftId = `SHF-${Date.now()}`;
    const newShift: Shift = {
      id_turno: shiftId,
      id_operador: idOperador,
      nombre_operador: nombreOperador,
      monto_inicial_caja: montoInicial,
      estado: 'ABIERTO',
      fecha_apertura: new Date().toISOString(),
      total_tickets_emitidos: 0,
      total_tickets_cobrados: 0,
      total_fugas: 0,
      total_descuentos: 0,
    };
    this.currentShift = newShift;
    this.addAudit(
      'TURNO_ABIERTO',
      'APERTURA',
      'AZUL',
      idOperador,
      nombreOperador,
      `Apertura de turno con fondo inicial en gaveta: $${montoInicial.toLocaleString('es-CL')}`
    );
    return newShift;
  }

  public getCurrentShift(): Shift | null {
    return this.currentShift;
  }

  public closeShiftBlind(
    desglose: CashDenominations,
    montoTarjeta: number,
    montoTransferencia: number
  ): { shift: Shift; diferencia: number; esperadoEfectivo: number } {
    if (!this.currentShift || this.currentShift.estado !== 'ABIERTO') {
      throw new Error('No hay un turno activo para cerrar.');
    }

    // Calcular el total declarado en efectivo a partir del desglose de billetes y monedas
    const montoEfectivo =
      desglose.b20000 * 20000 +
      desglose.b10000 * 10000 +
      desglose.b5000 * 5000 +
      desglose.b2000 * 2000 +
      desglose.b1000 * 1000 +
      desglose.monedas;

    // Calcular montos esperados por el sistema según tickets cobrados
    const ticketsTurno = this.tickets.filter(
      (t) =>
        (t.estado_ticket === 'PAGADO' || t.estado_ticket === 'ENTREGADO') &&
        new Date(t.fecha_hora_salida || '') >= new Date(this.currentShift!.fecha_apertura)
    );

    const totalCobradoEfectivo = ticketsTurno
      .filter((t) => t.metodo_pago === 'EFECTIVO')
      .reduce((sum, t) => sum + (t.monto_total_cobrado || 0), 0);

    const totalCobradoTarjeta = ticketsTurno
      .filter((t) => t.metodo_pago === 'TARJETA')
      .reduce((sum, t) => sum + (t.monto_total_cobrado || 0), 0);

    const totalCobradoTransf = ticketsTurno
      .filter((t) => t.metodo_pago === 'TRANSFERENCIA')
      .reduce((sum, t) => sum + (t.monto_total_cobrado || 0), 0);

    const esperadoEfectivo = this.currentShift.monto_inicial_caja + totalCobradoEfectivo;
    const esperadoTotal = esperadoEfectivo + totalCobradoTarjeta + totalCobradoTransf;
    const diferencia = montoEfectivo - esperadoEfectivo;

    // Generar sello hash simulado SHA-256
    const hashData = `${this.currentShift.id_turno}|${montoEfectivo}|${esperadoEfectivo}|${Date.now()}`;
    const hashSellado = `SHA256-${Buffer.from(hashData).toString('base64').substring(0, 16).toUpperCase()}`;

    this.currentShift.desglose_efectivo = desglose;
    this.currentShift.monto_declarado_efectivo = montoEfectivo;
    this.currentShift.monto_declarado_tarjeta = montoTarjeta;
    this.currentShift.monto_declarado_transferencia = montoTransferencia;
    this.currentShift.monto_esperado_efectivo = esperadoEfectivo;
    this.currentShift.monto_esperado_tarjeta = totalCobradoTarjeta;
    this.currentShift.monto_esperado_transferencia = totalCobradoTransf;
    this.currentShift.monto_esperado_total = esperadoTotal;
    this.currentShift.diferencia = diferencia;
    this.currentShift.estado = 'CERRADO';
    this.currentShift.fecha_cierre = new Date().toISOString();
    this.currentShift.hash_sellado = hashSellado;

    const esCuadrePerfecto = Math.abs(diferencia) === 0;

    this.addAudit(
      'TURNO_CERRADO_CIEGO',
      'CIERRE',
      esCuadrePerfecto ? 'VERDE' : 'ROJO',
      this.currentShift.id_operador,
      this.currentShift.nombre_operador,
      `Cierre ciego finalizado. Declarado: $${montoEfectivo.toLocaleString('es-CL')}, Esperado: $${esperadoEfectivo.toLocaleString('es-CL')}, Diferencia: $${diferencia.toLocaleString('es-CL')}. Sello: ${hashSellado}`,
      undefined,
      { montoEfectivo, esperadoEfectivo, diferencia, desglose, hashSellado }
    );

    return {
      shift: { ...this.currentShift },
      diferencia,
      esperadoEfectivo,
    };
  }

  // --- GESTIÓN DE SLOTS Y ESTADO ---
  public getSlots(): ParkingSlot[] {
    return this.slots;
  }

  // --- CHECK-IN (ANTI-PASSBACK & MÁSCARA CANÓNICA) ---
  public checkin(
    patente: string,
    tipo: VehicleType,
    telefono?: string,
    email?: string,
    isForeignPlate: boolean = false,
    slotIdSugerido?: number,
    forzarIngreso: boolean = false,
    nombreConductor?: string,
    observacionesDanio?: string
  ): Ticket {
    let patenteNormalizada = patente.trim().toUpperCase();
    if (!isForeignPlate) {
      patenteNormalizada = patenteNormalizada.replace(/[^A-Z0-9]/g, '');
    }

    if (!patenteNormalizada || patenteNormalizada.length < 3) {
      throw new Error('La patente ingresada no es válida.');
    }

    // Regla de Anti-Passback: Comprobar si ya existe un ticket activo para este vehículo
    const ticketExistente = this.tickets.find(
      (t) =>
        t.patente === patenteNormalizada &&
        (t.estado_ticket === 'IN_PARKING' || t.estado_ticket === 'ACTIVO' || t.estado_ticket === 'CREADO')
    );

    if (ticketExistente && !forzarIngreso) {
      throw new Error(
        `[ANTI-PASSBACK]: El vehículo ${patenteNormalizada} ya tiene un ingreso activo en el slot ${ticketExistente.slot_codigo || ticketExistente.slot_numero} (${ticketExistente.id_ticket}). ¿Desea forzar el ingreso?`
      );
    }

    // Asignación de plaza
    let slotAsignado: ParkingSlot | undefined;
    if (slotIdSugerido) {
      const targetSlot = this.slots.find((s) => s.id === slotIdSugerido);
      if (targetSlot && targetSlot.estado === 'DISPONIBLE') {
        slotAsignado = targetSlot;
      }
    }
    if (!slotAsignado) {
      slotAsignado = this.slots.find((s) => s.estado === 'DISPONIBLE');
    }

    // Si las 30 plazas están ocupadas, crear un slot virtual de sobrecupo temporal
    if (!slotAsignado) {
      const sobrecupoCount = this.slots.filter((s) => s.sector === 'SOBRECUPO').length + 1;
      const nuevoSlotSobrecupo: ParkingSlot = {
        id: 100 + sobrecupoCount,
        codigo: `SOBRECUPO-${sobrecupoCount.toString().padStart(2, '0')}`,
        sector: 'SOBRECUPO',
        tipo: 'SOBRECUPO',
        estado: 'OCUPADO',
      };
      this.slots.push(nuevoSlotSobrecupo);
      slotAsignado = nuevoSlotSobrecupo;
    }

    // Generación del ID Canónico: TKT-AAAAMMDD-T01-XXXX o sufijo O si está offline
    const fecha = new Date();
    const dateStr = fecha.toISOString().slice(0, 10).replace(/-/g, '');
    this.ticketSequence += 1;
    const seqStr = this.ticketSequence.toString().padStart(4, '0');
    const sufijoO = this.isOfflineMode ? 'O' : '';
    const ticketId = `TKT-${dateStr}-T01-${seqStr}${sufijoO}`;

    // Tarifas canónicas Iquique (Auto $25, Camioneta $30, Moto $15 CLP/min)
    const tarifaMinuto = tipo === 'camioneta' ? 30 : tipo === 'moto' ? 15 : 25;

    const nuevoTicket: Ticket = {
      id_ticket: ticketId,
      patente: patenteNormalizada,
      is_foreign_plate: isForeignPlate,
      vehiculo_tipo: tipo,
      slot_numero: slotAsignado.id,
      slot_codigo: slotAsignado.codigo,
      fecha_hora_ingreso: fecha.toISOString(),
      estado_ticket: 'IN_PARKING',
      driver_name: nombreConductor,
      driver_phone: telefono,
      driver_email: email,
      tarifa_por_minuto: tarifaMinuto,
      tiempo_gracia_minutos: this.defaultGraceMinutes,
      is_offline: this.isOfflineMode,
      sufijo_offline: sufijoO || undefined,
      reprint_count: 0,
      observaciones: observacionesDanio,
    };

    // Actualizar estado del slot
    slotAsignado.estado = 'OCUPADO';
    slotAsignado.ticket_actual = nuevoTicket;
    this.tickets.push(nuevoTicket);

    if (this.currentShift) {
      this.currentShift.total_tickets_emitidos += 1;
    }

    this.addAudit(
      'CHECKIN_EMITIDO',
      'APERTURA',
      'AZUL',
      this.currentShift?.id_operador || 'OP-01',
      this.currentShift?.nombre_operador || 'Operador',
      `Ingreso registrado: ${patenteNormalizada} (${tipo}) en ${slotAsignado.codigo}. Ticket: ${ticketId}`
    );

    return nuevoTicket;
  }

  // --- CÁLCULO DE SALIDA (TARIFA CONGELADA & VALIDACIONES) ---
  public calculatePendingCheckout(identificador: string): {
    ticket: Ticket;
    minutosTranscurridos: number;
    montoAPagar: number;
    montoOriginal: number;
    estaEnGracia: boolean;
    advertenciaMinutos?: string;
  } {
    const idBusqueda = identificador.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const ticket = this.tickets.find(
      (t) =>
        (t.estado_ticket === 'IN_PARKING' || t.estado_ticket === 'ACTIVO') &&
        (t.id_ticket.toUpperCase() === idBusqueda || t.patente.replace(/[^A-Z0-9]/g, '') === idBusqueda)
    );

    if (!ticket) {
      throw new Error(`No se encontró un vehículo activo con el identificador o patente: ${identificador}`);
    }

    const ahora = new Date();
    const ingreso = new Date(ticket.fecha_hora_ingreso);
    const diffMs = ahora.getTime() - ingreso.getTime();
    const minutosTranscurridos = Math.max(1, Math.floor(diffMs / 60000));

    // Regla de advertencia si dura menos de 5 minutos
    let advertenciaMinutos: string | undefined;
    if (minutosTranscurridos < 5) {
      advertenciaMinutos = 'Estadía inferior a 5 minutos. Posible error de ingreso.';
    }

    // Regla de Tiempo de Gracia
    const estaEnGracia = minutosTranscurridos <= ticket.tiempo_gracia_minutos;
    let montoAPagar = 0;

    if (!estaEnGracia) {
      // Minutos cobrables menos minutos de gracia
      const minutosCobrables = minutosTranscurridos - ticket.tiempo_gracia_minutos;
      montoAPagar = minutosCobrables * ticket.tarifa_por_minuto;
      // Redondeo minuto cerrado hacia arriba a la decena CLP más cercana
      montoAPagar = Math.ceil(montoAPagar / 10) * 10;
    }

    // Sumar recargo por multa si se extravió el ticket físico
    if (ticket.recargo_multa) {
      montoAPagar += ticket.recargo_multa;
    }

    // Restar descuento si fue aprobado
    if (ticket.descuento_aplicado) {
      montoAPagar = Math.max(0, montoAPagar - ticket.descuento_aplicado);
    }

    return {
      ticket,
      minutosTranscurridos,
      montoAPagar,
      montoOriginal: montoAPagar + (ticket.descuento_aplicado || 0) - (ticket.recargo_multa || 0),
      estaEnGracia,
      advertenciaMinutos,
    };
  }

  // --- CHECK-OUT Y COBRO (POS) ---
  public checkout(
    identificador: string,
    metodoPago: PaymentMethod,
    montoEntregado: number
  ): { ticket: Ticket; vuelto: number } {
    const calc = this.calculatePendingCheckout(identificador);
    const ticket = calc.ticket;

    if (metodoPago === 'EFECTIVO' && montoEntregado < calc.montoAPagar) {
      throw new Error(`Monto entregado ($${montoEntregado.toLocaleString('es-CL')}) insuficiente. Total a pagar: $${calc.montoAPagar.toLocaleString('es-CL')}.`);
    }

    const vuelto = metodoPago === 'EFECTIVO' ? montoEntregado - calc.montoAPagar : 0;
    const ahora = new Date().toISOString();

    ticket.fecha_hora_salida = ahora;
    ticket.duracion_total_minutos = calc.minutosTranscurridos;
    ticket.monto_original_calculado = calc.montoOriginal;
    ticket.monto_total_cobrado = calc.montoAPagar;
    ticket.estado_ticket = 'ENTREGADO'; // Cierre canónico de 4 fases
    ticket.metodo_pago = metodoPago;
    ticket.monto_entregado = montoEntregado;
    ticket.vuelto = vuelto;

    // Liberar slot físico
    const slot = this.slots.find((s) => s.id === ticket.slot_numero);
    if (slot) {
      slot.estado = 'DISPONIBLE';
      slot.ticket_actual = undefined;
    }

    if (this.currentShift) {
      this.currentShift.total_tickets_cobrados += 1;
    }

    this.addAudit(
      'CHECKOUT_PAGADO',
      'SISTEMA',
      'AZUL',
      this.currentShift?.id_operador || 'OP-01',
      this.currentShift?.nombre_operador || 'Operador',
      `Salida vehículo ${ticket.patente}. Cobrado: $${calc.montoAPagar.toLocaleString('es-CL')} (${metodoPago}), Vuelto: $${vuelto.toLocaleString('es-CL')}`,
      undefined,
      { ticketId: ticket.id_ticket, monto: calc.montoAPagar, metodoPago, vuelto }
    );

    return { ticket, vuelto };
  }

  // --- EXCEPCIONES ANTIFRAUDE: FUGA, DESCUENTO Y TICKET PERDIDO ---
  public registrarFuga(identificador: string, pin: string, motivo: string): Ticket {
    const calc = this.calculatePendingCheckout(identificador);
    const ticket = calc.ticket;

    if (!pin || pin.length < 4) {
      throw new Error('Se requiere el PIN individual de 4 dígitos para registrar la fuga de un vehículo.');
    }

    const ahora = new Date().toISOString();
    ticket.fecha_hora_salida = ahora;
    ticket.duracion_total_minutos = calc.minutosTranscurridos;
    ticket.monto_original_calculado = calc.montoAPagar;
    ticket.monto_total_cobrado = 0;
    ticket.estado_ticket = 'ANULADO';
    ticket.incidencia = 'FUGA';
    ticket.observaciones = motivo || 'Vehículo retirado sin realizar el pago';
    ticket.pin_autorizador = pin;

    // Liberar slot
    const slot = this.slots.find((s) => s.id === ticket.slot_numero);
    if (slot) {
      slot.estado = 'DISPONIBLE';
      slot.ticket_actual = undefined;
    }

    if (this.currentShift) {
      this.currentShift.total_fugas = (this.currentShift.total_fugas || 0) + 1;
    }

    this.addAudit(
      'VEHICULO_FUGA_ANULADO',
      'FUGA',
      'ROJO',
      this.currentShift?.id_operador || 'OP-01',
      this.currentShift?.nombre_operador || 'Operador',
      `[FUGA SIN PAGO]: Vehículo ${ticket.patente} se retiró sin pagar. Monto adeudado no percibido: $${calc.montoAPagar.toLocaleString('es-CL')}. Motivo: ${motivo}`,
      pin,
      { ticketId: ticket.id_ticket, montoPerdido: calc.montoAPagar, motivo }
    );

    return ticket;
  }

  public aplicarDescuentoOCobroParcial(
    identificador: string,
    montoNuevo: number,
    pin: string,
    motivo: string,
    tipo: 'DESCUENTO' | 'COBRO_PARCIAL'
  ): Ticket {
    const calc = this.calculatePendingCheckout(identificador);
    const ticket = calc.ticket;

    if (!pin || pin.length < 4) {
      throw new Error('Se requiere el PIN individual de 4 dígitos para autorizar modificaciones al monto.');
    }

    const descuento = Math.max(0, calc.montoAPagar - montoNuevo);
    ticket.descuento_aplicado = descuento;
    ticket.incidencia = tipo;
    ticket.observaciones = motivo;
    ticket.pin_autorizador = pin;

    if (this.currentShift) {
      this.currentShift.total_descuentos = (this.currentShift.total_descuentos || 0) + descuento;
    }

    const esDescuento = tipo === 'DESCUENTO';
    this.addAudit(
      esDescuento ? 'DESCUENTO_AUTORIZADO' : 'COBRO_PARCIAL_DISPUTA',
      tipo,
      esDescuento ? 'VERDE' : 'AZUL',
      this.currentShift?.id_operador || 'OP-01',
      this.currentShift?.nombre_operador || 'Operador',
      `Ajuste de cobro en ticket ${ticket.id_ticket} (${ticket.patente}): Monto original $${calc.montoAPagar} -> Nuevo monto $${montoNuevo} (Descuento: $${descuento}). Motivo: ${motivo}`,
      pin,
      { ticketId: ticket.id_ticket, montoOriginal: calc.montoAPagar, montoNuevo, descuento, motivo }
    );

    return ticket;
  }

  public declararTicketPerdido(identificador: string, pin: string): Ticket {
    const calc = this.calculatePendingCheckout(identificador);
    const ticket = calc.ticket;

    if (!pin || pin.length < 4) {
      throw new Error('Se requiere PIN de autorización para registrar un ticket extraviado.');
    }

    const MULTA_TICKET_EXTRAVIADO = 10000; // $10.000 CLP fijo
    ticket.recargo_multa = MULTA_TICKET_EXTRAVIADO;
    ticket.incidencia = 'MULTA_EXTRAVIO';
    ticket.pin_autorizador = pin;

    this.addAudit(
      'TICKET_EXTRAVIADO_MULTA',
      'MULTA_EXTRAVIO',
      'ROJO',
      this.currentShift?.id_operador || 'OP-01',
      this.currentShift?.nombre_operador || 'Operador',
      `Ticket extraviado declarado para patente ${ticket.patente}. Se aplica multa reglamentaria de $${MULTA_TICKET_EXTRAVIADO.toLocaleString('es-CL')}.`,
      pin,
      { ticketId: ticket.id_ticket, multa: MULTA_TICKET_EXTRAVIADO }
    );

    return ticket;
  }

  public reimprimirTicket(identificador: string): Ticket {
    const ticket = this.tickets.find(
      (t) => t.id_ticket.toUpperCase() === identificador.toUpperCase() || t.patente === identificador.toUpperCase()
    );
    if (!ticket) {
      throw new Error(`Ticket no encontrado para reimpresión: ${identificador}`);
    }

    ticket.reprint_count += 1;
    this.addAudit(
      'TICKET_REIMPRESO',
      'REIMPRESION',
      'GRIS',
      this.currentShift?.id_operador || 'OP-01',
      this.currentShift?.nombre_operador || 'Operador',
      `Reimpresión física N° ${ticket.reprint_count} emitida para ticket ${ticket.id_ticket} (${ticket.patente})`
    );

    return ticket;
  }

  // --- AUDITORÍA INMUTABLE CON CÓDIGO CROMÁTICO ---
  public addAudit(
    accion: string,
    tipoEvento: IncidenceType | 'CIERRE' | 'APERTURA' | 'REIMPRESION' | 'SISTEMA' = 'SISTEMA',
    colorTag: 'VERDE' | 'ROJO' | 'AZUL' | 'GRIS' = 'GRIS',
    idUsuario: string = 'SYSTEM',
    nombreUsuario: string = 'Sistema',
    motivo?: string,
    autorizadorPin?: string,
    metadatos?: Record<string, any>
  ): AuditLog {
    const log: AuditLog = {
      id_auditoria: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      accion,
      tipo_evento: tipoEvento,
      color_tag: colorTag,
      id_usuario: idUsuario,
      nombre_usuario: nombreUsuario,
      fecha_hora: new Date().toISOString(),
      motivo,
      autorizador_pin: autorizadorPin,
      metadatos,
    };
    this.auditLogs.unshift(log);
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public getTickets(): Ticket[] {
    return this.tickets;
  }

  // --- CONEXIÓN GOOGLE CLOUD RUN ---
  public getCloudRunInfo(): CloudRunConnectionInfo {
    return {
      projectId: process.env.NEXT_PUBLIC_GCP_PROJECT_ID || 'gen-lang-client-0862587160',
      projectNumber: process.env.NEXT_PUBLIC_GCP_PROJECT_NUMBER || '349577440002',
      region: process.env.NEXT_PUBLIC_GCP_REGION || 'us-west1',
      serviceName: 'cordano-pms-v1',
      serviceUrl: process.env.K_SERVICE ? `https://cordano-pms-v1-349577440002.us-west1.run.app` : undefined,
      existingAppUrl: process.env.EXISTING_CLOUDRUN_APP_URL || undefined,
      status: 'STANDALONE_READY',
    };
  }
}

// Singleton global en memoria
declare global {
  var pmsStoreInstance: PmsDataStore | undefined;
}

export const pmsStore = globalThis.pmsStoreInstance ?? new PmsDataStore();
if (process.env.NODE_ENV !== 'production') {
  globalThis.pmsStoreInstance = pmsStore;
}
