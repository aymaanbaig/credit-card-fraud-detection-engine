import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminNav from '../components/AdminNav.jsx'

const CSS_VARS = `
  :root { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; --table-hover: #f8fafc; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; --table-hover: #1e2438; }
  }
  :root[data-theme="light"] { --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-muted: #64748b; --accent: #3b82f6; --tag-bg: #f1f5f9; --table-hover: #f8fafc; }
  :root[data-theme="dark"] { --bg: #0f1117; --surface: #1a1f2e; --border: #252b3b; --text: #e2e8f0; --text-muted: #64748b; --accent: #60a5fa; --tag-bg: #252b3b; --table-hover: #1e2438; }
  input.search-box {
    background: var(--surface) !important; color: var(--text) !important;
    border: 1px solid var(--border) !important; border-radius: 6px !important;
    padding: 7px 12px !important; outline: none; font-family: inherit; font-size: 13px;
    width: 100%; max-width: 280px;
  }
  input.search-box:focus { border-color: var(--accent) !important; }
  .feat-row:hover { background: var(--table-hover) !important; }
  select.cat-select {
    background: var(--surface); color: var(--text); border: 1px solid var(--border);
    border-radius: 6px; padding: 7px 10px; font-size: 12px; outline: none;
    font-family: inherit; cursor: pointer;
  }
  select.cat-select:focus { border-color: var(--accent); }
`

const FEATURES = [
  { code: 'V1',  label: 'Card Verification',        category: 'Authentication',
    description: 'Card verification signals. A negative value suggests a verification inconsistency — common in card-not-present fraud where someone uses stolen card details without the physical card.' },
  { code: 'V2',  label: 'Amount Deviation',          category: 'Spend Pattern',
    description: "How much the transaction amount deviates from the cardholder's expected spend profile. Large positive values indicate an amount unusually high relative to the account's history." },
  { code: 'V3',  label: 'Transaction Timing',        category: 'Velocity',
    description: 'Timing pattern of transactions. A high-frequency burst in a short window is a common signal when a stolen card is being rapidly used before it is blocked.' },
  { code: 'V4',  label: 'Account Tenure',            category: 'Account',
    description: "How long the account has been active and whether recent activity matches its history. Sudden behavioural shifts on an established account score higher on this feature." },
  { code: 'V5',  label: 'Device Behaviour',          category: 'Authentication',
    description: "Terminal or device type used for the transaction. An unfamiliar device compared to the cardholder's normal pattern raises this signal." },
  { code: 'V6',  label: 'Category Behaviour',        category: 'Spend Pattern',
    description: "Shifts in merchant category relative to the cardholder's normal pattern. A sudden move to an unfamiliar category is a known fraud indicator, especially alongside other anomalies." },
  { code: 'V7',  label: 'Geographic Pattern',        category: 'Location',
    description: "Whether the transaction location is consistent with the cardholder's normal geographic activity. A significant location shift raises this signal." },
  { code: 'V8',  label: 'Session Behaviour',         category: 'Authentication',
    description: 'Digital fingerprint of the session — browser, device, and interaction patterns. Remote or automated card use produces a different fingerprint than normal in-person transactions.' },
  { code: 'V9',  label: 'Address Matching',          category: 'Authentication',
    description: "Address Verification System (AVS) signal. A mismatch between the submitted billing address and the registered address is a classic card-not-present fraud indicator." },
  { code: 'V10', label: 'Authentication Strength',   category: 'Authentication',
    description: 'Strength of the authentication check — chip, PIN, 3DS, or CVV only. A weak or failed check is a strong fraud signal, especially for online transactions.' },
  { code: 'V11', label: 'Spending Consistency',      category: 'Spend Pattern',
    description: "How consistent this transaction is with the cardholder's overall spending profile. A low score indicates the transaction breaks their established pattern." },
  { code: 'V12', label: 'Merchant Risk',             category: 'Merchant',
    description: "Risk level of the merchant type relative to the cardholder's normal behaviour. A merchant category that differs from their usual pattern raises this signal." },
  { code: 'V13', label: 'Card Usage Frequency',      category: 'Velocity',
    description: "How frequently the card has been used in the recent window. A spike well above the cardholder's normal rate is a common indicator of a stolen card being tested." },
  { code: 'V14', label: 'Transaction Velocity',      category: 'Velocity',
    description: 'The most predictive velocity feature. A rapid sequence of transactions in a short window is a classic stolen-card pattern — fraudsters spend quickly before the card is blocked.' },
  { code: 'V15', label: 'Purchase Pattern',          category: 'Spend Pattern',
    description: "Combination of amount and merchant type relative to the cardholder's normal purchase pattern. An unusual combination of both raises this signal." },
  { code: 'V16', label: 'Transaction Channel',       category: 'Authentication',
    description: 'Whether the transaction was card-present (in-person) or card-not-present (online, phone). Online transactions carry higher fraud risk for cardholders who normally shop in person.' },
  { code: 'V17', label: 'Spend-to-Frequency Ratio',  category: 'Velocity',
    description: 'Combines spend amount with transaction frequency. High spend combined with high frequency in a short period is strongly associated with card testing — fraudsters make small then large purchases to verify a stolen card.' },
  { code: 'V18', label: 'Billing Consistency',       category: 'Account',
    description: "Whether transaction details are consistent with the cardholder's registered profile. Inconsistencies can indicate a third party has taken over the account." },
  { code: 'V19', label: 'Cardholder Behaviour',      category: 'Account',
    description: "Composite behavioural score based on account history, transaction frequency, and merchant patterns. Deviations from the cardholder's established behaviour raise this score." },
  { code: 'V20', label: 'Recurring Payments',        category: 'Spend Pattern',
    description: 'Expected recurring payment patterns (subscriptions, bills). A transaction that breaks the expected recurring pattern can indicate account compromise.' },
  { code: 'V21', label: 'Cross-Channel Activity',    category: 'Authentication',
    description: 'Activity across multiple payment channels (online, in-store, ATM) in a short window. Fraudsters often test a stolen card across several channels before making large purchases.' },
  { code: 'V22', label: 'Card Validity',             category: 'Account',
    description: 'Card renewal and validity signals. Anomalies here can indicate that card details from a cancelled or recently renewed card are being used.' },
  { code: 'V23', label: 'International Activity',    category: 'Location',
    description: "Cross-border or international card use signals. Unusual international activity for a cardholder who normally transacts domestically is a known fraud indicator." },
  { code: 'V24', label: 'Payment Method',            category: 'Authentication',
    description: "The method used to initiate the payment. A shift from the cardholder's usual method (e.g. from chip to contactless-only or online) raises this signal." },
  { code: 'V25', label: 'Transaction Sequencing',    category: 'Velocity',
    description: 'Order and pattern of transactions in the current session. An unusual sequence — many small transactions followed by a large one — is a known card-testing pattern.' },
  { code: 'V26', label: 'Spend Diversity',           category: 'Spend Pattern',
    description: 'Spread across merchant categories in the recent window. Fraudsters often spread purchases across categories to avoid velocity triggers on any single category.' },
  { code: 'V27', label: 'Chargeback Signals',        category: 'Account',
    description: 'Patterns associated with prior chargebacks or refund activity on the account. A history of disputed transactions raises the prior probability of fraud.' },
  { code: 'V28', label: 'Overall Risk',              category: 'Account',
    description: "Composite account-level risk indicator aggregating multiple signals from the cardholder's history. High values indicate the account has accumulated several risk factors." },
  { code: 'Amount', label: 'Transaction Amount',     category: 'Spend Pattern',
    description: 'The raw transaction amount. Note: in this dataset fraud transactions tend toward smaller amounts (median £9) vs genuine (median £22), so very large amounts can push the model away from fraud. The personal amount rule compensates for this.' },
  { code: 'Time',   label: 'Transaction Time',       category: 'Velocity',
    description: 'Time elapsed since the first transaction in the dataset, converted to a position in the 24-hour cycle. Transactions in the early hours (00:00–05:00) have a slightly higher fraud association.' },
]

