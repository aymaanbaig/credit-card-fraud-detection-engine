import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// merchant name → category auto-fill
const MERCHANTS = [
  { name: 'Tesco', category: 'Groceries' },
  { name: 'Sainsbury\'s', category: 'Groceries' },
  { name: 'ASDA', category: 'Groceries' },
  { name: 'Amazon', category: 'Electronics' },
  { name: 'Currys', category: 'Electronics' },
  { name: 'Apple Store', category: 'Electronics' },
  { name: 'Ryanair', category: 'Travel' },
  { name: 'Booking.com', category: 'Travel' },
  { name: 'National Rail', category: 'Travel' },
  { name: 'Odeon Cinema', category: 'Entertainment' },
  { name: 'Spotify', category: 'Entertainment' },
  { name: 'Netflix', category: 'Entertainment' },
  { name: 'ASOS', category: 'Clothing' },
  { name: 'Zara', category: 'Clothing' },
  { name: 'H&M', category: 'Clothing' },
  { name: 'Shell Garage', category: 'Other' },
  { name: 'McDonald\'s', category: 'Other' },
]

const CSS_VARS = `
  :root {
    --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0;
    --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6;
    --tag-bg: #f1f5f9;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b;
      --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; }
  }
  :root[data-theme="light"] { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0;
    --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; }
  :root[data-theme="dark"] { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b;
    --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; }
  input[type=number], input[type=text], select {
    background: var(--surface) !important; color: var(--text) !important;
    border: 1px solid var(--border) !important; border-radius: 6px !important;
    padding: 9px 12px !important; width: 100%; outline: none;
    font-family: inherit; transition: border-color 0.15s;
  }
  input[type=number]:focus, input[type=text]:focus, select:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent) !important;
  }
  input[type=radio] { accent-color: var(--accent); }
  @media (max-width: 680px) {
    .pay-grid { grid-template-columns: 1fr !important; }
  }
`

export default function TransactionForm() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ user_id: '', amount: '', merchant_name: MERCHANTS[0].name, merchant_category: MERCHANTS[0].category })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => {
      setUsers(data)
      if (data.length > 0) setForm(f => ({ ...f, user_id: data[0].id }))
    })
  }, [])

  const selectedUser = users.find(u => u.id === form.user_id)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleMerchantChange(e) {
    const merchant = MERCHANTS.find(m => m.name === e.target.value)
    setForm(f => ({ ...f, merchant_name: e.target.value, merchant_category: merchant ? merchant.category : f.merchant_category }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Enter a valid amount.'); return }
    setError(null); setLoading(true)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: form.user_id, amount: parseFloat(form.amount),
          merchant_name: form.merchant_name, merchant_category: form.merchant_category }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      navigate('/result', { state: { result: await res.json(), form } })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{CSS_VARS}</style>
      <div style={{ width: '100%', maxWidth: 880 }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 5 }}>FraudGuard</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>Secure Payment</h1>
          </div>
          <a href="/admin/login" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>Admin →</a>
        </div>

        <div className="pay-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* LEFT — Cardholder */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Select Account</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {users.map(u => (
                <label key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px',
                  borderRadius: 8, border: `1px solid ${form.user_id === u.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: form.user_id === u.id ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <input type="radio" name="user_id" value={u.id}
                    checked={form.user_id === u.id} onChange={handleChange}
                    style={{ width: 15, height: 15, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>•••• {u.card_last4}</div>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: u.risk_level === 'high' ? '#ef444420' : '#22c55e20',
                    color: u.risk_level === 'high' ? '#ef4444' : '#22c55e',
                    border: `1px solid ${u.risk_level === 'high' ? '#ef444440' : '#22c55e40'}`,
                  }}>{u.risk_level}</span>
                </label>
              ))}
            </div>

            {selectedUser && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Account Profile</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Account age', val: `${selectedUser.account_age_years} yr${selectedUser.account_age_years !== 1 ? 's' : ''}` },
                    { label: 'Typical spend', val: `£${selectedUser.typical_spend?.toFixed(2)}` },
                    { label: 'Usual merchant', val: selectedUser.usual_merchant },
                    { label: 'Tx frequency', val: selectedUser.normal_tx_count },
                    { label: 'Address', val: selectedUser.address },
                    { label: 'Recent txns', val: `${selectedUser.recent_tx_count} this week` },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Payment form */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Payment Details</div>

            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Amount (£)</label>
                <input name="amount" type="number" min="0.01" step="0.01"
                  placeholder="0.00" value={form.amount} onChange={handleChange} required
                  style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Merchant</label>
                <select name="merchant_name" value={form.merchant_name} onChange={handleMerchantChange}>
                  {MERCHANTS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Category</label>
                <div style={{
                  padding: '9px 12px', borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--tag-bg)', fontSize: 13, color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}>
                  {form.merchant_category}
                </div>
              </div>

              {error && (
                <div style={{ fontSize: 12, color: '#ef4444', background: '#ef444415', border: '1px solid #ef444430', borderRadius: 6, padding: '8px 12px' }}>
                  {error}
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '12px 0', borderRadius: 7, border: 'none',
                  background: loading ? 'var(--border)' : 'var(--accent)',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {loading ? <><span className="spinner-border spinner-border-sm" />Processing...</> : 'Pay now →'}
                </button>

                <div style={{ marginTop: 12, padding: '9px 12px', background: 'var(--tag-bg)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  🔒 Screened in real time by hybrid fraud detection — rule engine + machine learning.
                </div>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
