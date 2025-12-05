"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  telegramId: string | null;
  username: string | null;
  fullName: string | null;
  role: string;
  balance: number;
  createdAt: string;
  uploadsCount: number;
  purchasesCount: number;
  transactionsCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search,
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!editingUser) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          balance: parseFloat(newBalance),
        }),
      });

      if (res.ok) {
        setEditingUser(null);
        setNewBalance("");
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Пользователи</h1>
      </div>

      {/* Поиск */}
      <div className="bg-slate-800 rounded-xl p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Поиск по имени, username или Telegram ID..."
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Таблица */}
      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr className="text-left text-slate-400 text-sm">
                <th className="px-6 py-4">Пользователь</th>
                <th className="px-6 py-4">Telegram ID</th>
                <th className="px-6 py-4">Баланс</th>
                <th className="px-6 py-4">Загрузок</th>
                <th className="px-6 py-4">Покупок</th>
                <th className="px-6 py-4">Регистрация</th>
                <th className="px-6 py-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">
                        {user.username ? `@${user.username}` : user.fullName || "—"}
                      </div>
                      {user.fullName && user.username && (
                        <div className="text-sm text-slate-400">{user.fullName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">
                      {user.telegramId || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-blue-400 font-semibold">
                        {user.balance.toFixed(1)} п.
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{user.uploadsCount}</td>
                    <td className="px-6 py-4 text-slate-300">{user.purchasesCount}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setNewBalance(user.balance.toString());
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Изменить
                      </button>
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

      {/* Модалка редактирования */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              Редактировать пользователя
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Пользователь</label>
                <div className="text-white">
                  {editingUser.username ? `@${editingUser.username}` : editingUser.fullName || editingUser.telegramId}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Баланс (поинты)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleUpdateBalance}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

