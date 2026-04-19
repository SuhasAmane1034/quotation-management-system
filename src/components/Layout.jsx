import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusSquare, Package, Boxes, Settings, Zap, LogOut, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/quotations', icon: FileText, label: 'Quotations' },
      { to: '/quotations/new', icon: PlusSquare, label: 'New Quotation' },
    ]
  },
  {
    label: 'Catalog',
    items: [
      { to: '/products', icon: Package, label: 'Products' },
      { to: '/inventory', icon: Boxes, label: 'Inventory' },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  }
];

export default function Layout() {
  const { user, settings, signOut, updateSettings } = useApp();
  const isDark = settings?.dark_mode === true || settings?.dark_mode === 'true';

  const toggleDark = () => {
    updateSettings({ ...settings, dark_mode: !isDark });
  };

  const initials = (user?.user_metadata?.name || user?.email || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark"><Zap size={18} color="white" /></div>
          <div>
            <div className="sidebar-logo-text">QuoteFlow</div>
            <div className="sidebar-logo-sub">LED Solutions Pro</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map(group => (
            <div key={group.label}>
              <div className="nav-section-label">{group.label}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/quotations'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={17} className="nav-icon" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={toggleDark} style={{ color: 'rgba(255,255,255,0.5)', flex: 1, justifyContent: 'center' }} title="Toggle dark mode">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={signOut} style={{ color: 'rgba(255,255,255,0.5)', flex: 1, justifyContent: 'center' }} title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
