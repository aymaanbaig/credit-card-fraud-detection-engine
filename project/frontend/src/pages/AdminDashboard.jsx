import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminNav from '../components/AdminNav.jsx'

const CSS_VARS = `
  :root { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; --table-hover: #f8fafc; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; --table-hover: #1e2438; }
  }
  :root[data-theme="light"] { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; --table-hover: #f8fafc; }
  :root[data-theme="dark"] { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; --table-hover: #1e2438; }
  .tx-row:hover { background: var(--table-hover) !important; }
  select.filter-select { background: var(--surface); color: var(--text); border: 1px solid var(--border);
    border-radius: 6px; padding: 6px 10px; font-size: 12px; outline: none; font-family: inherit; cursor: pointer; }
  select.filter-select:focus { border-color: var(--accent); }
  input[type=range].threshold-slider { -webkit-appearance: none; width: 160px; height: 4px;
    border-radius: 999px; background: var(--border); outline: none; cursor: pointer; }
  input[type=range].threshold-slider::-webkit-slider-thumb { -webkit-appearance: none;
    width: 14px; height: 14px; border-radius: 50%; background: var(--accent); cursor: pointer; }
  input[type=range].risk-range { -webkit-appearance: none; width: 100px; height: 4px;
    border-radius: 999px; background: var(--border); outline: none; cursor: pointer; }
  input[type=range].risk-range::-webkit-slider-thumb { -webkit-appearance: none;
    width: 13px; height: 13px; border-radius: 50%; background: var(--accent); cursor: pointer; }
`

function DecisionBadge({ decision }) {
  const map = {
    fraud:     { bg: '#ef444420', color: '#ef4444', border: '#ef444440' },
    uncertain: { bg: '#f59e0b20', color: '#f59e0b', border: '#f59e0b40' },
    genuine:   { bg: '#22c55e20', color: '#22c55e', border: '#22c55e40' },
  }
  const s = map[decision] || map.uncertain
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {decision}
    </span>
  )
}

function RiskBar({ score, threshold }) {
  const pct = Math.round(score * 100)
  const color = score > 0.7 ? '#ef4444' : score > 0.3 ? '#f59e0b' : '#22c55e'
  const nearThreshold = threshold && Math.abs(pct - threshold) <= 15
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'visible', position: 'relative' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
        {/* threshold tick mark */}
        {threshold && (
          <div style={{ position: 'absolute', top: -3, left: `${threshold}%`, width: 2, height: 11, background: 'var(--text-muted)', opacity: 0.5, borderRadius: 1, transform: 'translateX(-50%)' }} />
        )}
      </div>
      <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right',
        color: nearThreshold ? color : 'var(--text-muted)', fontWeight: nearThreshold ? 700 : 400 }}>
        {pct}%
      </span>
    </div>
  )
}

// re-apply threshold to a stored transaction — decision is recalculated client-side
function applyThreshold(tx, threshold) {
  const score = tx.risk_score
  const rulesFired = tx.triggered_rules.length > 0
  const modelFlags = score >= threshold
  let decision
  if (rulesFired && modelFlags) decision = 'fraud'
  else if (rulesFired || modelFlags) decision = 'uncertain'
  else decision = 'genuine'
  return { ...tx, decision }
}

