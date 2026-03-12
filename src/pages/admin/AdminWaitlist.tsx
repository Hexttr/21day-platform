import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AdminPageLayout } from '@/components/AdminPageLayout';
import { toast } from 'sonner';
import { ClipboardList, Phone, MessageCircle, RefreshCw, Copy, Calendar, Users, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface WaitlistEntry {
  id: string;
  first_name: string;
  last_name: string;
  contact: string;
  contact_type: string;
  created_at: string;
}

export default function AdminWaitlist() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadWaitlist();
  }, [isAdmin, navigate]);

  const loadWaitlist = async () => {
    setLoading(true);
    try {
      const data = await api<Array<{ id: string; firstName: string; lastName: string; contact: string; contactType: string; createdAt: string }>>('/admin/waitlist');
      setEntries(data.map(e => ({ id: e.id, first_name: e.firstName, last_name: e.lastName, contact: e.contact, contact_type: e.contactType, created_at: e.createdAt })));
    } catch (error) {
      console.error('Error loading waitlist:', error);
      toast.error('Ошибка загрузки списка ожидания');
    } finally {
      setLoading(false);
    }
  };

  const copyContact = (contact: string) => {
    navigator.clipboard.writeText(contact);
    toast.success('Контакт скопирован');
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm('Удалить эту заявку?')) {
      return;
    }

    try {
      await api(`/admin/waitlist/${id}`, { method: 'DELETE' });
      setEntries((current) => current.filter((entry) => entry.id !== id));
      toast.success('Заявка удалена');
    } catch (error) {
      console.error('Error deleting waitlist entry:', error);
      toast.error('Не удалось удалить заявку');
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'd MMM yyyy, HH:mm', { locale: ru });
  };

  return (
    <AdminPageLayout
      title="Список ожидания"
      description="Заявки на следующий поток курса"
      icon={ClipboardList}
      iconColor="accent"
      actions={
        <Button variant="outline" size="sm" onClick={loadWaitlist} disabled={loading} className="rounded-xl gap-2 h-9">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Обновить</span>
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-4 sm:p-5">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
            <Users className="text-accent" style={{ width: '18px', height: '18px' }} />
          </div>
          <p className="text-2xl font-serif font-semibold text-foreground">{entries.length}</p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Всего заявок</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-4 sm:p-5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
            <MessageCircle className="text-blue-500" style={{ width: '18px', height: '18px' }} />
          </div>
          <p className="text-2xl font-serif font-semibold text-foreground">
            {entries.filter(e => e.contact_type === 'telegram').length}
          </p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Telegram</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-4 sm:p-5">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
            <Phone className="text-green-500" style={{ width: '18px', height: '18px' }} />
          </div>
          <p className="text-2xl font-serif font-semibold text-foreground">
            {entries.filter(e => e.contact_type === 'phone').length}
          </p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Телефон</p>
        </div>
      </div>

      {/* Waitlist */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden">
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-border/50">
          <ClipboardList className="w-4.5 h-4.5 text-accent" style={{ width: '18px', height: '18px' }} />
          <h2 className="font-serif font-semibold text-foreground">Заявки</h2>
          <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full ml-auto">
            {entries.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-foreground mb-1">Пока нет заявок</p>
            <p className="text-sm text-muted-foreground">Заявки появятся, когда кто-то запишется в список ожидания</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-secondary/20 transition-colors"
              >
                {/* Number */}
                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">{index + 1}</span>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">
                    {entry.first_name} {entry.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`flex items-center gap-1.5 ${
                      entry.contact_type === 'telegram' ? 'text-blue-500' : 'text-green-500'
                    }`}>
                      {entry.contact_type === 'telegram' ? (
                        <MessageCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Phone className="w-3.5 h-3.5" />
                      )}
                      <span className="text-sm font-medium">{entry.contact}</span>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs">{formatDate(entry.created_at)}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyContact(entry.contact)}
                    className="p-2 rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors"
                    title="Скопировать контакт"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => void deleteEntry(entry.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Удалить заявку"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
