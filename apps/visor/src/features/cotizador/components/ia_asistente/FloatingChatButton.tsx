import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Sparkles, X, ExternalLink, Send, User, Bot as BotIcon, Trash2, ArrowLeft, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../../../lib/api';

// Interfaces para el manejo de mensajes con la API de Gemini
interface GeminiMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: string; // ISO string para serialización en localStorage
}

interface FloatingChatButtonProps {
  chatUrl?: string;
  greetingMessage?: string;
  bubbleDelay?: number;
}

// Un globito que flota para que el robot nos conteste dudas.
export function FloatingChatButton({
  greetingMessage = "¿Hola! Tienes dudas? Chatea con nuestro Asistente de IA UTEL.",
  bubbleDelay = 3500
}: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showBubble, setShowBubble] = useState<boolean>(false);
  const [hasDismissed, setHasDismissed] = useState<boolean>(false);
  
  // Aquí elegimos si hablamos con el robot de UTEL o con el robot gigante Gemini.
  const [activeView, setActiveView] = useState<'menu' | 'utel' | 'gemini'>('menu');
  
  // Los mensajitos que nos decimos con el robot.
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utelChatUrl = "https://www.chatbase.co/chatbot-iframe/0PP3_Utrwkr_FZBE8_v_w";

  // El robot recuerda lo que platicamos ayer.
  useEffect(() => {
    const saved = localStorage.getItem('utel_gemini_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading chat history", e);
      }
    } else {
      // Mensaje de bienvenida inicial
      setMessages([{
        id: 'welcome',
        role: 'bot',
        text: '¡Hola! Soy tu asistente inteligente de UTEL mejorado con Gemini. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date().toISOString()
      }]);
    }

    const dismissed = sessionStorage.getItem('utel_chat_bubble_dismissed') === 'true';
    if (dismissed) {
      setHasDismissed(true);
      return;
    }

    if (!isOpen) {
      const timer = setTimeout(() => {
        setShowBubble(true);
      }, bubbleDelay);
      return () => clearTimeout(timer);
    }
  }, [bubbleDelay, isOpen]);

  // Save history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('utel_gemini_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowBubble(false);
      setHasDismissed(true);
      sessionStorage.setItem('utel_chat_bubble_dismissed', 'true');
    } else {
      setActiveView('menu');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Map display messages to Gemini API expected history format
      const history: GeminiMessage[] = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      const response = await api.post('/cotizador/chat', {
        message: input,
        history
      });

      const data = response.data;
      if (data.error) throw new Error(data.error);

      const botMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.text,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: 'Lo siento, hubo un problema al conectarme con Gemini. Asegúrate de que la API key esté configurada.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar el historial de chat?')) {
      const welcome = {
        id: 'welcome',
        role: 'bot',
        text: '¡Hola! Soy tu asistente inteligente de UTEL mejorado con Gemini. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date().toISOString()
      };
      setMessages([welcome as DisplayMessage]);
      localStorage.removeItem('utel_gemini_chat_history');
    }
  };

  const handleDismissBubble = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowBubble(false);
    setHasDismissed(true);
    sessionStorage.setItem('utel_chat_bubble_dismissed', 'true');
  };

  return (
    <div id="utel-floating-chat-container" className="fixed bottom-6 right-6 flex flex-col items-end z-50 select-none pointer-events-none">
      
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="utel-chat-dropdown-window"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[340px] sm:w-[400px] h-[550px] sm:h-[600px] max-h-[calc(100vh-120px)] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeView !== 'menu' && (
                  <button 
                    onClick={() => setActiveView('menu')}
                    className="p-1.5 -ml-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div className="relative">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    activeView === 'gemini' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600' : 
                    activeView === 'utel' ? 'bg-gradient-to-tr from-[#2A9D8F] to-[#1D3557]' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {activeView === 'gemini' ? <Sparkles className="h-5 w-5" /> : 
                     activeView === 'utel' ? <BotIcon className="h-5 w-5" /> : 
                     <Cpu className="h-5 w-5" />}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight font-sans">
                    {activeView === 'gemini' ? 'Gemini Assistant' : activeView === 'utel' ? 'Asistente UTEL' : 'Elegir Asistente'}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Sesión Activa</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {activeView === 'gemini' && (
                  <button 
                    onClick={clearHistory}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all cursor-pointer"
                    title="Borrar historial"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button 
                  onClick={toggleChat}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow flex flex-col overflow-hidden relative">
              <AnimatePresence mode="wait">
                {activeView === 'menu' ? (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-grow p-6 flex flex-col gap-4 bg-slate-50 dark:bg-slate-950"
                  >
                    <div className="text-center mb-2">
                       <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Centro de Inteligencia</h4>
                    </div>

                    <button
                      onClick={() => setActiveView('gemini')}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                    >
                      <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Google Gemini</div>
                        <div className="text-[11px] text-slate-500">Historial integrado en la sesión</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveView('utel')}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-[#2A9D8F] transition-all cursor-pointer group shadow-sm hover:shadow-md"
                    >
                      <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <BotIcon className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Asistente UTEL (Iframe)</div>
                        <div className="text-[11px] text-slate-500">Chatbot corporativo oficial</div>
                      </div>
                    </button>

                    <div className="border-t border-slate-200 dark:border-slate-800 my-2" />

                    <a
                      href="https://chatgpt.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-slate-100/50 dark:bg-slate-900/50 border border-transparent rounded-2xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
                    >
                      <div className="h-12 w-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                        <ExternalLink className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">OpenAI ChatGPT</div>
                        <div className="text-[11px] text-slate-500">Abrir en pestaña externa</div>
                      </div>
                    </a>

                    <p className="mt-auto text-center text-[10px] text-slate-400 font-medium">
                      UTEL Commercial Intelligence Hub v2.1
                    </p>
                  </motion.div>
                ) : activeView === 'gemini' ? (
                  <motion.div
                    key="gemini-chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col overflow-hidden h-full"
                  >
                    <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                              msg.role === 'user' 
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' 
                                : 'bg-indigo-600 text-white'
                            }`}>
                              {msg.role === 'user' ? <User className="h-4 w-4" /> : <BotIcon className="h-4 w-4" />}
                            </div>
                            <div className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800'
                            }`}>
                              {msg.text}
                              <div className={`text-[9px] mt-1 opacity-60 font-medium ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="flex gap-2 items-center bg-white dark:bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800">
                             <div className="flex gap-1">
                               <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce"></span>
                               <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                               <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                             </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                      <form onSubmit={handleSendMessage} className="relative">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Escribe tu mensaje..."
                          disabled={isLoading}
                          className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm"
                        />
                        <button
                          type="submit"
                          disabled={!input.trim() || isLoading}
                          className="absolute right-1.5 top-1.5 h-8 w-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="utel-iframe"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow relative h-full bg-white dark:bg-slate-900"
                  >
                    <iframe
                      src={utelChatUrl}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      className="w-full h-full border-none"
                      title="UTEL Chat"
                      allow="clipboard-write"
                    />
                     <a
                        href={utelChatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-4 right-4 h-10 w-10 bg-indigo-600/10 backdrop-blur-md border border-indigo-600/20 flex items-center justify-center rounded-xl shadow-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                        title="Expandir"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting Bubble */}
      <AnimatePresence>
        {showBubble && !hasDismissed && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            onClick={toggleChat}
            className="mb-4 mr-1 max-w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl pointer-events-auto flex gap-3 relative cursor-pointer group"
          >
            <div className="flex-shrink-0 h-9 w-9 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">ASISTENTE GEMINI</span>
                <button onClick={handleDismissBubble} className="text-slate-400 hover:text-slate-600 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-[12px] text-slate-600 dark:text-slate-300 font-medium leading-snug">
                {greetingMessage}
              </p>
            </div>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all cursor-pointer pointer-events-auto border-2 ${
          isOpen 
            ? 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-100 dark:border-slate-700' 
            : 'bg-indigo-600 text-white border-white/10'
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </motion.button>
    </div>
  );
}
