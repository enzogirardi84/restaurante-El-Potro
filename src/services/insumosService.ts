import { getActiveSupabaseClient, tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { Insumo } from '../types';
import { INITIAL_INSUMOS } from '../data/initialData';

const CACHE_KEY = 'el_patron_cache_insumos';

const invalidateCache = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
};

export const insumosService = {
  async list(): Promise<Insumo[]> {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
    const client = tryGetActiveSupabaseClient();

    if (cached) {
      if (client) {
        // Stale-While-Revalidate: fetch updated data in background
        setTimeout(async () => {
          try {
            const { data, error } = await client.from('insumos').select('*').order('id_insumo', { ascending: true });
            if (!error && data) {
              localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            }
          } catch (e) {
            console.warn('Background insumos cache refresh failed:', e);
          }
        }, 500);
      }

      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed parsing insumos cache:', e);
      }
    }

    if (!client) {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(INITIAL_INSUMOS));
        } catch {}
      }
      return INITIAL_INSUMOS;
    }

    const { data, error } = await client.from('insumos').select('*').order('id_insumo', { ascending: true });
    if (error) {
      console.error('Error fetching insumos:', error);
      throw error;
    }
    const result = data || [];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      } catch {}
    }
    return result;
  },

  async getById(id: string): Promise<Insumo | null> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('insumos').select('*').eq('id_insumo', id).single();
    if (error) {
      console.error(`Error fetching insumo ${id}:`, error);
      return null;
    }
    return data;
  },

  async create(insumo: Insumo): Promise<Insumo> {
    invalidateCache();
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('insumos').insert([insumo]).select().single();
    if (error) {
      console.error('Error creating insumo:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, insumo: Partial<Insumo>): Promise<Insumo> {
    invalidateCache();
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('insumos').update(insumo).eq('id_insumo', id).select().single();
    if (error) {
      console.error('Error updating insumo:', error);
      throw error;
    }
    return data;
  },

  async upsert(insumos: Insumo[]): Promise<Insumo[]> {
    invalidateCache();
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('insumos').upsert(insumos).select();
    if (error) {
      console.error('Error upserting insumos:', error);
      throw error;
    }
    return data || [];
  },

  async remove(id: string): Promise<boolean> {
    invalidateCache();
    const supabase = getActiveSupabaseClient();
    const { error } = await supabase.from('insumos').delete().eq('id_insumo', id);
    if (error) {
      console.error('Error deleting insumo:', error);
      return false;
    }
    return true;
  },

  async recordMovement(movement: {
    id_insumo: string;
    tipo_movimiento: 'entrada' | 'salida_comanda' | 'salida_merma' | 'ajuste';
    cantidad: number;
    stock_anterior: number;
    stock_nuevo: number;
  }): Promise<void> {
    const supabase = getActiveSupabaseClient();
    const id_movimiento = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const { error } = await supabase.from('movimientos_inventario').insert([{
      id_movimiento,
      ...movement,
      fecha: new Date().toISOString()
    }]);
    if (error) {
      console.error('Error recording movement:', error);
    }
  }
};
