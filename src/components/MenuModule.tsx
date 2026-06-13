import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Search, Edit2, Check, RefreshCw } from 'lucide-react';
import { ProductoMenu } from '../types';
import { menuService } from '../services/menuService';

const MENU_CATEGORIES = ['Entradas', 'Pastas', 'Carnes', 'Pescados', 'Comidas Criollas', 'Postres', 'Bebidas', 'Bodega'] as const;

type Feedback = {
  type: 'success' | 'warning' | 'error';
  message: string;
};

const makeClientId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `prod_custom_${crypto.randomUUID()}`;
  }
  return `prod_custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const isOfflinePersistenceError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return message.toLowerCase().includes('supabase no esta configurado')
    || message.toLowerCase().includes('supabase no está configurado');
};

interface MenuModuleProps {
  productosMenu: ProductoMenu[];
  onProductosMenuChange?: (productos: ProductoMenu[]) => void;
  addLog: (tipo: any, mensaje: string) => void;
}

export default function MenuModule({ productosMenu, onProductosMenuChange, addLog }: MenuModuleProps) {
  const [items, setItems] = useState<ProductoMenu[]>(productosMenu);

  useEffect(() => {
    setItems(productosMenu);
  }, [productosMenu]);

  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');

  // Add Item state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState<string>('Entradas');
  const [imagenUrl, setImagenUrl] = useState('');

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrecio, setEditPrecio] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const updateItems = (updater: (current: ProductoMenu[]) => ProductoMenu[]) => {
    setItems(current => {
      const next = updater(current);
      onProductosMenuChange?.(next);
      return next;
    });
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nombre.trim();
    const cleanDescription = descripcion.trim();
    const cleanImageUrl = imagenUrl.trim();
    const parsedPrice = Number(precio);

    if (!cleanName) {
      setFeedback({ type: 'error', message: 'Ingrese un nombre para el producto.' });
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFeedback({ type: 'error', message: 'Ingrese un precio mayor a cero.' });
      return;
    }

    const fallbackImg = (categoria === 'Bebidas' || categoria === 'Bodega')
      ? 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80'
      : categoria === 'Postres'
        ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'
        : 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80';

    const tipo = categoria === 'Bebidas' 
      ? 'bebida' 
      : categoria === 'Bodega' 
        ? 'vino' 
        : categoria === 'Postres' 
          ? 'postre' 
          : 'plato';

    const requiere_cocina = !(categoria === 'Bebidas' || categoria === 'Bodega');

    const newItem: ProductoMenu = {
      id_producto: makeClientId(),
      nombre: cleanName,
      descripcion: cleanDescription || `${cleanName} elaborado con ingredientes selectos.`,
      precio_venta: parsedPrice,
      categoria,
      activo: true,
      imagen: cleanImageUrl || fallbackImg,
      tipo,
      requiere_cocina,
      tiempo_preparacion_estimado: requiere_cocina ? 12 : undefined
    };

    updateItems(prev => [newItem, ...prev]);
    setSavingId('create');

    try {
      const savedItem = await menuService.create(newItem);
      updateItems(prev => prev.map(item => item.id_producto === newItem.id_producto ? savedItem : item));
      setFeedback({ type: 'success', message: 'Producto guardado en Supabase.' });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'warning',
        message: isOfflinePersistenceError(err)
          ? 'Producto agregado solo en esta sesión. Configure Supabase para persistir cambios.'
          : 'Producto agregado localmente, pero no se pudo guardar en Supabase.'
      });
    } finally {
      setSavingId(null);
    }

    addLog('sistema', `MENÚ: Creado nuevo platillo/bebida '${cleanName}' con precio de venta $${parsedPrice}`);
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setImagenUrl('');
  };

  const handleToggleActivo = async (id: string) => {
    const target = items.find(item => item.id_producto === id);
    if (!target) return;

    const nextState = !target.activo;
    updateItems(prev => prev.map(item => item.id_producto === id ? { ...item, activo: nextState } : item));
    setSavingId(id);

    try {
      const savedItem = await menuService.update(id, { activo: nextState });
      updateItems(prev => prev.map(item => item.id_producto === id ? savedItem : item));
      setFeedback({ type: 'success', message: `Estado de "${target.nombre}" actualizado.` });
    } catch (err) {
      console.error(err);
      if (!isOfflinePersistenceError(err)) {
        updateItems(prev => prev.map(item => item.id_producto === id ? { ...item, activo: target.activo } : item));
      }
      setFeedback({
        type: 'warning',
        message: isOfflinePersistenceError(err)
          ? 'Cambio aplicado solo en esta sesión. Configure Supabase para persistirlo.'
          : 'No se pudo guardar el cambio en Supabase; se restauró el estado anterior.'
      });
    } finally {
      setSavingId(null);
    }

    addLog('sistema', `MENÚ: Cambiado estado de '${target.nombre}' a ${nextState ? 'ACTIVO' : 'INACTIVO'}`);
  };

  const handleStartEditing = (id: string, currentPrice: number) => {
    setEditingId(id);
    setEditPrecio(currentPrice.toString());
  };

  const handleSavePrecio = async (id: string) => {
    const target = items.find(item => item.id_producto === id);
    const parsedPrice = Number(editPrecio);

    if (!target) return;
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFeedback({ type: 'error', message: 'Ingrese un precio mayor a cero.' });
      return;
    }

    updateItems(prev => prev.map(item => item.id_producto === id ? { ...item, precio_venta: parsedPrice } : item));
    setSavingId(id);

    try {
      const savedItem = await menuService.update(id, { precio_venta: parsedPrice });
      updateItems(prev => prev.map(item => item.id_producto === id ? savedItem : item));
      setFeedback({ type: 'success', message: `Precio de "${target.nombre}" actualizado.` });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      if (!isOfflinePersistenceError(err)) {
        updateItems(prev => prev.map(item => item.id_producto === id ? { ...item, precio_venta: target.precio_venta } : item));
      }
      setFeedback({
        type: 'warning',
        message: isOfflinePersistenceError(err)
          ? 'Precio actualizado solo en esta sesión. Configure Supabase para persistirlo.'
          : 'No se pudo guardar el precio en Supabase; se restauró el valor anterior.'
      });
    } finally {
      setSavingId(null);
    }

    addLog('sistema', `MENÚ: Actualizado precio de venta de '${target.nombre}' de $${target.precio_venta} a $${parsedPrice}`);
  };

  // Filter items
  const filtered = items.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategoria === 'todos' || item.categoria === selectedCategoria;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left col: Add new Item */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#624A3E]" />
            Nuevo Plato / Bebida
          </h3>
          <form onSubmit={handleCreateItem} className="space-y-3">
            {feedback && (
              <div className={`rounded-xl border px-3 py-2 text-[11px] font-bold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : feedback.type === 'warning'
                    ? 'bg-amber-50 text-amber-800 border-amber-100'
                    : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {feedback.message}
              </div>
            )}
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Nombre Comercial</label>
              <input 
                type="text" 
                value={nombre} 
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Ojo de Bife Criollo"
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E]"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Precio de Venta ($)</label>
              <input 
                type="number" 
                value={precio} 
                onChange={e => setPrecio(e.target.value)}
                placeholder="Ej. 18500"
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E]"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Descripción</label>
              <textarea 
                value={descripcion} 
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Ingredientes u observaciones..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E] resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">Categoría</label>
              <select 
                value={categoria} 
                onChange={e => setCategoria(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E] cursor-pointer font-bold text-stone-700"
              >
                {MENU_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider block mb-1">URL de Imagen (Opcional)</label>
              <input 
                type="url" 
                value={imagenUrl} 
                onChange={e => setImagenUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E]"
              />
            </div>
            <button 
              type="submit"
              disabled={savingId === 'create'}
              className="w-full py-2.5 bg-[#624A3E] hover:bg-[#503C32] disabled:bg-stone-300 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-[#624A3E]/10 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingId === 'create' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {savingId === 'create' ? 'Guardando...' : 'Registrar en Carta'}
            </button>
          </form>
        </div>

        {/* Right 3 cols: Filter list */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-100">
            <h3 className="text-sm font-black text-stone-800 uppercase tracking-tight flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-[#624A3E]" />
              Catálogo de Menú ({filtered.length})
            </h3>

            {/* Filter tags */}
            <div className="flex flex-wrap gap-1">
              {(['todos', ...MENU_CATEGORIES] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all border ${
                    selectedCategoria === cat
                      ? 'bg-[#624A3E] text-white border-[#5d3a2e]'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat === 'todos' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar platillo, vino o postre comercial..."
              className="w-full text-xs pl-9 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-1 focus:ring-[#624A3E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(item => (
              <div 
                key={item.id_producto} 
                className={`p-3 bg-[#F5F1E9]/30 border rounded-2xl flex gap-3 transition-colors hover:bg-[#F5F1E9]/60 ${
                  item.activo ? 'border-stone-150' : 'border-rose-105 bg-rose-50/10 opacity-70'
                }`}
              >
                <img 
                  src={item.imagen} 
                  alt={item.nombre} 
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover shrink-0 bg-stone-100 border border-stone-200"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black uppercase text-[#624A3E]">{item.categoria}</span>
                    <h4 className="text-xs font-extrabold text-stone-900 tracking-tight leading-snug truncate" title={item.nombre}>{item.nombre}</h4>
                    {item.descripcion && (
                      <p className="text-[10px] text-stone-500 leading-snug line-clamp-2 mt-0.5" title={item.descripcion}>
                        {item.descripcion}
                      </p>
                    )}
                    
                    {editingId === item.id_producto ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs font-bold text-stone-700">$</span>
                        <input 
                          type="number" 
                          value={editPrecio}
                          onChange={e => setEditPrecio(e.target.value)}
                          className="w-16 text-xs p-1 border border-stone-300 rounded bg-white text-stone-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#624A3E]"
                        />
                        <button 
                          onClick={() => handleSavePrecio(item.id_producto)}
                          disabled={savingId === item.id_producto}
                          className="p-1 rounded bg-[#22C55E]/15 hover:bg-[#22C55E]/20 text-[#22C55E] cursor-pointer"
                        >
                          {savingId === item.id_producto ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-stone-850 font-mono tracking-tight">${item.precio_venta.toLocaleString('es-AR')}</span>
                        <button 
                          onClick={() => handleStartEditing(item.id_producto, item.precio_venta)}
                          className="p-1 px-1.5 rounded hover:bg-stone-200/50 text-stone-400 hover:text-stone-750 transition-colors cursor-pointer text-[10px]"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/40 mt-1">
                    <span className={`text-[9px] font-bold ${item.activo ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {item.activo ? '● En carta' : '● Pausado'}
                    </span>
                    <button 
                      onClick={() => handleToggleActivo(item.id_producto)}
                      disabled={savingId === item.id_producto}
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait ${
                        item.activo 
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {savingId === item.id_producto ? 'Guardando' : item.activo ? 'Retirar' : 'Habilitar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
