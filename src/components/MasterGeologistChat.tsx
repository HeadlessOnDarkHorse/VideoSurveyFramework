import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, X } from 'lucide-react';
import { pb } from '../lib/pocketbase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MasterGeologistChatProps {
  findingId: string;
  findingTitle: string;
  aiClassificationData: any;
  onClose: () => void;
}

const MasterGeologistChat: React.FC<MasterGeologistChatProps> = ({
  findingTitle,
  aiClassificationData,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting from the "Master Geologist" context
    const initialPrompt = `Hello! I see you've found something you identified as ${findingTitle}. Based on the visual analysis, I'm ${Math.round((aiClassificationData?.[0]?.confidence || 0) * 100)}% confident in that classification. What would you like to know about its formation, chemical properties, or geological age?`;

    setMessages([
      { id: '1', role: 'assistant', content: initialPrompt }
    ]);
  }, [findingTitle, aiClassificationData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Securely call a custom PocketBase route that holds the OpenAI API Key on the server
      const response = await pb.send('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          findingTitle,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (response && response.content) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.content
        }]);
      }
    } catch (err: any) {
      console.error("Chat API Error:", err);
      // Fallback message if API fails
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, my satellite uplink to basecamp is spotty right now. (Error: ${err.message})`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg h-[600px] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-500 rounded-full">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">Master Geologist</h3>
              <p className="text-xs text-zinc-400">AI Field Mentor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>

                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-blue-600/20 text-blue-500'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-zinc-300" /> : <Bot className="w-5 h-5" />}
                </div>

                <div className={`p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>

              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%] space-x-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-800 rounded-tl-none border border-zinc-700 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about its age, origin, chemistry..."
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default MasterGeologistChat;
