"use client";

import { useEffect, useState } from "react";

interface Stats {
  overview: {
    totalUsers: number;
    totalLeads: number;
    totalTransactions: number;
    leadsInMarket: number;
    archivedLeads: number;
    totalPurchases: number;
    totalBalance: number;
  };
  today: {
    newUsers: number;
    newLeads: number;
    purchases: number;
    transactions: number;
  };
  week: {
    newUsers: number;
    newLeads: number;
    purchases: number;
  };
  leadsByStatus: Record<string, number>;
  topUploaders: Array<{
    id: string;
    username: string | null;
    fullName: string | null;
    telegramId: string | null;
    balance: number;
    uploadsCount: number;
  }>;
  topBuyers: Array<{
    id: string;
    username: string | null;
    fullName: string | null;
    telegramId: string | null;
    balance: number;
    purchasesCount: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
    user: { username: string | null; fullName: string | null; telegramId: string | null };
  }>;
}

const statusLabels: Record<string, string> = {
  uploaded: "Загружено",
  on_moderation: "На модерации",
  rejected: "Отклонено",
  in_market: "На маркете",
  archived: "В архиве",
};

const typeLabels: Record<string, string> = {
  deposit: "Пополнение",
  withdraw: "Вывод",
  purchase: "Покупка",
  upload_reward: "Награда за загрузку",
  sale_reward: "Награда за продажу",
  admin_adjustment: "Корректировка",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError("Ошибка загрузки статистики");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center text-red-400 p-8">
        {error || "Нет данных"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Дашборд</h1>

      {/* Основные метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Пользователей"
          value={stats.overview.totalUsers}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Всего лидов"
          value={stats.overview.totalLeads}
          icon="📝"
          color="green"
        />
        <StatCard
          title="На маркете"
          value={stats.overview.leadsInMarket}
          icon="🛒"
          color="purple"
        />
        <StatCard
          title="Покупок"
          value={stats.overview.totalPurchases}
          icon="💰"
          color="yellow"
        />
      </div>

      {/* Статистика за сегодня */}
      <div className="bg-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">📅 Сегодня</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStat label="Новых пользователей" value={stats.today.newUsers} />
          <MiniStat label="Новых лидов" value={stats.today.newLeads} />
          <MiniStat label="Покупок" value={stats.today.purchases} />
          <MiniStat label="Транзакций" value={stats.today.transactions} />
        </div>
      </div>

      {/* Статистика за неделю */}
      <div className="bg-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">📆 За неделю</h2>
        <div className="grid grid-cols-3 gap-4">
          <MiniStat label="Новых пользователей" value={stats.week.newUsers} />
          <MiniStat label="Новых лидов" value={stats.week.newLeads} />
          <MiniStat label="Покупок" value={stats.week.purchases} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Статус лидов */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📊 Статусы лидов</h2>
          <div className="space-y-3">
            {Object.entries(stats.leadsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-slate-400">{statusLabels[status] || status}</span>
                <span className="text-white font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Общий баланс */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">💎 Экономика</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Общий баланс пользователей</span>
              <span className="text-white font-semibold">{stats.overview.totalBalance.toFixed(1)} п.</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Всего транзакций</span>
              <span className="text-white font-semibold">{stats.overview.totalTransactions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Архивных лидов</span>
              <span className="text-white font-semibold">{stats.overview.archivedLeads}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Топ загрузчиков */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🏆 Топ загрузчиков</h2>
          <div className="space-y-3">
            {stats.topUploaders.map((user, i) => (
              <div key={user.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-sm text-white font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">
                    {user.username || user.fullName || `ID: ${user.telegramId}`}
                  </div>
                  <div className="text-sm text-slate-400">
                    {user.uploadsCount} лидов
                  </div>
                </div>
                <span className="text-blue-400 font-semibold">{user.balance.toFixed(1)} п.</span>
              </div>
            ))}
            {stats.topUploaders.length === 0 && (
              <p className="text-slate-400 text-center py-4">Нет данных</p>
            )}
          </div>
        </div>

        {/* Топ покупателей */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🛒 Топ покупателей</h2>
          <div className="space-y-3">
            {stats.topBuyers.map((user, i) => (
              <div key={user.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-sm text-white font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">
                    {user.username || user.fullName || `ID: ${user.telegramId}`}
                  </div>
                  <div className="text-sm text-slate-400">
                    {user.purchasesCount} покупок
                  </div>
                </div>
                <span className="text-green-400 font-semibold">{user.balance.toFixed(1)} п.</span>
              </div>
            ))}
            {stats.topBuyers.length === 0 && (
              <p className="text-slate-400 text-center py-4">Нет данных</p>
            )}
          </div>
        </div>
      </div>

      {/* Последние транзакции */}
      <div className="bg-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">🕐 Последние транзакции</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-400 text-sm">
                <th className="pb-3">Пользователь</th>
                <th className="pb-3">Тип</th>
                <th className="pb-3">Сумма</th>
                <th className="pb-3">Дата</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {stats.recentTransactions.map((tx) => (
                <tr key={tx.id} className="border-t border-slate-700">
                  <td className="py-3 text-white">
                    {tx.user.username || tx.user.fullName || tx.user.telegramId}
                  </td>
                  <td className="py-3 text-slate-400">
                    {typeLabels[tx.type] || tx.type}
                  </td>
                  <td className={`py-3 font-semibold ${tx.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(1)} п.
                  </td>
                  <td className="py-3 text-slate-400">
                    {new Date(tx.createdAt).toLocaleString("ru-RU")}
                  </td>
                </tr>
              ))}
              {stats.recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Нет транзакций
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "purple" | "yellow";
}) {
  const colors = {
    blue: "bg-blue-600/20 text-blue-400",
    green: "bg-green-600/20 text-green-400",
    purple: "bg-purple-600/20 text-purple-400",
    yellow: "bg-yellow-600/20 text-yellow-400",
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400">{title}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

