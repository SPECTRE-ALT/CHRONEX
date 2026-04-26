import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Mic, MicOff } from 'lucide-react';

export function AICoach({ contextData }) {
    const [messages, setMessages] = useState([
        { 
            role: 'assistant', 
            content: "Welcome to Chronex.\n\nI’m your mindset assistant, designed to provide thoughtful, structured responses to help you stay focused, motivated, and clear in your thinking.\n\nHow can I support you today?",
            isBotDisclaimer: false 
        }
    ]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    const knowledgeBase = {
        // Science & Physics
        "gravity": "Gravity is the force that pulls objects toward each other. On Earth, it keeps everything grounded.",
        "photosynthesis": "Photosynthesis is how plants make food using sunlight, carbon dioxide, and water.",
        "atom": "An atom is the smallest unit of matter, made of protons, neutrons, and electrons.",
        "force": "Force is a push or pull acting on an object.",
        "energy": "Energy is the ability to do work. It exists in forms like kinetic, potential, heat, and light.",
        "speed of light": "The speed of light is about 299,792 km per second.",
        "newton": "A newton is the unit of force in physics, named after Isaac Newton.",
        "relativity": "Einstein's theory that space and time are linked for objects moving at consistent speeds.",
        "entropy": "A measure of disorder or randomness in a system.",
        "friction": "The resistance that one surface or object encounters when moving over another.",
        
        // Biology
        "cell": "A cell is the basic unit of life in living organisms.",
        "dna": "Deoxyribonucleic acid (DNA) carries the genetic instructions for life.",
        "evolution": "The process by which different kinds of living organisms developed and diversified over time.",
        "mitochondria": "Known as the powerhouse of the cell, they generate most of the cell's energy.",
        "neuron": "A specialized cell transmitting nerve impulses; a nerve cell.",
        
        // Math
        "pi": "Pi (π) is about 3.14159 and is used in circle calculations.",
        "triangle": "A triangle is a shape with three sides and three angles.",
        "algebra": "A branch of mathematics where letters and symbols represent numbers in formulas.",
        "calculus": "The mathematical study of continuous change.",
        "prime": "A number greater than 1 that cannot be formed by multiplying two smaller natural numbers.",
        
        // Productivity & Mindset (App Specific)
        "pomodoro": "A time management method using a timer to break work into 25-minute intervals, separated by short breaks.",
        "dopamine": "A neurotransmitter that plays a major role in how we feel pleasure and stay motivated.",
        "neuroplasticity": "The brain's ability to reorganize itself by forming new neural connections.",
        "cortisol": "The body's main stress hormone. Managing it is key to long-term focus.",
        "circadian": "Your internal 24-hour clock that regulates sleep-wake cycles.",
        "deep work": "The ability to focus without distraction on a cognitively demanding task.",
        "flow state": "A state of mind in which a person becomes fully immersed in an activity.",
        
        // Technology
        "internet": "A global network providing a variety of information and communication facilities.",
        "ai": "Artificial Intelligence is the simulation of human intelligence by machines.",
        "computer": "An electronic device for storing and processing data."
    };

    const tryMath = (input) => {
        try {
            if (/^[0-9+\-*/(). ]+$/.test(input) && /[0-9]/.test(input) && /[+\-*/]/.test(input)) {
                return eval(input);
            }
        } catch {
            return null;
        }
        return null;
    };

    const getPremadeResponse = (userText) => {
        const text = userText.toLowerCase().trim();
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const followUp = "\n\nWant a quick tip or another explanation?";
        
        // 1. Math Solving
        const mathResult = tryMath(text);
        if (mathResult !== null) {
            return `The answer is: ${mathResult}${followUp}`;
        }

        // 2. Mode Switching
        if (text.includes('study') || text.includes('focus') || text.includes('learn')) {
            return "Switching to focus mode 🧠\n\nLet’s keep things sharp. What do you want to work on?";
        }

        // 3. Quick Tips
        if (text.includes('tip') || text.includes('help')) {
            return "Quick tip ⚡:\n\nSit straight, drink water every 30–45 mins, and take short breaks to stay focused.";
        }

        // 4. Question Detection (what is, define, explain)
        if (text.includes("what is") || text.includes("define") || text.includes("explain")) {
            for (let key in knowledgeBase) {
                if (text.includes(key)) {
                    return `Switching to knowledge mode 📘...\n\nHere’s a quick explanation:\n${knowledgeBase[key]}${followUp}`;
                }
            }
        }

        // 5. Fallback Knowledge Base Search (Direct Keyword)
        for (let key in knowledgeBase) {
            const trigger = key.length > 5 ? key.substring(0, 5) : key;
            if (text.includes(trigger)) {
                return `Switching to knowledge mode 📘...\n\nHere’s a quick explanation:\n${knowledgeBase[key]}${followUp}`;
            }
        }

        // 6. Greeting detection
        const greetings = [
            "Hey 👋 I’m Chronex. I can help with focus, posture, hydration, and mindset. What do you want to improve today?",
            "Hi there! I’m Chronex. I'm here to help you optimize your focus and physical wellness. What's on your mind?",
            "Hello! I can help you improve focus, posture, and hydration. What can we work on together today?"
        ];
        const greetingWords = ['hi', 'hello', 'hey', 'yo', 'greetings'];
        if (greetingWords.some(g => text === g || text.startsWith(g + ' '))) {
            return pick(greetings);
        }

        // 7. Casual replies
        const casuals = [
            "Got it 👍 Want help with anything else like focus or posture?",
            "Nice. Need anything else? 🎯",
            "Alright 👍 I’m here if you need more help."
        ];
        const casualTriggers = ['ok', 'thanks', 'thank you', 'cool', 'nice', 'great', 'awesome', 'got it'];
        if (casualTriggers.some(t => text === t || text.startsWith(t + ' '))) {
            return pick(casuals);
        }

        // 8. Topic responses
        if (text.includes('post') || text.includes('sit') || text.includes('back') || text.includes('slouch')) {
            return pick([
                "Good posture keeps your spine aligned and reduces fatigue.\n\nTry this: sit upright, shoulders relaxed, screen at eye level.",
                "Alignment is key to energy! Keep your back supported and chin tucked slightly.\n\nWant a quick posture check tip?",
                "Slouching can drain your focus. Try rolling your shoulders back and taking a deep breath."
            ]);
        }

        if (text.includes('hydrat') || text.includes('water') || text.includes('drink') || text.includes('thirsty')) {
            return pick([
                "Staying hydrated improves focus and energy. Aim for small sips regularly.",
                "Water is fuel for your brain! Try to drink a glass every hour.\n\nWant a simple water plan?",
                "Thirsty? That's usually a sign your brain is already dehydrating. Grab some water now!"
            ]);
        }

        if (text.includes('focus') || text.includes('work') || text.includes('concentrat') || text.includes('study') || text.includes('distract')) {
            return pick([
                "Focus works best in short bursts. Try 25 minutes of work, then a 5-minute break.",
                "Deep focus requires a clear environment. Try removing distractions for the next 20 minutes.",
                "Concentration is a muscle. Start with small blocks of deep work and build up."
            ]);
        }

        if (text.includes('mindset') || text.includes('mood') || text.includes('feel') || text.includes('motiv')) {
            return pick([
                "Mindset is the foundation of high performance. Keep your goals clear.",
                "Feeling stuck? A quick mindset shift can change everything. Focus on one small win.",
                "Your mood follows your actions. Try a 1-minute breathing exercise to reset."
            ]);
        }
        
        // 9. Fallback / Unknown input (Always guide the user)
        return "I can help with mindset, posture, focus, and basic science/math. Try asking something like '2+2' or 'what is gravity'.";
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        
        setLoading(true);
        // Simulate a 0.8s typing delay
        setTimeout(() => {
            const reply = getPremadeResponse(userMsg);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: reply,
                isBotDisclaimer: false 
            }]);
            setLoading(false);
        }, 800);
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
                    <h3 className="text-sm font-bold tracking-wide">Mindset AI (PREMADE)</h3>
                </div>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed border ${m.role === 'user'
                            ? 'bg-chronex-accent/10 border-chronex-accent/20 text-chronex-accent rounded-tr-none font-medium'
                            : 'bg-white/5 border-white/10 text-gray-300 rounded-tl-none'
                            }`}>
                            <div>{m.content}</div>
                            {m.isBotDisclaimer && (
                                <div className="mt-2 pt-2 border-t border-white/5 text-[10px] font-bold text-chronex-accent uppercase tracking-tighter">
                                    {disclaimerText}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 p-3 rounded-xl rounded-tl-none text-xs text-white/50 flex items-center gap-2 border border-white/5">
                            <Bot size={12} className="animate-bounce text-chronex-accent" /> Thinking...
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
                    placeholder={isListening ? "Listening..." : "Ask a doubt..."}
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


