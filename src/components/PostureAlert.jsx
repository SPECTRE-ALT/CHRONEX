import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Power } from 'lucide-react';

export function PostureAlert({ active, message, onDismiss }) {
    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl"
                >
                    <div className="w-full max-w-2xl p-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent rounded-3xl">
                        <div className="bg-[#0f0505] border border-red-500/30 rounded-3xl p-12 text-center relative overflow-hidden">
                            {/* Scanning Line Animation */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,50,50,0.1)_50%,transparent_100%)] bg-[length:100%_200%] animate-[scan_2s_linear_infinite]" />

                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/50 text-red-500"
                            >
                                <AlertTriangle size={48} />
                            </motion.div>

                            <h2 className="text-4xl font-bold text-white mb-4 tracking-tighter">POSTURE CRITICAL</h2>
                            <p className="text-xl text-red-400 font-mono mb-12 uppercase tracking-widest">{message || "Please correct your head position immediately."}</p>

                            <button
                                onClick={onDismiss}
                                className="group relative px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold tracking-wider uppercase rounded-xl transition-all active:scale-95"
                            >
                                <span className="flex items-center gap-3">
                                    <Power size={20} />
                                    Resume Session
                                </span>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
