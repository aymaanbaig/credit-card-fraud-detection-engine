import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function DecisionBadge({ decision }) {
  return <span className={`badge badge-${decision}`}>{decision}</span>
}

export default function TransactionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tx, setTx] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/pipeline/flagged/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Transaction not found (${r.status})`)
        return r.json()
      })
      .then((data) => {
        setTx(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="page">
        <div className="spinner-wrap">
          <div className="spinner" />
          Loading transaction...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <p className="error-msg">Error: {error}</p>
      </div>
    )
  }

  const disclaimer = tx.shap_explanation[0]
  const explanationLines = tx.shap_explanation.slice(1).filter((l) => l.trim() !== '')

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate(-1)}>
        &larr; Back to list
      </button>

      <h1 className="page-title">Transaction {tx.transaction_id}</h1>

      {/* Summary row */}
      <div className="card">
        <div className="detail-grid">
          <div className="detail-item">
            <label>Decision</label>
            <span><DecisionBadge decision={tx.decision} /></span>
          </div>
          <div className="detail-item">
            <label>Risk Score</label>
            <span>{Math.round(tx.risk_score * 100)}%</span>
          </div>
          <div className="detail-item">
            <label>Model Used</label>
            <span>{tx.model_used}</span>
          </div>
          <div className="detail-item">
            <label>Rules Fired</label>
            <span>{tx.triggered_rules.length}</span>
          </div>
        </div>
      </div>

      {/* Triggered rules */}
      {tx.triggered_rules.length > 0 && (
        <div className="card">
          <p className="card-title">Triggered Rules</p>
          <ul className="rules-list">
            {tx.rule_reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {tx.triggered_rules.length === 0 && (
        <div className="card">
          <p className="card-title">Triggered Rules</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No rules triggered — flagged by model score alone.</p>
        </div>
      )}

      {/* SHAP explanation */}
      <div className="card">
        <p className="card-title">SHAP Explanation — Top Contributing Features</p>
        <ul className="shap-list">
          <li className="shap-disclaimer">{disclaimer}</li>
          {explanationLines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
