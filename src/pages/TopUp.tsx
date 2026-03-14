import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, ArrowRight, History, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { useBalance } from '@/contexts/BalanceContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSearchParams } from 'react-router-dom';

interface Transaction {
  id: string;
  amount: string;
  type: string;
  description: string | null;
  balanceAfter: string;
  createdAt: string;
}

const PRESET_AMOUNTS = [100, 300, 500, 1000, 3000, 5000];

export default function TopUp() {
  const { balance, balanceTokens, tokenRate, isLoading: balanceLoading, refreshBalance } = useBalance();
  const [amount, setAmount] = useState<number>(300);
  const [customAmount, setCustomAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get('status');
  const paymentAmount = searchParams.get('amount');

  useEffect(() => {
    refreshBalance();
    api<Transaction[]>('/balance/transactions')
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  }, []);

  useEffect(() => {
    if (paymentStatus === 'success') {
      toast.success(`Баланс пополнен на ${paymentAmount || ''} ₽`);
      refreshBalance();
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === 'failed') {
      toast.error('Оплата не прошла. Попробуйте ещё раз.');
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === 'error') {
      toast.error('Ошибка при обработке платежа');
      setSearchParams({}, { replace: true });
    }
  }, [paymentStatus]);

  const effectiveAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleTopUp = async () => {
    if (!effectiveAmount || effectiveAmount < 100) {
      toast.error('Минимальная сумма пополнения — 100 ₽');
      return;
    }
    setIsCreating(true);
    try {
      const data = await api<{ paymentUrl: string; invId: number }>('/payments/create', {
        method: 'POST',
        body: { amount: effectiveAmount },
      });
      window.location.href = data.paymentUrl;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка создания платежа');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(248deg 100% 94.56%)' }}>
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <span className="font-semibold text-foreground text-sm">Баланс</span>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Balance card */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center shadow-glow">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Текущий баланс</p>
              <p className="text-3xl font-extrabold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {balanceLoading ? '...' : `${balanceTokens} Tokens`}
              </p>
              {!balanceLoading && (
                <p className="text-xs text-muted-foreground mt-1">{balance.toFixed(2)} ₽ • {tokenRate} tokens = 1 ₽</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">Пополнить баланс</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustomAmount(''); }}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    !customAmount && amount === a
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 bg-secondary/30 text-foreground hover:border-primary/40'
                  }`}
                >
                  {a} ₽
                </button>
              ))}
            </div>

            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Своя сумма..."
                min={100}
                max={10000}
                className="flex-1 h-12 rounded-xl border border-border/50 bg-secondary/30 px-4 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
              />
              <span className="text-muted-foreground font-medium">₽</span>
            </div>

            <Button
              onClick={handleTopUp}
              disabled={isCreating || !effectiveAmount || effectiveAmount < 100}
              className="w-full h-14 rounded-xl gradient-hero hover:opacity-90 shadow-glow font-semibold text-base"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <CreditCard className="w-5 h-5 mr-2" />
              )}
              Пополнить на {effectiveAmount || 0} ₽
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-lg font-semibold text-foreground">История операций</h2>
          </div>

          {loadingTx ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Операций пока нет</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const amt = parseFloat(tx.amount);
                const isPositive = amt > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-secondary/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.description || (tx.type === 'topup' ? 'Пополнение' : tx.type === 'ai_usage' ? 'AI запрос' : tx.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-foreground'}`}>
                        {isPositive ? '+' : ''}{amt.toFixed(2)} ₽
                      </p>
                      <p className="text-xs text-muted-foreground">{parseFloat(tx.balanceAfter).toFixed(2)} ₽</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
