import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Bell, FileCheck, MessageSquare, Award, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '../components/ui/Button';

const Notifications = () => {
    const { t } = useTranslation();
    const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();

    useEffect(() => {
        refresh();
    }, [refresh]);

    const getIcon = (type) => {
        switch (type) {
            case 'bid_received': return FileCheck;
            case 'tender_published': return FileText;
            case 'message': return MessageSquare;
            case 'tender_awarded': return Award;
            case 'deadline_approaching': return AlertCircle;
            default: return Bell;
        }
    };

    const getColors = (type) => {
        switch (type) {
            case 'bid_received': return { text: 'text-blue-600', bg: 'bg-blue-50' };
            case 'tender_published': return { text: 'text-green-600', bg: 'bg-green-50' };
            case 'tender_awarded': return { text: 'text-orange-600', bg: 'bg-orange-50' };
            case 'deadline_approaching': return { text: 'text-red-600', bg: 'bg-red-50' };
            default: return { text: 'text-gray-600', bg: 'bg-gray-50' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('notifications.title')}</h2>
                    <p className="text-gray-500">
                        {unreadCount > 0 ? t('notifications.unreadCount', { count: unreadCount }) : t('notifications.allCaughtUp')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <>
                            <Button variant="outline" size="sm" onClick={markAllAsRead}>
                                <CheckCircle className="h-4 w-4 mr-1" /> {t('notifications.markAllRead')}
                            </Button>
                            <Badge variant="default" className="bg-blue-600">
                                <Bell className="h-3 w-3 mr-1" /> {unreadCount} {t('notifications.new')}
                            </Badge>
                        </>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {notifications.map((notification) => {
                    const data = notification.data || {};
                    const type = data.type || 'system';
                    const Icon = getIcon(type);
                    const colors = getColors(type);
                    const isRead = !!notification.read_at;

                    return (
                        <Card
                            key={notification.id}
                            className={`hover:shadow-md transition-all cursor-pointer ${!isRead ? 'border-l-4 border-l-blue-600' : ''}`}
                            onClick={() => !isRead && markAsRead(notification.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className={`h-12 w-12 ${colors.bg} rounded-lg flex items-center justify-center shrink-0`}>
                                        <Icon className={`h-6 w-6 ${colors.text}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className={`font-semibold text-gray-900 ${!isRead ? 'font-bold' : ''}`}>
                                                {data.title || t('notifications.newNotification')}
                                            </h3>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${!isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {data.message || ''}
                                        </p>
                                    </div>
                                    {!isRead && (
                                        <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-2" title="Unread"></div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {notifications.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">{t('notifications.emptyTitle')}</h3>
                    <p className="text-gray-500">{t('notifications.emptyDesc')}</p>
                </div>
            )}
        </div>
    );
};

export default Notifications;
