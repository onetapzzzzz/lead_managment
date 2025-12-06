"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: string;
  phone: string;
  comment: string | null;
  region: string | null;
  niche: string | null;
  purchaseCount: number;
  isArchived: boolean;
  ownerReward: number;
  status: string;
  createdAt: string;
  owner: { username: string | null; fullName: string | null; telegramId: string | null } | null;
  purchases: Array<{
    id: string;
    price: number;
    purchaseNum: number;
    createdAt: string;
    buyer: { username: string | null; fullName: string | null; telegramId: string | null };
  }>;
}

const statusLabels: Record<string, string> = {
  uploaded: "Загружено",
  on_moderation: "На модерации",
  rejected: "Отклонено",
  in_market: "На маркете",
  archived: "В архиве",
};

const statusColors: Record<string, string> = {
  uploaded: "bg-gray-500",
  on_moderation: "bg-yellow-500",
  rejected: "bg-red-500",
  in_market: "bg-green-500",
  archived: "bg-slate-500",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Новые фильтры
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [ownerId, setOwnerId] = useState("");

  useEffect(() => {
    fetchLeads();
  }, [page, search, status, dateFrom, dateTo, ownerId]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search,
        status,
      });
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (ownerId) params.append("ownerId", ownerId);
      
      const res = await fetch(`/api/admin/leads?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status: newStatus }),
      });

      if (res.ok) {
        fetchLeads();
        setSelectedLead(null);
      }
    } catch (error) {
      console.error("Error updating lead:", error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Удалить лид? Это действие нельзя отменить.")) return;

    try {
      const res = await fetch(`/api/admin/leads?id=${leadId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchLeads();
        setSelectedLead(null);
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Лиды</h1>
      </div>

      {/* Фильтры */}
      <div className="bg-slate-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Поиск по телефону, региону, нише..."
            className="md:col-span-2 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все статусы</option>
            <option value="uploaded">Загружено</option>
            <option value="on_moderation">На модерации</option>
            <option value="in_market">На маркете</option>
            <option value="archived">В архиве</option>
            <option value="rejected">Отклонено</option>
          </select>
          <input
            type="text"
            value={ownerId}
            onChange={(e) => {
              setOwnerId(e.target.value);
              setPage(1);
            }}
            placeholder="Telegram ID владельца"
            className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Дата от</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Дата до</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            {(search || status || dateFrom || dateTo || ownerId) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setDateFrom("");
                  setDateTo("");
                  setOwnerId("");
                  setPage(1);
                }}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Сбросить все фильтры
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr className="text-left text-slate-400 text-sm">
                <th className="px-6 py-4">Телефон</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4">Покупок</th>
                <th className="px-6 py-4">Владелец</th>
                <th className="px-6 py-4">Регион / Ниша</th>
                <th className="px-6 py-4">Дата</th>
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
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Лиды не найдены
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <span className="text-white font-mono">{lead.phone}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[lead.status]}`}>
                        {statusLabels[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {lead.purchaseCount}/3
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {lead.owner?.username ? `@${lead.owner.username}` : lead.owner?.fullName || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {[lead.region, lead.niche].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(lead.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Подробнее
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

      {/* Модалка деталей */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Детали лида</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Телефон</label>
                <div className="text-white font-mono text-lg">{selectedLead.phone}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Статус</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[selectedLead.status]}`}>
                      {statusLabels[selectedLead.status]}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Покупок</label>
                  <div className="text-white">{selectedLead.purchaseCount}/3</div>
                </div>
              </div>

              {selectedLead.owner && (
                <div>
                  <label className="text-sm text-slate-400">Владелец</label>
                  <div className="text-white">
                    {selectedLead.owner.username ? `@${selectedLead.owner.username}` : selectedLead.owner.fullName}
                  </div>
                </div>
              )}

              {(selectedLead.region || selectedLead.niche) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLead.region && (
                    <div>
                      <label className="text-sm text-slate-400">Регион</label>
                      <div className="text-white">{selectedLead.region}</div>
                    </div>
                  )}
                  {selectedLead.niche && (
                    <div>
                      <label className="text-sm text-slate-400">Ниша</label>
                      <div className="text-white">{selectedLead.niche}</div>
                    </div>
                  )}
                </div>
              )}

              {selectedLead.comment && (
                <div>
                  <label className="text-sm text-slate-400">Комментарий</label>
                  <div className="text-white">{selectedLead.comment}</div>
                </div>
              )}

              {selectedLead.purchases.length > 0 && (
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">История покупок</label>
                  <div className="space-y-2">
                    {selectedLead.purchases.map((p) => (
                      <div key={p.id} className="bg-slate-700 rounded-lg p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white">
                            {p.buyer.username ? `@${p.buyer.username}` : p.buyer.fullName}
                          </span>
                          <span className="text-green-400">{p.price} п.</span>
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          {new Date(p.createdAt).toLocaleString("ru-RU")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Действия */}
              <div className="pt-4 border-t border-slate-700">
                <label className="text-sm text-slate-400 mb-2 block">Изменить статус</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleUpdateStatus(selectedLead.id, key)}
                      disabled={selectedLead.status === key}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedLead.status === key
                          ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => handleDeleteLead(selectedLead.id)}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

