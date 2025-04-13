document.addEventListener('DOMContentLoaded', function() {
    // Fetch requests when page loads
    fetchRequests();
    
    // Setup search functionality
    setupSearch();
});

// Function to fetch requests from API
function fetchRequests(retry = true) {
    const accessToken = localStorage.getItem('access_token');
    
    fetch("http://127.0.0.1:8000/requests/?expand=user,service", {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            if (retry) {
                // Attempt to refresh token and retry
                return refreshToken()
                    .then(() => fetchRequests(false)); // Retry only once
            }
            throw new Error("Token expired - Please login again");
        }
        if (!response.ok) {
            throw new Error("Failed to fetch requests");
        }
        return response.json();
    })
    .then(data => {
        populateRequestsTable(data);
    })
    .catch(error => {
        console.error("Error fetching requests:", error);
        showAlert(error.message, "danger");
        
        // Redirect to login if token is invalid
        if (error.message.includes("Please login again")) {
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        }
    });
}

// Modify the populateRequestsTable function to include the consultation button
async function populateRequestsTable(requests) {
    const tableBody = document.getElementById('requestsTableBody');
    tableBody.innerHTML = ''; // Clear existing rows

    for (const request of requests) {
        const user = typeof request.user === 'object' ? request.user : await fetchUserDetails(request.user);
        const service = typeof request.service === 'object' ? request.service : await fetchServiceDetails(request.service);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.request_id || 'N/A'}</td>
            <td>${user.username || `User ${user.id}`}</td>
            <td>${service.service_name || `Service ${service.id}`}</td>
            <td>${formatDatesForDisplay(request.selected_dates)}</td>
            <td>${formatStatus(request.request_status)}</td>
            <td>
                <div class="d-flex">
                    <!-- Consultation Button -->
                    <button class="btn btn-sm btn-info me-1" onclick="showRequestDetails(${request.request_id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    
                    <!-- Approve Button - Only show if status is pending -->
                    ${request.request_status === 'Pending' ? `
                    <button class="btn btn-sm btn-success me-1" onclick="approveRequest(${request.request_id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    ` : ''}
                    
                    <!-- Reject Button -->
                    <button class="btn btn-sm btn-danger" onclick="deleteRequest(${request.request_id})">
                        <i class="fas fa-trash"></i> Reject
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    }
}

async function fetchUserDetails(userId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/users/${userId}/`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        return await response.json();
    } catch (error) {
        return {id: userId, username: `User ${userId}`};
    }
}

async function fetchServiceDetails(serviceId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/services/${serviceId}/`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        return await response.json();
    } catch (error) {
        return {id: serviceId, service_name: `Service ${serviceId}`};
    }
}
// Improved date/time formatting function to handle objects, arrays, and strings
function formatDatesForDisplay(dates) {
    if (!dates || typeof dates !== 'object') {
        return '<span class="text-muted small">No dates/times selected</span>';
    }

    // Handle different date/time formats:
    // Format 1: {'date1': '04/05/2025 14:30', 'date2': '07/14/2025 09:00'}
    // Format 2: [{'date': '04/05/2025', 'time': '14:30'}, {...}]
    const dateEntries = Array.isArray(dates) ? 
        dates.map((item, index) => [`Slot ${index + 1}`, item]) : 
        Object.entries(dates);
    
    if (dateEntries.length === 0) {
        return '<span class="text-muted small">No dates/times selected</span>';
    }

    // Create styled date/time elements
    const formattedDates = dateEntries.map(([key, dateTime]) => {
        const formattedDateTime = safeFormatDateTime(dateTime);
        return `
            <div class="d-flex align-items-center mb-1">
                <span class="badge bg-light text-dark me-2 small">
                    <i class="fas fa-calendar-day me-1"></i>
                    ${key}:
                </span>
                <span class="fw-medium">${formattedDateTime}</span>
            </div>
        `;
    });

    return `
        <div class="date-container" style="max-width: 300px;">
            ${formattedDates.join('')}
        </div>
    `;
}

