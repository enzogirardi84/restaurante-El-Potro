import { getActiveSupabaseClient, tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { ProductoMenu } from '../types';
import { INITIAL_PRODUCTOS_MENU } from '../data/initialData';

const inferTipo = (categoria: string): ProductoMenu['tipo'] => {
  const normalized = categoria.trim().toLowerCase();
  if (normalized.includes('bodega') || normalized.includes('vino')) return 'vino';
  if (normalized.includes('bebida')) return 'bebida';
  if (normalized.includes('postre')) return 'postre';
  return 'plato';
};

const normalizeProductoMenu = (prod: any): ProductoMenu => {
  const categoria = String(prod.categoria || 'Menú');
  const tipo = prod.tipo || inferTipo(categoria);

  return {
    id_producto: String(prod.id_producto),
    nombre: String(prod.nombre || ''),
    descripcion: prod.descripcion || '',
    precio_venta: Number(prod.precio_venta || 0),
    categoria,
    subcategoria: prod.subcategoria || undefined,
    activo: Boolean(prod.activo),
    imagen: prod.imagen || '',
    tipo,
    tiempo_preparacion_estimado: prod.tiempo_preparacion_estimado || undefined,
    requiere_cocina: prod.requiere_cocina ?? (tipo === 'plato' || tipo === 'postre')
  };
};

const toDbProductoMenu = (prod: ProductoMenu | Partial<ProductoMenu>) => ({
  ...prod,
  imagen: prod.imagen || null
});

const invalidateCache = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('el_patron_cache_menu');
  }
};

export const menuService = {
  async list(): Promise<ProductoMenu[]> {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('el_patron_cache_menu') : null;
    const client = tryGetActiveSupabaseClient();

    if (cached) {
      if (client) {
        // Stale-While-Revalidate: fetch updated data in background
        setTimeout(async () => {
          try {
            const { data, error } = await client.from('productos_menu').select('*').order('id_producto', { ascending: true });
            if (!error && data) {
              localStorage.setItem('el_patron_cache_menu', JSON.stringify(data));
            }
          } catch (e) {
            console.warn('Background menu cache refresh failed:', e);
          }
        }, 500);
      }

      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeProductoMenu);
        }
      } catch (e) {
        console.warn('Failed parsing menu cache:', e);
      }
    }

    if (!client) {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('el_patron_cache_menu', JSON.stringify(INITIAL_PRODUCTOS_MENU));
        } catch {}
      }
      return INITIAL_PRODUCTOS_MENU;
    }

    const { data, error } = await client.from('productos_menu').select('*').order('id_producto', { ascending: true });
    if (error) {
      console.error('Error fetching productos_menu:', error);
      throw error;
    }
    const normalized = (data || []).map(normalizeProductoMenu);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('el_patron_cache_menu', JSON.stringify(data));
      } catch {}
    }
    return normalized;
  },

  async getById(id: string): Promise<ProductoMenu | null> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('productos_menu').select('*').eq('id_producto', id).single();
    if (error) {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    }
    return normalizeProductoMenu(data);
  },

  async create(prod: ProductoMenu): Promise<ProductoMenu> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('productos_menu').insert([toDbProductoMenu(prod)]).select().single();
    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }
    invalidateCache();
    return normalizeProductoMenu(data);
  },

  async update(id: string, prod: Partial<ProductoMenu>): Promise<ProductoMenu> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('productos_menu').update(toDbProductoMenu(prod)).eq('id_producto', id).select().single();
    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }
    invalidateCache();
    return normalizeProductoMenu(data);
  },

  async upsert(prods: ProductoMenu[]): Promise<ProductoMenu[]> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('productos_menu').upsert(prods.map(toDbProductoMenu)).select();
    if (error) {
      console.error('Error upserting productos_menu:', error);
      throw error;
    }
    invalidateCache();
    return (data || []).map(normalizeProductoMenu);
  },

  async remove(id: string): Promise<boolean> {
    const supabase = getActiveSupabaseClient();
    const { error } = await supabase.from('productos_menu').delete().eq('id_producto', id);
    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }
    invalidateCache();
    return true;
  }
};
