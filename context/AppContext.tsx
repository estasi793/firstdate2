import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MatchRequest, Message } from '../types';
import { createSupabaseClient, getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';

interface AppContextType {
  currentUser: User | null;
  allUsers: User[];
  incomingLikes: MatchRequest[];
  matches: MatchRequest[];
  messages: Message[];
  isLoading: boolean;
  isConfigured: boolean;
  
  register: (name: string, bio: string, photoUrl: string | null) => Promise<void>;
  sendLike: (targetId: number) => Promise<{ success: boolean; message: string }>;
  respondToLike: (fromId: number, accept: boolean) => Promise<void>;
  sendMessage: (toId: number, text: string) => Promise<void>;
  loginAsUser: (id: number) => Promise<boolean>;
  logout: () => void;
  resetServer: () => Promise<void>;
  configureServer: (url: string, key: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SESSION_USER_ID_KEY = 'neonmatch_session_user_id';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ahora usamos setSupabase para poder actualizar el cliente dinámicamente
  const [supabase, setSupabase] = useState<any>(() => createSupabaseClient());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(!!getSupabaseConfig());

  const configureServer = (url: string, key: string) => {
    // 1. Guardar en localStorage
    saveSupabaseConfig(url.trim(), key.trim());
    
    // 2. Crear nueva instancia
    const newClient = createSupabaseClient();
    
    // 3. Actualizar estado
    setSupabase(newClient);
    setIsConfigured(!!newClient);
    
    if (newClient) {
      // Forzar recarga de datos si la conexión es exitosa
      // (El useEffect dependiente de 'supabase' se encargará)
    } else {
      alert("Error: La URL o Key parecen inválidas.");
    }
  };

  // Cargar datos iniciales y suscripciones Realtime
  useEffect(() => {
    if (!supabase) return;

    const fetchData = async () => {
      setIsLoading(true);
      
      // 1. Cargar Usuarios
      const { data: usersData, error: userError } = await supabase.from('users').select('*').order('id', { ascending: true });
      
      if (userError) {
        console.error("Error conectando a Supabase:", userError);
        // Si hay error de conexión (ej. 401), tal vez la config está mal
        return; 
      }

      if (usersData) {
        // Mapear snake_case de DB a camelCase de TS
        const mappedUsers = usersData.map((u: any) => ({
          id: u.id,
          name: u.name,
          bio: u.bio,
          photoUrl: u.photo_url,
          joinedAt: u.joined_at
        }));
        setAllUsers(mappedUsers);

        // Auto-login si hay sesión guardada
        const storedId = localStorage.getItem(SESSION_USER_ID_KEY);
        if (storedId) {
          const found = mappedUsers.find((u: User) => u.id === parseInt(storedId));
          if (found) setCurrentUser(found);
        }
      }

      // 2. Cargar Matches
      const { data: matchesData } = await supabase.from('matches').select('*');
      if (matchesData) {
        const mappedMatches = matchesData.map((m: any) => ({
          fromId: m.from_id,
          toId: m.to_id,
          status: m.status,
          timestamp: m.timestamp
        }));
        setMatchRequests(mappedMatches);
      }

      // 3. Cargar Mensajes
      const { data: msgData } = await supabase.from('messages').select('*').order('timestamp', { ascending: true });
      if (msgData) {
        const mappedMsgs = msgData.map((m: any) => ({
          id: m.id.toString(),
          senderId: m.sender_id,
          receiverId: m.receiver_id,
          text: m.text,
          timestamp: m.timestamp
        }));
        setMessages(mappedMsgs);
      }

      setIsLoading(false);
    };

    fetchData();

    // SUSCRIPCIONES REALTIME (Para que funcione al instante entre móviles)
    const channel = supabase.channel('public_db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload: any) => {
        // Recargar usuarios cuando entra alguien nuevo
        fetchData(); 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload: any) => {
        // Recargar matches cuando alguien vota
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        // Añadir mensaje nuevo
        const newMsg = payload.new;
        setMessages(prev => [...prev, {
          id: newMsg.id.toString(),
          senderId: newMsg.sender_id,
          receiverId: newMsg.receiver_id,
          text: newMsg.text,
          timestamp: newMsg.timestamp
        }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const register = async (name: string, bio: string, photoUrl: string | null) => {
    if (!supabase) return;
    setIsLoading(true);

    // Insertar en Supabase. La base de datos asignará el ID automáticamente (1, 2, 3...)
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, bio, photo_url: photoUrl }])
      .select()
      .single();

    if (error) {
      console.error("Error registro:", error);
      alert("Error al registrarse. ¿Has ejecutado el SQL en Supabase?");
      setIsLoading(false);
      return;
    }

    if (data) {
      const newUser: User = {
        id: data.id,
        name: data.name,
        bio: data.bio,
        photoUrl: data.photo_url,
        joinedAt: data.joined_at
      };
      
      // Actualizar estado local inmediatamente
      setAllUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      localStorage.setItem(SESSION_USER_ID_KEY, newUser.id.toString());
    }
    
    setIsLoading(false);
  };

  const loginAsUser = async (id: number): Promise<boolean> => {
    // Buscar en la lista local cargada
    const found = allUsers.find(u => u.id === id);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem(SESSION_USER_ID_KEY, found.id.toString());
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_USER_ID_KEY);
    // No recargar página completa para mantener estado de Supabase
    // window.location.reload(); 
  };

  const resetServer = async () => {
    // Esto es solo para pruebas
    if (!supabase) return;
    if (confirm("¿ADMIN: Borrar todos los datos de la base de datos?")) {
      await supabase.from('messages').delete().neq('id', 0);
      await supabase.from('matches').delete().neq('id', 0);
      await supabase.from('users').delete().neq('id', 0);
      logout();
    }
  };

  const sendLike = async (targetId: number): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !supabase) return { success: false, message: 'Error de conexión' };
    if (targetId === currentUser.id) return { success: false, message: "¡No puedes votarte a ti mismo!" };

    // Verificar si el usuario existe
    const targetUser = allUsers.find(u => u.id === targetId);
    if (!targetUser) return { success: false, message: 'Ese número no existe todavía.' };

    // Verificar si ya existe el like
    const existing = matchRequests.find(
      r => (r.fromId === currentUser.id && r.toId === targetId) ||
           (r.fromId === targetId && r.toId === currentUser.id)
    );

    if (existing) return { success: false, message: 'Ya habéis interactuado.' };

    const { error } = await supabase
      .from('matches')
      .insert([{ from_id: currentUser.id, to_id: targetId, status: 'pending' }]);

    if (error) {
      console.error(error);
      return { success: false, message: 'Error al enviar voto' };
    }

    return { success: true, message: `¡Has votado al Número ${targetId}!` };
  };

  const respondToLike = async (fromId: number, accept: boolean) => {
    if (!currentUser || !supabase) return;
    
    const status = accept ? 'accepted' : 'rejected';
    
    // 1. Actualización Optimista (UI responde al instante)
    setMatchRequests(prev => prev.map(m => {
      if (m.fromId === fromId && m.toId === currentUser.id) {
        return { ...m, status: status as any };
      }
      return m;
    }));
    
    // 2. Actualizar en DB
    const { error } = await supabase
      .from('matches')
      .update({ status: status })
      .eq('from_id', fromId)
      .eq('to_id', currentUser.id);

    if (error) console.error("Error al responder match:", error);
  };

  const sendMessage = async (toId: number, text: string) => {
    if (!currentUser || !supabase) return;

    await supabase.from('messages').insert([{
      sender_id: currentUser.id,
      receiver_id: toId,
      text: text
    }]);
  };

  // Filtros UI
  const incomingLikes = matchRequests.filter(
    req => req.toId === currentUser?.id && req.status === 'pending'
  );

  const matches = matchRequests.filter(
    req => (req.fromId === currentUser?.id || req.toId === currentUser?.id) && req.status === 'accepted'
  );

  return (
    <AppContext.Provider value={{
      currentUser,
      allUsers,
      incomingLikes,
      matches,
      messages,
      isLoading,
      isConfigured,
      register,
      sendLike,
      respondToLike,
      sendMessage,
      loginAsUser,
      logout,
      resetServer,
      configureServer
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};