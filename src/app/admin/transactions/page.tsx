"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
  user: { username: string | null; fullName: string | null; telegramId: string | null };
  lead: { phone: string } | null;
}

const typeLabels: Record<string, string> = {
  deposit: "Пополнение",
  withdraw: "Вывод",
  purchase: "Покупка",
  upload_reward: "Награда за загрузку",
  sale_reward: "Награда за продажу",
  admin_adjustment: "Корректировка админом",
};

const typeColors: Record<string, string> = {
  deposit: "text-green-400",
  withdraw: "text-red-400",
  purchase: "text-red-400",
  upload_reward: "text-green-400",
  sale_reward: "text-green-400",
  admin_adjustment: "text-blue-400",
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<Record<string, { count: number; sum: number }>>({});

  useEffect(() => {
    fetchTransactions();
  }, [page, type]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        type,
      });
      const res = await fetch(`/api/admin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setTotalPages(data.pages);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Транзакции</h1>
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Object.entries(typeLabels).map(([key, label]) => (
          <div key={key} className="bg-slate-800 rounded-xl p-4">
            <div className="text-sm text-slate-400">{label}</div>
            <div className={`text-xl font-bold ${typeColors[key]}`}>
              {summary[key]?.sum?.toFixed(1) || "0"} п.
            </div>
            <div className="text-sm text-slate-500">{summary[key]?.count || 0} шт.</div>
          </div>
        ))}
      </div>

      {/* Фильтр */}
      <div className="bg-slate-800 rounded-xl p-4">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Все типы</option>
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Таблица */}
      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr className="text-left text-slate-400 text-sm">
                <th className="px-6 py-4">Дата</th>
                <th className="px-6 py-4">Пользователь</th>
                <th className="px-6 py-4">Тип</th>
                <th className="px-6 py-4">Сумма</th>
                <th className="px-6 py-4">Описание</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Транзакции не найдены
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      {new Date(tx.createdAt).toLocaleString("ru-RU")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">
                        {tx.user.username ? `@${tx.user.username}` : tx.user.fullName || tx.user.telegramId}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {typeLabels[tx.type] || tx.type}
                    </td>
                    <td className={`px-6 py-4 font-semibold ${typeColors[tx.type] || "text-white"}`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(1)} п.
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm max-w-xs truncate">
                      {tx.description || (tx.lead ? `Лид: ${tx.lead.phone}` : "—")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Страница {page} из {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

