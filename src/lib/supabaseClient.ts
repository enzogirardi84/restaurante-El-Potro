import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  key: string;
}

const readLocalConfig = (key: string) => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(key) || '';
};

export const getSupabaseConfig = (): SupabaseConfig => {
  const env = (import.meta as any).env || {};
  const url = env.VITE_SUPABASE_URL || readLocalConfig('el_patron_supabase_url');
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || readLocalConfig('el_patron_supabase_anon_key');
  return { url, key };
};

export const hasSupabaseConfig = (config = getSupabaseConfig()) => {
  return Boolean(config.url && config.key && !config.key.includes('...') && !config.key.includes('tu-anon-key'));
};

let cachedClient: SupabaseClient | null = null;
let cachedFingerprint = '';

const createConfiguredClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!hasSupabaseConfig(config)) return null;

  const fingerprint = `${config.url}:${config.key}`;
  if (cachedClient && cachedFingerprint === fingerprint) {
    return cachedClient;
  }

  cachedFingerprint = fingerprint;
  cachedClient = createClient(config.url, config.key, {
    auth: { persistSession: false }
  });

  return cachedClient;
};

export const supabase = createConfiguredClient();

export const tryGetActiveSupabaseClient = (): SupabaseClient | null => {
  return createConfiguredClient();
};

export const resetSupabaseClientCache = () => {
  cachedClient = null;
  cachedFingerprint = '';
};

export const getActiveSupabaseClient = (): SupabaseClient => {
  const client = createConfiguredClient();
  if (!client) {
    throw new Error('Supabase no está configurado. Ingrese VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY o configure la conexión desde el módulo Sistema.');
  }
  return client;
};
