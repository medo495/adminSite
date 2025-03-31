document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let evaluations = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let filteredEvaluations = [];
    
    // DOM Elements
    const evaluationsTable = document.getElementById('evaluationsTable');
    const tableBody = evaluationsTable.querySelector('tbody');
    const pagination = document.getElementById('pagination');
    const totalRatingsEl = document.getElementById('totalRatings');
    const avgRatingEl = document.getElementById('avgRating');
    const fiveStarRatingsEl = document.getElementById('fiveStarRatings');
    const lowRatingsEl = document.getElementById('lowRatings');
    const ratingFilter = document.getElementById('ratingFilter');
    const dateFilter = document.getElementById('dateFilter');
    const serviceFilter = document.getElementById('serviceFilter');
    const applyFiltersBtn = document.getElementById('applyFilters');
    
    // Initialize the page
    async function init() {
        await fetchEvaluations();
        populateServiceFilter();
        applyFilters();
        updateSummaryCards();
    }
//---------------------------------------------------------------------------------------------------- 
    // Fetch evaluations from API
    async function fetchEvaluations() {
        try {
            // First try the direct endpoint
            let evaluations = await tryFetchEvaluations();
            
            // If that fails with 405, try alternative approaches
            if (evaluations === null) {
                evaluations = await tryAlternativeApproach();
            }
    
            displayEvaluations(evaluations || []);
            
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Could not load evaluations');
            displayEvaluations([]); // Show empty state
        }
    }
    
    async function tryFetchEvaluations() {
        try {
            const response = await fetch('http://localhost:8000/evaluation/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch {
            return null;
        }
    }
    
    async function tryAlternativeApproach() {
        // Try to get evaluations through related endpoints
        // For example, if evaluations are linked to requests:
        try {
            const requests = await fetch('http://localhost:8000/requests/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            }).then(r => r.json());
            
            // Extract evaluations from requests if they're embedded
            return requests.flatMap(request => request.evaluations || []);
        } catch {
            return [];
        }
    }
    
    function displayEvaluations(evaluations) {
        const tableBody = document.querySelector('#evaluationsTable tbody');
        tableBody.innerHTML = '';
    
        if (evaluations.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        No evaluations available or unable to load data
                    </td>
                </tr>
            `;
            return;
        }
    
        // ... rest of your display code ...
    }
    
    // Initialize
    document.addEventListener('DOMContentLoaded', fetchEvaluations);
    
    function displayEvaluations(evaluations) {
        const tableBody = document.querySelector('#evaluationsTable tbody');
        tableBody.innerHTML = '';
    
        if (!evaluations || evaluations.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No evaluations found</td>
                </tr>
            `;
            return;
        }
    
        evaluations.forEach(evaluation => {
            // Safely access nested properties
            const userName = evaluation.link?.request?.user?.username || 'N/A';
            const providerName = evaluation.link?.provider?.fullname || 'N/A';
            const serviceName = evaluation.link?.request?.service?.service_name || 'N/A';
    
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${evaluation.evaluation_id}</td>
                <td>${userName}</td>
                <td>${providerName}</td>
                <td>${serviceName}</td>
                <td>
                    ${'★'.repeat(evaluation.rating)}${'☆'.repeat(5 - evaluation.rating)}
                    (${evaluation.rating}/5)
                </td>
                <td>${evaluation.comment || 'No comment'}</td>
                <td>${new Date(evaluation.evaluation_date).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" 
                            onclick="editEvaluation(${evaluation.evaluation_id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="deleteEvaluation(${evaluation.evaluation_id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Initialize when page loads
    document.addEventListener('DOMContentLoaded', fetchEvaluations);
    function displayEvaluations(evaluations) {
        const tableBody = document.querySelector('#evaluationsTable tbody');
        tableBody.innerHTML = '';
    
        if (evaluations.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No evaluations found</td>
                </tr>
            `;
            return;
        }
    
        evaluations.forEach(eval => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${eval.evaluation_id}</td>
                <td>${eval.link?.request?.user?.username || 'N/A'}</td>
                <td>${eval.link?.provider?.fullname || 'N/A'}</td>
                <td>${eval.link?.request?.service?.service_name || 'N/A'}</td>
                <td>
                    ${'★'.repeat(eval.rating)}${'☆'.repeat(5 - eval.rating)}
                    (${eval.rating}/5)
                </td>
                <td>${eval.comment || 'No comment'}</td>
                <td>${new Date(eval.evaluation_date).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" 
                            onclick="editEvaluation(${eval.evaluation_id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="deleteEvaluation(${eval.evaluation_id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Helper function to show alerts
    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container') || document.body;
        container.prepend(alertDiv);
        
        setTimeout(() => alertDiv.remove(), 5000);
    }
    
    // Initialize when page loads
    document.addEventListener('DOMContentLoaded', fetchEvaluations);
    
    // Populate service filter dropdown
    function populateServiceFilter() {
        const services = [...new Set(evaluations.map(eval => eval.service))];
        serviceFilter.innerHTML = '<option value="all">All Services</option>';
        
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service;
            option.textContent = service;
            serviceFilter.appendChild(option);
        });
    }
    
    // Apply filters
    function applyFilters() {
        filteredEvaluations = [...evaluations];
        
        // Rating filter
        const ratingValue = ratingFilter.value;
        if (ratingValue !== 'all') {
            filteredEvaluations = filteredEvaluations.filter(eval => eval.rating === parseInt(ratingValue));
        }
        
        // Date filter
        const dateValue = dateFilter.value;
        if (dateValue !== 'all') {
            const now = new Date();
            filteredEvaluations = filteredEvaluations.filter(eval => {
                const evalDate = new Date(eval.evaluation_date);
                
                if (dateValue === 'today') {
                    return evalDate.toDateString() === now.toDateString();
                } else if (dateValue === 'week') {
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    return evalDate >= startOfWeek;
                } else if (dateValue === 'month') {
                    return evalDate.getMonth() === now.getMonth() && evalDate.getFullYear() === now.getFullYear();
                }
                return true;
            });
        }
        
        // Service filter
        const serviceValue = serviceFilter.value;
        if (serviceValue !== 'all') {
            filteredEvaluations = filteredEvaluations.filter(eval => eval.service === serviceValue);
        }
        
        currentPage = 1;
        renderTable();
        updatePagination();
        updateSummaryCards();
    }
    
    // Render evaluations table
    function renderTable() {
        tableBody.innerHTML = '';
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredEvaluations.length);
        const paginatedData = filteredEvaluations.slice(startIndex, endIndex);
        
        if (paginatedData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" class="text-center py-4">No evaluations found</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        paginatedData.forEach(evaluation => {
            const row = document.createElement('tr');
            
            // Create rating stars
            const stars = [];
            for (let i = 1; i <= 5; i++) {
                stars.push(i <= evaluation.rating 
                    ? '<i class="fas fa-star text-warning"></i>' 
                    : '<i class="far fa-star text-warning"></i>');
            }
            
            row.innerHTML = `
                <td>${evaluation.evaluation_id}</td>
                <td>${evaluation.user}</td>
                <td>${evaluation.provider}</td>
                <td>${evaluation.service}</td>
                <td>${stars.join('')} (${evaluation.rating})</td>
                <td>${evaluation.comment || 'No comment'}</td>
                <td>${new Date(evaluation.evaluation_date).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-evaluation" data-id="${evaluation.evaluation_id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-evaluation').forEach(btn => {
            btn.addEventListener('click', handleDeleteEvaluation);
        });
    }
    
    // Update pagination
    function updatePagination() {
        pagination.innerHTML = '';
        const totalPages = Math.ceil(filteredEvaluations.length / itemsPerPage);
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                renderTable();
                updatePagination();
            }
        });
        pagination.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                renderTable();
                updatePagination();
            });
            pagination.appendChild(li);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                updatePagination();
            }
        });
        pagination.appendChild(nextLi);
    }
    
    // Update summary cards
    function updateSummaryCards() {
        totalRatingsEl.textContent = filteredEvaluations.length;
        
        if (filteredEvaluations.length > 0) {
            const totalRating = filteredEvaluations.reduce((sum, eval) => sum + eval.rating, 0);
            const averageRating = (totalRating / filteredEvaluations.length).toFixed(1);
            avgRatingEl.textContent = averageRating;
            
            const fiveStarCount = filteredEvaluations.filter(eval => eval.rating === 5).length;
            fiveStarRatingsEl.textContent = fiveStarCount;
            
            const lowRatingCount = filteredEvaluations.filter(eval => eval.rating <= 2).length;
            lowRatingsEl.textContent = lowRatingCount;
        } else {
            avgRatingEl.textContent = '0.0';
            fiveStarRatingsEl.textContent = '0';
            lowRatingsEl.textContent = '0';
        }
    }
    
    // Handle delete evaluation
    async function handleDeleteEvaluation(e) {
        const evaluationId = e.currentTarget.getAttribute('data-id');
        
        if (confirm('Are you sure you want to delete this evaluation?')) {
            try {
                const response = await fetch(`/api/evaluation/${evaluationId}/`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                });
                
                if (response.ok) {
                    showAlert('success', 'Evaluation deleted successfully');
                    await fetchEvaluations();
                    applyFilters();
                } else {
                    throw new Error('Failed to delete evaluation');
                }
            } catch (error) {
                console.error('Error deleting evaluation:', error);
                showAlert('danger', 'Failed to delete evaluation. Please try again.');
            }
        }
    }
    
    // Helper function to get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // Show alert message
    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    
    // Event listeners
    applyFiltersBtn.addEventListener('click', applyFilters);
    
    // Initialize the page
    init();
});