import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leadsAPI, analyticsAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, leadsRes] = await Promise.all([
        leadsAPI.getStats(),
        leadsAPI.getLeads({ limit: 10, sortBy: 'created_at', sortOrder: 'DESC' }),
      ]);

      setStats(statsRes.data.stats);
      setRecentLeads(leadsRes.data.leads);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Leads',
      value: stats?.total_leads || 0,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      name: 'Last 7 Days',
      value: stats?.last_7_days || 0,
      icon: '📅',
      color: 'bg-green-500',
    },
    {
      name: 'Last 30 Days',
      value: stats?.last_30_days || 0,
      icon: '📆',
      color: 'bg-purple-500',
    },
    {
      name: 'Verified Leads',
      value: stats?.verified_leads || 0,
      icon: '✅',
      color: 'bg-emerald-500',
    },
    {
      name: 'Enriched Leads',
      value: stats?.enriched_leads || 0,
      icon: '⭐',
      color: 'bg-yellow-500',
    },
    {
      name: 'Avg Lead Score',
      value: stats?.avg_lead_score ? Math.round(stats.avg_lead_score) : 0,
      icon: '🎯',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's your lead generation overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Leads */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Leads</h2>
          <Link to="/leads" className="text-primary-600 hover:text-primary-700 font-medium">
            View All →
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No leads yet</p>
            <p className="text-gray-400">
              Start extracting leads from LinkedIn using the Chrome extension
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Title
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Company
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Score
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {lead.full_name || lead.first_name}
                        </p>
                        <p className="text-sm text-gray-500">{lead.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {lead.title || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {lead.company_name || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.lead_score >= 80
                          ? 'bg-green-100 text-green-800'
                          : lead.lead_score >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.lead_score || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(lead.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
