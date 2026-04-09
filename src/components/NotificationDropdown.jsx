import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notificationsPath = user?.role === 'admin' ? '/admin/notifications' : '/contractor/notifications';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAll = async () => {
        await markAllAsRead();
    };

    const handleMarkItem = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        await markAsRead(id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-blue-600 relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform transition-all">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900">{t('notifications.title')}</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {t('notifications.markAllRead')}
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors group relative ${!n.read_at ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`h-2 w-2 mt-2 rounded-full shrink-0 ${!n.read_at ? 'bg-blue-600' : 'bg-transparent'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm text-gray-800 leading-snug ${!n.read_at ? 'font-semibold' : ''}`}>
                                                    {(n.data && (n.data.message || n.data.title)) || t('notifications.newNotification')}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                </div>
                                            </div>
                                            {!n.read_at && (
                                                <button
                                                    onClick={(e) => handleMarkItem(e, n.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-all"
                                                    title={t('notifications.markAsRead')}
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">{t('notifications.emptyDropdown')}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-50 text-center bg-gray-50/30">
                        <Link
                            to={notificationsPath}
                            className="text-xs text-gray-600 hover:text-blue-600 font-medium inline-flex items-center gap-1"
                            onClick={() => setIsOpen(false)}
                        >
                            {t('notifications.viewAll')} <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
