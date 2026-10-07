import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminNav from '../components/AdminNav.jsx'

const CSS_VARS = `
  :root { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; }
  }
  :root[data-theme="light"] { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; }
  :root[data-theme="dark"] { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; }
  @media (max-width: 768px) {
    .detail-layout { flex-direction: column !important; }
    .detail-left { width: 100% !important; position: static !important; border-right: none !important; border-bottom: 1px solid var(--border) !important; max-height: none !important; min-height: auto !important; }
    .detail-right { padding: 20px 16px !important; }
  }
  @media print {
    body { background: #fff !important; }
    nav, .no-print { display: none !important; }
    .detail-layout { flex-direction: column !important; }
    .detail-left {
      width: 100% !important; position: static !important; border-right: none !important;
      border-bottom: 1px solid #e2e8f0 !important; max-height: none !important;
      min-height: auto !important; padding: 16px 0 !important;
    }
    .detail-right { padding: 16px 0 !important; max-width: 100% !important; }
    .print-header { display: block !important; }
    * { color: #0f172a !important; background: #fff !important; border-color: #e2e8f0 !important; }
  }
`

function parseShapLine(line) {
  const shapMatch = line.match(/\(SHAP contribution:\s*([^)]+)\)$/)
  const featureMatch = line.match(/\(([^)]+)\)\s*\(SHAP contribution:/)
  if (!shapMatch) return null
  const shapText = shapMatch[1].trim()
  const featureLabel = featureMatch ? featureMatch[1].trim() : null
  const sentence = line
    .replace(/\s*\(SHAP contribution:[^)]+\)$/, '')
    .replace(/\s*\([^)]+\)\s*$/, '')
    .trim()
  const towardFraud = shapText.includes('toward fraud')
  const strength = shapText.split(' ')[0]
  const vCodeMatch = sentence.match(/\b(V\d+|Amount|Time)\b/)
  const featureCode = vCodeMatch ? vCodeMatch[1] : null
  return { sentence, featureLabel, featureCode, strength, towardFraud }
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
      {children}
    </div>
  )
}

function InfoRow({ label, value, mono, large }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, letterSpacing: '0.03em' }}>{label}</div>
      <div style={{
        fontSize: large ? 22 : 13, fontWeight: large ? 700 : 500,
        fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--text)', letterSpacing: large ? '-0.02em' : 'normal',
        wordBreak: 'break-all',
      }}>{value}</div>
    </div>
  )
}

function DecisionBadge({ decision }) {
  const map = {
    fraud: { bg: '#ef444420', color: '#ef4444', border: '#ef444440' },
    uncertain: { bg: '#f59e0b20', color: '#f59e0b', border: '#f59e0b40' },
    genuine: { bg: '#22c55e20', color: '#22c55e', border: '#22c55e40' },
  }
  const s = map[decision] || map.uncertain
  return (
    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '4px 10px', borderRadius: 5, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {decision}
    </span>
  )
}

function ProfileStat({ label, value, highlight }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: highlight ? 'var(--accent)' : 'var(--text)' }}>{value}</div>
    </div>
  )
}

