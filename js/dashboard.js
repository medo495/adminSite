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
