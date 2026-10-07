import { useLocation, useNavigate } from 'react-router-dom'

const CSS_VARS = `
  :root { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; }
  }
  :root[data-theme="light"] { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; }
  :root[data-theme="dark"] { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; }
`

export default function PaymentResult() {
  const location = useLocation()
  const navigate = useNavigate()
  const { result, form } = location.state || {}
  if (!result) { navigate('/'); return null }

  const approved = result.decision === 'genuine'
  const statusColor = approved ? '#22c55e' : '#f59e0b'
  const statusBg = approved ? '#22c55e12' : '#f59e0b12'
  const statusBorder = approved ? '#22c55e30' : '#f59e0b30'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{CSS_VARS}</style>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)' }}>FraudGuard</div>
        </div>

        {/* Status banner */}
        <div style={{
          background: statusBg, border: `1px solid ${statusBorder}`,
          borderRadius: 10, padding: '20px 24px', marginBottom: 16,
          display: 'flex', alignItems: 'flex-start', gap: 16,
        }}>
          <div style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{approved ? '✓' : '⚠'}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: statusColor, marginBottom: 4 }}>
              {approved ? 'Payment approved' : 'Payment held for review'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {approved
                ? 'Your payment was processed successfully. No issues were detected.'
                : 'Our system flagged this payment for manual review. You will be contacted within 24 hours.'}
            </div>
          </div>
        </div>

        {/* Transaction summary */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Transaction Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Amount', val: `£${parseFloat(form.amount).toFixed(2)}`, large: true },
              { label: 'Merchant', val: form.merchant_name },
              { label: 'Category', val: form.merchant_category },
              { label: 'Reference', val: result.transaction_id, mono: true },
            ].map(({ label, val, large, mono }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                <div style={{
                  fontSize: large ? 20 : 13, fontWeight: large ? 700 : 500,
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
                  color: 'var(--text)',
                  wordBreak: 'break-all',
                }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => navigate('/')} style={{
          width: '100%', padding: '11px 0', borderRadius: 7,
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          ← Make another payment
        </button>

      </div>
    </div>
  )
}
