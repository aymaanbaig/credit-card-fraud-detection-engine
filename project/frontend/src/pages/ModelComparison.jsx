import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminNav from '../components/AdminNav.jsx'

const CSS_VARS = `
  :root { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; }
  }
  :root[data-theme="light"] { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; }
  :root[data-theme="dark"] { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; }
`

const XGB_COLOR = '#3b82f6'
const MLP_COLOR = '#f59e0b'

const METRICS = [
  { key: 'fpr',       label: 'False Positive Rate', lower_better: true,  format: v => (parseFloat(v) * 100).toFixed(2) + '%', note: 'Primary metric — lower is better' },
  { key: 'precision', label: 'Precision',            lower_better: false, format: v => (parseFloat(v) * 100).toFixed(1) + '%', note: 'Of flagged, how many are real fraud' },
  { key: 'recall',    label: 'Recall',               lower_better: false, format: v => (parseFloat(v) * 100).toFixed(1) + '%', note: 'Of all fraud, how many were caught' },
  { key: 'f1',        label: 'F1 Score',             lower_better: false, format: v => (parseFloat(v) * 100).toFixed(1) + '%', note: 'Balance of precision and recall' },
  { key: 'auc_roc',   label: 'AUC-ROC',              lower_better: false, format: v => parseFloat(v).toFixed(4),               note: 'Separation across all thresholds' },
]

function MetricBar({ label, xgbVal, mlpVal, lowerBetter, format, note, isFirst }) {
  const xgb = parseFloat(xgbVal)
  const mlp = parseFloat(mlpVal)
  const xgbWins = lowerBetter ? xgb <= mlp : xgb >= mlp
  const maxVal = Math.max(xgb, mlp, 0.0001)

  return (
    <div style={{ padding: '14px 20px', borderTop: isFirst ? 'none' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{note}</span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {lowerBetter ? '↓ lower is better' : '↑ higher is better'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[
          { name: 'XGBoost', val: xgb, color: XGB_COLOR, wins: xgbWins,  formatted: format(xgbVal) },
          { name: 'MLP',     val: mlp, color: MLP_COLOR, wins: !xgbWins, formatted: format(mlpVal) },
        ].map(m => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 60, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{m.name}</div>
            <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(m.val / maxVal) * 100}%`, background: m.color, opacity: m.wins ? 1 : 0.4, borderRadius: 999 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 80 }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: m.wins ? m.color : 'var(--text-muted)' }}>{m.formatted}</span>
              {m.wins && <span style={{ fontSize: 10, color: m.color }}>✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ImageCard({ title, src, caption }) {
  const [failed, setFailed] = useState(false)
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--tag-bg)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{title}</div>
      </div>
      <div style={{ padding: 16 }}>
        {failed
          ? <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--tag-bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px' }}>
              Image not available — restart the backend and refresh.
            </div>
          : <img src={src} alt={title} style={{ display: 'block', maxWidth: '100%', maxHeight: 420, margin: '0 auto', borderRadius: 6, border: '1px solid var(--border)' }}
              onError={() => setFailed(true)} />
        }
        {caption && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>{caption}</div>}
      </div>
    </div>
  )
}

export default function ModelComparison() {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('isAdmin')) { navigate('/admin/login'); return }
    fetch('/api/admin/model-results')
      .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json() })
      .then(data => { setResults(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [navigate])

  const xgb = results.find(r => r.model === 'xgboost') || {}
  const mlp = results.find(r => r.model === 'mlp') || {}

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      <style>{CSS_VARS}</style>

      <AdminNav current="Model Comparison" />

      <div style={{ padding: '28px 24px', maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>XGBoost vs MLP</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, maxWidth: 660 }}>
            Both models trained on the same preprocessed data — stratified 80/20 split, SMOTE on training only, StandardScaler on Amount and Time.
            False positive rate is the primary metric: a high FPR means genuine customers get their cards blocked.
          </p>
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '32px 0' }}>
            <span className="spinner-border spinner-border-sm" /> Loading results...
          </div>
        )}
        {error && <div style={{ color: '#ef4444', background: '#ef444415', border: '1px solid #ef444430', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Metric comparison table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--tag-bg)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Metric Breakdown</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: XGB_COLOR, fontWeight: 600 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: XGB_COLOR, display: 'inline-block' }} />XGBoost
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MLP_COLOR, fontWeight: 600 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: MLP_COLOR, display: 'inline-block' }} />MLP
                  </span>
                </div>
              </div>
              {METRICS.map((m, i) => (
                <MetricBar key={m.key} label={m.label} note={m.note}
                  xgbVal={xgb[m.key] || '0'} mlpVal={mlp[m.key] || '0'}
                  lowerBetter={m.lower_better} format={m.format} isFirst={i === 0} />
              ))}
            </div>

            {/* Precision-recall curve — shared chart from training */}
            <ImageCard
              title="Precision-Recall Curve — XGBoost vs MLP"
              src="/model-images/precision_recall_curve.png"
              caption="Both models plotted on the same axes. A curve closer to the top-right corner is better. XGBoost maintains higher precision at the same recall levels across all thresholds."
            />

            {/* ROC curve */}
            <ImageCard
              title="ROC Curve — XGBoost"
              src="/model-images/xgboost_roc_curve.png"
              caption={`AUC-ROC ${xgb.auc_roc || '—'} — the area under the curve. Closer to 1.0 means the model separates fraud from genuine better across all thresholds.`}
            />

            {/* Confusion matrices side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ImageCard
                title="Confusion Matrix — XGBoost"
                src="/model-images/xgboost_confusion_matrix.png"
                caption={`FPR ${xgb.fpr ? (parseFloat(xgb.fpr) * 100).toFixed(2) + '%' : '—'} · Recall ${xgb.recall ? (parseFloat(xgb.recall) * 100).toFixed(1) + '%' : '—'}`}
              />
              <ImageCard
                title="Confusion Matrix — MLP"
                src="/model-images/mlp_confusion_matrix.png"
                caption={`FPR ${mlp.fpr ? (parseFloat(mlp.fpr) * 100).toFixed(2) + '%' : '—'} · Recall ${mlp.recall ? (parseFloat(mlp.recall) * 100).toFixed(1) + '%' : '—'}`}
              />
            </div>

            {/* Hyperparameters */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--tag-bg)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Best Hyperparameters</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {[
                  { model: 'XGBoost', color: XGB_COLOR, params: [
                    { label: 'n_estimators', val: xgb.n_estimators },
                    { label: 'max_depth',    val: xgb.max_depth },
                    { label: 'learning_rate',val: xgb.learning_rate },
                  ]},
                  { model: 'MLP', color: MLP_COLOR, params: [
                    { label: 'hidden_layer_sizes', val: mlp.hidden_layers },
                    { label: 'alpha (L2)',          val: mlp.alpha },
                    { label: 'early_stopping',      val: 'true' },
                  ]},
                ].map((m, col) => (
                  <div key={m.model} style={{ padding: '16px 20px', borderLeft: col === 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: m.color, marginBottom: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{m.model}</div>
                    {m.params.map(p => (
                      <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{p.label}</span>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: 'var(--text)' }}>{p.val || '—'}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Key finding */}
            <div style={{ padding: '14px 18px', background: 'var(--tag-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text)' }}>Key finding:</strong> Both models achieve the same FPR (0.05%) — neither flags more genuine customers than the other.
              XGBoost scores higher on recall, F1, and AUC-ROC.
              XGBoost outperforms MLP on this dataset because tree-based models handle tabular, PCA-compressed features better than neural networks.
              The comparison is fair: same train/test split, same SMOTE-balanced training set, same StandardScaler.
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
