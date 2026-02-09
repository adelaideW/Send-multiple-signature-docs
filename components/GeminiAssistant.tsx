
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, X, Loader2, Sparkles, User, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiAssistantProps {
  onClose: () => void;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi there! I am your HR Assistant powered by Gemini. How can I help you with Harry Porter\'s documents or profile today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Fix: Direct initialization with process.env.API_KEY as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const modelName = 'gemini-3-flash-preview';
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: `You are a helpful HR Assistant. You have access to Harry Porter's profile. He is a Demo Admin in Engineering based in San Francisco. He started on 12/01/2016. He has several folders like Notices, Confidential documents, and Work authorization. He has an expired offer letter and a signed offer letter from 2016. User asks: ${input}` }
            ]
          }
        ],
        config: {
          systemInstruction: 'Be professional, concise, and helpful. You are integrated into an HR platform dashboard.',
          temperature: 0.7,
        }
      });

      // Fix: Access response.text directly (property, not a method)
      const aiText = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error('Gemini API Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to my brain. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-14 right-0 w-96 h-[calc(100vh-3.5rem)] bg-white border-l border-slate-200 shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-purple-900 text-white">
        <div className="flex items-center space-x-2">
          <Sparkles size={18} className="text-purple-200" />
          <h2 className="font-bold">HR Smart Assistant</h2>
        </div>
        <button onClick={onClose} className="hover:bg-purple-800 p-1 rounded transition-colors">
          <X size={20} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              m.role === 'user' 
                ? 'bg-purple-900 text-white rounded-br-none' 
                : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span className="text-[10px] font-bold uppercase opacity-70">
                  {m.role === 'user' ? 'You' : 'Gemini'}
                </span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-800 rounded-lg p-3 rounded-bl-none flex items-center space-x-2">
              <Loader2 size={16} className="animate-spin text-purple-900" />
              <span className="text-xs">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything..."
            className="w-full border border-slate-200 rounded-lg py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-900 outline-none resize-none h-24"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 bottom-3 p-2 bg-purple-900 text-white rounded-md hover:bg-purple-800 disabled:opacity-50 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Powered by Gemini 3 Flash • Info may be inaccurate
        </p>
      </div>
    </div>
  );
}

export default GeminiAssistant;
