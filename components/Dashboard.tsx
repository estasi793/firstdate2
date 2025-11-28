import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './Button';
import { Input } from './Input';
import { getSupabaseConfig } from '../lib/supabase';

export const Dashboard: React.FC<{ onViewChange: (view: 'chat') => void }> = ({ onViewChange }) => {
  const { currentUser, sendLike, incomingLikes, respondToLike, matches, logout, allUsers } = useApp();
  const [targetId, setTargetId] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  
  // Estado para la URL base (permite cambiar localhost por IP o dominio real)
  const [baseUrlOverride, setBaseUrlOverride] = useState('');

  useEffect(() => {
    // Inicializar con la URL actual del navegador
    setBaseUrlOverride(window.location.origin + window.location.pathname);

    const params = new URLSearchParams(window.location.search);
    const voteParam = params.get('vote');
    if (voteParam) {
      setTargetId(voteParam);
    }
  }, []);

  if (!currentUser) return null;

  const handleLike = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsVoting(true);
    const result = await sendLike(parseInt(targetId));
    setIsVoting(false);
    
    setFeedback({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
    if (result.success) {
      setTargetId('');
      // Limpiar URL
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({path: newUrl}, '', newUrl);
    }
  };

  const getPartnerId = (req: any) => req.fromId === currentUser.id ? req.toId : req.fromId;

  // GENERACIÓN DE URL MÁGICA
  const config = getSupabaseConfig();
  
  // Usamos la URL que el usuario haya editado (o la detectada)
  // Limpiamos barras finales para evitar dobles //
  const cleanBaseUrl = baseUrlOverride.replace(/\/$/, '');
  
  const magicLink = `${cleanBaseUrl}?sbUrl=${encodeURIComponent(config?.url || '')}&sbKey=${encodeURIComponent(config?.key || '')}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(magicLink)}`;

  const shareViaWhatsApp = () => {
    const text = `¡Únete a la fiesta en NeonMatch! Entra aquí para conseguir tu número: ${magicLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(magicLink);
    alert("¡Enlace copiado! Ahora envíalo por WhatsApp a tu amigo/a.");
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-20 pt-6 px-4 space-y-6">
      
      {/* Header / ID Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden mb-4 shadow-lg">
            {currentUser.photoUrl && <img src={currentUser.photoUrl} alt="Me" className="w-full h-full object-cover" /> }
          </div>
          <p className="text-white/80 font-medium tracking-widest uppercase text-xs">Tu Número</p>
          <h1 className="text-6xl font-black tracking-tighter mt-1">{currentUser.id}</h1>
          <p className="mt-2 text-white/90 font-medium">{currentUser.name}</p>
          
          <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm w-full text-center">
            <p className="text-xs text-indigo-100 italic">"{currentUser.bio}"</p>
          </div>
        </div>
      </div>

      {/* Botón de Invitación Principal */}
      <Button 
        onClick={() => setShowInviteModal(true)} 
        variant="secondary"
        className="bg-slate-800 border-pink-500/50 text-pink-400 hover:bg-slate-700 hover:text-pink-300"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 8V4m0 4h2v4H6V8zm10 0V4m0 4h2v4h-2V8zM6 20h2v-4H6v4zm0 0v1m14-1v1" /></svg>
          INVITAR / VER QR
        </span>
      </Button>

      {/* Invite Modal Overlay */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fade-in-up overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative shadow-2xl space-y-6 text-center my-auto">
             <button 
               onClick={() => setShowInviteModal(false)}
               className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1"
             >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>

             <div>
               <h3 className="text-xl font-black text-slate-900">¡Invita a la Fiesta!</h3>
               <p className="text-sm text-slate-500 mt-1">Escanear esto les conecta a tu servidor.</p>
             </div>

             {/* URL EDITOR Warning */}
             <div className="text-left bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-[10px] font-bold text-yellow-700 uppercase mb-1">⚠️ Importante si estás probando:</p>
                <p className="text-xs text-yellow-800 leading-tight">
                  Si estás en tu casa, cambia <b>localhost</b> por la <b>IP de tu ordenador</b> (ej. 192.168.1.35). Si no, el móvil de tu amigo no encontrará la página.
                </p>
             </div>

             <div className="text-left">
                <label className="text-xs font-bold text-slate-400 uppercase">Dirección Web (Edítala si falla)</label>
                <input 
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono mt-1 focus:ring-2 focus:ring-pink-500 outline-none"
                  value={baseUrlOverride}
                  onChange={(e) => setBaseUrlOverride(e.target.value)}
                />
             </div>

             <div className="bg-slate-100 p-4 rounded-xl inline-block mx-auto border-4 border-slate-900">
               <img src={qrImageUrl} alt="QR Invitación" className="w-48 h-48 mix-blend-multiply" />
             </div>

             <div className="space-y-3">
               <button 
                 onClick={shareViaWhatsApp}
                 className="w-full py-3 rounded-xl font-bold bg-[#25D366] text-white shadow-lg shadow-green-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
               >
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.466c-.072-.124-.263-.198-.55-.341-.288-.145-1.701-.84-1.964-.935-.262-.095-.454-.143-.645.143-.191.286-.739.935-.905 1.125-.167.191-.333.214-.62.071-.288-.144-1.213-.448-2.311-1.427-.853-.76-1.429-1.699-1.596-1.987-.167-.286-.018-.44.126-.583.13-.129.288-.334.432-.501.144-.167.191-.286.287-.477.096-.191.048-.358-.024-.501-.072-.143-.645-1.554-.885-2.129-.232-.556-.468-.48-.645-.487-.168-.007-.358-.008-.55-.008-.191 0-.501.072-.763.359-.263.287-1.006.982-1.006 2.395 0 1.413 1.029 2.778 1.173 2.969.143.191 2.025 3.092 4.905 4.335.686.296 1.221.473 1.642.607.701.223 1.339.191 1.841.116.558-.083 1.701-.695 1.94-1.365.239-.67.239-1.243.167-1.365z"/></svg>
                 Enviar por WhatsApp
               </button>
               
               <button 
                 onClick={copyToClipboard}
                 className="w-full py-3 rounded-xl font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors"
               >
                 Copiar Enlace
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Liker Input */}
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-pink-500">❤️</span> ¿Has visto a alguien?
        </h3>
        <form onSubmit={handleLike} className="flex gap-3">
          <Input 
            type="number" 
            placeholder="Nº (ej. 39)" 
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="text-lg font-bold"
          />
          <Button type="submit" className="w-auto px-6" disabled={!targetId || isVoting} isLoading={isVoting}>
            Votar
          </Button>
        </form>
        {feedback && (
          <p className={`mt-3 text-sm ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {feedback.text}
          </p>
        )}
      </div>

      {/* Incoming Likes */}
      {incomingLikes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white px-2">Votos Pendientes ({incomingLikes.length})</h3>
          {incomingLikes.map(req => {
             const user = allUsers.find(u => u.id === req.fromId);
             const displayName = user ? `Número ${req.fromId}` : `Número ${req.fromId}`;
             const displayPhoto = user?.photoUrl;

             return (
              <div key={req.fromId} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden">
                     {displayPhoto ? <img src={displayPhoto} alt="Requester" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-600" />}
                  </div>
                  <div>
                    <p className="font-bold text-white">{displayName}</p>
                    {user && <p className="text-xs text-slate-400 italic">"{user.bio}"</p>}
                    <p className="text-xs text-pink-400 font-bold mt-1">Te ha votado</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => respondToLike(req.fromId, false)}
                    className="w-8 h-8 rounded-full bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                  <button 
                    onClick={() => respondToLike(req.fromId, true)}
                    className="w-8 h-8 rounded-full bg-pink-500 text-white hover:bg-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/30 transition-colors"
                  >
                    ✓
                  </button>
                </div>
              </div>
             );
          })}
        </div>
      )}

      {/* Matches List Preview */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-bold text-white">Coincidencias (Matches)</h3>
          {matches.length > 0 && (
            <button onClick={() => onViewChange('chat')} className="text-xs text-pink-400 font-bold hover:text-pink-300">
              Ver Todo &rarr;
            </button>
          )}
        </div>
        
        {matches.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <p>Sin coincidencias aún. ¡Empieza a votar!</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {matches.map(match => {
              const partnerId = getPartnerId(match);
              const partner = allUsers.find(u => u.id === partnerId);
              if (!partner) return null;
              return (
                <div key={partner.id} onClick={() => onViewChange('chat')} className="flex-shrink-0 flex flex-col items-center cursor-pointer group">
                  <div className="w-16 h-16 rounded-full border-2 border-pink-500 p-1 relative">
                    <img src={partner.photoUrl || ''} className="w-full h-full rounded-full object-cover" alt={partner.name} />
                  </div>
                  <span className="mt-1 text-xs font-bold text-white group-hover:text-pink-400">#{partner.id}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-8 text-center">
        <button onClick={logout} className="text-slate-500 text-sm hover:text-white underline">Cerrar Sesión</button>
      </div>
    </div>
  );
};