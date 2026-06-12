import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_INSUMOS,
  INITIAL_MESAS,
  INITIAL_PRODUCTOS_MENU,
  INITIAL_RECETAS_ESCANDALLO
} from '../src/data/initialData';

type SecretMap = Record<string, string>;

const repoRoot = process.cwd();
const secretsPath = path.join(repoRoot, '.streamlit', 'secrets.toml');

function readStreamlitSecrets(): SecretMap {
  if (!fs.existsSync(secretsPath)) return {};

  const content = fs.readFileSync(secretsPath, 'utf8');
  const secrets: SecretMap = {};

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*["'](.+)["']\s*$/);
    if (match) {
      secrets[match[1]] = match[2];
    }
  }

  return secrets;
}

function normalizeSupabaseUrl(rawUrl: string): string {
  return rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

async function upsertTable<T extends object>(
  tableName: string,
  rows: T[],
  onConflict: string
) {
  if (!rows.length) return 0;

  const { error } = await supabase
    .from(tableName)
    .upsert(rows as any[], { onConflict });

  if (error) {
    throw new Error(`${tableName}: ${error.message}`);
  }

  return rows.length;
}

async function countTable(tableName: string) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`${tableName}: ${error.message}`);
  }

  return count || 0;
}

const secrets = readStreamlitSecrets();
const rawUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  secrets.SUPABASE_URL ||
  secrets.VITE_SUPABASE_URL ||
  '';

const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  secrets.SUPABASE_ANON_KEY ||
  secrets.VITE_SUPABASE_ANON_KEY ||
  '';

if (!rawUrl || !anonKey) {
  throw new Error('Falta SUPABASE_URL o SUPABASE_ANON_KEY. Configuralos en .streamlit/secrets.toml o variables de entorno.');
}

const supabase = createClient(normalizeSupabaseUrl(rawUrl), anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const productos = INITIAL_PRODUCTOS_MENU.map(producto => ({
  ...producto,
  imagen: producto.imagen || null
}));

const recetas = INITIAL_RECETAS_ESCANDALLO.map(receta => ({
  ...receta,
  unidad_medida: receta.unidad_medida || null,
  merma_estimada_porcentaje: receta.merma_estimada_porcentaje ?? 0
}));

console.log('Iniciando carga de datos base en Supabase...');

const summary = {
  mesas: await upsertTable('mesas', INITIAL_MESAS, 'id_mesa'),
  insumos: await upsertTable('insumos', INITIAL_INSUMOS, 'id_insumo'),
  productos_menu: await upsertTable('productos_menu', productos, 'id_producto'),
  recetas_escandallo: await upsertTable('recetas_escandallo', recetas, 'id_receta')
};

const counts = {
  mesas: await countTable('mesas'),
  insumos: await countTable('insumos'),
  productos_menu: await countTable('productos_menu'),
  recetas_escandallo: await countTable('recetas_escandallo')
};

console.log('Carga completada.');
console.table(summary);
console.log('Totales actuales en Supabase:');
console.table(counts);
