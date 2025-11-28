import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './Button';
import { getWingmanSuggestion } from '../services/geminiService';

export const ChatInterface: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser, matches, allUsers, messages, sendMessage } = useApp();
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGettingSuggestion, setIsGettingSuggestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getPartnerId = (req: any) => req.fromId === currentUser?.id ? req.toId : req.fromId;

  // Auto-select first match if none selected
  useEffect(() => {
    if (!activePartnerId && matches.length > 0) {
      setActivePartnerId(getPartnerId(matches[0]));
    }
  }, [matches, activePartnerId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activePartnerId]);

  if (!currentUser) return null;

  const activePartner = allUsers.find(u => u.id === activePartnerId);
  
  const currentChatMessages = messages.filter(m => 
    (m.senderId === currentUser.id && m.receiverId === activePartnerId) ||
    (m.senderId === activePartnerId && m.receiverId === currentUser.id)
  ).sort((a, b) => a.timestamp - b.timestamp);

  const handleSend = (text: string = inputText) => {
    if (!text.trim() || !activePartnerId) return;
    sendMessage(activePartnerId, text);
    setInputText('');
    setSuggestion(null);
  };

  const handleWingman = async () => {
    if (!activePartner) return;
    setIsGettingSuggestion(true);
    const lastMsgs = currentChatMessages.slice(-5).map(m => ({
      sender: m.senderId === currentUser.id ? 'Yo' : 'Ella/Él',
      text: m.text
    }));
    
    const sug = await getWingmanSuggestion(currentUser.bio, activePartner.bio, lastMsgs);
    setSuggestion(sug);
    setIsGettingSuggestion(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 max-w-md mx-auto relative">
      {/* Header */}
      <div className="bg-slate-800 p-4 flex items-center gap-4 border-b border-slate-700 shadow-lg z-10">
        <button onClick={onBack} className="text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        
        {/* Match Selector (Scrollable horizontally) */}
        <div className="flex-1 overflow-x-auto scrollbar-hide flex gap-3">
          {matches.map(m => {
            const pid = getPartnerId(m);
            const p = allUsers.find(u => u.id === pid);
            if (!p) return null;
            const isActive = pid === activePartnerId;
            return (
              <div 
                key={pid} 
                onClick={() => setActivePartnerId(pid)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all whitespace-nowrap ${isActive ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300'}`}
              >
                 <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-600">
                    <img src={p.photoUrl || ''} className="w-full h-full object-cover" />
                 </div>
                 <span className="text-sm font-bold">#{p.id}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        {activePartner ? (
          <>
             <div className="text-center py-6 opacity-50">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-2">
                   <img src={activePartner.photoUrl || ''} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm">Match con <span className="font-bold">{activePartner.name}</span></p>
                <p className="text-xs italic">"{activePartner.bio}"</p>
             </div>

             {currentChatMessages.map(msg => {
               const isMe = msg.senderId === currentUser.id;
               return (
                 <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                     isMe 
                     ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-br-none' 
                     : 'bg-slate-800 text-slate-200 rounded-bl-none'
                   }`}>
                     {msg.text}
                   </div>
                 </div>
               );
             })}
             <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            Selecciona un match para chatear
          </div>
        )}
      </div>

      {/* Input Area */}
      {activePartner && (
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          {/* AI Suggestion Chip */}
          {suggestion && (
            <div className="mb-3 animate-fade-in-up">
              <div className="bg-indigo-900/50 border border-indigo-500/30 rounded-lg p-3 flex justify-between items-center">
                <p className="text-xs text-indigo-200 italic mr-2">" {suggestion} "</p>
                <button 
                  onClick={() => { setInputText(suggestion); setSuggestion(null); }}
                  className="text-xs font-bold text-indigo-400 hover:text-white whitespace-nowrap"
                >
                  Usar esta
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 items-center">
             <button 
               onClick={handleWingman}
               disabled={isGettingSuggestion}
               className="p-2 rounded-full bg-slate-700 text-yellow-400 hover:bg-slate-600 transition-colors"
               title="Ayuda IA"
             >
               {isGettingSuggestion ? (
                 <span className="animate-spin block">✨</span>
               ) : (
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8 8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
               )}
             </button>
             <input 
               className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-pink-500"
               placeholder="Escribe un mensaje..."
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
             <button 
               onClick={() => handleSend()}
               disabled={!inputText.trim()}
               className="p-2 rounded-full bg-pink-600 text-white disabled:opacity-50 hover:bg-pink-700"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};