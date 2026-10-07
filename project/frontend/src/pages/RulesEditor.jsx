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
  input[type=number].rule-input, input[type=text].rule-input, input[type=time].rule-input {
    background: var(--surface) !important; color: var(--text) !important;
    border: 1px solid var(--border) !important; border-radius: 6px !important;
    padding: 7px 10px !important; font-family: inherit; font-size: 13px;
    width: 130px; outline: none;
  }
  input[type=number].rule-input:focus, input[type=text].rule-input:focus, input[type=time].rule-input:focus { border-color: var(--accent) !important; }
`

// seconds → "HH:MM"
function secsToTime(secs) {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0')
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

// "HH:MM" → seconds
function timeToSecs(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 3600 + m * 60
}

// human-readable labels for each rule block and its fields
const RULE_META = {
  amount_rule: {
    label: 'Amount Threshold',
    description: 'Flags transactions above a fixed amount. Catches unusually large purchases.',
    fields: { max_amount: { label: 'Max amount (£)', type: 'number', min: 0 } },
  },
  night_transaction_rule: {
    label: 'Night Transaction',
    description: 'Flags transactions made during the configured night window. Transactions in the early hours carry a higher fraud association.',
    fields: {
      night_start_second: { label: 'Night starts at', type: 'time' },
      night_end_second:   { label: 'Night ends at',   type: 'time' },
    },
  },
  micro_transaction_rule: {
    label: 'Micro Transaction',
    description: 'Flags suspiciously small transactions — a common card-testing pattern where fraudsters verify a stolen card with a tiny purchase before making a larger one.',
    fields: { max_amount: { label: 'Max micro amount (£)', type: 'number', min: 0 } },
  },
  personal_amount_rule: {
    label: 'Personal Amount (× typical spend)',
    description: "Flags if the transaction amount exceeds a multiple of the cardholder's own typical spend. More precise than the flat threshold — a £500 purchase is fine for one user but suspicious for another.",
    fields: { multiplier: { label: 'Multiplier (×)', type: 'number', min: 1, step: 0.5 } },
  },
}

export default function RulesEditor() {
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('isAdmin')) { navigate('/admin/login'); return }
    fetch('/api/admin/rules/config')
      .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json() })
      .then(data => { setConfig(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [navigate])

  function handleFieldChange(rule, field, value) {
    setConfig(prev => ({
      ...prev,
      [rule]: { ...prev[rule], [field]: value },
    }))
    setSuccess(false)
  }

  function handleToggle(rule) {
    setConfig(prev => ({
      ...prev,
      [rule]: { ...prev[rule], enabled: !prev[rule].enabled },
    }))
    setSuccess(false)
  }

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false)
    try {
      const [res] = await Promise.all([
        fetch('/api/admin/rules/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        }),
        new Promise(r => setTimeout(r, 800)), // minimum visible spinner
      ])
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000) // auto-clear after 3s
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      <style>{CSS_VARS}</style>

      <AdminNav current="Rules" />

      <div style={{ padding: '28px 24px', maxWidth: 780, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>Rule Engine Configuration</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Changes are saved to <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>services/rule_engine/rules_config.yaml</code> and take effect on the next transaction submission — no restart needed.
          </p>
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '32px 0' }}>
            <span className="spinner-border spinner-border-sm" /> Loading config...
          </div>
        )}

        {error && (
          <div style={{ color: '#ef4444', background: '#ef444415', border: '1px solid #ef444430', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}


        {config && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(config).map(([ruleKey, ruleVal]) => {
              const meta = RULE_META[ruleKey]
              const enabled = ruleVal.enabled !== false
              return (
                <div key={ruleKey} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '18px 20px', opacity: enabled ? 1 : 0.55,
                  borderLeft: `3px solid ${enabled ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                        {meta?.label || ruleKey}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {meta?.description}
                      </div>
                    </div>
                    {/* Enable/disable toggle */}
                    <button onClick={() => handleToggle(ruleKey)} style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '4px 12px',
                      borderRadius: 5, cursor: 'pointer', border: `1px solid ${enabled ? '#22c55e40' : 'var(--border)'}`,
                      background: enabled ? '#22c55e18' : 'var(--tag-bg)',
                      color: enabled ? '#22c55e' : 'var(--text-muted)',
                    }}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* Fields */}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 14 }}>
                    {Object.entries(ruleVal)
                      .filter(([k]) => k !== 'enabled' && k !== 'day_seconds')
                      .map(([field, val]) => {
                        const fieldMeta = meta?.fields?.[field]
                        const isTimeField = fieldMeta?.type === 'time'
                        return (
                          <div key={field}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                              {fieldMeta?.label || field}
                            </div>
                            <input
                              type={isTimeField ? 'time' : (fieldMeta?.type || 'number')}
                              className="rule-input"
                              value={isTimeField ? secsToTime(val) : val}
                              min={fieldMeta?.min}
                              max={fieldMeta?.max}
                              step={fieldMeta?.step || 'any'}
                              onChange={e => {
                                const newVal = isTimeField
                                  ? timeToSecs(e.target.value)
                                  : parseFloat(e.target.value)
                                handleFieldChange(ruleKey, field, isNaN(newVal) ? val : newVal)
                              }}
                              disabled={!enabled}
                            />
                          </div>
                        )
                      })}
                  </div>
                </div>
              )
            })}

            {/* Save button + inline confirmation */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 8 }}>
              {success && (
                <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>✓</span> Saved — takes effect on next submission.
                </span>
              )}
              <button onClick={handleSave} disabled={saving} style={{
                padding: '10px 28px', borderRadius: 7, border: 'none',
                background: saving ? 'var(--border)' : success ? '#16a34a' : 'var(--accent)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.3s',
              }}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm" /> Saving...</>
                  : success ? '✓ Saved' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
