/**
 * Cost Tracking Dashboard Modal
 * Admin-only view showing all LLM/API costs, provider breakdown,
 * profitability analysis, and per-session line items.
 * Accessible from Header toolbar and Emilia help categories.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllCosts,
  buildCostSummary,
  buildSessionRows,
  exportCostsCSV,
  deleteAllCosts,
} from '../../lib/costTracking';
import type { CostEntry, CostSummary, SessionCostRow } from '../../types';
import './CostTrackingModal.css';

interface CostTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CostTrackingModal({ isOpen, onClose }: CostTrackingModalProps) {
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [sessionRows, setSessionRows] = useState<SessionCostRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const costEntries = await fetchAllCosts();
      setEntries(costEntries);
      setSummary(buildCostSummary(costEntries));
      setSessionRows(buildSessionRows(costEntries));
      setSavedAt(new Date().toLocaleString());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleExport = () => {
    const csv = exportCostsCSV(entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clues-costs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL cost tracking data? This cannot be undone.')) return;
    await deleteAllCosts();
    await loadData();
  };

  const handleSaveToDb = async () => {
    // Data is already persisted on each logCost call.
    // This button refreshes from Supabase to confirm sync.
    await loadData();
    setSavedAt(new Date().toLocaleString());
  };

  if (!isOpen) return null;

  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="cost-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Cost Tracking Dashboard">
      <div className="cost-modal glass-heavy" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cost-modal__header">
          <div>
            <h2 className="cost-modal__title">Cost Tracking Dashboard</h2>
            {savedAt && (
              <span className="cost-modal__saved">
                Saved to database &bull; {savedAt}
              </span>
            )}
          </div>
          <button className="cost-modal__close" onClick={onClose} aria-label="Close cost tracking">
            &times;
          </button>
        </div>

        {isLoading ? (
          <div className="cost-modal__loading">Loading cost data...</div>
        ) : summary ? (
          <div className="cost-modal__body">
            {/* ─── Cost Summary Cards ─── */}
            <section className="cost-section">
              <h3 className="cost-section__title">Cost Summary</h3>
              <div className="cost-summary-grid">
                <div className="cost-card">
                  <span className="cost-card__label">Grand Total</span>
                  <span className="cost-card__value cost-card__value--primary">{fmt(summary.grand_total)}</span>
                </div>
                <div className="cost-card">
                  <span className="cost-card__label">Total Sessions</span>
                  <span className="cost-card__value">{summary.total_sessions}</span>
                </div>
                <div className="cost-card">
                  <span className="cost-card__label">Total API Calls</span>
                  <span className="cost-card__value">{summary.total_calls}</span>
                </div>
                <div className="cost-card">
                  <span className="cost-card__label">Avg Cost / Session</span>
                  <span className="cost-card__value">{fmt(summary.avg_cost_per_session)}</span>
                </div>
              </div>
            </section>

            {/* ─── Cost by Provider ─── */}
            <section className="cost-section">
              <h3 className="cost-section__title">Cost by Provider</h3>
              <div className="cost-provider-list">
                {summary.by_provider.map(p => (
                  <div key={p.label} className="cost-provider-row">
                    <span className="cost-provider-row__icon">{p.icon}</span>
                    <span className="cost-provider-row__label">{p.label}</span>
                    <span className="cost-provider-row__cost">{fmt(p.total_cost)}</span>
                    <span className="cost-provider-row__pct">{fmtPct(p.percentage)}</span>
                    <div className="cost-provider-row__bar">
                      <div
                        className="cost-provider-row__bar-fill"
                        style={{ width: `${Math.min(p.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── Cost by Tier ─── */}
            <section className="cost-section">
              <h3 className="cost-section__title">Cost by Completion Tier</h3>
              <div className="cost-tier-grid">
                {(Object.entries(summary.by_tier) as [string, number][]).map(([tier, cost]) => (
                  <div key={tier} className="cost-tier-row">
                    <span className="cost-tier-row__label">{tier}</span>
                    <span className="cost-tier-row__cost">{fmt(cost)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── Profitability Analysis ─── */}
            <section className="cost-section">
              <h3 className="cost-section__title">Profitability Analysis</h3>
              <div className="cost-profit-grid">
                <div className="cost-profit-row">
                  <span>Avg Cost per Session:</span>
                  <span className="cost-profit-row__value">{fmt(summary.profitability.avg_cost_per_session)}</span>
                </div>
                <div className="cost-profit-row">
                  <span>Break-even price (20% margin):</span>
                  <span className="cost-profit-row__value">{fmt(summary.profitability.breakeven_20_margin)}</span>
                </div>
                <div className="cost-profit-row">
                  <span>Suggested price (50% margin):</span>
                  <span className="cost-profit-row__value cost-profit-row__value--accent">{fmt(summary.profitability.suggested_50_margin)}</span>
                </div>
                <div className="cost-profit-row">
                  <span>Suggested price (100% margin):</span>
                  <span className="cost-profit-row__value cost-profit-row__value--gold">{fmt(summary.profitability.suggested_100_margin)}</span>
                </div>
              </div>
            </section>

            {/* ─── Recent Sessions Table ─── */}
            <section className="cost-section">
              <div className="cost-section__header-row">
                <h3 className="cost-section__title">
                  Recent Sessions ({sessionRows.length})
                </h3>
                <button
                  className="cost-btn cost-btn--sm"
                  onClick={() => setShowPricing(!showPricing)}
                >
                  {showPricing ? 'Hide Pricing' : 'Show Pricing'}
                </button>
              </div>

              {sessionRows.length > 0 ? (
                <div className="cost-table-wrap">
                  <table className="cost-table">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Tier</th>
                        <th>Calls</th>
                        <th>Date</th>
                        <th>Cost</th>
                        {showPricing && <th>Margin 50%</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {sessionRows.map(row => (
                        <tr key={row.session_id}>
                          <td className="cost-table__session-id" title={row.session_id}>
                            {row.session_id.slice(0, 8)}...
                          </td>
                          <td>
                            <span className={`cost-tier-badge cost-tier-badge--${row.tier}`}>
                              {row.tier}
                            </span>
                          </td>
                          <td>{row.call_count}</td>
                          <td>{new Date(row.created_at).toLocaleDateString()}</td>
                          <td className="cost-table__cost">{fmt(row.total_cost)}</td>
                          {showPricing && (
                            <td className="cost-table__cost cost-table__cost--accent">
                              {fmt(row.total_cost * 1.5)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="cost-empty">No sessions recorded yet.</p>
              )}
            </section>

            {/* ─── Action Buttons ─── */}
            <div className="cost-actions">
              <button className="cost-btn" onClick={handleSaveToDb}>
                Save to Database
              </button>
              <button className="cost-btn" onClick={handleExport}>
                Export CSV
              </button>
              <button className="cost-btn cost-btn--danger" onClick={handleDeleteAll}>
                Delete All
              </button>
            </div>
          </div>
        ) : (
          <div className="cost-modal__empty">
            <p>No cost data available yet.</p>
            <p className="cost-modal__empty-hint">
              Costs are recorded automatically when LLM calls are made through the evaluation pipeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
