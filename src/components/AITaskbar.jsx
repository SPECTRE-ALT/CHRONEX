import React from 'react';
import { ExternalLink } from 'lucide-react';

const AI_LINKS = [
    { name: 'Grok', url: 'https://grok.com/', color: 'hover:text-blue-400' },
    { name: 'Claude', url: 'https://claude.ai/login', color: 'hover:text-orange-400' },
    { name: 'Gemini', url: 'https://gemini.google.com/?hl=en-IN', color: 'hover:text-blue-500' },
    { name: 'ChatGPT', url: 'https://chatgpt.com/', color: 'hover:text-green-400' },
];

export function AITaskbar() {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="glass-panel px-6 py-3 flex items-center gap-6 rounded-full border border-white/10 bg-black/80 backdrop-blur-xl shadow-glass hover:shadow-glass-hover transition-all duration-300">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 mr-2 border-r border-white/10 pr-4">
                    External Agents
                </span>
                {AI_LINKS.map((link) => (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-xs font-bold text-white/70 transition-colors ${link.color} group`}
                        title={`Open ${link.name}`}
                    >
                        <span className="group-hover:translate-y-[-1px] transition-transform duration-300">{link.name}</span>
                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                    </a>
                ))}
            </div>
        </div>
    );
}
