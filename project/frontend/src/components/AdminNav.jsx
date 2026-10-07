import { Link, useNavigate } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/admin/dashboard',  label: 'Dashboard' },
  { to: '/admin/comparison', label: 'Model Comparison' },
  { to: '/admin/rules',      label: 'Rules' },
  { to: '/admin/features',   label: 'Feature Reference' },
  { to: '/admin/history',    label: 'History' },
]

export default function AdminNav({ current }) {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('isAdmin')
    navigate('/admin/login')
  }

  return (
    <nav style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', height: 52, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Brand + current page */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          FraudGuard <span style={{ color: 'var(--border)', margin: '0 6px' }}>|</span>
          <span style={{ color: 'var(--text)' }}>{current}</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {NAV_LINKS.map((link, i) => {
            const isActive = link.label === current
            return (
              <span key={link.to} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {i > 0 && <span style={{ color: 'var(--border)', padding: '0 2px' }}>·</span>}
                {isActive
                  ? <span style={{ fontSize: 11, color: 'var(--accent)', padding: '2px 8px', fontWeight: 600 }}>{link.label}</span>
                  : <Link to={link.to} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 8px', textDecoration: 'none' }}>{link.label}</Link>
                }
              </span>
            )
          })}
        </div>
      </div>

      <button onClick={handleLogout} style={{
        fontSize: 12, color: 'var(--text-muted)', background: 'none',
        border: '1px solid var(--border)', borderRadius: 5, padding: '4px 12px', cursor: 'pointer',
      }}>
        Sign out
      </button>
    </nav>
  )
}
