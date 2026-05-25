import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../../services/apiClient';

const BannerSection = () => {
    const [banners, setBanners] = useState([]);
    const [current, setCurrent] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        apiClient.get('/banners')
            .then(res => setBanners(res.data || []))
            .catch(() => {});
    }, []);

    const total = banners.length;

    useEffect(() => {
        if (total <= 1) return;
        timerRef.current = setInterval(() => {
            setCurrent(c => (c + 1) % total);
        }, 6000);
        return () => clearInterval(timerRef.current);
    }, [total]);

    const go = (dir) => {
        clearInterval(timerRef.current);
        setCurrent(c => (c + dir + total) % total);
        if (total > 1) {
            timerRef.current = setInterval(() => {
                setCurrent(c => (c + 1) % total);
            }, 6000);
        }
    };

    if (banners.length === 0) return null;

    const banner = banners[current];

    return (
        <section className="py-12 bg-[#060e1c] border-t border-white/5">
            <div className="container mx-auto px-4 md:px-8">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ minHeight: 220 }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -60 }}
                            transition={{ duration: 0.45, ease: 'easeInOut' }}
                            className="relative w-full"
                        >
                            {/* Background image or gradient */}
                            {banner.image ? (
                                <img
                                    src={banner.image}
                                    alt={banner.title || 'Advertisement'}
                                    className="w-full object-cover rounded-2xl"
                                    style={{ maxHeight: 380, minHeight: 220 }}
                                />
                            ) : (
                                <div
                                    className="w-full rounded-2xl flex items-center justify-center"
                                    style={{
                                        minHeight: 220,
                                        background: banner.bgColor || 'linear-gradient(135deg,#1e3a5f 0%,#0f2744 100%)',
                                    }}
                                />
                            )}

                            {/* Overlay content */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center px-8 md:px-14">
                                <div className="max-w-xl space-y-3">
                                    {banner.tag && (
                                        <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/15 text-white/80 backdrop-blur-sm border border-white/20">
                                            {banner.tag}
                                        </span>
                                    )}
                                    {banner.title && (
                                        <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg">
                                            {banner.title}
                                        </h3>
                                    )}
                                    {banner.subtitle && (
                                        <p className="text-sm md:text-base text-white/80 leading-relaxed">
                                            {banner.subtitle}
                                        </p>
                                    )}
                                    {banner.ctaText && banner.ctaUrl && (
                                        <a
                                            href={banner.ctaUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                                            style={{
                                                background: banner.ctaColor || 'linear-gradient(90deg,#5f9d37,#eb761b)',
                                                color: '#fff',
                                            }}
                                        >
                                            {banner.ctaText}
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Arrows — only when multiple banners */}
                    {banners.length > 1 && (
                        <>
                            <button
                                onClick={() => go(-1)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => go(1)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>

                            {/* Dots */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {banners.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { clearInterval(timerRef.current); setCurrent(i); }}
                                        className={`rounded-full transition-all ${i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Sponsored label */}
                <p className="text-center text-[10px] text-white/25 mt-3 uppercase tracking-widest">
                    Sponsored
                </p>
            </div>
        </section>
    );
};

export default BannerSection;
