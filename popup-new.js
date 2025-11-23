const API_URL = 'http://localhost:3000/api/v1';

// DOM Elements
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loadingView = document.getElementById('loadingView');

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const viewDashboardBtn = document.getElementById('viewDashboardBtn');
const exportBtn = document.getElementById('exportBtn');

const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  showView('loading');
  await checkAuth();
});

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
openDashboardBtn.addEventListener('click', () => openDashboard());
viewDashboardBtn.addEventListener('click', () => openDashboard());
exportBtn.addEventListener('click', handleExport);

// Functions
async function checkAuth() {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);

    if (authToken) {
      // Verify token with backend
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        showDashboard(data.user);
      } else {
        // Token invalid, clear it
        await chrome.storage.local.remove(['authToken']);
        showView('login');
      }
    } else {
      showView('login');
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showView('login');
  }
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showError('Please enter email and password');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token
      await chrome.storage.local.set({ authToken: data.token });

      showSuccess('Logged in successfully!');
      setTimeout(() => {
        showDashboard(data.user);
      }, 1000);
    } else {
      showError(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Connection error. Make sure backend is running.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

async function handleLogout() {
  await chrome.storage.local.remove(['authToken']);
  showView('login');
  showSuccess('Logged out successfully');
}

async function showDashboard(user) {
  // Update user info
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('userPlan').textContent = `${user.subscription_tier} Plan`;

  // Load stats
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);

    const response = await fetch(`${API_URL}/leads/stats/summary`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      document.getElementById('totalLeads').textContent = data.stats.total_leads || 0;
      document.getElementById('todayLeads').textContent = data.stats.last_7_days || 0;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }

  showView('dashboard');
}

function openDashboard() {
  chrome.tabs.create({ url: 'http://localhost:5173' });
}

async function handleExport() {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);

    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting...';

    const response = await fetch(`${API_URL}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ format: 'csv' }),
    });

    if (response.ok) {
      showSuccess('Export started! Check the dashboard.');
    } else {
      showError('Export failed');
    }
  } catch (error) {
    console.error('Export error:', error);
    showError('Export failed');
  } finally {
    exportBtn.disabled = false;
    exportBtn.textContent = '📥 Export Leads';
  }
}

function showView(view) {
  loginView.classList.remove('active');
  dashboardView.classList.remove('active');
  loadingView.style.display = 'none';

  if (view === 'login') {
    loginView.classList.add('active');
  } else if (view === 'dashboard') {
    dashboardView.classList.add('active');
  } else if (view === 'loading') {
    loadingView.style.display = 'block';
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('active');
  setTimeout(() => {
    errorMessage.classList.remove('active');
  }, 5000);
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.classList.add('active');
  setTimeout(() => {
    successMessage.classList.remove('active');
  }, 3000);
}
