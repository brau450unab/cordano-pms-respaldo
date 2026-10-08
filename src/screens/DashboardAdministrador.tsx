import React from 'react';
import { useParking } from '../context/ParkingContext';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  Download,
} from 'lucide-react';

export const DashboardAdministrador: React.FC = () => {
  const { tickets } = useParking();

  // Paid tickets calculations
  const paidTickets = tickets.filter((t) => t.status === 'pagado');
  const totalRevenue = paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalDiscounts = paidTickets.reduce((sum, t) => sum + (t.discountAmount || 0), 0);

  // Revenue by payment method
  const methodTotals = paidTickets.reduce(
    (acc, t) => {
      const m = t.paymentMethod || 'efectivo';
      acc[m] = (acc[m] || 0) + (t.totalAmount || 0);
      return acc;
    },
    { efectivo: 0, tarjeta_debito: 0, tarjeta_credito: 0, transferencia: 0 } as Record<string, number>
  );

  const pieData = [
    { name: 'Efectivo', value: methodTotals.efectivo, color: '#0F172A' },
    { name: 'Débito', value: methodTotals.tarjeta_debito, color: '#475569' },
    { name: 'Crédito', value: methodTotals.tarjeta_credito, color: '#94A3B8' },
    { name: 'Transferencia', value: methodTotals.transferencia, color: '#CBD5E1' },
  ].filter((d) => d.value > 0);

  // Sample hourly occupancy distribution for Recharts
  const hourlyData = [
    { hour: '07:00', vehiculos: 4, recaudacion: 12000 },
    { hour: '09:00', vehiculos: 14, recaudacion: 42000 },
    { hour: '11:00', vehiculos: 18, recaudacion: 68000 },
    { hour: '13:00', vehiculos: 20, recaudacion: 85000 },
    { hour: '15:00', vehiculos: 16, recaudacion: 54000 },
    { hour: '17:00', vehiculos: 19, recaudacion: 79000 },
    { hour: '19:00', vehiculos: 12, recaudacion: 38000 },
    { hour: '21:00', vehiculos: 6, recaudacion: 18000 },
  ];

  const exportReportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Ticket,Patente,Tipo,Slot,Monto,Medio,Estado\n' +
      tickets
        .map(
          (t) =>
            `${t.ticketCode},${t.plateNumber},${t.vehicleType},${t.slotCode},${t.totalAmount || 0},${t.paymentMethod || 'N/A'},${t.status}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'cordano_reporte_administrador.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 tabular-nums">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
              SUPERVISIÓN & CONTROL EJECUTIVO
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1.5 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-slate-800" />
            <span>Dashboard Administrador (Serrano 447)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisión consolidada de ingresos, horas punta y distribución de recaudación
          </p>
        </div>

        <button
          onClick={exportReportCSV}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs tabular-nums font-bold transition flex items-center space-x-2 cursor-pointer border border-slate-900"
        >
          <Download className="w-4 h-4" />
          <span>EXPORTAR REPORTE CSV</span>
        </button>
      </div>

      {/* Top Admin KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        
        <div className="bg-white rounded-xl p-4 border border-slate-300 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">[ Total Recaudado ]</span>
          <p className="text-2xl font-black text-slate-900">
            ${totalRevenue.toLocaleString('es-CL')} <span className="text-xs text-slate-500">CLP</span>
          </p>
          <p className="text-xs text-slate-600 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-slate-700" />
            <span>+14.2% vs ayer</span>
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-300 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">[ Tickets Procesados ]</span>
          <p className="text-2xl font-black text-slate-900">
            {paidTickets.length}
          </p>
          <p className="text-xs text-slate-500">
            Estadía media: 78 min
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-300 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">[ Descuentos & Convenios ]</span>
          <p className="text-2xl font-black text-slate-900">
            ${totalDiscounts.toLocaleString('es-CL')} <span className="text-xs text-slate-500">CLP</span>
          </p>
          <p className="text-xs text-slate-500">
            Aprobados con Clave Admin
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-300 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">[ Hora Punta Demanda ]</span>
          <p className="text-2xl font-black text-slate-900">
            13:00 hrs
          </p>
          <p className="text-xs text-slate-500">
            95% ocupación peak
          </p>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 tabular-nums">
        
        {/* Chart 1: Hourly Revenue & Occupancy */}
        <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">[ Curva de Recaudación por Horario ]</h3>
            <span className="text-xs text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
              Serrano 447
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorRecaudacion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
                <Tooltip
                  formatter={(value: any) => [`$${value.toLocaleString('es-CL')} CLP`, 'Recaudación']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="recaudacion"
                  stroke="#0F172A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRecaudacion)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Payment Methods Donut */}
        <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">[ Medios de Pago ]</h3>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => `$${val.toLocaleString('es-CL')} CLP`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            {pieData.map((item) => (
              <div key={item.name} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-700">{item.name}</span>
                </span>
                <span className="tabular-nums font-bold text-slate-900">${item.value.toLocaleString('es-CL')}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
