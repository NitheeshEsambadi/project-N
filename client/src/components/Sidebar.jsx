import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Coins, 
  Package, 
  TrendingUp, 
  CreditCard, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';

const Sidebar = ({ user, logout }) => {
  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20}/>, roles: ['admin', 'accountant', 'worker'] },
    { name: 'Workers', path: '/workers', icon: <Users size={20}/>, roles: ['admin', 'accountant'] },
    { name: 'Gold Issue', path: '/gold', icon: <Coins size={20}/>, roles: ['admin', 'accountant'] },
    { name: 'Products', path: '/products', icon: <Package size={20}/>, roles: ['admin', 'accountant', 'worker'] },
    { name: 'Wastage', path: '/wastage', icon: <TrendingUp size={20}/>, roles: ['admin', 'accountant'] },
    { name: 'Payments', path: '/payments', icon: <CreditCard size={20}/>, roles: ['admin', 'accountant'] },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={20}/>, roles: ['admin', 'accountant'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={20}/>, roles: ['admin'] },
  ];

  return (
    <div className="glass" style={{ 
      width: '260px', 
      height: 'calc(100vh - 40px)', 
      margin: '20px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '40px' }}>
        <h3 className="gold-gradient">PRO PORTAL</h3>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role.toUpperCase()}</p>
      </div>

      <div style={{ flex: 1 }}>
        {links.filter(link => link.roles.includes(user?.role)).map(link => (
          <NavLink 
            key={link.name} 
            to={link.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '8px',
              color: isActive ? 'var(--primary-gold)' : 'var(--text-muted)',
              background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
              transition: 'var(--transition)'
            })}
          >
            {link.icon}
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{link.name}</span>
          </NavLink>
        ))}
      </div>

      <button onClick={logout} style={{ 
        background: 'transparent', 
        border: 'none', 
        color: 'var(--danger)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        padding: '12px 16px',
        cursor: 'pointer',
        fontSize: '0.9rem'
      }}>
        <LogOut size={20}/>
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
