document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const reportsTableBody = document.getElementById('reportsTableBody');
    const searchInput = document.getElementById('searchReportInput');
    const searchButton = document.getElementById('searchReportButton');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Global variables
    let allReports = [];
    let filteredReports = [];
    
    // Fetch reports from backend
    async function fetchReports() {
        try {
            const response = await fetch('/api/reports');
            if (!response.ok) throw new Error('Failed to fetch reports');
            
            allReports = await response.json();
            filteredReports = [...allReports];
            renderReports();
        } catch (error) {
            console.error('Error fetching reports:', error);
            showErrorMessage('Failed to load reports. Please try again later.');
        }
    }
    
    // Render reports to the table
    function renderReports() {
        if (filteredReports.length === 0) {
            reportsTableBody.innerHTML = `
                <tr id="noDataMessage">
                    <td colspan="8" class="text-center">No reports found</td>
                </tr>
            `;
            return;
        }
        
        reportsTableBody.innerHTML = filteredReports.map(report => `
            <tr>
                <td>${report.report_id}</td>
                <td>${report.link_id}</td>
                <td>${report.user_id}</td>
                <td>${report.provider_id}</td>
                <td class="text-truncate" style="max-width: 200px;" title="${report.report_text}">
                    ${report.report_text}
                </td>
                <td>
                    <span class="badge ${getStatusBadgeClass(report.status)}">
                        ${report.status}
                    </span>
                </td>
                <td>${new Date(report.report_date).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-report" data-id="${report.report_id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${report.status === 'pending' ? `
                    <button class="btn btn-sm btn-success resolve-report" data-id="${report.report_id}">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
        // Add event listeners to action buttons
        document.querySelectorAll('.view-report').forEach(btn => {
            btn.addEventListener('click', viewReportDetails);
        });
        
        document.querySelectorAll('.resolve-report').forEach(btn => {
            btn.addEventListener('click', resolveReport);
        });
    }
    
    // Helper function to get badge class based on status
    function getStatusBadgeClass(status) {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-warning text-dark';
            case 'resolved': return 'bg-success';
            default: return 'bg-secondary';
        }
    }
    
    // Filter reports by status
    function filterReports(status) {
        if (status === 'all') {
            filteredReports = [...allReports];
        } else {
            filteredReports = allReports.filter(report => 
                report.status.toLowerCase() === status.toLowerCase()
            );
        }
        renderReports();
    }
    
    // Search reports
    function searchReports(query) {
        const lowerQuery = query.toLowerCase();
        filteredReports = allReports.filter(report => 
            report.report_id.toString().includes(lowerQuery) ||
            report.link_id.toString().includes(lowerQuery) ||
            report.user_id.toString().includes(lowerQuery) ||
            report.provider_id.toString().includes(lowerQuery) ||
            report.report_text.toLowerCase().includes(lowerQuery) ||
            report.status.toLowerCase().includes(lowerQuery)
        );
        renderReports();
    }
    
    // View report details
    async function viewReportDetails(e) {
        const reportId = e.currentTarget.getAttribute('data-id');
        try {
            const response = await fetch(`/api/reports/${reportId}`);
            if (!response.ok) throw new Error('Failed to fetch report details');
            
            const report = await response.json();
            // Show modal with report details
            showReportModal(report);
        } catch (error) {
            console.error('Error fetching report details:', error);
            showErrorMessage('Failed to load report details.');
        }
    }
    
    // Resolve report
    async function resolveReport(e) {
        const reportId = e.currentTarget.getAttribute('data-id');
        try {
            const response = await fetch(`/api/reports/${reportId}/resolve`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to resolve report');
            
            // Refresh reports
            fetchReports();
            showSuccessMessage('Report resolved successfully!');
        } catch (error) {
            console.error('Error resolving report:', error);
            showErrorMessage('Failed to resolve report.');
        }
    }
    
    // Show report modal
    function showReportModal(report) {
        // You would implement your modal here
        console.log('Showing report details:', report);
        alert(`Report Details:\n\nID: ${report.report_id}\nStatus: ${report.status}\n\n${report.report_text}`);
    }
    
    // Show error message
    function showErrorMessage(message) {
        // Implement your error notification system
        alert('Error: ' + message);
    }
    
    // Show success message
    function showSuccessMessage(message) {
        // Implement your success notification system
        alert('Success: ' + message);
    }
    
    // Event Listeners
    searchButton.addEventListener('click', () => searchReports(searchInput.value));
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') searchReports(searchInput.value);
    });
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => filterReports(btn.getAttribute('data-status')));
    });
    
    // Initial fetch
    fetchReports();
});