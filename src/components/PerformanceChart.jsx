import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function PerformanceChart({ newData }) {
    const [data, setData] = useState([
        { time: 'Start', score: 50 },
    ]);

    useEffect(() => {
        if (newData) {
            setData(prev => {
                const now = new Date();
                const timeStr = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
                const newEntry = { time: timeStr, score: newData.focusScore || newData.postureScore || 50 };
                const newArr = [...prev, newEntry];
                if (newArr.length > 20) newArr.shift();
                return newArr;
            });
        }
    }, [newData]);

    return (
        <div className="glass-panel p-6 h-full min-h-[300px] flex flex-col">
            <h3 className="text-chronex-text-muted text-sm font-mono tracking-widest uppercase mb-6">
                Performance Curve
            </h3>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ccff00" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ccff00" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 10 }}
                            dy={10}
                            interval="preserveStartEnd"
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#1f1f1f', color: '#fff' }}
                            itemStyle={{ color: '#ccff00' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#ccff00"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorScore)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
