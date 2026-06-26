import { getActiveSupabaseClient, tryGetActiveSupabaseClient } from '../lib/supabaseClient';
import { Usuario } from '../types';

const DEFAULT_USUARIOS: Usuario[] = [
  { id_usuario: 1, nombre: 'Enzo', apellido: 'Fernández', rol: 'mozo' },
  { id_usuario: 2, nombre: 'Micaela', apellido: 'Gómez', rol: 'mozo' },
  { id_usuario: 3, nombre: 'Damián', apellido: 'Martínez', rol: 'cocina' },
  { id_usuario: 4, nombre: 'Sofía', apellido: 'Alegre', rol: 'administrador' }
];

const invalidateCache = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('el_patron_cache_usuarios');
  }
};

export const usuariosService = {
  async list(): Promise<Usuario[]> {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('el_patron_cache_usuarios') : null;
    const client = tryGetActiveSupabaseClient();

    if (cached) {
      if (client) {
        // Stale-While-Revalidate: background refresh
        setTimeout(async () => {
          try {
            const { data, error } = await client.from('usuarios').select('*').order('id_usuario', { ascending: true });
            if (!error && data) {
              localStorage.setItem('el_patron_cache_usuarios', JSON.stringify(data));
            }
          } catch (e) {
            console.warn('Background usuarios cache refresh failed:', e);
          }
        }, 500);
      }

      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed parsing usuarios cache:', e);
      }
    }

    if (!client) {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('el_patron_cache_usuarios', JSON.stringify(DEFAULT_USUARIOS));
        } catch {}
      }
      return DEFAULT_USUARIOS;
    }

    const { data, error } = await client.from('usuarios').select('*').order('id_usuario', { ascending: true });
    if (error) {
      console.error('Error fetching usuarios:', error);
      throw error;
    }
    const result = data || [];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('el_patron_cache_usuarios', JSON.stringify(result));
      } catch {}
    }
    return result;
  },

  async getById(id: number): Promise<Usuario | null> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('usuarios').select('*').eq('id_usuario', id).single();
    if (error) {
      console.error(`Error fetching usuario ${id}:`, error);
      return null;
    }
    return data;
  },

  async create(user: Usuario): Promise<Usuario> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('usuarios').insert([user]).select().single();
    if (error) {
      console.error('Error creating usuario:', error);
      throw error;
    }
    invalidateCache();
    return data;
  },

  async update(id: number, user: Partial<Usuario>): Promise<Usuario> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('usuarios').update(user).eq('id_usuario', id).select().single();
    if (error) {
      console.error('Error updating usuario:', error);
      throw error;
    }
    invalidateCache();
    return data;
  },

  async upsert(users: Usuario[]): Promise<Usuario[]> {
    const supabase = getActiveSupabaseClient();
    const { data, error } = await supabase.from('usuarios').upsert(users).select();
    if (error) {
      console.error('Error upserting usuarios:', error);
      throw error;
    }
    invalidateCache();
    return data || [];
  },

  async remove(id: number): Promise<boolean> {
    const supabase = getActiveSupabaseClient();
    const { error } = await supabase.from('usuarios').delete().eq('id_usuario', id);
    if (error) {
      console.error('Error deleting usuario:', error);
      return false;
    }
    invalidateCache();
    return true;
  }
};