// Safe date/time formatter with multiple format support
function safeFormatDateTime(dateTime) {
    if (!dateTime) return '<span class="text-muted">Date/time not available</span>';
    
    // Handle object format: {date: '2025-04-05', time: '14:30'}
    if (typeof dateTime === 'object' && !(dateTime instanceof Date)) {
        if (dateTime.date && dateTime.time) {
            return formatDateTimeString(`${dateTime.date}T${dateTime.time}`);
        }
        return formatDateTimeString(JSON.stringify(dateTime));
    }
    
    // Handle string formats
    if (typeof dateTime === 'string') {
        // Check if it's just a date (2025-04-05)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTime)) {
            return formatDateOnly(dateTime);
        }
        // Check if it's date and time (2025-04-05T14:30 or 04/05/2025 14:30)
        return formatDateTimeString(dateTime);
    }
    
    // Handle Date objects
    if (dateTime instanceof Date) {
        return dateTime.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // If all else fails, return the raw value with a warning
    return `
        <span title="Original format: ${dateTime}">
            <i class="fas fa-exclamation-triangle text-warning me-1"></i>
            ${typeof dateTime === 'object' ? JSON.stringify(dateTime) : dateTime}
        </span>
    `;
}

// Format a date string with time
function formatDateTimeString(dateTimeStr) {
    try {
        // Normalize different date/time separators
        const normalized = dateTimeStr
            .replace(/\//g, '-')  // Convert slashes to hyphens
            .replace(' ', 'T');    // Convert space to T for ISO format
        
        const date = new Date(normalized);
        if (isNaN(date.getTime())) return dateTimeStr;
        
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return dateTimeStr;
    }
}

// Format date only (without time)
function formatDateOnly(dateStr) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

// Helper function to format dates with times
function formatDateTimes(dateTimes) {
    if (!dateTimes) return '';
    
    if (Array.isArray(dateTimes)) {
        return dateTimes.map(dt => safeFormatDateTime(dt)).join(', ');
    }
    
    return safeFormatDateTime(dateTimes);
}
// Enhanced status display with icons and better styling
function formatStatus(status) {
    if (!status) {
        // If status is null/undefined, check for alternative status fields
        status = 'unknown';
    }

    // Normalize the status string (trim whitespace, lowercase)
    const statusLower = String(status).trim().toLowerCase();
    let icon, badgeClass, displayText;

    switch(statusLower) {
        case 'pending':
        case 'pending_approval':
            icon = 'fa-clock';
            badgeClass = 'bg-warning text-dark';
            displayText = 'Pending';
            break;
        case 'approved':
        case 'accepted':
            icon = 'fa-check-circle';
            badgeClass = 'bg-success';
            displayText = 'Approved';
            break;
        case 'rejected':
        case 'denied':
            icon = 'fa-times-circle';
            badgeClass = 'bg-danger';
            displayText = 'Rejected';
            break;
        case 'completed':
        case 'fulfilled':
            icon = 'fa-check-square';
            badgeClass = 'bg-primary';
            displayText = 'Completed';
            break;
        case 'cancelled':
        case 'canceled':
            icon = 'fa-ban';
            badgeClass = 'bg-secondary';
            displayText = 'Cancelled';
            break;
        case 'in_progress':
        case 'processing':
            icon = 'fa-spinner fa-spin';
            badgeClass = 'bg-info';
            displayText = 'In Progress';
            break;
        default:
            // If we get an unrecognized status, display it as-is with a question mark
            icon = 'fa-question-circle';
            badgeClass = 'bg-info text-dark';
            displayText = String(status); // Show the actual status value
    }

    return `
        <span class="badge ${badgeClass} p-2">
            <i class="fas ${icon} me-1"></i>
            ${displayText}
        </span>
    `;
}


// Helper function to get status badge class
function getStatusBadgeClass(status) {
    switch(status?.toLowerCase()) {
        case 'pending': return 'bg-warning text-dark';
        case 'approved': return 'bg-success';
        case 'rejected': return 'bg-danger';
        case 'completed': return 'bg-primary';
        default: return 'bg-secondary';
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', performRequestsSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performRequestsSearch();
        });
    }
}

function performRequestsSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tableBody = document.getElementById('requestsTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    let hasMatches = false;

    for (let row of rows) {
        const cells = row.getElementsByTagName('td');
        let rowMatches = false;
        
        // Search all columns except actions (last column)
        for (let i = 0; i < cells.length - 1; i++) {
            const cellText = cells[i].textContent.toLowerCase();
            if (cellText.includes(searchTerm)) {
                rowMatches = true;
                break;
            }
        }
        
        row.style.display = rowMatches ? '' : 'none';
        if (rowMatches) hasMatches = true;
    }

    // Show no results message if needed
    if (!hasMatches && searchTerm) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.innerHTML = `
            <td colspan="6" class="text-center">No matching requests found</td>
        `;
        noResultsRow.id = 'noResultsMessage';
        tableBody.appendChild(noResultsRow);
    } else {
        const noResultsMsg = document.getElementById('noResultsMessage');
        if (noResultsMsg) noResultsMsg.remove();
    }
}
// function to handle approval
function approveRequest(requestId) {
    if (confirm('Are you sure you want to approve this request?')) {
        fetch(`http://127.0.0.1:8000/requests/${requestId}/approve/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) {
                const error = new Error(data.message || 'Approval failed');
                error.status = response.status;
                throw error;
            }
            return data;
        })
        .then(data => {
            alert(data.message || 'Request approved successfully!');
            fetchRequests(); // Refresh the list
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message || 'Failed to approve request');
        });
    }
}

// function to handle edit
function editRequest(requestId) {
    // Implement edit functionality
    console.log("Edit request:", requestId);
    window.location.href = `edit_request.html?id=${requestId}`;
}
//function to handle delete/rejection
function deleteRequest(requestId) {
    if (confirm("Are you sure you want to delete this request?")) {
        const accessToken = localStorage.getItem('access_token');
        
        fetch(`http://127.0.0.1:8000/requests/${requestId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json" // Explicitly ask for JSON
            }
        })
        .then(async (response) => {
            // First, check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Server returned: ${text}`);
            }

            // If it is JSON, proceed
            const data = await response.json();
            
            if (response.status === 401) {
                await refreshToken();
                throw new Error("Token expired - Please try again");
            }
            if (!response.ok) {
                throw new Error(data.message || "Delete failed");
            }
            
            showAlert("Request deleted successfully", "success");
            fetchRequests(); // Refresh the table
        })
        .catch(error => {
            console.error("Full delete error:", error);
            showAlert(`Delete failed: ${error.message}`, "danger");
        });
    }
}
// Utility functions (should be in a shared file)
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container-fluid');
    container.prepend(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Function to refresh the access token
function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    return fetch("http://127.0.0.1:8000/auth/refresh/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            refresh: refreshToken
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to refresh token");
        }
        return response.json();
    })
    .then(data => {
        // Store the new tokens
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
        }
    });
}


// Add this to your existing code

