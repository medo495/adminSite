document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');
    const token = localStorage.getItem('token');
    
    if (!requestId) {
        alert('No request ID provided. Redirecting to requests list.');
        window.location.href = 'requests.html';
        return;
    }

    // DOM elements
    const requestIdField = document.getElementById('requestId');
    const userSelect = document.getElementById('userSelect');
    const serviceSelect = document.getElementById('serviceSelect');
    const providerSelect = document.getElementById('providerSelect');
    const statusSelect = document.getElementById('statusSelect');
    const selectedDatesList = document.getElementById('selectedDatesList');
    const editRequestForm = document.getElementById('editRequestForm');
    const deleteBtn = document.getElementById('deleteBtn');

    // Fetch request details
    function fetchRequestDetails() {
        fetch(`/api/requests/?id=${requestId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch request details');
            }
            return response.json();
        })
        .then(request => {
            // Populate form fields
            requestIdField.value = request.request_id;
            
            // User (beneficiary)
            const userOption = document.createElement('option');
            userOption.value = request.user.id;
            userOption.textContent = `${request.user.username} (${request.user.email})`;
            userSelect.appendChild(userOption);
            
            // Service
            const serviceOption = document.createElement('option');
            serviceOption.value = request.service.service_id;
            serviceOption.textContent = `${request.service.service_name} (${request.service.category})`;
            serviceSelect.appendChild(serviceOption);
            
            // Provider (if linked)
            if (request.provider) {
                const providerOption = document.createElement('option');
                providerOption.value = request.provider.id;
                providerOption.textContent = `${request.provider.user.username} - ${request.provider.specialization}`;
                providerSelect.appendChild(providerOption);
            } else {
                const providerOption = document.createElement('option');
                providerOption.textContent = 'No provider assigned';
                providerOption.disabled = true;
                providerSelect.appendChild(providerOption);
            }
            
            // Status
            statusSelect.value = request.request_status;
            
            // Selected dates
            let datesArray;
            try {
                datesArray = Array.isArray(request.selected_dates) ? 
                    request.selected_dates : 
                    JSON.parse(request.selected_dates);
            } catch (e) {
                datesArray = ['Invalid date format'];
            }
            
            datesArray.forEach(date => {
                const dateElement = document.createElement('span');
                dateElement.className = 'selected-date';
                dateElement.textContent = date;
                selectedDatesList.appendChild(dateElement);
            });
        })
        .catch(error => {
            console.error('Error fetching request details:', error);
            alert('Failed to load request details. Please try again.');
        });
    }

    // Form submission
    editRequestForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const requestData = {
            request_status: statusSelect.value
        };
        
        fetch(`/api/requests/?id=${requestId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update request');
            }
            return response.json();
        })
        .then(data => {
            alert('Request updated successfully!');
            window.location.href = 'requests.html';
        })
        .catch(error => {
            console.error('Error updating request:', error);
            alert('Failed to update request. Please try again.');
        });
    });

    // Delete request
    deleteBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this request?')) {
            fetch(`/api/requests/?id=${requestId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete request');
                }
                return response.json();
            })
            .then(() => {
                alert('Request deleted successfully');
                window.location.href = 'requests.html';
            })
            .catch(error => {
                console.error('Error deleting request:', error);
                alert('Failed to delete request. Please try again.');
            });
        }
    });

    // Initialize
    fetchRequestDetails();
});