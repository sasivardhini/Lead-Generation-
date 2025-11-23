import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { leadsAPI, exportAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    minScore: '',
  });

  useEffect(() => {
    loadLeads();
  }, [pagination.page, filters]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const response = await leadsAPI.getLeads({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      setLeads(response.data.leads);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
      }));
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;

    try {
      await leadsAPI.deleteLead(id);
      toast.success('Lead deleted');
      loadLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleExport = async (format) => {
    try {
      toast.loading('Creating export...');
      const response = await exportAPI.createExport(format, filters);
      const exportId = response.data.export.id;

      // Poll for completion
      const checkStatus = async () => {
        const statusRes = await exportAPI.getExportStatus(exportId);
        if (statusRes.data.export.status === 'completed') {
          const blob = await exportAPI.downloadExport(exportId);
          const url = window.URL.createObjectURL(blob.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = `leads-export.${format}`;
          a.click();
          toast.dismiss();
          toast.success('Export downloaded!');
        } else if (statusRes.data.export.status === 'failed') {
          toast.dismiss();
          toast.error('Export failed');
        } else {
          setTimeout(checkStatus, 2000);
        }
      };

      checkStatus();
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export leads');
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-600 mt-2">
          Manage and organize your extracted LinkedIn leads
        </p>
      </div>

      {/* Filters & Actions */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              className="input"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          {/* Status Filter */}
          <select
            className="input lg:w-48"
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
          </select>

          {/* Min Score Filter */}
          <select
            className="input lg:w-48"
            value={filters.minScore}
            onChange={(e) =>
              setFilters({ ...filters, minScore: e.target.value })
            }
          >
            <option value="">All Scores</option>
            <option value="80">High Quality (80+)</option>
            <option value="60">Medium Quality (60+)</option>
            <option value="40">Low Quality (40+)</option>
          </select>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="btn btn-secondary"
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="btn btn-secondary"
            >
              📑 Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No leads found</p>
            <p className="text-gray-400">
              Try adjusting your filters or extract new leads from LinkedIn
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Title
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Company
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Location
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Score
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Added
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {lead.full_name || `${lead.first_name} ${lead.last_name}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {lead.email}
                          </p>
                          {lead.linkedin_url && (
                            <a
                              href={lead.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:underline"
                            >
                              View LinkedIn →
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {lead.title || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {lead.company_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {lead.location || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.lead_score >= 80
                              ? 'bg-green-100 text-green-800'
                              : lead.lead_score >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {lead.lead_score || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {lead.status || 'new'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(lead.created_at), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {leads.length} of {pagination.total.toLocaleString()}{' '}
                leads
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  ← Previous
                </button>
                <span className="px-4 py-2 text-sm">
                  Page {pagination.page} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page >= totalPages}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LeadsPage;
