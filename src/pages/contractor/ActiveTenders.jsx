import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Search, MapPin, Calendar, Clock, Filter, X, Lock, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import BackendApiService from '../../services/backendApi';
// import { useDebounce } from '../../hooks/useDebounce'; // Removed

// Simple debounce impl since I don't know if hook exists
const useDebounceValue = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const ITALIAN_PROVINCES = [
    'Agrigento', 'Alessandria', 'Ancona', 'Aosta', 'Arezzo', 'Ascoli Piceno', 'Asti', 'Avellino',
    'Bari', 'Barletta-Andria-Trani', 'Belluno', 'Benevento', 'Bergamo', 'Biella', 'Bologna',
    'Bolzano', 'Brescia', 'Brindisi', 'Cagliari', 'Caltanissetta', 'Campobasso', 'Caserta',
    'Catania', 'Catanzaro', 'Chieti', 'Como', 'Cosenza', 'Cremona', 'Crotone', 'Cuneo',
    'Enna', 'Fermo', 'Ferrara', 'Firenze', 'Foggia', 'Forlì-Cesena', 'Frosinone',
    'Genova', 'Gorizia', 'Grosseto',
    'Imperia', 'Isernia',
    'La Spezia', 'L Aquila', 'Latina', 'Lecce', 'Lecco', 'Livorno', 'Lodi', 'Lucca',
    'Macerata', 'Mantova', 'Massa-Carrara', 'Matera', 'Messina', 'Milano', 'Modena', 'Monza e Brianza',
    'Napoli', 'Novara',
    'Nuoro', 'Oristano',
    'Padova', 'Palermo', 'Parma', 'Pavia', 'Perugia', 'Pesaro e Urbino', 'Pescara', 'Piacenza',
    'Pisa', 'Pistoia', 'Pordenone', 'Potenza', 'Prato',
    'Ragusa', 'Ravenna', 'Reggio Calabria', 'Reggio Emilia', 'Rieti', 'Rimini', 'Roma', 'Rovigo',
    'Salerno', 'Sassari', 'Savona', 'Siena', 'Siracusa', 'Sondrio', 'Sud Sardegna',
    'Taranto', 'Teramo', 'Terni', 'Torino', 'Trapani', 'Trento', 'Treviso', 'Trieste',
    'Udine',
    'Varese', 'Venezia', 'Verbano-Cusio-Ossola', 'Vercelli', 'Verona', 'Vibo Valentia', 'Vicenza', 'Viterbo',
];

const formatBudgetRange = (value, t) => {
    if (value === undefined || value === null || value === '') return 'N/A';
    const str = String(value).trim();
    if (str === '0-50000') return '€0 – €50.000';
    if (str === '50000-100000') return '€50.000 – €100.000';
    if (str === '100000-250000') return '€100.000 – €250.000';
    if (str === '250000+') return `${t('contractor.tenders.moreThan')} €250.000`;

    const num = parseFloat(value);
    if (!Number.isNaN(num)) {
        if (num <= 50000) return '€0 – €50.000';
        if (num <= 100000) return '€50.000 – €100.000';
        if (num <= 250000) return '€100.000 – €250.000';
        return `${t('contractor.tenders.moreThan')} €250.000`;
    }
    return value;
};