export default function AdminDashboard() {
  const navigate = useNavigate()  // still needed for auth redirect
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // filters
  const [filterDecision, setFilterDecision] = useState('all')
  const [filterRule, setFilterRule] = useState('all')
  const [minRisk, setMinRisk] = useState(0)
  const [maxRisk, setMaxRisk] = useState(100)
  const [sortBy, setSortBy] = useState('id_desc')

  // threshold slider (#9)
  const [threshold, setThreshold] = useState(50)

  useEffect(() => {
    if (!localStorage.getItem('isAdmin')) { navigate('/admin/login'); return }
    fetch('/api/admin/flagged')
      .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json() })
      .then(data => { setTransactions(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [navigate])

  // collect all unique rule names across all transactions for the rule filter dropdown
  const allRules = useMemo(() => {
    const set = new Set()
    transactions.forEach(tx => tx.triggered_rules.forEach(r => set.add(r)))
    return Array.from(set).sort()
  }, [transactions])

  // apply threshold first, then filters, then sort
  const withThreshold = useMemo(() =>
    transactions.map(tx => applyThreshold(tx, threshold / 100)),
    [transactions, threshold]
  )

  const filtered = useMemo(() => {
    return withThreshold.filter(tx => {
      if (filterDecision !== 'all' && tx.decision !== filterDecision) return false
      if (filterRule === '_none' && tx.triggered_rules.length > 0) return false
      if (filterRule !== 'all' && filterRule !== '_none' && !tx.triggered_rules.includes(filterRule)) return false
      const pct = tx.risk_score * 100
      if (pct < minRisk || pct > maxRisk) return false
      return true
    })
  }, [withThreshold, filterDecision, filterRule, minRisk, maxRisk])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'risk_desc') return b.risk_score - a.risk_score
      if (sortBy === 'risk_asc') return a.risk_score - b.risk_score
      if (sortBy === 'id_asc') return a.id - b.id
      return b.id - a.id
    })
  }, [filtered, sortBy])

  const fraudCount   = withThreshold.filter(t => t.decision === 'fraud').length
  const uncertainCount = withThreshold.filter(t => t.decision === 'uncertain').length
  const genuineCount = withThreshold.filter(t => t.decision === 'genuine').length

  const thresholdColor = threshold > 70 ? '#22c55e' : threshold > 40 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      <style>{CSS_VARS}</style>

      <AdminNav current="Dashboard" />

      <div style={{ padding: '28px 24px', maxWidth: 1300, margin: '0 auto' }}>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
          {[
            { label: 'Total reviewed', val: transactions.length, color: 'var(--accent)' },
            { label: 'Confirmed fraud', val: fraudCount, color: '#ef4444' },
            { label: 'Uncertain', val: uncertainCount, color: '#f59e0b' },
            { label: 'Genuine', val: genuineCount, color: '#22c55e' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 20px', minWidth: 130 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color, letterSpacing: '-0.02em' }}>{val}</div>
            </div>
          ))}

          {/* Threshold card — #9 */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 20px', minWidth: 220 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Model Threshold
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="range" className="threshold-slider" min={1} max={99} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))} />
              <span style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: thresholdColor, minWidth: 44 }}>
                {threshold}%
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
              Model flags at ≥{threshold}%. A tick mark on each bar shows the cutoff. Drag left to catch more fraud (higher FPR); drag right to reduce false positives.
            </div>
          </div>
        </div>

        {/* Filters — #12 */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filters</div>

          {/* Decision */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Decision</div>
            <select className="filter-select" value={filterDecision} onChange={e => setFilterDecision(e.target.value)}>
              <option value="all">All</option>
              <option value="fraud">Fraud</option>
              <option value="uncertain">Uncertain</option>
              <option value="genuine">Genuine</option>
            </select>
          </div>

          {/* Rule triggered */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Rule triggered</div>
            <select className="filter-select" value={filterRule} onChange={e => setFilterRule(e.target.value)}>
              <option value="all">Any rule</option>
              <option value="_none">No rules</option>
              {allRules.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Risk score range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Min risk: {minRisk}%</div>
            <input type="range" className="risk-range" min={0} max={100} value={minRisk}
              onChange={e => setMinRisk(Math.min(Number(e.target.value), maxRisk))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Max risk: {maxRisk}%</div>
            <input type="range" className="risk-range" min={0} max={100} value={maxRisk}
              onChange={e => setMaxRisk(Math.max(Number(e.target.value), minRisk))} />
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sort</div>
            <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="id_desc">Newest first</option>
              <option value="id_asc">Oldest first</option>
              <option value="risk_desc">Risk: high → low</option>
              <option value="risk_asc">Risk: low → high</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sorted.length} result{sorted.length !== 1 ? 's' : ''}</span>
            <button onClick={() => { setFilterDecision('all'); setFilterRule('all'); setMinRisk(0); setMaxRisk(100); setSortBy('id_desc') }}
              style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>
              Reset
            </button>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '32px 0' }}>
            <span className="spinner-border spinner-border-sm" /> Loading transactions...
          </div>
        )}
        {error && <div style={{ color: '#ef4444', background: '#ef444415', border: '1px solid #ef444430', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>{error}</div>}
        {!loading && !error && transactions.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '32px 0' }}>No transactions yet. Submit a payment from the customer screen to see results here.</div>
        )}
        {!loading && !error && transactions.length > 0 && sorted.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '32px 0' }}>No transactions match your filters.</div>
        )}

        {/* Table */}
        {!loading && !error && sorted.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Cardholder', 'Card', 'Merchant', 'Amount', 'Decision', 'Risk Score', 'Rules', 'Verdict', 'Submitted', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap', background: 'var(--tag-bg)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((tx, i) => (
                    <tr key={tx.id} className="tx-row" style={{ borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>{tx.id}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--text)' }}>{tx.user_name}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--text-muted)' }}>•••• {tx.card_last4}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{tx.merchant_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.merchant_category}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                        £{parseFloat(tx.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px' }}><DecisionBadge decision={tx.decision} /></td>
                      <td style={{ padding: '12px 14px' }}><RiskBar score={tx.risk_score} threshold={threshold} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        {tx.triggered_rules.length > 0
                          ? tx.triggered_rules.map(r => (
                            <span key={r} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r}</span>
                          ))
                          : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {tx.analyst_verdict
                          ? (() => {
                              const vc = { fraud: ['#ef444420','#ef4444','#ef444440'], genuine: ['#22c55e20','#22c55e','#22c55e40'], unsure: ['#f59e0b20','#f59e0b','#f59e0b40'] }[tx.analyst_verdict] || ['#e2e8f020','#64748b','#e2e8f040']
                              return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, background: vc[0], color: vc[1], border: `1px solid ${vc[2]}` }}>{tx.analyst_verdict}</span>
                            })()
                          : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' }}>
                        {tx.submitted_at ? tx.submitted_at.replace('T', ' ').slice(0, 16) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Link to={`/admin/transaction/${tx.id}`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
