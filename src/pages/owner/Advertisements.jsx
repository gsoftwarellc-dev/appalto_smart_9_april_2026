import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/backendApi';
import { Button } from '../../components/ui/Button';
import {
    Megaphone, ImagePlus, Trash2, ChevronUp, ChevronDown,
    ToggleLeft, ToggleRight, ExternalLink, Save, RefreshCw,
    CheckCircle2, Plus, Eye, EyeOff, GripVertical
} from 'lucide-react';

const newBanner = () => ({
    id: Date.now(),
    active: true,
    image: '',
    tag: '',
    title: '',
    subtitle: '',
    ctaText: '',
    ctaUrl: '',
    ctaColor: '#eb761b',
    bgColor: '#1e3a5f',
});

const field = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition-all";
const label = "text-xs font-semibold text-gray-500 mb-1.5 block";

const BannerPreview = ({ banner, sponsoredLabel = 'Sponsored' }) => (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ minHeight: 200 }}>
        {banner.image
            ? <img src={banner.image} alt="preview" className="w-full object-cover" style={{ minHeight: 200, maxHeight: 260 }} />
            : <div className="w-full" style={{ minHeight: 200, background: banner.bgColor || '#1e3a5f' }} />
        }
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent flex items-center px-7">
            <div className="space-y-2 max-w-xs">
                {banner.tag && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/15 text-white/80 border border-white/20">
                        {banner.tag}
                    </span>
                )}
                <h3 className="text-lg font-bold text-white leading-snug drop-shadow">
                    {banner.title || <span className="opacity-30 italic">No title</span>}
                </h3>
                {banner.subtitle && <p className="text-xs text-white/75 leading-relaxed">{banner.subtitle}</p>}
                {banner.ctaText && (
                    <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-md"
                        style={{ background: banner.ctaColor || '#eb761b' }}>
                        {banner.ctaText} <ExternalLink className="h-3 w-3" />
                    </span>
                )}
            </div>
        </div>
        <div className="absolute bottom-2 right-3 text-[9px] text-white/30 uppercase tracking-widest">{sponsoredLabel}</div>
    </div>
);

