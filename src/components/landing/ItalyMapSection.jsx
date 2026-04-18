import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Activity, Users } from 'lucide-react';
import italyMap from '@svg-maps/italy';

const [, , MAP_WIDTH, MAP_HEIGHT] = italyMap.viewBox.split(' ').map(Number);
const MAP_LOCATIONS = italyMap.locations;

const cities = [
    { name: 'Torino', x: 92, y: 128, tenders: 89, region: 'region_north' },
    { name: 'Milano', x: 165, y: 123, tenders: 142, region: 'region_north' },
    { name: 'Verona', x: 234, y: 140, tenders: 58, region: 'region_north' },
    { name: 'Venezia', x: 291, y: 135, tenders: 65, region: 'region_north' },
    { name: 'Bologna', x: 249, y: 199, tenders: 78, region: 'region_north' },
    { name: 'Genova', x: 132, y: 203, tenders: 51, region: 'region_north' },
    { name: 'Firenze', x: 228, y: 279, tenders: 92, region: 'region_center' },
    { name: 'Ancona', x: 334, y: 276, tenders: 49, region: 'region_center' },
    { name: 'Perugia', x: 274, y: 317, tenders: 44, region: 'region_center' },
    { name: 'Roma', x: 315, y: 377, tenders: 205, region: 'region_center' },
    { name: 'Napoli', x: 417, y: 448, tenders: 115, region: 'region_south' },
    { name: 'Pescara', x: 383, y: 363, tenders: 53, region: 'region_center' },
    { name: 'Sassari', x: 111, y: 430, tenders: 31, region: 'region_south' },
    { name: 'Cagliari', x: 133, y: 548, tenders: 46, region: 'region_south' },
    { name: 'Bari', x: 518, y: 437, tenders: 54, region: 'region_south' },
    { name: 'Lecce', x: 584, y: 501, tenders: 39, region: 'region_south' },
    { name: 'Reggio Calabria', x: 469, y: 633, tenders: 35, region: 'region_south' },
    { name: 'Palermo', x: 347, y: 675, tenders: 62, region: 'region_south' }
];

