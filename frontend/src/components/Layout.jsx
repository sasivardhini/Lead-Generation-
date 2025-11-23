import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Leads', href: '/leads', icon: '👥' },
  { name: 'Analytics', href: '/analytics', icon: '📈' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

function Layout() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">
            🎯 Lead Gen Pro
          </h1>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.subscription_tier} Plan
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-3 text-gray-400 hover:text-gray-600"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="py-8 px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
