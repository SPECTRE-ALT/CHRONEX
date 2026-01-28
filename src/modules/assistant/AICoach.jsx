import React, { useState, useEffect, useRef } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { Send, Sparkles, Bot, Mic, MicOff } from 'lucide-react';

export function AICoach({ contextData }) {
    const { sendMessage, loading } = useGemini();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "I'm Chronex. How can I assist your workflow?" }
    ]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef(null);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

        const systemInstruction = `
      You are Chronex, a cognitive coach.
      User Context:
      - Posture: ${contextData?.postureStatus || 'Unknown'} (Score: ${contextData?.postureScore || 0})
      - Focus: ${contextData?.focusScore || 'N/A'}
      - Current Mood: ${contextData?.mood || 'Neutral'}
      
      Keep responses concise, witty, and high-performance focused.
    `;

        const apiMessages = [
            { role: "system", content: systemInstruction },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg }
        ];

        const reply = await sendMessage("qwen/qwen3-32b", apiMessages);
        setMessages(prev => [...prev, { role: 'assistant', content: reply || "Connection disruption." }]);
    };

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition not supported in this browser. Try Chrome.");
            return;
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
        recognition.start();
    };

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="glass-panel text-left flex flex-col h-full min-h-[400px]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <Bot size={18} className="text-chronex-accent" />
                    <h3 className="text-sm font-bold tracking-wide">Mindset AI</h3>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed border ${m.role === 'user'
                            ? 'bg-chronex-accent/10 border-chronex-accent/20 text-chronex-accent rounded-tr-none font-medium'
                            : 'bg-white/5 border-white/10 text-gray-300 rounded-tl-none'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 p-3 rounded-xl rounded-tl-none text-xs text-white/50 flex items-center gap-2 border border-white/5">
                            <Sparkles size={12} className="animate-spin text-chronex-accent" /> Processing...
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-4 border-t border-white/5 flex gap-2">
                <button
                    onClick={toggleListening}
                    className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={isListening ? "Listening..." : "Ask Chronex..."}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-chronex-accent/50 transition-colors placeholder:text-white/20"
                />
                <button
                    onClick={handleSend}
                    className="p-2 bg-white/10 hover:bg-chronex-accent hover:text-black rounded-lg transition-colors"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