// Function to show request details in modal
async function showRequestDetails(requestId) {
    try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            throw new Error('No access token found. Please login again.');
        }

        // Show loading state
        const modal = new bootstrap.Modal(document.getElementById('requestDetailsModal'));
        modal.show();
        document.getElementById('modalRequestId').value = 'Loading...';
        
        // Fetch request details
        const response = await fetch(`http://127.0.0.1:8000/requests/${requestId}/?expand=user,service`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            try {
                await refreshToken();
                return showRequestDetails(requestId); // Retry with new token
            } catch (refreshError) {
                throw new Error('Session expired. Please login again.');
            }
        }

        // Handle other error statuses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const request = await response.json();
        
        // Validate response data
        if (!request || typeof request !== 'object') {
            throw new Error('Invalid request data received from server');
        }

        // Populate modal fields
        document.getElementById('modalRequestId').value = request.request_id || 'N/A';
        document.getElementById('modalRequestStatus').value = request.request_status || 'N/A';
        document.getElementById('modalCustomer').value = request.user?.username || `User ${request.user}`;
        document.getElementById('modalService').value = request.service?.service_name || `Service ${request.service}`;
        document.getElementById('modalRequirements').value = request.special_requirements || 'None';
        
        // Format dates for display
        const datesContainer = document.getElementById('modalSelectedDates');
        datesContainer.innerHTML = formatDatesForDisplay(request.selected_dates);
        
        // Only show provider assignment if status is pending
        const providerSection = document.getElementById('providerAssignmentSection');
        const saveBtn = document.getElementById('saveProviderBtn');
        
        if (request.request_status === 'Pending') {
            providerSection.style.display = 'block';
            saveBtn.style.display = 'block';
            await fetchAvailableProviders(request.service, request.selected_dates);
        } else {
            providerSection.style.display = 'none';
            saveBtn.style.display = 'none';
        }
        
        // Store current request ID for the save operation
        saveBtn.onclick = () => assignProvider(requestId);

    } catch (error) {
        console.error("Error in showRequestDetails:", error);
        
        // Update modal to show error state
        document.getElementById('modalRequestId').value = 'Error';
        document.getElementById('modalRequestStatus').value = 'N/A';
        document.getElementById('modalCustomer').value = 'Failed to load';
        document.getElementById('modalService').value = 'Failed to load';
        document.getElementById('modalRequirements').value = 'Failed to load details';
        document.getElementById('modalSelectedDates').innerHTML = 
            `<div class="alert alert-danger">${error.message}</div>`;
        
        // Hide provider assignment section
        document.getElementById('providerAssignmentSection').style.display = 'none';
        document.getElementById('saveProviderBtn').style.display = 'none';
        
        // Ensure modal is still shown even with errors
        const modal = new bootstrap.Modal(document.getElementById('requestDetailsModal'));
        modal.show();
    }
}

// Function to fetch available providers for a service and dates
function fetchAvailableProviders(serviceId, selectedDates) {
    const accessToken = localStorage.getItem('access_token');
    const selectElement = document.getElementById('providerSelect');
    
    // Clear existing options except the first one
    selectElement.innerHTML = '<option value="">Select a provider</option>';
    
    // First get the service category
    fetch(`http://127.0.0.1:8000/services/${serviceId}/`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            return refreshToken().then(() => fetchAvailableProviders(serviceId, selectedDates));
        }
        if (!response.ok) {
            throw new Error("Failed to fetch service details");
        }
        return response.json();
    })
    .then(service => {
        // Now fetch providers for this category
        return fetch(`http://127.0.0.1:8000/providers/?category=${service.category}`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to fetch providers");
        }
        return response.json();
    })
    .then(providers => {
        // Populate the select dropdown
        providers.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider.id;
            option.textContent = provider.username || `Provider ${provider.id}`;
            selectElement.appendChild(option);
        });
    })
    .catch(error => {
        console.error("Error fetching providers:", error);
        showAlert(`Failed to load providers: ${error.message}`, "danger");
    });
}

// Function to assign a provider to a request
function assignProvider(requestId) {
    const providerId = document.getElementById('providerSelect').value;
    if (!providerId) {
        showAlert("Please select a provider", "warning");
        return;
    }
    
    const accessToken = localStorage.getItem('access_token');
    
    fetch(`http://127.0.0.1:8000/requests/${requestId}/assign/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            provider_id: providerId
        })
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            const error = new Error(data.message || 'Assignment failed');
            error.status = response.status;
            throw error;
        }
        return data;
    })
    .then(data => {
        showAlert(data.message || 'Provider assigned successfully!', 'success');
        fetchRequests(); // Refresh the list
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('requestDetailsModal'));
        modal.hide();
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert(error.message || 'Failed to assign provider', 'danger');
    });
}

// Update your deleteRequest function to handle rejection
function deleteRequest(requestId) {
    if (confirm("Are you sure you want to reject and delete this request?")) {
        const accessToken = localStorage.getItem('access_token');
        
        fetch(`http://127.0.0.1:8000/requests/${requestId}/reject/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        })
        .then(async (response) => {
            const data = await response.json();
            
            if (response.status === 401) {
                await refreshToken();
                throw new Error("Token expired - Please try again");
            }
            if (!response.ok) {
                throw new Error(data.message || "Rejection failed");
            }
            
            showAlert("Request rejected and removed successfully", "success");
            fetchRequests(); // Refresh the table
        })
        .catch(error => {
            console.error("Full rejection error:", error);
            showAlert(`Rejection failed: ${error.message}`, "danger");
        });
    }
}