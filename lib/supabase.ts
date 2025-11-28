import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'neonmatch_sb_url';
const STORAGE_KEY_KEY = 'neonmatch_sb_key';

export const getSupabaseConfig = () => {
  // 1. Intentar leer de la URL (para configuración mágica vía QR)
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('sbUrl');
  const keyParam = params.get('sbKey');

  if (urlParam && keyParam) {
    localStorage.setItem(STORAGE_KEY_URL, urlParam);
    localStorage.setItem(STORAGE_KEY_KEY, keyParam);
    
    // Limpiar URL manteniendo la ruta base
    const newUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({path: newUrl}, '', newUrl);

    return { url: urlParam, key: keyParam };
  }

  // 2. Intentar leer de localStorage
  const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
  const storedKey = localStorage.getItem(STORAGE_KEY_KEY);

  if (storedUrl && storedKey) {
    return { url: storedUrl, key: storedKey };
  }

  // 3. Fallback a variables de entorno (si las configuraste en Vercel)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_KEY };
  }

  return null;
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem(STORAGE_KEY_URL, url);
  localStorage.setItem(STORAGE_KEY_KEY, key);
};

export const createSupabaseClient = () => {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    return createClient(config.url, config.key);
  } catch (error) {
    console.error("Error inicializando Supabase:", error);
    return null;
  }
};