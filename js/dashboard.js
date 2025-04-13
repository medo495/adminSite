// Chart.js setup for Monthly Earnings and Expenses Analysis
const earningsCtx = document.getElementById('earningsChart').getContext('2d');
const expensesCtx = document.getElementById('expensesChart').getContext('2d');

const earningsChart = new Chart(earningsCtx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Earnings ($)',
            data: [5000, 7000, 8000, 9000, 8500, 9200, 10000, 11000, 12000, 13000, 14000, 15000],
            borderColor: '#007bff',
            borderWidth: 2,
            fill: false
        }]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Monthly Earnings'
            }
        }
    }
});

const expensesChart = new Chart(expensesCtx, {
    type: 'bar',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Expenses ($)',
            data: [3000, 4000, 5000, 4000, 4500, 5000, 6000, 6500, 7000, 7500, 8000, 8500],
            backgroundColor: '#ff6347',
            borderColor: '#ff6347',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Monthly Expenses'
            }
        }
    }
});

// Fetch data from Django REST Framework APIs
async function fetchData(url) {
    const accessToken = localStorage.getItem('access_token');
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });
    if (response.status === 401) {
        refreshToken();
        throw new Error("Token expired");
    }
    if (!response.ok) {
        throw new Error("Error fetching data");
    }
    return await response.json();
}

// Refresh token function
function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    fetch("http://127.0.0.1:8000/token/refresh/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh: refreshToken })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to refresh token");
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('access_token', data.access_token);
        console.log("Token refreshed successfully.");
        initDashboard(); // Reload dashboard data
    })
    .catch(error => {
        console.error("Error refreshing token:", error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = "login.html"; // Redirect to login page
    });
}

// Load key metrics
async function loadKeyMetrics() {
    try {
        const data = await fetchData('/api/key-metrics/');
        document.getElementById('total-users').textContent = data.total_users;
        document.getElementById('active-providers').textContent = data.active_providers;
        document.getElementById('completed-bookings').textContent = data.completed_bookings;
        document.getElementById('customer-satisfaction').textContent = data.customer_satisfaction;
    } catch (error) {
        console.error("Error loading key metrics:", error);
    }
}

// Load booking trends chart
async function loadBookingTrendsChart() {
    try {
        const data = await fetchData('/api/booking-trends/');
        const ctx = document.getElementById('bookingTrendsChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Bookings',
                    data: data.values,
                    borderColor: '#007bff',
                    fill: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    } catch (error) {
        console.error("Error loading booking trends chart:", error);
    }
}

// Load service categories chart
async function loadServiceCategoriesChart() {
    try {
        const data = await fetchData('/api/service-categories/');
        const ctx = document.getElementById('serviceCategoriesChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Popularity',
                    data: data.values,
                    backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    } catch (error) {
        console.error("Error loading service categories chart:", error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const data = await fetchData('/api/recent-activity/');
        const tableBody = document.querySelector('#recent-activity-table tbody');
        tableBody.innerHTML = data.map(activity => `
            <tr>
                <td>${activity.type}</td>
                <td>${activity.description}</td>
                <td>${activity.date}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error loading recent activity:", error);
    }
}

// Initialize dashboard
async function initDashboard() {
    try {
        await loadKeyMetrics();
        await loadBookingTrendsChart();
        await loadServiceCategoriesChart();
        await loadRecentActivity();
    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initDashboard);









