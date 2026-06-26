import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasSupabaseConfig,
  getSupabaseConfig,
} from './supabaseClient';

test('detecta configuracion Supabase incompleta o placeholder', () => {
  assert.equal(hasSupabaseConfig({ url: '', key: '' }), false);
  assert.equal(hasSupabaseConfig({ url: 'https://demo.supabase.co', key: 'tu-anon-key' }), false);
  assert.equal(hasSupabaseConfig({ url: 'https://demo.supabase.co', key: 'abc...' }), false);
  assert.equal(hasSupabaseConfig({ url: 'https://demo.supabase.co', key: 'real-key' }), true);
});

test('recupera configuracion valida', () => {
  const config = getSupabaseConfig();
  // El Potro tiene variables cargadas en .env locales en desarrollo
  assert.ok(typeof config.url === 'string');
  assert.ok(typeof config.key === 'string');
});
