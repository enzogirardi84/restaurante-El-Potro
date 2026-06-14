/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed,
  ChefHat,
  Database,
  TrendingUp,
  Receipt,
  Home,
  BarChart3,
  BookOpen,
  ClipboardList,
  Boxes,
  Archive,
  Settings,
  Users,
  WalletCards,
  FileText,
  BadgePercent,
  CalendarDays,
  Truck,
  Terminal,
  User,
  Clock,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Scale,
  ChevronRight,
  CircleAlert,
  CircleCheck
} from 'lucide-react';

import { Mesa, Insumo, ProductoMenu, RecetaEscandallo, Pedido, Merma, EventoLog } from './types';
import { 
  INITIAL_MESAS, 
  INITIAL_INSUMOS, 
  INITIAL_PRODUCTOS_MENU, 
  INITIAL_RECETAS_ESCANDALLO, 
  INITIAL_PEDIDOS 
} from './data/initialData';

// Subcomponents matching the design
import HomeMenuModule from './components/HomeMenuModule';
import MozoTerminal from './components/MozoTerminal';
import KitchenMonitor from './components/KitchenMonitor';
import InventoryModule from './components/InventoryModule';
import BusinessIntelligence from './components/BusinessIntelligence';
import CajaModule from './components/CajaModule';
import SistemaModule from './components/SistemaModule';
import PythonStreamlitLogin from './components/PythonStreamlitLogin';
import ElPatronLogo from './components/ElPatronLogo';
import PanelDashboard from './components/PanelDashboard';
import UsuariosModule from './components/UsuariosModule';
import MenuModule from './components/MenuModule';
import RecetasModule from './components/RecetasModule';
import MesasModule from './components/MesasModule';
import ProveedoresModule from './components/ProveedoresModule';
import PromocionesModule from './components/PromocionesModule';
import ReservasModule from './components/ReservasModule';
import FacturacionModule from './components/FacturacionModule';
import BackupsModule from './components/BackupsModule';
import RestaurantOpsModule from './components/RestaurantOpsModule';
import { 
  getSupabaseClient,
  dbFetchMesas,
  dbFetchInsumos,
  dbFetchProductosMenu,
  dbFetchRecetas,
  dbFetchPedidos,
  dbSavePedidoComplex,
  dbUpsertMesas,
  dbUpsertInsumos,
  dbFetchMermas,
  dbRecordMovement
} from './supabase';

type ActiveView =
  | 'home'
  | 'panel'
  | 'mozo'
  | 'cocina'
  | 'caja'
  | 'reportes'
  | 'usuarios'
  | 'menu'
  | 'recetas'
  | 'mesas'
  | 'inventario'
  | 'proveedores'
  | 'promociones'
  | 'reservas'
  | 'facturacion'
  | 'turnos'
  | 'compras'
  | 'clientes'
  | 'delivery'
  | 'ticketera'
  | 'sistema'
  | 'backups';

type NavItem = {
  id: ActiveView;
  label: string;
  shortLabel: string;
  description: string;
  group: 'Operación' | 'Administración' | 'Sistema';
  icon: React.ElementType;
  tone: 'brown' | 'green' | 'amber' | 'blue' | 'red' | 'slate';
};

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Menú Principal',
    shortLabel: 'Inicio',
    description: 'Centro operativo y accesos rápidos del restaurante.',
    group: 'Operación',
    icon: Home,
    tone: 'brown',
  },
  {
    id: 'panel',
    label: 'Panel General',
    shortLabel: 'Panel',
    description: 'Métricas macro, alertas críticas y bitácora en vivo.',
    group: 'Operación',
    icon: BarChart3,
    tone: 'blue',
  },
  {
    id: 'mozo',
    label: 'Mozo / Salón',
    shortLabel: 'Mozo',
    description: 'Toma de pedidos, mesas y envío de comandas.',
    group: 'Operación',
    icon: Smartphone,
    tone: 'brown',
  },
  {
    id: 'cocina',
    label: 'Cocina KDS',
    shortLabel: 'Cocina',
    description: 'Preparación, tiempos y descuento de escandallos.',
    group: 'Operación',
    icon: ChefHat,
    tone: 'amber',
  },
  {
    id: 'caja',
    label: 'Caja',
    shortLabel: 'Caja',
    description: 'Cobros, pagos mixtos, cierres y comprobantes.',
    group: 'Operación',
    icon: WalletCards,
    tone: 'green',
  },
  {
    id: 'turnos',
    label: 'Turnos',
    shortLabel: 'Turnos',
    description: 'Apertura, personal activo y control de servicio.',
    group: 'Operación',
    icon: Clock,
    tone: 'amber',
  },
  {
    id: 'delivery',
    label: 'Delivery',
    shortLabel: 'Delivery',
    description: 'Pedidos externos, canales online y despacho.',
    group: 'Operación',
    icon: Truck,
    tone: 'green',
  },
  {
    id: 'reportes',
    label: 'Reportes / BI',
    shortLabel: 'Reportes',
    description: 'Lectura comercial, ventas, stock y desempeño.',
    group: 'Operación',
    icon: TrendingUp,
    tone: 'blue',
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    shortLabel: 'Usuarios',
    description: 'Personal, roles y permisos operativos.',
    group: 'Administración',
    icon: Users,
    tone: 'slate',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    shortLabel: 'Clientes',
    description: 'Historial, preferencias, reservas y fidelizacion.',
    group: 'Administración',
    icon: Users,
    tone: 'brown',
  },
  {
    id: 'compras',
    label: 'Compras',
    shortLabel: 'Compras',
    description: 'Reposicion, sugerencias de compra y proveedores.',
    group: 'Administración',
    icon: Boxes,
    tone: 'red',
  },
  {
    id: 'menu',
    label: 'Menú',
    shortLabel: 'Carta',
    description: 'Platos, bebidas, precios y disponibilidad.',
    group: 'Administración',
    icon: BookOpen,
    tone: 'brown',
  },
  {
    id: 'recetas',
    label: 'Recetas / Escandallos',
    shortLabel: 'Recetas',
    description: 'Ingredientes, gramajes y fórmulas de descuento.',
    group: 'Administración',
    icon: ClipboardList,
    tone: 'amber',
  },
  {
    id: 'mesas',
    label: 'Mesas',
    shortLabel: 'Mesas',
    description: 'Distribución del salón, ocupación y capacidad.',
    group: 'Administración',
    icon: UtensilsCrossed,
    tone: 'blue',
  },
  {
    id: 'inventario',
    label: 'Inventario',
    shortLabel: 'Stock',
    description: 'Insumos, bodega, mermas y reposición.',
    group: 'Administración',
    icon: Boxes,
    tone: 'red',
  },
  {
    id: 'proveedores',
    label: 'Proveedores',
    shortLabel: 'Proveedores',
    description: 'Contactos, compras y abastecimiento.',
    group: 'Administración',
    icon: Truck,
    tone: 'slate',
  },
  {
    id: 'promociones',
    label: 'Promociones',
    shortLabel: 'Promos',
    description: 'Descuentos, happy hour y campañas.',
    group: 'Administración',
    icon: BadgePercent,
    tone: 'green',
  },
  {
    id: 'reservas',
    label: 'Reservas',
    shortLabel: 'Reservas',
    description: 'Agenda, clientes y mesas planificadas.',
    group: 'Administración',
    icon: CalendarDays,
    tone: 'amber',
  },
  {
    id: 'facturacion',
    label: 'Facturación',
    shortLabel: 'Facturas',
    description: 'Archivo tributario, tickets y pagos.',
    group: 'Administración',
    icon: FileText,
    tone: 'green',
  },
  {
    id: 'sistema',
    label: 'Sistema',
    shortLabel: 'Sistema',
    description: 'Supabase, configuración y diagnóstico general.',
    group: 'Sistema',
    icon: Settings,
    tone: 'blue',
  },
  {
    id: 'ticketera',
    label: 'Ticketera',
    shortLabel: 'Ticketera',
    description: 'Impresion, PDF, cola de tickets y ESC/POS.',
    group: 'Sistema',
    icon: Receipt,
    tone: 'green',
  },
  {
    id: 'backups',
    label: 'Backups',
    shortLabel: 'Backups',
    description: 'Copias de seguridad y restauración.',
    group: 'Sistema',
    icon: Archive,
    tone: 'slate',
  },
];