const CATEGORIES = ['All', 'Velocity', 'Spend Pattern', 'Authentication', 'Location', 'Merchant', 'Account']

export default function FeatureReference() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = FEATURES.filter(f => {
    const matchCat = activeCategory === 'All' || f.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q || f.code.toLowerCase().includes(q) || f.label.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      <style>{CSS_VARS}</style>

      <AdminNav current="Feature Reference" />

      <div style={{ padding: '28px 24px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>V-Feature Reference</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 680, margin: 0 }}>
            V1–V28 are PCA-transformed features — original names were not disclosed by the dataset provider.
            Labels below are working assumptions based on fraud detection literature (Bahnsen et al. 2016, IEEE-CIS dataset).
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="search-box" placeholder="Search features..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="cat-select" value={activeCategory} onChange={e => setActiveCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} feature{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--tag-bg)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap', width: 70 }}>Code</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap', width: 180 }}>Label</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap', width: 130 }}>Category</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={f.code} className="feat-row" style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 700, color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', padding: '2px 7px', borderRadius: 4, border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                        {f.code}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{f.label}</td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--tag-bg)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                        {f.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', lineHeight: 1.6, verticalAlign: 'top' }}>{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>No features match your search.</div>
          )}
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--tag-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>Note:</strong> These are working assumptions, not verified feature definitions.
          V1–V28 were anonymised using PCA before the dataset was published. Read SHAP explanations as directional signals only.
        </div>
      </div>
    </div>
  )
}
