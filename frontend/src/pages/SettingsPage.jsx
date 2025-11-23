import React, { useState } from 'react';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';

function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'subscription', name: 'Subscription', icon: '💳' },
    { id: 'api', name: 'API Keys', icon: '🔑' },
    { id: 'integrations', name: 'Integrations', icon: '🔌' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account, subscription, and integrations
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Profile Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="input"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  className="input"
                  defaultValue={user?.first_name || ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  className="input"
                  defaultValue={user?.last_name || ''}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                className="input"
                defaultValue={user?.company_name || ''}
              />
            </div>

            <button
              onClick={() => toast.success('Profile updated!')}
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Subscription Plan
          </h2>

          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 capitalize">
                  {user?.subscription_tier} Plan
                </h3>
                <p className="text-gray-600 mt-1">
                  Status: <span className="font-medium capitalize">{user?.subscription_status}</span>
                </p>
              </div>
              <button className="btn btn-primary">
                Upgrade Plan
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Monthly Leads Limit</span>
              <span className="font-medium">2,500 / 2,500</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Email Verifications</span>
              <span className="font-medium">1,843 / 2,500</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Data Enrichments</span>
              <span className="font-medium">234 / 500</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            API Keys
          </h2>

          <p className="text-gray-600 mb-6">
            Use API keys to integrate Lead Generator Pro with your applications
          </p>

          <button
            onClick={() => toast.success('API key generated!')}
            className="btn btn-primary mb-6"
          >
            + Generate New API Key
          </button>

          <div className="border border-gray-200 rounded-lg">
            <div className="p-4 bg-gray-50 border-b">
              <p className="text-sm text-gray-500">No API keys yet</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            CRM Integrations
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {['Salesforce', 'HubSpot', 'Pipedrive', 'Zapier'].map((integration) => (
              <div
                key={integration}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{integration}</h3>
                  <p className="text-sm text-gray-500">Not connected</p>
                </div>
                <button className="btn btn-secondary">
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