const ActiveTenders = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    const [tenders, setTenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState(['All']); // Dynamically loaded? Or static list for now?

    const debouncedSearch = useDebounceValue(searchTerm, 500);

    const fetchTenders = useCallback(async () => {
        setLoading(true);
        try {
            const filters = {
                search: debouncedSearch,
                location: locationFilter,
                status: statusFilter
            };
            const data = await BackendApiService.getTenders(filters);
            setTenders(data);

            // Extract locations if we want dynamic list (or just keep static 'All' + common cities)
            // For now let's just keep 'All' and maybe add unique from data if we want, 
            // but server filtering implies we don't have all data.
            // Let's stick to a static list or fetch locations separately. For MVP, input text or static list.
        } catch (err) {
            console.error("Failed to load tenders", err);
            setTenders([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, locationFilter, statusFilter]);

    useEffect(() => {
        fetchTenders();
    }, [fetchTenders]);


    const handleUnlock = async (e, tender) => {
        e.preventDefault();

        try {
            await BackendApiService.unlockTender(tender.id);
            // Update local state to reflect unlock
            setTenders(prev => prev.map(t =>
                t.id === tender.id ? { ...t, isUnlocked: true } : t
            ));
            alert(t('contractor.tenders.unlockSuccess'));
            // After successful unlock, take user directly to tender details
            navigate(`/contractor/tenders/${tender.id}`);
        } catch (err) {
            console.error("Failed to unlock tender", err);
            if (err.response && err.response.status === 402) {
                alert(t('contractor.tenders.insufficientCredits'));
            } else {
                alert(t('contractor.tenders.unlockError'));
            }
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setLocationFilter('All');
        setStatusFilter('All');
    };

    const hasActiveFilters = searchTerm !== '' || locationFilter !== 'All' || statusFilter !== 'All';

    const availableLocations = ['All', ...ITALIAN_PROVINCES];

    const statuses = ['All', 'Open', 'Urgent'];

    // Helper for translating status
    const getStatusLabel = (status) => {
        if (status === 'All') return t('contractor.bids.tabs.all');
        if (status === 'Open') return t('contractor.tenders.open');
        if (status === 'Urgent') return t('contractor.tenders.urgent');
        return status;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('contractor.tenders.title')}</h2>
                    <p className="text-gray-500">{t('contractor.tenders.subtitle')}</p>
                </div>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <X className="h-4 w-4 mr-1" /> {t('contractor.tenders.clearFilters')}
                    </Button>
                )}
            </div>

            {/* Filter Bar */}
            <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t('contractor.tenders.searchPlaceholder')}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Location Filter */}
                        <div className="w-full md:w-48">
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <select
                                    className="w-full h-10 pl-9 pr-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                >
                                    {availableLocations.map(loc => (
                                        <option key={loc} value={loc}>{loc === 'All' ? t('contractor.tenders.allLocations') : loc}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Status Filter Buttons */}
                        <div className="flex bg-white rounded-md border border-gray-300 p-1">
                            {statuses.map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`flex-1 px-4 py-1.5 text-sm font-medium rounded transition-colors ${statusFilter === status
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {getStatusLabel(status)}
                                </button>
                            ))}
                        </div>

                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {tenders.map((tender) => (
                        <Card
                            key={tender.id}
                            className={`group relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-l-4 overflow-hidden
                                ${tender.isUnlocked
                                    ? 'cursor-pointer border-l-blue-500 hover:border-l-blue-600'
                                    : 'border-l-gray-300 bg-gray-50/50'
                                }
                                ${tender.status === 'Urgent' && tender.isUnlocked ? 'border-l-red-500 hover:border-l-red-600' : ''}
                            `}
                            onClick={(e) => {
                                if (tender.isUnlocked) {
                                    navigate(`/contractor/tenders/${tender.id}`);
                                }
                            }}
                        >
                            {/* Colorful background gradient on hover for unlocked */}
                            {tender.isUnlocked && (
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            )}

                            <CardContent className="p-6 relative z-10">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className={`text-xl font-bold transition-colors ${tender.isUnlocked ? 'text-gray-900 group-hover:text-blue-700' : 'text-gray-700'}`}>
                                                {tender.title}
                                            </h3>

                                            {/* Status Badges */}
                                            {tender.status === 'Urgent' && (
                                                <Badge variant="destructive" className="animate-pulse shadow-sm">
                                                    {t('contractor.tenders.urgent')}
                                                </Badge>
                                            )}
                                            {tender.status === 'Open' && (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                                                    {t('contractor.tenders.open')}
                                                </Badge>
                                            )}
                                            {!tender.isUnlocked && (
                                                <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">
                                                    <Lock className="w-3 h-3 mr-1" /> {t('contractor.tenders.locked')}
                                                </Badge>
                                            )}
                                        </div>

                                        <p className={`text-gray-600 line-clamp-2 ${!tender.isUnlocked ? 'italic text-gray-500 blur-[0.5px]' : ''}`}>
                                            {tender.description}
                                        </p>

                                        <div className="flex flex-wrap gap-4 pt-2">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-full border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <MapPin className="h-4 w-4 text-blue-500" />
                                                <span className="font-medium">{tender.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-full border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <Calendar className="h-4 w-4 text-orange-500" />
                                                <span>{t('contractor.tenders.deadline')}: <span className="font-medium">{tender.deadline?.split('T')[0]}</span></span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-900 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 group-hover:bg-green-100 transition-all">
                                                <span className="text-green-600 font-bold">€</span>
                                                <span className="font-bold">{formatBudgetRange(tender.budget, t)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="flex flex-col justify-center min-w-[140px] pl-4 md:border-l md:border-gray-100">
                                        {tender.isUnlocked ? (
                                            <div className="flex items-center justify-end text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                                                {t('contractor.tenders.viewDetails')}
                                                <Loader2 className="ml-2 h-4 w-4 opacity-0" /> {/* Hidden placeholder to keep layout stable if needed, or better arrow */}
                                                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <Button
                                                size="lg"
                                                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnlock(e, tender);
                                                }}
                                            >
                                                <Lock className="w-4 h-4 mr-2" />
                                                {t('contractor.tenders.unlockButton')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {tenders.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">{t('contractor.tenders.noTenders')}</h3>
                            <p className="text-gray-500">{t('contractor.tenders.tryAdjusting')}</p>
                            <Button variant="link" onClick={clearFilters} className="mt-2 text-blue-600">
                                {t('contractor.tenders.clearFilters')}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ActiveTenders;

