import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function AnalyticsPage() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await analyticsAPI.getDashboardStats();
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
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

  // Mock data for charts (replace with actual API data)
  const leadGrowthData = [
    { name: 'Week 1', leads: 45 },
    { name: 'Week 2', leads: 78 },
    { name: 'Week 3', leads: 92 },
    { name: 'Week 4', leads: 125 },
  ];

  const qualityDistribution = [
    { name: 'High (80+)', value: 35 },
    { name: 'Medium (60-79)', value: 45 },
    { name: 'Low (40-59)', value: 15 },
    { name: 'Poor (<40)', value: 5 },
  ];

  const sourceDistribution = [
    { name: 'LinkedIn', value: 180 },
    { name: 'Manual', value: 25 },
    { name: 'Import', value: 15 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track your lead generation performance and quality metrics
        </p>
      </div>

      {/* Lead Growth Chart */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Lead Growth (Last 4 Weeks)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={leadGrowthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="leads"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quality Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Lead Quality Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={qualityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {qualityDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Source Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Lead Sources
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sourceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Verification Rate
          </h3>
          <p className="text-3xl font-bold text-gray-900">78%</p>
          <p className="text-sm text-green-600 mt-2">↑ 5% from last month</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Avg Lead Score
          </h3>
          <p className="text-3xl font-bold text-gray-900">72</p>
          <p className="text-sm text-green-600 mt-2">↑ 8 points</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Conversion Rate
          </h3>
          <p className="text-3xl font-bold text-gray-900">12.5%</p>
          <p className="text-sm text-red-600 mt-2">↓ 2% from last month</p>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
