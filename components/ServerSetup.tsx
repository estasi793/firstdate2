import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './Button';
import { Input } from './Input';

export const ServerSetup: React.FC = () => {
  const { configureServer } = useApp();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  const handleSave = () => {
    if (url && key) {
      // Usar la función del contexto para que la app se actualice al instante
      configureServer(url, key);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-black text-white mb-2">Conectar Servidor</h1>
        <p className="text-slate-400 mb-6 text-sm">
          Para que todos los usuarios se vean entre sí, necesitamos conectar una base de datos.
        </p>

        <ol className="list-decimal list-inside text-xs text-slate-500 mb-6 space-y-2">
          <li>Crea proyecto en <a href="https://supabase.com" target="_blank" className="text-pink-500 underline">supabase.com</a></li>
          <li>Ejecuta el script SQL en el editor.</li>
          <li>Copia la URL y la Anon Key de los ajustes.</li>
        </ol>

        <div className="space-y-4">
          <Input 
            label="Project URL" 
            placeholder="https://xyz.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Input 
            label="API Key (Anon/Public)" 
            type="password"
            placeholder="eyJh..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <Button onClick={handleSave} disabled={!url || !key}>
            Conectar Discoteca
          </Button>
        </div>
      </div>
    </div>
  );
};