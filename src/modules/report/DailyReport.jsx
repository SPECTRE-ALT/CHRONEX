import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DailyReport() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('chronex_daily_log') || '[]');
        // Transform timestamps to readable time
        const formattedData = data.map(item => ({
            ...item,
            time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })).slice(-20); // Show last 20
        setHistory(formattedData);
    }, []);

    const averageScore = history.reduce((acc, curr) => acc + (curr.score || 0), 0) / (history.length || 1);
    const badPostureCount = history.filter(h => h.status === 'Bad').length;
    const commonIssue = history.length > 0 ?
        history.map(h => h.issue).sort((a, b) =>
            history.filter(v => v.issue === a).length - history.filter(v => v.issue === b).length
        ).pop() : "None";

    return (
        <div className="glass-panel h-full flex flex-col p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
                <FileText className="text-chronex-accent" size={24} />
                <h2 className="text-2xl font-bold tracking-tight">Daily Biometric Report</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Avg Score</div>
                    <div className="text-3xl font-bold text-white font-mono">{Math.round(averageScore)}%</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Bad Posture Events</div>
                    <div className="text-3xl font-bold text-chronex-alert font-mono">{badPostureCount}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Common Issue</div>
                    <div className="text-xl font-bold text-chronex-accent flex items-center gap-2">
                        {commonIssue}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[200px] w-full bg-black/20 rounded-xl border border-white/5 p-4 relative">
                <h3 className="text-sm font-bold text-white/50 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} /> Session Timeline
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ccff00" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ccff00" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="time" stroke="#666" fontSize={10} />
                        <YAxis stroke="#666" fontSize={10} domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                            itemStyle={{ color: '#ccff00' }}
                        />
                        <Area type="monotone" dataKey="score" stroke="#ccff00" fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 text-center">
                <button
                    onClick={() => {
                        localStorage.removeItem('chronex_daily_log');
                        setHistory([]);
                    }}
                    className="text-xs text-red-500 hover:text-red-400 underline"
                >
                    Clear Report History
                </button>
            </div>
        </div>
    );
}