const NAV_GROUPS: NavItem['group'][] = ['Operación', 'Administración', 'Sistema'];

const TONE_CLASSES: Record<NavItem['tone'], string> = {
  brown: 'text-[#D8B08A] bg-[#6B4A35]/18 border-[#8C6239]/25',
  green: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20',
  amber: 'text-amber-300 bg-amber-500/10 border-amber-400/20',
  blue: 'text-sky-300 bg-sky-500/10 border-sky-400/20',
  red: 'text-rose-300 bg-rose-500/10 border-rose-400/20',
  slate: 'text-stone-300 bg-stone-500/10 border-stone-400/20',
};

export default function App() {
  // --- Global Synced States ---
  const [isStreamlitLoggedIn, setIsStreamlitLoggedIn] = useState<boolean>(false);
  const [permitirVentaSinStock, setPermitirVentaSinStock] = useState<boolean>(false);
  const [mesas, setMesas] = useState<Mesa[]>(INITIAL_MESAS);
  const [insumos, setInsumos] = useState<Insumo[]>(INITIAL_INSUMOS);
  const [productosMenu, setProductosMenu] = useState<ProductoMenu[]>(INITIAL_PRODUCTOS_MENU);
  const [recetas, setRecetas] = useState<RecetaEscandallo[]>(INITIAL_RECETAS_ESCANDALLO);
  const [pedidos, setPedidos] = useState<Pedido[]>(INITIAL_PEDIDOS);
  const [mermas, setMermas] = useState<Merma[]>([]);

  // Auto-sync effect on mount
  useEffect(() => {
    const autoLoadSupabase = async () => {
      const client = getSupabaseClient();
      if (!client) return;
      try {
        const dbMesas = await dbFetchMesas();
        const dbInsumos = await dbFetchInsumos();
        const dbProducts = await dbFetchProductosMenu();
        const dbRecipes = await dbFetchRecetas();
        const dbPedidos = await dbFetchPedidos();
        const dbMermas = await dbFetchMermas();

        if (dbMesas && dbMesas.length > 0) {
          setMesas(dbMesas.map(m => ({
            id_mesa: m.id_mesa,
            numero_mesa: m.numero_mesa,
            estado: m.estado || 'libre',
            comensales: m.comensales || undefined
          })));
        }
        if (dbInsumos && dbInsumos.length > 0) {
          setInsumos(dbInsumos);
        }
        if (dbProducts && dbProducts.length > 0) {
          setProductosMenu(dbProducts);
        }
        if (dbRecipes && dbRecipes.length > 0) {
          setRecetas(dbRecipes);
        }
        if (dbPedidos && dbPedidos.length > 0) {
          setPedidos(dbPedidos);
        }
        if (dbMermas && dbMermas.length > 0) {
          setMermas(dbMermas);
        }
        addLog('sistema', 'SUPABASE: Auto-sincronización exitosa en el arranque de la aplicación.');
      } catch (err) {
        console.warn('Supabase: Falló auto-sync en el arranque. Usando datos SQLite locales.', err);
      }
    };
    autoLoadSupabase();
  }, []);

  // Sync completion callback handed to settings
  const handleSupabaseSync = (newData: {
    mesas?: Mesa[];
    insumos?: Insumo[];
    productosMenu?: ProductoMenu[];
    recetas?: RecetaEscandallo[];
    pedidos?: Pedido[];
    mermas?: Merma[];
  }) => {
    if (newData.mesas) setMesas(newData.mesas);
    if (newData.insumos) setInsumos(newData.insumos);
    if (newData.productosMenu) setProductosMenu(newData.productosMenu);
    if (newData.recetas) setRecetas(newData.recetas);
    if (newData.pedidos) setPedidos(newData.pedidos);
    if (newData.mermas) setMermas(newData.mermas);
  };

  
  // Custom interactive log tracker for BI & audit
  const [logs, setLogs] = useState<EventoLog[]>([
    {
      id: 'init_log_1',
      tipo: 'sistema',
      mensaje: 'SISTEMA: Conexión establecida de forma segura. SQLite local cargada con éxito.',
      timestamp: new Date(Date.now() - 35 * 60 * 1000)
    },
    {
      id: 'init_log_2',
      tipo: 'sistema',
      mensaje: 'SISTEMA: Inicializando terminales para personal de Mozo, Cocina, Caja y Administrador.',
      timestamp: new Date(Date.now() - 34 * 60 * 1000)
    },
    {
      id: 'init_log_3',
      tipo: 'descuento_stock',
      mensaje: 'ESCANDALLO: Stock de materia prima cargado con 15 insumos controlados.',
      timestamp: new Date(Date.now() - 33 * 60 * 1000)
    }
  ]);

  // Terminal active configs & simulation states
  const [activeMozo, setActiveMozo] = useState<string>('Enzo');
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const selectView = (view: ActiveView) => {
    setActiveView(view);
    setIsSidebarCollapsed(true);
  };

  // Simulation Clock state (operational minutes passed)
  const [minutosGlobal, setMinutosGlobal] = useState<number>(0);
  const [autoTimerRunning, setAutoTimerRunning] = useState<boolean>(false);

  // Helper log registrar
  const addLog = (
    tipo: 'pedido_creado' | 'descuento_stock' | 'alerta_stock' | 'comanda_estado' | 'merma_registrada' | 'sistema', 
    mensaje: string
  ) => {
    const newLogItem: EventoLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tipo,
      mensaje,
      timestamp: new Date()
    };
    setLogs(prev => [newLogItem, ...prev]);
  };

  // --- Handlers for Waiter View (Terminal Mozo) ---
  const handleCrearPedido = (newPedidoData: Omit<Pedido, 'id_pedido' | 'fecha_hora' | 'minutos_transcurridos' | 'origen'> & { origen?: 'Mozo'; comensales?: number }) => {
    const newId = Math.floor(1000 + Math.random() * 9000);
    const newPedido: Pedido = {
      ...newPedidoData,
      id_pedido: newId,
      fecha_hora: new Date(),
      minutos_transcurridos: 0,
      origen: newPedidoData.origen || 'Mozo'
    };

    setPedidos(prev => [newPedido, ...prev]);

    // Update mesa occupied
    const updatedMesas = mesas.map(m => m.id_mesa === newPedidoData.id_mesa ? { ...m, estado: 'ocupada' as const, comensales: newPedidoData.comensales || 2 } : m);
    setMesas(updatedMesas);

    addLog('pedido_creado', `Mesa ${newPedidoData.numero_mesa} generó pedido #${newId} por ${newPedido.mozo}. Items: ${newPedidoData.items.map(i => `${i.nombre} (x${i.cantidad})`).join(', ')}`);

    // Sync state mutations to Supabase in background
    dbSavePedidoComplex(newPedido);
    dbUpsertMesas(updatedMesas);
  };

  const handleMozoChange = (mozo: string) => {
    setActiveMozo(mozo);
    addLog('sistema', `SESIÓN: Acceso de personal actualizado por mozo: ${mozo}`);
  };

  // --- Handlers for Kitchen View (KDS) ---
  const handleCambiarEstadoPedido = (idPedido: number, nuevoEstado: Pedido['estado_comanda']) => {
    let updatedPedido: Pedido | null = null;
    let stockDeductionBlocked = false;
    let errorMsg = '';

    const pObj = pedidos.find(p => p.id_pedido === idPedido);

    // If changing to 'en_cocina' (production), run escandallo and subtract stock if not discounted yet
    if (nuevoEstado === 'en_cocina' && pObj) {
      // 1. Validate empty orders or orders without products
      if (!pObj.items || pObj.items.length === 0) {
        alert("Error: No se puede enviar a cocina un pedido vacío (sin productos).");
        addLog('sistema', `RECHAZADO: Intento de enviar a cocina el pedido vacío #${idPedido}`);
        return;
      }

      // 2. Prevent double stock deduction
      if (pObj.stock_descontado) {
        console.log(`[Escandallo] El pedido #${idPedido} ya tiene stock descontado.`);
      } else {
        let canDeduct = true;
        let itemsDescontados: string[] = [];
        let alarmasBajoStock: string[] = [];

        // Validate insufficient stock BEFORE proceeding if ALLOW VENTA WITHOUT STOCK is false
        if (!permitirVentaSinStock) {
          for (const item of pObj.items) {
            const qtyPlates = item.cantidad;
            const matchingRecetas = recetas.filter(r => r.id_producto === item.id_producto);

            if (matchingRecetas.length === 0) {
              // Warn about missing recipe, but do not break the order
              addLog('sistema', `ADVERTENCIA RECETA: El producto '${item.nombre}' no tiene receta asociada.`);
              continue;
            }

            for (const rec of matchingRecetas) {
              const insumo = insumos.find(i => i.id_insumo === rec.id_insumo);
              if (!insumo) {
                addLog('sistema', `ADVERTENCIA RECETA: No existe el insumo con ID '${rec.id_insumo}' solicitado por receta.`);
                continue;
              }
              const requiredAmt = rec.cantidad_a_descontar * qtyPlates;
              if (insumo.stock_actual < requiredAmt) {
                canDeduct = false;
                errorMsg = `Insumo crítico agotado para '${insumo.nombre}' (Disponible: ${insumo.stock_actual}${insumo.unidad_medida}, Requerido: ${requiredAmt}${insumo.unidad_medida}).`;
                break;
              }
            }
            if (!canDeduct) break;
          }
        }

        if (!canDeduct) {
          stockDeductionBlocked = true;
          alert(`No es posible iniciar cocción: ${errorMsg}`);
          addLog('alerta_stock', `RECHAZADO FUEGO: Pedido #${idPedido} bloqueado por falta de stock. ${errorMsg}`);
          return; // STOP!
        }

        // Apply deduction to ingredients
        let updatedInsumos: Insumo[] = [];
        setInsumos(prevInsumos => {
          const copy = prevInsumos.map(ins => ({ ...ins }));

          pObj.items.forEach(item => {
            const qtyPlates = item.cantidad;
            const matchingRecetas = recetas.filter(r => r.id_producto === item.id_producto);

            matchingRecetas.forEach(rec => {
              const insIdx = copy.findIndex(ins => ins.id_insumo === rec.id_insumo);
              if (insIdx !== -1) {
                const currentIns = copy[insIdx];
                const discountAmt = parseFloat((rec.cantidad_a_descontar * qtyPlates).toFixed(2));
                const stockAnterior = currentIns.stock_actual;
                const updatedStock = parseFloat((Math.max(permitirVentaSinStock ? -999999 : 0, stockAnterior - discountAmt)).toFixed(2));

                copy[insIdx].stock_actual = updatedStock;
                itemsDescontados.push(`${currentIns.nombre} (-${discountAmt} ${currentIns.unidad_medida})`);

                if (updatedStock <= currentIns.stock_minimo) {
                  alarmasBajoStock.push(`${currentIns.nombre} (Stock actual: ${updatedStock}${currentIns.unidad_medida})`);
                }

                // Record inventory movement securely
                dbRecordMovement({
                  id_insumo: currentIns.id_insumo,
                  tipo_movimiento: 'salida_comanda',
                  cantidad: discountAmt,
                  stock_anterior: stockAnterior,
                  stock_nuevo: updatedStock
                }).catch(console.error);
              } else {
                addLog('sistema', `ADVERTENCIA: No existe insumo '${rec.id_insumo}' solicitado por la receta.`);
              }
            });
          });

          updatedInsumos = copy;
          return copy;
        });

        // Mutate local temporary model flags
        pObj.stock_descontado = true;
        pObj.fecha_descuento_stock = new Date();

        if (itemsDescontados.length > 0) {
          addLog('descuento_stock', `ESCANDALLO: Pedido #${idPedido} cambió a EN_COCINA. Descuento automático de: ${itemsDescontados.join(', ')}`);
        }

        alarmasBajoStock.forEach(alertStr => {
          addLog('alerta_stock', `CRÍTICO REPOSICIÓN: El insumo '${alertStr}' cayó por debajo del stock mínimo estipulado.`);
        });

        // Write through stocks to database
        setTimeout(() => {
          if (updatedInsumos.length > 0) {
            dbUpsertInsumos(updatedInsumos);
          }
        }, 50);
      }
    }

    // If order is canceled, let's reverse stock deduction if it has already been discounted
    if (nuevoEstado === 'cancelado' && pObj) {
      if (pObj.stock_descontado) {
        let itemsReversados: string[] = [];
        let updatedInsumos: Insumo[] = [];

        setInsumos(prevInsumos => {
          const copy = prevInsumos.map(ins => ({ ...ins }));

          pObj.items.forEach(pItem => {
            const qtyPlates = pItem.cantidad;
            const matchingRecetas = recetas.filter(r => r.id_producto === pItem.id_producto);

            matchingRecetas.forEach(rec => {
              const insIdx = copy.findIndex(ins => ins.id_insumo === rec.id_insumo);
              if (insIdx !== -1) {
                const currentIns = copy[insIdx];
                const restoreAmt = parseFloat((rec.cantidad_a_descontar * qtyPlates).toFixed(2));
                const stockAnterior = currentIns.stock_actual;
                const updatedStock = parseFloat((stockAnterior + restoreAmt).toFixed(2));

                copy[insIdx].stock_actual = updatedStock;
                itemsReversados.push(`${currentIns.nombre} (+${restoreAmt} ${currentIns.unidad_medida})`);

                // Record reversal inventory movement
                dbRecordMovement({
                  id_insumo: currentIns.id_insumo,
                  tipo_movimiento: 'entrada',
                  cantidad: restoreAmt,
                  stock_anterior: stockAnterior,
                  stock_nuevo: updatedStock
                }).catch(console.error);
              }
            });
          });

          updatedInsumos = copy;
          return copy;
        });

        pObj.stock_descontado = false;
        pObj.fecha_descuento_stock = undefined;

        if (itemsReversados.length > 0) {
          addLog('descuento_stock', `REVERSO ESCANDALLO: Pedido #${idPedido} CANCELADO. Reintegro automático de: ${itemsReversados.join(', ')}`);
        }

        setTimeout(() => {
          if (updatedInsumos.length > 0) {
            dbUpsertInsumos(updatedInsumos);
          }
        }, 50);
      } else {
        addLog('sistema', `CANCELACIÓN: Pedido #${idPedido} cancelado sin descuento de stock previo.`);
      }
    }

    // Proceed to standard states update
    setPedidos(prev => prev.map(p => {
      if (p.id_pedido === idPedido) {
        const updated = { ...p, estado_comanda: nuevoEstado };
        if (nuevoEstado === 'listo') {
          updated.segundos_en_listo = 0; // reset cooling timer
        }
        updatedPedido = updated;
        return updated;
      }
      return p;
    }));

    const mStr = pObj ? ` para ${pObj.numero_mesa}` : '';
    addLog('comanda_estado', `COMANDA #${idPedido}${mStr}: Estado cambiado a ${nuevoEstado.toUpperCase()}`);

    // Dynamic write-through
    setTimeout(() => {
      if (updatedPedido) {
        dbSavePedidoComplex(updatedPedido);
      } else if (pObj) {
        dbSavePedidoComplex({ ...pObj, estado_comanda: nuevoEstado });
      }
    }, 50);

    // If order was delivered/paid or canceled, liberate the table
    if ((nuevoEstado === 'entregado_cobrado' || nuevoEstado === 'cancelado') && pObj) {
      const updatedMesas = mesas.map(m => m.id_mesa === pObj.id_mesa ? { ...m, estado: 'libre' as const, comensales: undefined } : m);
      setMesas(updatedMesas);
      dbUpsertMesas(updatedMesas);
    }
  };

  const handleProducirPedidoConEscandallo = (idPedido: number) => {
    // When marking as finished, transition to 'listo'
    handleCambiarEstadoPedido(idPedido, 'listo');
  };

  // --- Handlers for Cashier View (Caja & Cierre) ---
  const handleFacturarMesa = (idPedido: number) => {
    const target = pedidos.find(p => p.id_pedido === idPedido);
    if (!target) return;

    // Settle order state to delivered/paid
    setPedidos(prev => prev.map(p => p.id_pedido === idPedido ? { ...p, estado_comanda: 'entregado_cobrado' } : p));

    // Clear mesa state
    const updatedMesas = mesas.map(m => m.id_mesa === target.id_mesa ? { ...m, estado: 'libre' as const, comensales: undefined } : m);
    setMesas(updatedMesas);

    addLog('sistema', `CAJA: Facturación completa cobrada correctamente de la mesa ${target.numero_mesa} por Pedido #${idPedido}`);

    // Supabase pushes
    dbSavePedidoComplex({ ...target, estado_comanda: 'entregado_cobrado' });
    dbUpsertMesas(updatedMesas);
  };

  // --- Handlers for Inventory View ---
  const handleRegistrarMerma = (idInsumo: string, cantidad: number, motivo: Merma['motivo']) => {
    const insObj = insumos.find(i => i.id_insumo === idInsumo);
    if (!insObj) return;

    const newMerma: Merma = {
      id_merma: `mrm_${Date.now()}`,
      id_insumo: idInsumo,
      nombre_insumo: insObj.nombre,
      cantidad,
      unidad_medida: insObj.unidad_medida,
      motivo,
      fecha: new Date()
    };

    setMermas(prev => [newMerma, ...prev]);

    // Subtract from active stock
    const updatedInsumos = insumos.map(i => i.id_insumo === idInsumo ? {
      ...i,
      stock_actual: Math.max(0, parseFloat((i.stock_actual - cantidad).toFixed(2)))
    } : i);
    setInsumos(updatedInsumos);

    addLog('merma_registrada', `REGISTRO MERMA: ${cantidad} ${insObj.unidad_medida} de '${insObj.nombre}' registrado por motivo: ${motivo.toUpperCase()}`);

    // Sync inventory reduction
    dbUpsertInsumos(updatedInsumos);
  };

  const handleRestockInsumo = (idInsumo: string, cantidad: number) => {
    const updatedInsumos = insumos.map(i => i.id_insumo === idInsumo ? {
      ...i,
      stock_actual: parseFloat((i.stock_actual + cantidad).toFixed(2))
    } : i);
    setInsumos(updatedInsumos);

    const item = insumos.find(i => i.id_insumo === idInsumo);
    addLog('sistema', `REPOSICIÓN: Incremetado stock de '${item ? item.nombre : idInsumo}' en +${cantidad}`);

    // Sync inventory write
    dbUpsertInsumos(updatedInsumos);
  };

  const handleRestockTodo = () => {
    const updatedInsumos = insumos.map(i => {
      const restockAmt = i.unidad_medida === 'unidades' ? 10 : 3000;
      return {
        ...i,
        stock_actual: i.stock_actual + restockAmt
      };
    });
    setInsumos(updatedInsumos);
    addLog('sistema', `REPOSICIÓN GENERAL: Abastecimiento global automático de todos los insumos y materias primas.`);

    // Sync bulk inventory
    dbUpsertInsumos(updatedInsumos);
  };

  // --- Handlers for Simulation Controls ---
  const handleAdvanceTime = (mins: number) => {
    setMinutosGlobal(prev => prev + mins);

    // Age outstanding orders
    setPedidos(prev => prev.map(p => {
      if (p.estado_comanda !== 'entregado_cobrado') {
        const updated = {
          ...p,
          minutos_transcurridos: p.minutos_transcurridos + mins
        };
        // If the plate was ready, count the seconds/minutes in listo
        if (p.estado_comanda === 'listo') {
          updated.segundos_en_listo = (updated.segundos_en_listo || 0) + mins * 60;
        }
        return updated;
      }
      return p;
    }));

    addLog('sistema', `RELOJ: Reloj del restaurante adelantado en +${mins} minutos operacionales.`);
  };

  const handleToggleAutoTimer = () => {
    setAutoTimerRunning(prev => !prev);
    addLog('sistema', `RELOJ: Simulación en tiempo real ${!autoTimerRunning ? 'INICIADA' : 'DETENIDA'}`);
  };

  const handleInjectDeliveryOrder = (source: 'Rappi' | 'PedidosYa') => {
    const productsOptions = productosMenu.filter(p => p.activo);
    const itemMeal = productsOptions[Math.floor(Math.random() * Math.min(5, productsOptions.length))];
    const itemDrink = productsOptions[Math.min(productsOptions.length - 1, 6 + Math.floor(Math.random() * 3))];

    const newId = Math.floor(2000 + Math.random() * 8000);
    const newPedido: Pedido = {
      id_pedido: newId,
      id_mesa: 101, // delivery virtual code
      numero_mesa: `DELIVERY ${source === 'Rappi' ? 'RP' : 'PY'}`,
      mozo: `Integración API (${source})`,
      estado_comanda: 'pendiente',
      items: [
        { id_producto: itemMeal.id_producto, nombre: itemMeal.nombre, cantidad: 1, categoria: itemMeal.categoria },
        { id_producto: itemDrink.id_producto, nombre: itemDrink.nombre, cantidad: 2, categoria: itemDrink.categoria }
      ],
      fecha_hora: new Date(),
      minutos_transcurridos: 0,
      origen: source,
      observaciones: 'Despachar con cubiertos ecológicos. Cliente premium.'
    };

    setPedidos(prev => [newPedido, ...prev]);
    addLog('pedido_creado', `INTEGRACIÓN: Pedido online #${newId} detectado y cargado desde el puente webhook de ${source}`);
  };

  const handleResetAllData = () => {
    setMesas(INITIAL_MESAS);
    setInsumos(INITIAL_INSUMOS);
    setPedidos(INITIAL_PEDIDOS);
    setMermas([]);
    setMinutosGlobal(0);
    setAutoTimerRunning(false);
    setLogs([
      {
        id: `log_rst_${Date.now()}`,
        tipo: 'sistema',
        mensaje: 'SISTEMA: Demostración reiniciada a valores iniciales por defecto.',
        timestamp: new Date()
      }
    ]);
  };

  // Auto simulation ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (autoTimerRunning) {
      interval = setInterval(() => {
        setMinutosGlobal(prev => prev + 1);
        
        setPedidos(prevOrders => prevOrders.map(p => {
          if (p.estado_comanda !== 'entregado_cobrado') {
            const updated = {
              ...p,
              minutos_transcurridos: p.minutos_transcurridos + 1
            };
            if (p.estado_comanda === 'listo') {
              updated.segundos_en_listo = (updated.segundos_en_listo || 0) + 60;
            }
            return updated;
          }
          return p;
        }));
      }, 2000); // Every 2s equals 1 minute
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoTimerRunning]);

  // Simulated live clock formatter (start 20:30)
  const getSimulatedTimeStr = () => {
    const startHour = 20;
    const startMins = 30;
    const totalMinutes = startHour * 60 + startMins + minutosGlobal;
    const currentHour = Math.floor(totalMinutes / 60) % 24;
    const currentMins = totalMinutes % 60;
    return `${currentHour.toString().padStart(2, '0')}:${currentMins.toString().padStart(2, '0')} hs`;
  };

  // Live sidebar metrics calculation
  const occupiedTablesCount = mesas.filter(m => m.estado === 'ocupada').length;
  const activeOrdersCount = pedidos.filter(p => p.estado_comanda === 'pendiente' || p.estado_comanda === 'en_cocina').length;
  const readyToCollectCount = pedidos.filter(p => p.estado_comanda === 'listo').length;
  const lowStockCount = insumos.filter(i => i.stock_actual <= i.stock_minimo).length;
  const activeNavItem = NAV_ITEMS.find(item => item.id === activeView) || NAV_ITEMS[0];
  const ActiveHeaderIcon = activeNavItem.icon;
  const hasSupabaseConnection = !!getSupabaseClient();
  const totalSalesToday = pedidos
    .filter(p => p.estado_comanda === 'entregado_cobrado')
    .reduce((acc, p) => acc + p.items.reduce((sum, item) => sum + (item.cantidad * 12500), 0), 0);

  const getNavBadge = (id: ActiveView): string | null => {
    if (id === 'mesas') return `${occupiedTablesCount}/${mesas.length}`;
    if (id === 'mozo') return activeOrdersCount > 0 ? `${activeOrdersCount}` : null;
    if (id === 'cocina') return activeOrdersCount > 0 ? `${activeOrdersCount}` : null;
    if (id === 'caja') return readyToCollectCount > 0 ? `${readyToCollectCount}` : null;
    if (id === 'delivery') return pedidos.some(p => p.origen === 'Rappi' || p.origen === 'PedidosYa') ? `${pedidos.filter(p => p.origen === 'Rappi' || p.origen === 'PedidosYa').length}` : null;
    if (id === 'ticketera') return readyToCollectCount > 0 ? `${readyToCollectCount}` : null;
    if (id === 'compras') return lowStockCount > 0 ? `${lowStockCount}` : null;
    if (id === 'inventario') return lowStockCount > 0 ? `${lowStockCount}` : null;
    if (id === 'menu') return `${productosMenu.filter(p => p.activo).length}`;
    return null;
  };

  if (!isStreamlitLoggedIn) {
    return <PythonStreamlitLogin onLoginSuccess={() => setIsStreamlitLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen lg:h-screen bg-[#F4EFE6] flex flex-col lg:flex-row font-sans text-slate-800 antialiased selection:bg-[#624A3E] selection:text-white overflow-hidden">

      {/* LEFT SIDE PANEL (PERSISTENT SIDEBAR) */}
      <aside className={`w-full max-h-[82vh] lg:max-h-none ${isSidebarCollapsed ? 'lg:w-[92px]' : 'lg:w-[316px]'} lg:h-screen bg-[#171614] text-[#E9E0D4] flex flex-col border-b lg:border-b-0 lg:border-r border-stone-800 shrink-0 z-40 shadow-2xl shadow-black/20 transition-all duration-300 ease-out`} id="sidebar-left-panel">

        {/* Brand Header */}
        <div className="p-4 border-b border-stone-800 bg-[#12110F]">
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
            <div className={`${isSidebarCollapsed ? 'lg:w-14 lg:h-14' : 'w-12 h-12'} bg-[#FAF4EE] rounded-lg flex items-center justify-center shadow-md border border-[#8C6239]/35 p-0.5 overflow-hidden shrink-0 transition-all`}>
              <ElPatronLogo className="w-11 h-11 object-contain rounded-md" variant="icon" color="#4A2D1B" />
            </div>
            <div className={`min-w-0 flex-1 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              <span className="font-sans font-extrabold text-base text-white tracking-tight block">El Patrón Pro</span>
              <span className="text-[9px] uppercase font-bold text-[#D8B08A] tracking-wider block mt-0.5 leading-none">Gestión gastronómica</span>
            </div>
            <span className={`bg-[#6B4A35]/25 text-amber-200 text-[8px] border border-[#8C6239]/30 px-1.5 py-1 rounded font-bold font-mono shrink-0 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              v1.2.0
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            className={`mt-4 w-full min-h-10 rounded-lg border border-[#8C6239]/35 bg-[#1E1D1A] text-[#E9E0D4] hover:bg-[#2A2824] flex items-center justify-center gap-2 transition-all ${isSidebarCollapsed ? 'lg:h-11 lg:w-11 lg:mx-auto lg:mt-3' : ''}`}
            title={isSidebarCollapsed ? 'Abrir panel lateral' : 'Cerrar panel lateral'}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
            <span className={`text-xs font-extrabold ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              {isSidebarCollapsed ? 'Abrir menu' : 'Cerrar menu'}
            </span>
          </button>
        </div>

        {/* Live shift controls */}
        <div className={`p-4 border-b border-stone-800 bg-[#1D1B18] space-y-3 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-stone-800 bg-[#12110F] p-3">
              <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Servicio
              </span>
              <strong className="text-lg font-black text-white font-mono tracking-tight block mt-1">{getSimulatedTimeStr()}</strong>
            </div>
            <div className="rounded-lg border border-stone-800 bg-[#12110F] p-3">
              <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider">Recaudado</span>
              <strong className="text-lg font-black text-white font-mono tracking-tight block mt-1">${totalSalesToday.toLocaleString('es-AR')}</strong>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg border border-stone-800 bg-[#12110F] p-2 text-center">
              <span className="text-[9px] text-stone-500 font-bold block">Mesas</span>
              <strong className="text-sm font-black text-white font-mono">{occupiedTablesCount}/{mesas.length}</strong>
            </div>
            <div className="rounded-lg border border-stone-800 bg-[#12110F] p-2 text-center">
              <span className="text-[9px] text-stone-500 font-bold block">KDS</span>
              <strong className="text-sm font-black text-amber-300 font-mono">{activeOrdersCount}</strong>
            </div>
            <div className="rounded-lg border border-stone-800 bg-[#12110F] p-2 text-center">
              <span className="text-[9px] text-stone-500 font-bold block">Caja</span>
              <strong className="text-sm font-black text-emerald-300 font-mono">{readyToCollectCount}</strong>
            </div>
            <div className="rounded-lg border border-stone-800 bg-[#12110F] p-2 text-center">
              <span className="text-[9px] text-stone-500 font-bold block">Stock</span>
              <strong className={`text-sm font-black font-mono ${lowStockCount > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{lowStockCount}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAutoTimer}
              title={autoTimerRunning ? 'Pausar reloj operativo' : 'Iniciar reloj operativo'}
              className={`app-icon-button flex-1 ${
                autoTimerRunning
                  ? 'bg-amber-900/50 text-amber-200 border-amber-500/30'
                  : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/20'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoTimerRunning ? 'animate-spin' : ''}`} />
              <span>{autoTimerRunning ? 'Pausar' : 'Iniciar'}</span>
            </button>

            <button
              onClick={() => handleAdvanceTime(15)}
              title="Adelantar +15 minutos"
              className="app-icon-button bg-stone-900 text-stone-200 border-stone-700 hover:bg-stone-800"
            >
              +15m
            </button>
          </div>
        </div>

        {/* Business Rule + personnel */}
        <div className={`p-4 border-b border-stone-800 bg-[#181715] space-y-3 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
          <label className="flex items-center justify-between bg-[#12110F] border border-stone-800 p-3 rounded-lg cursor-pointer hover:border-[#8C6239]/40 transition-all select-none">
            <div className="min-w-0 pr-2">
              <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                Regla de stock
              </span>
              <span className="text-xs font-semibold text-white tracking-tight truncate block mt-1">
                {permitirVentaSinStock ? 'Venta forzada habilitada' : 'Bloquear sin ingredientes'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={permitirVentaSinStock}
              onChange={(e) => {
                setPermitirVentaSinStock(e.target.checked);
                addLog('sistema', `REGLA DE NEGOCIO: Venta forzada sin stock ${e.target.checked ? 'HABILITADA (se admiten negativos)' : 'DESHABILITADA (bloqueo automático)'}`);
              }}
              className="rounded border-stone-700 text-[#624A3E] focus:ring-[#624A3E] w-4 h-4 bg-stone-800 cursor-pointer"
            />
          </label>

          <div className="flex items-center gap-3 bg-[#12110F] border border-stone-800 p-3 rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-[#6B4A35]/20 border border-[#8C6239]/20 flex items-center justify-center text-[#D8B08A]">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="text-[9px] text-stone-500 block font-bold leading-none uppercase tracking-wider">Usuario en consola</span>
              <select
                value={activeMozo}
                onChange={(e) => handleMozoChange(e.target.value)}
                className="text-xs bg-transparent border-none p-0 focus:outline-none font-extrabold text-white cursor-pointer w-full mt-1 focus:ring-0"
              >
                <option value="Enzo" className="bg-stone-950 text-stone-200">Enzo (Mozo Salón)</option>
                <option value="Micaela" className="bg-stone-950 text-stone-200">Micaela (Mozo Salón)</option>
                <option value="Damián" className="bg-stone-950 text-stone-200">Damián (Cocinero KDS)</option>
                <option value="Sofía" className="bg-stone-950 text-stone-200">Sofía (Administrador / Caja)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Multi-role Navigation Panels */}
        <div className={`flex-1 overflow-y-auto p-3 space-y-4 restaurant-scroll ${isSidebarCollapsed ? 'lg:px-3' : ''}`}>
          {NAV_GROUPS.map(group => (
            <div key={group} className="space-y-2">
              <span className={`text-[10px] font-black text-stone-500 tracking-wider uppercase px-2 block ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>{group}</span>

              <nav className="space-y-1.5" id={`sidebar-navigation-${group.toLowerCase()}`}>
                {NAV_ITEMS.filter(item => item.group === group).map(item => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  const badge = getNavBadge(item.id);

                  return (
                    <button
                      key={item.id}
                      id={`tab-${item.id}`}
                      onClick={() => selectView(item.id)}
                      title={item.label}
                      aria-label={item.label}
                      className={`group w-full min-h-12 px-3 py-2.5 rounded-lg border flex items-center gap-3 text-left transition-all cursor-pointer ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''} ${
                        isActive
                          ? 'bg-[#6B4A35] text-white border-[#A77B58]/40 shadow-lg shadow-black/20'
                          : 'bg-[#1E1D1A]/85 hover:bg-[#2A2824] text-stone-300 hover:text-white border-stone-800/80 hover:border-[#8C6239]/35'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${isActive ? 'bg-white/12 text-white border-white/15' : TONE_CLASSES[item.tone]}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className={`min-w-0 flex-1 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                        <span className="text-[12px] font-extrabold block leading-tight truncate">{item.label}</span>
                        <span className={`text-[10px] block leading-tight mt-0.5 truncate ${isActive ? 'text-white/70' : 'text-stone-500 group-hover:text-stone-400'}`}>
                          {item.description}
                        </span>
                      </span>
                      {badge && (
                        <span className={`min-w-6 h-6 px-1.5 rounded-md flex items-center justify-center text-[10px] font-black font-mono border ${
                          isActive ? 'bg-white/15 border-white/15 text-white' : 'bg-black/20 border-stone-700 text-[#D8B08A]'
                        } ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Integration Specs footer */}
        <div className={`p-3 bg-[#11100E] text-stone-400 text-[10px] border-t border-stone-800 space-y-2 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-stone-300 font-bold font-mono min-w-0">
              {hasSupabaseConnection ? (
                <CircleCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <CircleAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="truncate">{hasSupabaseConnection ? 'Supabase activo' : 'Modo local'}</span>
            </div>
            <span className="text-stone-600 font-mono">SQLite bridge</span>
          </div>
          <p className="opacity-75">Los módulos viven en este panel lateral izquierdo.</p>
        </div>
      </aside>

      {/* CORE ACTIVE MODULE AREA (RIGHT SIDE CONTENT PANE) */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F4EFE6] lg:h-screen overflow-hidden">

        {/* TOP STATUS BAR ACCENTS */}
        <div className="bg-[#FFFDF8] border-b border-stone-200 px-4 md:px-6 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${TONE_CLASSES[activeNavItem.tone]}`}>
              <ActiveHeaderIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider font-black text-[#8C6239]">{activeNavItem.group}</span>
                <ChevronRight className="w-3 h-3 text-stone-400" />
                <span className="text-[10px] uppercase tracking-wider font-black text-stone-400">{activeNavItem.shortLabel}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#2F241D] tracking-tight leading-tight">
                {activeNavItem.label}
              </h1>
              <p className="text-xs md:text-sm text-stone-500 mt-0.5 max-w-3xl">
                {activeNavItem.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full xl:w-auto">
            <div className="app-status-chip">
              <span className="app-status-dot bg-emerald-500" />
              <span>{activeMozo}</span>
            </div>
            <div className="app-status-chip">
              <Clock className="w-3.5 h-3.5 text-[#8C6239]" />
              <span>{getSimulatedTimeStr()}</span>
            </div>
            <div className="app-status-chip">
              <ChefHat className="w-3.5 h-3.5 text-amber-600" />
              <span>{activeOrdersCount} KDS</span>
            </div>
            <div className="app-status-chip">
              <Scale className={`w-3.5 h-3.5 ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
              <span>{lowStockCount} stock</span>
            </div>
          </div>
        </div>

        {/* MAIN SCROLLABLE CONTENT */}
        <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-w-[1500px] w-full mx-auto restaurant-scroll">
          
          {/* ACTIVE TAB RENDER TRIAGE */}
          {activeView === 'home' && (
            <div className="animate-fadeIn">
              <HomeMenuModule
                mesas={mesas}
                pedidos={pedidos}
                insumos={insumos}
                productosMenu={productosMenu}
                activeMozo={activeMozo}
                onMozoChange={handleMozoChange}
                onNavigate={(view: ActiveView) => selectView(view)}
                getSimulatedTimeStr={getSimulatedTimeStr}
                autoTimerRunning={autoTimerRunning}
                onToggleAutoTimer={handleToggleAutoTimer}
                onAdvanceTime={handleAdvanceTime}
              />
            </div>
          )}

          {activeView === 'panel' && (
            <div className="animate-fadeIn">
              <PanelDashboard
                mesas={mesas}
                pedidos={pedidos}
                insumos={insumos}
                logs={logs}
                getSimulatedTimeStr={getSimulatedTimeStr}
                onNavigate={(view: ActiveView) => selectView(view)}
              />
            </div>
          )}

          {activeView === 'mozo' && (
            <div className="animate-fadeIn">
              <MozoTerminal
                mesas={mesas}
                insumos={insumos}
                productosMenu={productosMenu}
                recetas={recetas}
                activeMozo={activeMozo}
                onMozoChange={handleMozoChange}
                onCrearPedido={handleCrearPedido}
                pedidos={pedidos}
                onFacturarMesa={handleFacturarMesa}
                addLog={addLog}
                permitirVentaSinStock={permitirVentaSinStock}
              />
            </div>
          )}

          {activeView === 'cocina' && (
            <div className="animate-fadeIn">
              <KitchenMonitor
                pedidos={pedidos}
                onCambiarEstadoPedido={handleCambiarEstadoPedido}
                onProducirPedidoConEscandallo={handleProducirPedidoConEscandallo}
                minutosGlobal={minutosGlobal}
              />
            </div>
          )}

          {activeView === 'caja' && (
            <div className="animate-fadeIn">
              <CajaModule
                pedidos={pedidos}
                productosMenu={productosMenu}
                onFacturarMesa={handleFacturarMesa}
                onCambiarEstadoPedido={handleCambiarEstadoPedido}
                addLog={addLog}
              />
            </div>
          )}

          {activeView === 'reportes' && (
            <div className="animate-fadeIn">
              <BusinessIntelligence
                productosMenu={productosMenu}
                logs={logs}
              />
            </div>
          )}

          {activeView === 'usuarios' && (
            <div className="animate-fadeIn">
              <UsuariosModule
                logs={logs}
                addLog={addLog}
              />
            </div>
          )}

          {activeView === 'menu' && (
            <div className="animate-fadeIn">
              <MenuModule
                productosMenu={productosMenu}
                onProductosMenuChange={setProductosMenu}
                addLog={addLog}
              />
            </div>
          )}

          {activeView === 'recetas' && (
            <div className="animate-fadeIn">
              <RecetasModule
                recetas={recetas}
                productosMenu={productosMenu}
                insumos={insumos}
                addLog={addLog}
              />
            </div>
          )}

          {activeView === 'mesas' && (
            <div className="animate-fadeIn">
              <MesasModule
                mesas={mesas}
                onSubmitPedido={handleCrearPedido}
                addLog={addLog}
              />
            </div>
          )}

          {activeView === 'inventario' && (
            <div className="animate-fadeIn">
              <InventoryModule
                insumos={insumos}
                productosMenu={productosMenu}
                recetas={recetas}
                mermas={mermas}
                onRegistrarMerma={handleRegistrarMerma}
                onRestockInsumo={handleRestockInsumo}
                onRestockTodo={handleRestockTodo}
                addLog={addLog}
              />
            </div>
          )}

          {activeView === 'proveedores' && (
            <div className="animate-fadeIn">
              <ProveedoresModule
                onRestockTodo={handleRestockTodo}
                addLog={addLog}
              />
            </div>
          )}

          {activeView === 'promociones' && (
            <div className="animate-fadeIn">
              <PromocionesModule
                addLog={addLog}
              />
            </div>
          )}

          {activeView === 'reservas' && (
            <div className="animate-fadeIn">
              <ReservasModule
                mesas={mesas}
                addLog={addLog}
              />
            </div>
          )}

          {activeView === 'facturacion' && (
            <div className="animate-fadeIn">
              <FacturacionModule
                pedidos={pedidos}
                productosMenu={productosMenu}
                addLog={addLog}
              />
            </div>
          )}

          {(['turnos', 'compras', 'clientes', 'delivery', 'ticketera'] as ActiveView[]).includes(activeView) && (
            <div className="animate-fadeIn">
              <RestaurantOpsModule
                view={activeView as 'turnos' | 'compras' | 'clientes' | 'delivery' | 'ticketera'}
                mesas={mesas}
                pedidos={pedidos}
                insumos={insumos}
                productosMenu={productosMenu}
                logs={logs}
                activeMozo={activeMozo}
                getSimulatedTimeStr={getSimulatedTimeStr}
                onInjectDeliveryOrder={handleInjectDeliveryOrder}
                onRestockTodo={handleRestockTodo}
                addLog={addLog}
              />
            </div>
          )}

          {activeView === 'sistema' && (
            <div className="animate-fadeIn">
              <SistemaModule
                insumos={insumos}
                productosMenu={productosMenu}
                recetas={recetas}
                pedidos={pedidos}
                mesas={mesas}
                addLog={addLog}
                onSyncComplete={handleSupabaseSync}
              />
            </div>
          )}

          {activeView === 'backups' && (
            <div className="animate-fadeIn">
              <BackupsModule
                onResetAllData={handleResetAllData}
                addLog={addLog}
              />
            </div>
          )}

        </div>

        {/* SYSTEM COAXIAL FOOTER */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-400 flex flex-col md:flex-row justify-between items-center gap-3">
          <p>© 2026 Restaurante Pro S.A. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 cursor-default">Condiciones Operativas</span>
            <span>•</span>
            <span className="hover:text-slate-600 cursor-default">Auditoría Habilitada</span>
            <span>•</span>
            <span className="hover:text-slate-600 cursor-default">Fidelidad de Escandallos</span>
          </div>
        </footer>

      </main>

    </div>
  );
}