export default function AdminTransactionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tx, setTx] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [verdict, setVerdict] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedVerdict, setSavedVerdict] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('isAdmin')) { navigate('/admin/login'); return }
    fetch(`/api/admin/flagged/${id}`)
      .then(r => { if (!r.ok) throw new Error(`Not found (${r.status})`); return r.json() })
      .then(data => {
        setTx(data)
        // fetch full user profile using user_id stored in record
        return fetch('/api/users').then(r => r.json()).then(users => {
          const found = users.find(u => u.id === data.user_id)
          setUserProfile(found || null)
          setLoading(false)
        })
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [id, navigate])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
      <style>{CSS_VARS}</style>
      <span className="spinner-border spinner-border-sm" /> Loading transaction...
    </div>
  )
  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 24 }}>
      <style>{CSS_VARS}</style>
      <div style={{ color: '#ef4444', background: '#ef444415', border: '1px solid #ef444430', borderRadius: 6, padding: '10px 14px' }}>{error}</div>
    </div>
  )

  const disclaimer = tx.shap_explanation[0]
  const explanationLines = tx.shap_explanation.slice(1).filter(l => l.trim() !== '')
  const riskPct = (tx.risk_score * 100).toFixed(1)
  const riskColor = tx.risk_score > 0.7 ? '#ef4444' : tx.risk_score > 0.3 ? '#f59e0b' : '#22c55e'

  // compare submitted amount vs typical spend
  const typicalSpend = userProfile?.typical_spend
  const amountRatio = typicalSpend ? (tx.amount / typicalSpend).toFixed(1) : null

  function handleExport() {
    const prev = document.title
    document.title = `FraudReport_Tx${id}_${tx.user_name?.replace(/\s+/g, '_')}`
    window.print()
    document.title = prev
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      <style>{CSS_VARS}</style>

      <AdminNav current={`Transaction #${id}`} />

      {/* Print-only header — hidden on screen */}
      <div className="print-header" style={{ display: 'none', padding: '16px 28px 0', borderBottom: '2px solid #0f172a', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Fraud Detection System — Transaction Report</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          Transaction #{id} &nbsp;·&nbsp; {tx.user_name} &nbsp;·&nbsp; Generated {new Date().toLocaleString('en-GB')}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', minHeight: 'calc(100vh - 52px)' }} className="detail-layout">

        {/* LEFT PANEL — Cardholder identity */}
        <div className="detail-left" style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border)', minHeight: 'calc(100vh - 52px)', padding: '24px 20px', position: 'sticky', top: 52, overflowY: 'auto', maxHeight: 'calc(100vh - 52px)' }}>

          {/* Accent stripe */}
          <div style={{ height: 3, background: riskColor, borderRadius: 2, marginBottom: 20 }} />

          {/* Identity */}
          <div style={{ marginBottom: 20 }}>
            <SectionLabel>Cardholder</SectionLabel>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{tx.user_name}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>•••• {tx.card_last4}</div>
            {userProfile && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.07em',
                background: userProfile.risk_level === 'high' ? '#ef444420' : '#22c55e20',
                color: userProfile.risk_level === 'high' ? '#ef4444' : '#22c55e',
                border: `1px solid ${userProfile.risk_level === 'high' ? '#ef444440' : '#22c55e40'}`,
              }}>{userProfile.risk_level} risk profile</span>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', marginBottom: 0 }} />

          {/* Account profile */}
          {userProfile && (
            <div style={{ marginTop: 16, marginBottom: 20 }}>
              <SectionLabel>Account Profile</SectionLabel>
              <ProfileStat label="Account age" value={`${userProfile.account_age_years} year${userProfile.account_age_years !== 1 ? 's' : ''}`} />
              <ProfileStat label="Registered address" value={userProfile.address} />
              <ProfileStat label="Usual merchant category" value={userProfile.usual_merchant} />
              <ProfileStat label="Typical spend per transaction" value={`£${userProfile.typical_spend?.toFixed(2)}`} />
              <ProfileStat label="Normal transaction frequency" value={userProfile.normal_tx_count} />
              <ProfileStat label="Recent transactions this week" value={`${userProfile.recent_tx_count} transactions`} />
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', marginBottom: 16 }} />

          {/* This transaction vs profile */}
          <div>
            <SectionLabel>This Transaction vs Profile</SectionLabel>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Amount comparison */}
              <div style={{ padding: '10px 12px', borderRadius: 7, background: 'var(--tag-bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Amount vs typical</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text)', marginBottom: 2 }}>
                  £{parseFloat(tx.amount).toFixed(2)}
                </div>
                {amountRatio && (
                  <div style={{ fontSize: 11, color: amountRatio > 5 ? '#ef4444' : amountRatio > 2 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                    {amountRatio}× their usual £{typicalSpend?.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Category comparison */}
              <div style={{ padding: '10px 12px', borderRadius: 7, background: 'var(--tag-bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Category vs usual</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{tx.merchant_category}</div>
                {userProfile && tx.merchant_category !== userProfile.usual_merchant && (
                  <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 500 }}>
                    Unusual — normally {userProfile.usual_merchant}
                  </div>
                )}
                {userProfile && tx.merchant_category === userProfile.usual_merchant && (
                  <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 500 }}>Matches normal pattern</div>
                )}
              </div>

              {/* Merchant */}
              <div style={{ padding: '10px 12px', borderRadius: 7, background: 'var(--tag-bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Merchant</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{tx.merchant_name}</div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Analysis */}
        <div className="detail-right" style={{ flex: 1, padding: '24px 28px', maxWidth: 700 }}>

          {/* Export button — hidden when printing */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={handleExport} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: '1px solid var(--border)', background: 'var(--tag-bg)',
              color: 'var(--text-muted)', cursor: 'pointer',
            }}>
              ↓ Export PDF
            </button>
          </div>

          {/* Decision card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <DecisionBadge decision={tx.decision} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pipeline decision</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, letterSpacing: '0.03em' }}>Risk Score</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: riskColor }}>{riskPct}%</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, letterSpacing: '0.03em' }}>Model</div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'ui-monospace, monospace', color: 'var(--text)' }}>{tx.model_used}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, letterSpacing: '0.03em' }}>Rules Fired</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: tx.triggered_rules.length > 0 ? '#f59e0b' : '#22c55e' }}>
                  {tx.triggered_rules.length}
                </div>
              </div>
            </div>
          </div>

          {/* Triggered rules */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
            <SectionLabel>Triggered Rules</SectionLabel>
            {tx.triggered_rules.length === 0
              ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No rules triggered — flagged by model score alone.</div>
              : tx.rule_reasons.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < tx.rule_reasons.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text)' }}>{r}</div>
                </div>
              ))
            }
          </div>

          {/* SHAP */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px' }}>
            <SectionLabel>SHAP Explanation — Top Contributing Features</SectionLabel>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, padding: '8px 12px', background: 'var(--tag-bg)', borderRadius: 6, marginBottom: 14 }}>
              {disclaimer}
            </div>
            <div>
              {explanationLines.map((line, i) => {
                const parsed = parseShapLine(line)
                if (!parsed) return null
                const { sentence, featureLabel, featureCode, strength, towardFraud } = parsed
                const color = towardFraud ? '#ef4444' : '#22c55e'
                const isLast = i === explanationLines.length - 1
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '13px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, width: 68, textAlign: 'center', paddingTop: 2 }}>
                      <div style={{ fontSize: 18, color, lineHeight: 1, marginBottom: 2 }}>{towardFraud ? '↑' : '↓'}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color }}>{strength}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{towardFraud ? 'toward fraud' : 'away fraud'}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', marginBottom: 6 }}>{sentence}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {featureLabel && (
                          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: 'var(--tag-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            {featureLabel}
                          </span>
                        )}
                        {featureCode && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--tag-bg)', color: 'var(--accent)', border: '1px solid var(--border)', fontFamily: 'ui-monospace, monospace' }}>
                            {featureCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Analyst Verdict — #11 — hidden when printing */}
          <div className="no-print" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', marginTop: 16 }}>
            <SectionLabel>Analyst Verdict</SectionLabel>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
              Record your assessment. This is saved to the explanation history.
            </p>

            {/* Verdict buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { val: 'fraud',   label: 'Confirm fraud',   color: '#ef4444' },
                { val: 'genuine', label: 'Mark genuine',    color: '#22c55e' },
                { val: 'unsure',  label: 'Unsure',          color: '#f59e0b' },
              ].map(v => (
                <button key={v.val} onClick={() => { setVerdict(v.val); setSavedVerdict(null) }} style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${verdict === v.val ? v.color : 'var(--border)'}`,
                  background: verdict === v.val ? `${v.color}18` : 'var(--tag-bg)',
                  color: verdict === v.val ? v.color : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}>{v.label}</button>
              ))}
            </div>

            {/* Optional note */}
            {verdict && (
              <textarea
                placeholder="Optional note (e.g. why you disagree with the model)..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--tag-bg)', color: 'var(--text)',
                  fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
              />
            )}

            {/* Save button */}
            {verdict && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={async () => {
                  setSaving(true); setSavedVerdict(null)
                  await new Promise(r => setTimeout(r, 600))
                  try {
                    const res = await fetch(`/api/admin/history/${id}/verdict`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ analyst_verdict: verdict, analyst_note: note || null }),
                    })
                    if (!res.ok) throw new Error(`Server error ${res.status}`)
                    setSavedVerdict(verdict)
                  } catch(e) { console.error(e) }
                  finally { setSaving(false) }
                }} disabled={saving} style={{
                  padding: '8px 22px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
                  background: saving ? 'var(--border)' : savedVerdict ? '#16a34a' : 'var(--accent)',
                  color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.3s',
                }}>
                  {saving ? <><span className="spinner-border spinner-border-sm" /> Saving...</> : savedVerdict ? '✓ Saved to history' : 'Save verdict'}
                </button>
                {savedVerdict && (
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                    Verdict recorded — visible in History page.
                  </span>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
