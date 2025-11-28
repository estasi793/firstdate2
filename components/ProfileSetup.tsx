import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './Button';
import { Input } from './Input';
import { generateBio } from '../services/geminiService';

export const ProfileSetup: React.FC = () => {
  const { register, isLoading } = useApp();
  const [name, setName] = useState('');
  const [traits, setTraits] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateBio = async () => {
    if (!name || !traits) return;
    setIsGenerating(true);
    const result = await generateBio(name, traits);
    setBio(result);
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && bio && photo) {
      await register(name, bio, photo);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">Consigue tu Número</h2>
          <p className="mt-2 text-slate-400">Únete a la red exclusiva del local.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <Input 
            label="Tu Nombre" 
            placeholder="ej. Alex" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Tu Foto (Obligatorio)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer hover:border-pink-500 hover:bg-slate-800/50 transition-all overflow-hidden group">
                {photo ? (
                  <img src={photo} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-2 text-slate-500 group-hover:text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <p className="text-sm text-slate-500">Toca para subir</p>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} required={!photo} />
              </label>
            </div>
          </div>

          {/* AI Bio Generator */}
          <div className="space-y-2">
            <Input 
              label="Descríbete (Palabras Clave)" 
              placeholder="ej. Techno, Tacos, Senderismo"
              value={traits} 
              onChange={(e) => setTraits(e.target.value)}
            />
            <div className="flex gap-2">
              <textarea 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[80px]"
                placeholder="Tu biografía aparecerá aquí..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
              />
            </div>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleGenerateBio} 
              isLoading={isGenerating}
              disabled={!name || !traits}
              className="text-xs py-2"
            >
              ✨ Generar Bio con IA
            </Button>
          </div>

          <Button type="submit" disabled={!photo || !name || !bio || isLoading} isLoading={isLoading}>
            {isLoading ? 'Conectando...' : 'Entrar al Local'}
          </Button>
        </form>
      </div>
    </div>
  );
};