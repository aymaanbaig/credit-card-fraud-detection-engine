import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AdminNav from '../components/AdminNav.jsx'

const CSS_VARS = `
  :root { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; }
  }
  :root[data-theme="light"] { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; }
  :root[data-theme="dark"] { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; }
`

const VERDICT_COLORS = {
  fraud:   { bg: '#ef444415', color: '#ef4444', border: '#ef444430' },
  genuine: { bg: '#22c55e15', color: '#22c55e', border: '#22c55e30' },
  unsure:  { bg: '#f59e0b15', color: '#f59e0b', border: '#f59e0b30' },
}

const DECISION_COLORS = {
  fraud:     { bg: '#ef444415', color: '#ef4444', border: '#ef444430' },
  uncertain: { bg: '#f59e0b15', color: '#f59e0b', border: '#f59e0b30' },
  genuine:   { bg: '#22c55e15', color: '#22c55e', border: '#22c55e30' },
}

function Badge({ label, colorMap }) {
  const s = colorMap[label] || { bg: '#e2e8f015', color: '#64748b', border: '#e2e8f030' }
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {label}
    </span>
  )
}

export default function History() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('isAdmin')) { navigate('/admin/login'); return }
    fetch('/api/admin/history')
      .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json() })
      .then(data => { setHistory(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [navigate])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      <style>{CSS_VARS}</style>
      <AdminNav current="History" />

      <div style={{ padding: '28px 24px', maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>Explanation History</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Transactions with an analyst verdict. Click any row to see the SHAP explanation.
          </p>
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '40px 0' }}>
            <span className="spinner-border spinner-border-sm" /> Loading...
          </div>
        )}
        {error && (
          <div style={{ color: '#ef4444', background: '#ef444415', border: '1px solid #ef444430', borderRadius: 6, padding: '10px 14px', fontSize: 13 }}>{error}</div>
        )}

        {!loading && !error && history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            No verdicts recorded yet.<br />
            Open a transaction from the <Link to="/admin/dashboard" style={{ color: 'var(--accent)' }}>Dashboard</Link> and submit an analyst verdict.
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(tx => {
              const isOpen = expanded === tx.id
              const riskPct = Math.round((tx.risk_score || 0) * 100)
              const riskColor = tx.risk_score > 0.7 ? '#ef4444' : tx.risk_score > 0.3 ? '#f59e0b' : '#22c55e'
              const shapLines = (tx.shap_explanation || []).filter(l => l && l.trim())

              return (
                <div key={tx.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>

                  {/* Card header — always visible */}
                  <div onClick={() => setExpanded(isOpen ? null : tx.id)}
                    style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 80px 110px 110px 36px',
                      alignItems: 'center', gap: 16, padding: '14px 20px', cursor: 'pointer' }}>

                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>#{tx.id}</span>

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{tx.user_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>•••• {tx.card_last4}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text)' }}>{tx.merchant_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.merchant_category}</div>
                    </div>

                    <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                      {tx.amount ? `£${parseFloat(tx.amount).toFixed(2)}` : '—'}
                    </span>

                    <Badge label={tx.decision} colorMap={DECISION_COLORS} />
                    <Badge label={tx.analyst_verdict} colorMap={VERDICT_COLORS} />

                    <span style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '20px 20px 20px 20px', background: 'var(--tag-bg)' }}>

                      {/* Top row — risk + rules + date + link */}
                      <div style={{ display: 'flex', gap: 24, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Risk score</div>
                          <span style={{ fontSize: 18, fontWeight: 700, color: riskColor, fontVariantNumeric: 'tabular-nums' }}>{riskPct}%</span>
                        </div>
                        {tx.triggered_rules && tx.triggered_rules.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Rules triggered</div>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {tx.triggered_rules.map(r => (
                                <span key={r} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', textTransform: 'uppercase' }}>{r}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                          {tx.created_at && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'ui-monospace,monospace' }}>{tx.created_at.slice(0, 10)}</span>
                          )}
                          <Link to={`/admin/transaction/${tx.id}`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                            Full detail →
                          </Link>
                        </div>
                      </div>

                      {/* Analyst note */}
                      {tx.analyst_note && (
                        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginRight: 8 }}>Analyst note</span>
                          {tx.analyst_note}
                        </div>
                      )}

                      {/* SHAP explanation */}
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>SHAP Explanation</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {shapLines.map((line, i) => (
                          <div key={i} style={{ fontSize: 12, color: i === 0 ? 'var(--text-muted)' : 'var(--text)', lineHeight: 1.65,
                            paddingLeft: i === 0 ? 0 : 12, borderLeft: i === 0 ? 'none' : '2px solid var(--border)',
                            fontStyle: i === 0 ? 'italic' : 'normal' }}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            {history.length} verdict{history.length !== 1 ? 's' : ''} recorded
          </div>
        )}

      </div>
    </div>
  )
}
