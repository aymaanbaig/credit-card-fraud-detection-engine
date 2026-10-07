import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const SORT_OPTIONS = [
  { value: 'risk_score_desc', label: 'Risk score (high to low)' },
  { value: 'risk_score_asc', label: 'Risk score (low to high)' },
  { value: 'id_desc', label: 'Newest first' },
  { value: 'id_asc', label: 'Oldest first' },
]

function DecisionBadge({ decision }) {
  return <span className={`badge badge-${decision}`}>{decision}</span>
}

function RiskBar({ score }) {
  const pct = Math.round(score * 100)
  return (
    <div className="risk-bar-wrap">
      <div className="risk-bar">
        <div className="risk-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span>{pct}%</span>
    </div>
  )
}

export default function FlaggedTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterDecision, setFilterDecision] = useState('all')
  const [sortBy, setSortBy] = useState('id_desc')

  useEffect(() => {
    setLoading(true)
    fetch('/api/pipeline/flagged')
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setTransactions(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filtered = transactions.filter((tx) =>
    filterDecision === 'all' ? true : tx.decision === filterDecision
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'risk_score_desc') return b.risk_score - a.risk_score
    if (sortBy === 'risk_score_asc') return a.risk_score - b.risk_score
    if (sortBy === 'id_asc') return a.id - b.id
    return b.id - a.id
  })

  function handleSort(field) {
    if (field === 'risk_score') {
      setSortBy(sortBy === 'risk_score_desc' ? 'risk_score_asc' : 'risk_score_desc')
    } else {
      setSortBy(sortBy === 'id_desc' ? 'id_asc' : 'id_desc')
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Flagged Transactions</h1>

      <div className="filters">
        <label>
          Decision
          <select value={filterDecision} onChange={(e) => setFilterDecision(e.target.value)}>
            <option value="all">All</option>
            <option value="fraud">Fraud</option>
            <option value="uncertain">Uncertain</option>
          </select>
        </label>
        <label>
          Sort by
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
          Loading flagged transactions...
        </div>
      )}

      {error && <p className="error-msg">Error: {error}</p>}

      {!loading && !error && sorted.length === 0 && (
        <p className="empty-msg">No flagged transactions yet. Submit a transaction via the pipeline API to see it here.</p>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>ID {sortBy.startsWith('id') ? (sortBy === 'id_desc' ? '↓' : '↑') : ''}</th>
                  <th>Transaction ID</th>
                  <th>Decision</th>
                  <th onClick={() => handleSort('risk_score')}>Risk Score {sortBy.startsWith('risk_score') ? (sortBy === 'risk_score_desc' ? '↓' : '↑') : ''}</th>
                  <th>Model</th>
                  <th>Triggered Rules</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.id}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{tx.transaction_id}</td>
                    <td><DecisionBadge decision={tx.decision} /></td>
                    <td><RiskBar score={tx.risk_score} /></td>
                    <td>{tx.model_used}</td>
                    <td>{tx.triggered_rules.length > 0 ? tx.triggered_rules.join(', ') : <span style={{ color: 'var(--text-muted)' }}>none</span>}</td>
                    <td><Link to={`/transaction/${tx.id}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
