import React from 'react';
import {
  Boxes,
  CalendarDays,
  Clock,
  Contact,
  Printer,
  Receipt,
  Truck,
  Users
} from 'lucide-react';
import { EventoLog, Insumo, Mesa, Pedido, ProductoMenu } from '../types';

type OpsView = 'turnos' | 'compras' | 'clientes' | 'delivery' | 'ticketera';

interface RestaurantOpsModuleProps {
  view: OpsView;
  mesas: Mesa[];
  pedidos: Pedido[];
  insumos: Insumo[];
  productosMenu: ProductoMenu[];
  logs: EventoLog[];
  activeMozo: string;
  getSimulatedTimeStr: () => string;
  onInjectDeliveryOrder: (source: 'Rappi' | 'PedidosYa') => void;
  onRestockTodo: () => void;
  addLog: (tipo: EventoLog['tipo'], mensaje: string) => void;
}

const money = (value: number) => `$${value.toLocaleString('es-AR')}`;

export default function RestaurantOpsModule({
  view,
  mesas,
  pedidos,
  insumos,
  productosMenu,
  logs,
  activeMozo,
  getSimulatedTimeStr,
  onInjectDeliveryOrder,
  onRestockTodo,
  addLog
}: RestaurantOpsModuleProps) {
  const lowStock = insumos.filter(item => item.stock_actual <= item.stock_minimo);
  const activeOrders = pedidos.filter(pedido => pedido.estado_comanda !== 'entregado_cobrado' && pedido.estado_comanda !== 'cancelado');
  const readyOrders = pedidos.filter(pedido => pedido.estado_comanda === 'listo');
  const deliveryOrders = pedidos.filter(pedido => pedido.origen === 'Rappi' || pedido.origen === 'PedidosYa');
  const activeMenu = productosMenu.filter(item => item.activo);
  const totalSales = pedidos
    .filter(pedido => pedido.estado_comanda === 'entregado_cobrado')
    .reduce((acc, pedido) => acc + pedido.items.reduce((sum, item) => sum + item.cantidad * 12500, 0), 0);

  const titleByView: Record<OpsView, { title: string; subtitle: string; icon: React.ElementType }> = {
    turnos: {
      title: 'Turnos y apertura',
      subtitle: 'Control del servicio, personal activo y tablero de inicio/cierre.',
      icon: Clock
    },
    compras: {
      title: 'Compras y abastecimiento',
      subtitle: 'Sugerencias de reposicion segun stock minimo, bodega e insumos criticos.',
      icon: Boxes
    },
    clientes: {
      title: 'Clientes y fidelizacion',
      subtitle: 'Reservas, preferencias y lectura rapida del salon para atencion premium.',
      icon: Contact
    },
    delivery: {
      title: 'Delivery y canales online',
      subtitle: 'Entrada de pedidos externos, despacho y sincronizacion con cocina.',
      icon: Truck
    },
    ticketera: {
      title: 'Ticketera, PDF e impresion',
      subtitle: 'Cola de tickets, reimpresiones y preparado para impresora termica ESC/POS.',
      icon: Printer
    }
  };

  const CurrentIcon = titleByView[view].icon;

  const renderBody = () => {
    if (view === 'turnos') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Metric label="Hora de servicio" value={getSimulatedTimeStr()} />
            <Metric label="Usuario activo" value={activeMozo} />
            <Metric label="Mesas ocupadas" value={`${mesas.filter(m => m.estado === 'ocupada').length}/${mesas.length}`} />
          </div>
          <Panel title="Checklist del turno" icon={CalendarDays}>
            {['Caja abierta y fondo contado', 'Mozos asignados al salon', 'Cocina KDS en escucha', 'Stock critico revisado', 'Ticketera lista para imprimir'].map(item => (
              <div key={item} className="flex items-center justify-between border-b border-stone-100 py-3 last:border-b-0">
                <span className="text-sm font-semibold text-stone-700">{item}</span>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-emerald-700">OK</span>
              </div>
            ))}
          </Panel>
        </>
      );
    }

    if (view === 'compras') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Metric label="Stock bajo" value={lowStock.length} tone={lowStock.length ? 'danger' : 'ok'} />
            <Metric label="Insumos activos" value={insumos.length} />
            <Metric label="Bodega" value={insumos.filter(i => i.categoria.toLowerCase().includes('bodega')).length} />
            <Metric label="Menu activo" value={activeMenu.length} />
          </div>
          <Panel title="Lista sugerida de compra" icon={Boxes}>
            {(lowStock.length ? lowStock : insumos.slice(0, 8)).map(item => (
              <div key={item.id_insumo} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 border-b border-stone-100 py-3 last:border-b-0">
                <div>
                  <strong className="block text-sm text-stone-900">{item.nombre}</strong>
                  <span className="text-xs text-stone-500">{item.categoria}{item.proveedor ? ` | ${item.proveedor}` : ''}</span>
                </div>
                <span className="font-mono text-sm text-stone-700">{item.stock_actual} {item.unidad_medida}</span>
                <span className="font-mono text-sm text-stone-500">min. {item.stock_minimo}</span>
              </div>
            ))}
            <button onClick={onRestockTodo} className="mt-4 w-full min-h-11 rounded-lg bg-[#6B4A35] px-4 text-sm font-black text-white shadow-sm hover:bg-[#563729]">
              Generar reposicion general
            </button>
          </Panel>
        </>
      );
    }

    if (view === 'clientes') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Metric label="Reservas hoy" value={mesas.filter(m => m.estado === 'esperando_cuenta').length} />
            <Metric label="Mesas libres" value={mesas.filter(m => m.estado === 'libre').length} tone="ok" />
            <Metric label="Tickets cobrados" value={pedidos.filter(p => p.estado_comanda === 'entregado_cobrado').length} />
            <Metric label="Venta registrada" value={money(totalSales)} />
          </div>
          <Panel title="Atencion premium sugerida" icon={Users}>
            {mesas.slice(0, 6).map(mesa => (
              <div key={mesa.id_mesa} className="flex items-center justify-between border-b border-stone-100 py-3 last:border-b-0">
                <div>
                  <strong className="block text-sm text-stone-900">Mesa {mesa.numero_mesa}</strong>
                  <span className="text-xs text-stone-500">Estado: {mesa.estado.replace('_', ' ')}</span>
                </div>
                <span className="rounded-md border border-[#D8B08A]/50 bg-[#F7EFE4] px-2 py-1 text-[10px] font-black uppercase text-[#6B4A35]">
                  {mesa.comensales || 0} pax
                </span>
              </div>
            ))}
          </Panel>
        </>
      );
    }

    if (view === 'delivery') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Metric label="Pedidos online" value={deliveryOrders.length} />
            <Metric label="Activos" value={activeOrders.length} />
            <Metric label="Listos" value={readyOrders.length} tone="ok" />
            <Metric label="Canales" value="2" />
          </div>
          <Panel title="Entregas Activas (Canales Conectados)" icon={Truck}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => onInjectDeliveryOrder('Rappi')} 
                className="min-h-12 rounded-xl border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-950 font-black text-xs px-4 shadow-sm transition-all duration-100 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />
                Simular pedido Rappi (API)
              </button>
              <button 
                onClick={() => onInjectDeliveryOrder('PedidosYa')} 
                className="min-h-12 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-950 font-black text-xs px-4 shadow-sm transition-all duration-100 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                Simular pedido PedidosYa (API)
              </button>
            </div>
            <div className="mt-6 space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-500 pl-1">Listado de Pedidos Online</h4>
              {deliveryOrders.map(pedido => (
                <div key={pedido.id_pedido} className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-stone-900 block">Orden #{pedido.id_pedido}</span>
                    <span className="text-[10px] font-mono text-stone-500 font-semibold">{pedido.numero_mesa}</span>
                  </div>
                  <span className="rounded-md border border-[#8C6239]/20 bg-[#F7EFE4] px-2.5 py-1 text-[10px] font-black uppercase text-[#6B4A35]">
                    {pedido.estado_comanda.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {deliveryOrders.length === 0 && <Empty text="No hay pedidos externos en cola actualmente." />}
            </div>
          </Panel>
        </>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Metric label="Tickets listos" value={readyOrders.length} tone="ok" />
          <Metric label="Facturados" value={pedidos.filter(p => p.estado_comanda === 'entregado_cobrado').length} />
          <Metric label="PDF" value="Activo" />
          <Metric label="ESC/POS" value="Preparado" />
        </div>
        <Panel title="Cola de impresion" icon={Receipt}>
          {(readyOrders.length ? readyOrders : pedidos.slice(0, 5)).map(pedido => (
            <div key={pedido.id_pedido} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 border-b border-stone-100 py-3 last:border-b-0">
              <div>
                <strong className="block text-sm text-stone-900">Ticket #{pedido.id_pedido} | Mesa {pedido.numero_mesa}</strong>
                <span className="text-xs text-stone-500">{pedido.items.length} items | {pedido.mozo}</span>
              </div>
              <span className="text-xs font-black uppercase text-stone-500">{pedido.estado_comanda}</span>
              <button
                onClick={() => addLog('sistema', `TICKETERA: Ticket #${pedido.id_pedido} enviado a cola PDF/impresion.`)}
                className="rounded-lg border border-[#D8B08A] px-3 py-2 text-xs font-black text-[#6B4A35] hover:bg-[#F7EFE4]"
              >
                Enviar a ticketera
              </button>
            </div>
          ))}
          {pedidos.length === 0 && <Empty text="No hay tickets generados todavia." />}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <button className="min-h-11 rounded-lg bg-[#6B4A35] px-4 text-sm font-black text-white shadow-sm hover:bg-[#563729]">
              Descargar cierre PDF
            </button>
            <button className="min-h-11 rounded-lg border border-[#D8B08A] px-4 text-sm font-black text-[#6B4A35] hover:bg-[#F7EFE4]">
              Probar impresora termica
            </button>
          </div>
        </Panel>
      </>
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-[#DED4C7] bg-[#FFFDF8] p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[#D8B08A]/60 bg-[#F7EFE4] text-[#6B4A35]">
              <CurrentIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="font-display-serif text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6239]">Modulo operativo</span>
              <h2 className="font-serif-vintage text-3xl font-semibold text-[#2F241D]">{titleByView[view].title}</h2>
              <p className="mt-1 text-sm text-stone-600">{titleByView[view].subtitle}</p>
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
            <span className="font-black text-[#2F241D]">Ultimo evento:</span>{' '}
            {logs[0]?.mensaje || 'Sin actividad reciente'}
          </div>
        </div>
      </div>
      {renderBody()}
    </section>
  );
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: React.ReactNode; tone?: 'neutral' | 'ok' | 'danger' }) {
  const toneClass = tone === 'ok' ? 'border-emerald-300 text-emerald-700' : tone === 'danger' ? 'border-rose-300 text-rose-700' : 'border-[#DED4C7] text-[#2F241D]';
  return (
    <div className={`rounded-lg border bg-[#FFFDF8] p-4 shadow-sm ${toneClass}`}>
      <span className="font-display-serif text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">{label}</span>
      <strong className="mt-2 block text-3xl font-black">{value}</strong>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#DED4C7] bg-[#FFFDF8] p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 font-display-serif text-sm font-bold uppercase tracking-[0.14em] text-[#6B4A35]">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#D8B08A] bg-[#F7EFE4]/50 p-5 text-center text-sm font-semibold text-stone-500">
      {text}
    </div>
  );
}
