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
  LogOut,
  X,
  ShieldCheck,
  Briefcase,
  ShoppingCart,
  Receipt,
  User
} from 'lucide-react';

const Sidebar = ({ user, logout, closeSidebar, company }) => {
  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20}/>, roles: ['admin', 'accountant', 'worker'] },
    { name: 'Customers', path: '/customers', icon: <User size={20}/>, roles: ['admin', 'accountant', 'worker'] },
    { name: 'Workers', path: '/workers', icon: <Users size={20}/>, roles: ['admin', 'accountant'] },
    { name: 'Production', path: '/products', icon: <Briefcase size={20}/>, roles: ['admin', 'accountant', 'worker'] },
    { name: 'Inventory', path: '/inventory', icon: <Package size={20}/>, roles: ['admin', 'accountant', 'worker'] },
    { name: 'Sales', path: '/sales', icon: <ShoppingCart size={20}/>, roles: ['admin', 'accountant'] },
    { name: 'Billing', path: '/billing', icon: <Receipt size={20}/>, roles: ['admin', 'accountant', 'worker'] },
    { name: 'Wastage', path: '/wastage', icon: <TrendingUp size={20}/>, roles: ['admin', 'accountant'] },
    { name: 'Payments', path: '/payments', icon: <CreditCard size={20}/>, roles: ['admin', 'accountant'] },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={20}/>, roles: ['admin', 'accountant'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={20}/>, roles: ['admin'] },
  ];

  return (
    <div className="glass-card" style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      borderRadius: 0,
      border: 'none'
    }}>
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {company?.logo ? (
            <img src={company.logo} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', background: 'var(--primary-gold)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {(company?.name || 'P')[0].toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="gold-gradient" style={{ margin: 0, fontSize: '1.1rem', textTransform: 'uppercase' }}>
              {company?.name || 'PRO PORTAL'}
            </h3>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{user?.role}</p>
          </div>
        </div>
        <button 
          className="glass" 
          onClick={closeSidebar}
          style={{ padding: '8px', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
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