const Advertisements = () => {
    const { t } = useTranslation();
    const [banners, setBanners] = useState([]);
    const [selected, setSelected] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const savedRef = useRef(null);

    useEffect(() => {
        api.getSystemConfig().then(data => {
            if (data?.homepageBanners && Array.isArray(data.homepageBanners)) {
                setBanners(data.homepageBanners);
                savedRef.current = JSON.stringify(data.homepageBanners);
                if (data.homepageBanners.length > 0) setSelected(data.homepageBanners[0].id);
            } else {
                savedRef.current = JSON.stringify([]);
            }
        }).catch(() => { savedRef.current = JSON.stringify([]); });
    }, []);

    const isDirty = savedRef.current !== null && JSON.stringify(banners) !== savedRef.current;
    const activeBanners = banners.filter(b => b.active);
    const currentBanner = banners.find(b => b.id === selected);

    const updateBanner = (id, field, value) =>
        setBanners(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));

    const deleteBanner = (id) => {
        const remaining = banners.filter(b => b.id !== id);
        setBanners(remaining);
        setSelected(remaining.length > 0 ? remaining[0].id : null);
    };

    const moveBanner = (index, dir) => setBanners(prev => {
        const next = [...prev];
        const target = index + dir;
        if (target < 0 || target >= next.length) return prev;
        [next[index], next[target]] = [next[target], next[index]];
        return next;
    });

    const handleBannerImage = (id, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const maxW = 1200;
                const scale = img.width > maxW ? maxW / img.width : 1;
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                updateBanner(id, 'image', canvas.toDataURL('image/jpeg', 0.75));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const addBanner = () => {
        const b = newBanner();
        setBanners(prev => [...prev, b]);
        setSelected(b.id);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateSystemConfig({ homepageBanners: banners });
            savedRef.current = JSON.stringify(banners);
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 2500);
        } catch {
            alert(t('owner.advertisements.saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('owner.advertisements.title')}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">{t('owner.advertisements.subtitle')}</p>
                </div>
                <button
                    onClick={addBanner}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all hover:shadow-md"
                >
                    <Plus className="h-4 w-4" /> {t('owner.advertisements.addBanner')}
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg"><Megaphone className="h-4 w-4 text-gray-500" /></div>
                    <div><p className="text-xl font-bold text-gray-800">{banners.length}</p><p className="text-[11px] text-gray-400">{t('owner.advertisements.total')}</p></div>
                </div>
                <div className="bg-white border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg"><Eye className="h-4 w-4 text-green-500" /></div>
                    <div><p className="text-xl font-bold text-green-700">{activeBanners.length}</p><p className="text-[11px] text-gray-400">{t('owner.advertisements.active')}</p></div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg"><EyeOff className="h-4 w-4 text-gray-400" /></div>
                    <div><p className="text-xl font-bold text-gray-400">{banners.length - activeBanners.length}</p><p className="text-[11px] text-gray-400">{t('owner.advertisements.hidden')}</p></div>
                </div>
            </div>

            {banners.length === 0 ? (
                /* Empty state */
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-20 flex flex-col items-center gap-4">
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <Megaphone className="h-10 w-10 text-orange-400" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-gray-700">{t('owner.advertisements.emptyTitle')}</p>
                        <p className="text-sm text-gray-400 mt-1">{t('owner.advertisements.emptyDesc')}</p>
                    </div>
                    <button onClick={addBanner}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all mt-1">
                        <Plus className="h-4 w-4" /> {t('owner.advertisements.createFirst')}
                    </button>
                </div>
            ) : (
                /* Two-column layout */
                <div className="flex gap-5 items-start">
                    {/* LEFT — banner list */}
                    <div className="w-72 shrink-0 space-y-2">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-3">{t('owner.advertisements.displayOrder')}</p>
                        {banners.map((b, i) => (
                            <div
                                key={b.id}
                                onClick={() => setSelected(b.id)}
                                className={`group relative flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    selected === b.id
                                        ? 'border-orange-400 bg-orange-50 shadow-sm'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                } ${!b.active ? 'opacity-50' : ''}`}
                            >
                                {/* Thumbnail */}
                                {b.image
                                    ? <img src={b.image} alt="" className="h-12 w-16 object-cover rounded-lg shrink-0" />
                                    : <div className="h-12 w-16 rounded-lg shrink-0" style={{ background: b.bgColor || '#1e3a5f' }} />
                                }
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                        {b.title || <span className="text-gray-400 italic font-normal">{t('owner.advertisements.untitled')}</span>}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {b.active ? t('owner.advertisements.activeLabel') : t('owner.advertisements.hiddenLabel')}
                                        </span>
                                        <span className="text-[10px] text-gray-300">#{i + 1}</span>
                                    </div>
                                </div>
                                {/* Reorder buttons — show on hover */}
                                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={e => { e.stopPropagation(); moveBanner(i, -1); }} disabled={i === 0}
                                        className="p-0.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20">
                                        <ChevronUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); moveBanner(i, 1); }} disabled={i === banners.length - 1}
                                        className="p-0.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20">
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT — editor + preview */}
                    {currentBanner && (
                        <div className="flex-1 min-w-0 space-y-4">
                            {/* Live preview */}
                            <div className="bg-gray-900 rounded-2xl p-3 shadow-lg">
                                <p className="text-[10px] text-white/30 uppercase tracking-widest text-center mb-2">{t('owner.advertisements.livePreview')}</p>
                                <BannerPreview banner={currentBanner} sponsoredLabel={t('owner.advertisements.sponsored')} />
                            </div>

                            {/* Editor card */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                {/* Card header */}
                                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-xs font-bold text-white bg-orange-500 rounded-lg px-2 py-0.5">
                                            #{banners.findIndex(b => b.id === currentBanner.id) + 1}
                                        </span>
                                        <span className="text-sm font-bold text-gray-700">
                                            {currentBanner.title || t('owner.advertisements.untitledBanner')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => updateBanner(currentBanner.id, 'active', !currentBanner.active)}
                                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                                                currentBanner.active
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}>
                                            {currentBanner.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                            {currentBanner.active ? t('owner.advertisements.activeLabel') : t('owner.advertisements.hiddenLabel')}
                                        </button>
                                        <button onClick={() => deleteBanner(currentBanner.id)}
                                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-5 grid grid-cols-2 gap-4">
                                    {/* Image + bg color */}
                                    <div className="col-span-2">
                                        <p className={label}>{t('owner.advertisements.bannerImage')}</p>
                                        <div className="flex items-center gap-4">
                                            {currentBanner.image ? (
                                                <div className="relative shrink-0">
                                                    <img src={currentBanner.image} alt="" className="h-20 w-36 object-cover rounded-xl border border-gray-200 shadow-sm" />
                                                    <button onClick={() => updateBanner(currentBanner.id, 'image', '')}
                                                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition-colors">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="h-20 w-36 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all shrink-0">
                                                    <ImagePlus className="h-6 w-6 text-gray-400" />
                                                    <span className="text-[11px] text-gray-400 mt-1">{t('owner.advertisements.uploadImage')}</span>
                                                    <span className="text-[10px] text-gray-300">JPG, PNG, WebP</span>
                                                    <input type="file" accept="image/*" className="hidden"
                                                        onChange={e => handleBannerImage(currentBanner.id, e.target.files[0])} />
                                                </label>
                                            )}
                                            {!currentBanner.image && (
                                                <div>
                                                    <p className="text-[11px] font-semibold text-gray-500 mb-2">{t('owner.advertisements.bgColor')}</p>
                                                    <div className="flex items-center gap-3">
                                                        <input type="color"
                                                            value={currentBanner.bgColor?.startsWith('#') ? currentBanner.bgColor : '#1e3a5f'}
                                                            onChange={e => updateBanner(currentBanner.id, 'bgColor', e.target.value)}
                                                            className="h-10 w-16 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                                                        <div className="h-10 w-20 rounded-lg border border-gray-200 shadow-inner"
                                                            style={{ background: currentBanner.bgColor || '#1e3a5f' }} />
                                                        <p className="text-[10px] text-gray-400">{t('owner.advertisements.bgColorHint')}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tag */}
                                    <div>
                                        <label className={label}>{t('owner.advertisements.tag')} <span className="font-normal text-gray-300">{t('owner.advertisements.tagOptional')}</span></label>
                                        <input className={field} type="text" value={currentBanner.tag ?? ''}
                                            onChange={e => updateBanner(currentBanner.id, 'tag', e.target.value)}
                                            placeholder={t('owner.advertisements.tagPlaceholder')} />
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className={label}>{t('owner.advertisements.titleField')}</label>
                                        <input className={field} type="text" value={currentBanner.title ?? ''}
                                            onChange={e => updateBanner(currentBanner.id, 'title', e.target.value)}
                                            placeholder={t('owner.advertisements.titlePlaceholder')} />
                                    </div>

                                    {/* Subtitle */}
                                    <div className="col-span-2">
                                        <label className={label}>{t('owner.advertisements.subtitle')} <span className="font-normal text-gray-300">{t('owner.advertisements.tagOptional')}</span></label>
                                        <input className={field} type="text" value={currentBanner.subtitle ?? ''}
                                            onChange={e => updateBanner(currentBanner.id, 'subtitle', e.target.value)}
                                            placeholder={t('owner.advertisements.subtitlePlaceholder')} />
                                    </div>

                                    {/* CTA text */}
                                    <div>
                                        <label className={label}>{t('owner.advertisements.buttonText')} <span className="font-normal text-gray-300">{t('owner.advertisements.tagOptional')}</span></label>
                                        <input className={field} type="text" value={currentBanner.ctaText ?? ''}
                                            onChange={e => updateBanner(currentBanner.id, 'ctaText', e.target.value)}
                                            placeholder={t('owner.advertisements.buttonTextPlaceholder')} />
                                    </div>

                                    {/* CTA URL */}
                                    <div>
                                        <label className={label}>{t('owner.advertisements.buttonLink')}</label>
                                        <input className={field} type="url" value={currentBanner.ctaUrl ?? ''}
                                            onChange={e => updateBanner(currentBanner.id, 'ctaUrl', e.target.value)}
                                            placeholder="https://example.com" />
                                    </div>

                                    {/* CTA color */}
                                    <div className="col-span-2 flex items-end gap-4">
                                        <div>
                                            <label className={label}>{t('owner.advertisements.buttonColor')}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={currentBanner.ctaColor || '#eb761b'}
                                                    onChange={e => updateBanner(currentBanner.id, 'ctaColor', e.target.value)}
                                                    className="h-10 w-16 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                                                <span className="text-xs font-mono text-gray-400">{currentBanner.ctaColor}</span>
                                            </div>
                                        </div>
                                        {currentBanner.ctaText && (
                                            <div>
                                                <label className={label}>{t('owner.advertisements.preview')}</label>
                                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white shadow-md"
                                                    style={{ background: currentBanner.ctaColor || '#eb761b' }}>
                                                    {currentBanner.ctaText} <ExternalLink className="h-3 w-3" />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Floating save bar */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${isDirty || showSaved ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
                <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-6 py-3">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        {showSaved ? (
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-sm font-medium text-green-700">{t('owner.advertisements.savedSuccess')}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                                    <span className="text-sm font-medium text-gray-600">{t('owner.advertisements.unsavedChanges')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => { if (savedRef.current) { const b = JSON.parse(savedRef.current); setBanners(b); setSelected(b[0]?.id ?? null); }}}
                                        className="text-sm text-gray-400 hover:text-gray-700 font-medium transition-colors">
                                        {t('owner.advertisements.discard')}
                                    </button>
                                    <button onClick={handleSave} disabled={isSaving}
                                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all">
                                        {isSaving ? <><RefreshCw className="h-4 w-4 animate-spin" /> {t('owner.advertisements.saving')}</> : <><Save className="h-4 w-4" /> {t('owner.advertisements.saveBanners')}</>}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Advertisements;
