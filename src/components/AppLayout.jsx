import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Boxes, Moon, Sun, LogOut, Menu, X, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useToast } from './Toast.jsx';

const NAV = [
  { section: 'Overview' },
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { section: 'Operations' },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/sales', label: 'Sales & POS', icon: ShoppingCart },
  { section: 'Insights' },
  { to: '/inventory?lowStock=1', label: 'Alerts', icon: ClipboardList },
];

export default function AppLayout() {
  const { user, logout, isManager } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // mobile drawer

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed — please try again.');
    }
  };

  const link = ({ to, label, icon: Icon, end }) => (
    <NavLink
      key={label}
      to={to}
      end={end}
      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      onClick={() => setOpen(false)}
    >
      <Icon size={18} /> {label}
    </NavLink>
  );

  return (

    <div className="shell">
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar-brand">
          <span className="logo-badge"><Boxes size={18} /> </span> <div id='title-style'> PHÉNIX-PLUS <br/> <span id="Boissons-title">Boissons Gazeuses & alcoolisées</span></div> 
        </div>

        <nav className="nav">
          {NAV.map((item) =>
            item.section
              ? <div key={item.section} className="nav-section">{item.section}</div>
              : link(item)
          )}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{user?.name?.slice(0, 1).toUpperCase()}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div className="muted" style={{ fontSize: '0.72rem' }}>{user?.role}</div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost btn-sm hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <strong style={{ fontSize: '0.95rem' }}>{isManager ? 'Manager Console' : 'Point of Sale'}</strong>
          <div className="spacer" />
          <button className="btn btn-ghost btn-sm" onClick={toggle} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} aria-label="Log out">
            <LogOut size={18} />
          </button>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
