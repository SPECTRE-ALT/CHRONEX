import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, AlertCircle, Clock, Droplet, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DailyReport() {
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        sessionMinutes: 0,
        goodPercent: 0,
        warningPercent: 0,
        badPercent: 0,
        waterCount: 0,
        avgScore: 0
    });

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('chronex_daily_log') || '[]');
        
        const postureLogs = data.filter(d => d.type !== 'water');
        const waterLogs = data.filter(d => d.type === 'water');
        
        let good = 0, warning = 0, bad = 0;
        let totalScore = 0;

        postureLogs.forEach(log => {
            totalScore += log.score;
            if (log.status === 'Good') good++;
            else if (log.status === 'Warning') warning++;
            else bad++;
        });

        const totalPostureLogs = postureLogs.length || 1;
        
        setStats({
            sessionMinutes: Math.round((totalPostureLogs * 15) / 60), // each log is ~15s
            goodPercent: Math.round((good / totalPostureLogs) * 100),
            warningPercent: Math.round((warning / totalPostureLogs) * 100),
            badPercent: Math.round((bad / totalPostureLogs) * 100),
            waterCount: waterLogs.length,
            avgScore: Math.round(totalScore / totalPostureLogs)
        });

        const formattedData = postureLogs.map(item => ({
            ...item,
            time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })).slice(-20);
        
        setHistory(formattedData);
    }, []);

    return (
        <div className="glass-panel h-full flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FileText className="text-chronex-accent" size={24} />
                    <h2 className="text-2xl font-bold tracking-tight">Session Report</h2>
                </div>
                <div className="flex items-center gap-2 text-chronex-accent bg-white/5 px-3 py-1 rounded-full border border-chronex-accent/30">
                    <Clock size={14} />
                    <span className="font-mono text-sm">{stats.sessionMinutes} MIN</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle size={12}/> Optimal Time</div>
                    <div className="text-2xl font-bold text-green-400 font-mono">{stats.goodPercent}%</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><AlertCircle size={12}/> Warning Time</div>
                    <div className="text-2xl font-bold text-yellow-400 font-mono">{stats.warningPercent}%</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><AlertCircle size={12}/> Critical Time</div>
                    <div className="text-2xl font-bold text-red-400 font-mono">{stats.badPercent}%</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Droplet size={12}/> Hydration</div>
                    <div className="text-2xl font-bold text-blue-400 font-mono">{stats.waterCount} Logs</div>
                </div>
            </div>

            <div className="flex-1 min-h-[200px] w-full bg-black/20 rounded-xl border border-white/5 p-4 relative">
                <h3 className="text-sm font-bold text-white/50 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} /> Posture Score Timeline (Avg {stats.avgScore}%)
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
                        setStats({ sessionMinutes: 0, goodPercent: 0, warningPercent: 0, badPercent: 0, waterCount: 0, avgScore: 0 });
                    }}
                    className="text-xs text-red-500 hover:text-red-400 underline transition-colors"
                >
                    Clear Session History
                </button>
            </div>
        </div>
    );
}