const ItalyMapSection = () => {
    const { t } = useTranslation();
    const [activeCity, setActiveCity] = useState(null);
    const [liveStats, setLiveStats] = useState({
        activeTenders: 1245,
        contractorsOnline: 342
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setLiveStats((prev) => ({
                activeTenders: prev.activeTenders + (Math.random() > 0.7 ? 1 : 0),
                contractorsOnline: Math.max(300, prev.contractorsOnline + Math.floor(Math.random() * 5) - 2)
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative overflow-hidden bg-[#061129] py-24 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(77,123,255,0.1),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(95,157,55,0.1),transparent_24%)]"></div>
            <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.75)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.75)_1px,transparent_1px)] [background-size:42px_42px]"></div>

            <div className="container relative z-10 mx-auto px-4 md:px-8">
                <div className="overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(135deg,#040d22_0%,#071630_55%,#040d22_100%)] p-6 shadow-[0_38px_90px_rgba(0,0,0,0.42)] md:p-10">
                    <div className="grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr]">
                        <div className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2d5eb9]/30 bg-[#0a1735]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8cb5ff]">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#60a5fa] opacity-75"></span>
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#4f8dff]"></span>
                                    </span>
                                    LIVE NETWORK
                                </div>
                                <h2 className="text-4xl font-black leading-tight text-white md:text-6xl">
                                    {t('map.title')}
                                </h2>
                                <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300/82">
                                    {t('map.subtitle')}
                                </p>
                            </motion.div>

                            <div className="grid max-w-md gap-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.15 }}
                                    className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,28,54,0.92)_0%,rgba(13,22,43,0.96)_100%)] p-6 shadow-[0_18px_35px_rgba(0,0,0,0.18)]"
                                >
                                    <div>
                                        <div className="text-sm text-slate-400">{t('map.active_tenders_live')}</div>
                                        <div className="mt-2 text-4xl font-bold text-[#6ca6ff]">
                                            {liveStats.activeTenders.toLocaleString()}
                                        </div>
                                    </div>
                                    <Activity className="h-10 w-10 text-[#467df0]" />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.25 }}
                                    className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,28,54,0.92)_0%,rgba(13,22,43,0.96)_100%)] p-6 shadow-[0_18px_35px_rgba(0,0,0,0.18)]"
                                >
                                    <div>
                                        <div className="text-sm text-slate-400">{t('map.contractors_online')}</div>
                                        <div className="mt-2 text-4xl font-bold text-[#8b8cff]">
                                            {liveStats.contractorsOnline.toLocaleString()}
                                        </div>
                                    </div>
                                    <Users className="h-10 w-10 text-[#6c63ff]" />
                                </motion.div>
                            </div>
                        </div>

                        <div className="relative flex min-h-[560px] items-center justify-center">
                            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(144,180,255,0.08),transparent_58%)] blur-3xl"></div>

                            <motion.div
                                initial={{ scale: 0.92, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.75 }}
                                className="relative aspect-[610/793] w-full max-w-[520px]"
                            >
                                <svg
                                    viewBox={italyMap.viewBox}
                                    className="pointer-events-none h-full w-full drop-shadow-[0_24px_50px_rgba(0,0,0,0.34)]"
                                    aria-hidden="true"
                                >
                                    <defs>
                                        <linearGradient id="italyFill" x1="18%" y1="10%" x2="84%" y2="92%">
                                            <stop offset="0%" stopColor="#1a2f67" stopOpacity="0.84" />
                                            <stop offset="52%" stopColor="#12234f" stopOpacity="0.9" />
                                            <stop offset="100%" stopColor="#0b1631" stopOpacity="0.94" />
                                        </linearGradient>
                                        <linearGradient id="italyStroke" x1="10%" y1="8%" x2="85%" y2="88%">
                                            <stop offset="0%" stopColor="#b9d9ff" />
                                            <stop offset="48%" stopColor="#8fbaff" />
                                            <stop offset="100%" stopColor="#6e9af2" />
                                        </linearGradient>
                                        <filter id="italyGlow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="4" result="blur" />
                                            <feColorMatrix
                                                in="blur"
                                                type="matrix"
                                                values="0 0 0 0 0.58 0 0 0 0 0.74 0 0 0 0 1 0 0 0 0.35 0"
                                            />
                                        </filter>
                                    </defs>

                                    <g filter="url(#italyGlow)" opacity="0.55">
                                        {MAP_LOCATIONS.map((location) => (
                                            <path
                                                key={`${location.id}-glow`}
                                                d={location.path}
                                                fill="none"
                                                stroke="#8bb8ff"
                                                strokeWidth="2.6"
                                                vectorEffect="non-scaling-stroke"
                                                strokeLinejoin="round"
                                                strokeLinecap="round"
                                            />
                                        ))}
                                    </g>

                                    <g>
                                        {MAP_LOCATIONS.map((location) => (
                                            <path
                                                key={location.id}
                                                d={location.path}
                                                fill="url(#italyFill)"
                                                stroke="url(#italyStroke)"
                                                strokeWidth="1.3"
                                                vectorEffect="non-scaling-stroke"
                                                strokeLinejoin="round"
                                                strokeLinecap="round"
                                            />
                                        ))}
                                    </g>
                                </svg>

                                {cities.map((city) => (
                                    <button
                                        key={city.name}
                                        type="button"
                                        className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                                        style={{
                                            left: `${(city.x / MAP_WIDTH) * 100}%`,
                                            top: `${(city.y / MAP_HEIGHT) * 100}%`
                                        }}
                                        onMouseEnter={() => setActiveCity(city)}
                                        onMouseLeave={() => setActiveCity((current) => (current?.name === city.name ? null : current))}
                                        onFocus={() => setActiveCity(city)}
                                        onBlur={() => setActiveCity((current) => (current?.name === city.name ? null : current))}
                                        onClick={() => setActiveCity((current) => (current?.name === city.name ? null : city))}
                                        aria-label={city.name}
                                    >
                                        <span className="relative flex h-7 w-7 items-center justify-center">
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-[#71a7ff] opacity-30 blur-[2px]"></span>
                                            <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-[#71a7ff] opacity-55"></span>
                                            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border border-white/50 bg-[#9dc3ff] shadow-[0_0_16px_rgba(113,167,255,0.95)]"></span>
                                        </span>

                                        {activeCity?.name === city.name && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className="absolute bottom-full left-1/2 mb-3 min-w-[150px] -translate-x-1/2 rounded-2xl border border-[#4d7bff]/25 bg-[#0c1732]/95 p-3 text-left shadow-[0_18px_35px_rgba(0,0,0,0.32)] backdrop-blur-md"
                                            >
                                                <div className="text-sm font-bold text-white">{city.name}</div>
                                                <div className="mt-1 text-xs text-slate-400">{t(`map.${city.region}`)}</div>
                                                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-[#8cb5ff]">
                                                    <Activity className="h-3.5 w-3.5" />
                                                    {city.tenders} {t('map.active_label')}
                                                </div>
                                            </motion.div>
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ItalyMapSection;
