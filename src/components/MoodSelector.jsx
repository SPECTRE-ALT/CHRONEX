import React, { useState } from 'react';
import { Smile, Frown, Meh, Activity } from 'lucide-react';

const moods = [
    { id: 'great', icon: Smile, label: 'Great', color: 'text-green-400' },
    { id: 'neutral', icon: Meh, label: 'Okay', color: 'text-yellow-400' },
    { id: 'stressed', icon: Frown, label: 'Stressed', color: 'text-red-400' },
    { id: 'focus', icon: Activity, label: 'Locked In', color: 'text-chronex-accent' },
];

export function MoodSelector({ onChange }) {
    const [selected, setSelected] = useState('neutral');

    const handleSelect = (id) => {
        setSelected(id);
        if (onChange) onChange(id);
    };

    return (
        <div className="glass-panel p-4 flex flex-col gap-3">
            <h3 className="text-gray-400 text-xs uppercase tracking-widest">Current Mood</h3>
            <div className="flex justify-between gap-2">
                {moods.map((m) => {
                    const Icon = m.icon;
                    const isSelected = selected === m.id;
                    return (
                        <button
                            key={m.id}
                            onClick={() => handleSelect(m.id)}
                            className={`flex-1 p-2 rounded-lg flex flex-col items-center gap-1 transition-all duration-300 ${isSelected
                                ? 'bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)] scale-105'
                                : 'hover:bg-white/5 opacity-50 hover:opacity-100'
                                }`}
                        >
                            <Icon size={20} className={isSelected ? m.color : 'text-gray-400'} />
                            <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                {m.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
