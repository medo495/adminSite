document.addEventListener('DOMContentLoaded', function() {
    const userSelect = document.getElementById('userSelect');
    const serviceSelect = document.getElementById('serviceSelect');
    const providerSelect = document.getElementById('providerSelect');
    const addDateBtn = document.getElementById('addDateBtn');
    const selectedDatesList = document.getElementById('selectedDatesList');
    const addRequestForm = document.getElementById('addRequestForm');
    const token = localStorage.getItem('token');
    let selectedDates = [];

 //---------------------------------------------------------------------------------------------------------   
    // Fetch users and populate dropdown
    function fetchUsers(retry = true) {
        const accessToken = localStorage.getItem('access_token');
        
        fetch("http://127.0.0.1:8000/users/", {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (response.status === 401) {
                if (retry) {
                    return refreshToken()
                        .then(() => fetchBeneficiaries(false));
                }
                throw new Error("Token expired - Please login again");
            }
            if (!response.ok) {
                throw new Error("Failed to fetch beneficiaries");
            }
            return response.json();
        })
        .then(data => {
            const beneficiarySelect = document.getElementById('beneficiarySelect');
            beneficiarySelect.innerHTML = '<option value="" selected disabled>Select beneficiary</option>';
            
            // Handle different response formats
            const users = Array.isArray(data) ? data : (data.results || data.users || [data]);
            
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.username} (${user.email})`;
                beneficiarySelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error fetching beneficiaries:", error);
            const beneficiarySelect = document.getElementById('beneficiarySelect');
            beneficiarySelect.innerHTML = `
                <option value="" selected disabled>Error loading beneficiaries</option>
                <option value="" disabled>${error.message}</option>
            `;
            
            if (error.message.includes("Please login again")) {
                setTimeout(() => window.location.href = "login.html", 2000);
            }
        });
    }
 //---------------------------------------------------------------------------------------------------------   
    // Fetch services and populate dropdown
    function fetchServices(retry = true) {
        const accessToken = localStorage.getItem('access_token');
        
        fetch("http://127.0.0.1:8000/services/", {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (response.status === 401) {
                if (retry) {
                    return refreshToken()
                        .then(() => fetchServices(false));
                }
                throw new Error("Token expired - Please login again");
            }
            if (!response.ok) {
                throw new Error("Failed to fetch services");
            }
            return response.json();
        })
        .then(data => {
            const serviceSelect = document.getElementById('serviceSelect');
            serviceSelect.innerHTML = '<option value="" selected disabled>Select service</option>';
            
            // Handle different response formats
            const services = Array.isArray(data) ? data : (data.results || data.services || [data]);
            
            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.service_id || service.id;
                option.textContent = `${service.service_name} (${service.category})`;
                serviceSelect.appendChild(option);
            });
            
            // Enable provider selection after services load
            document.getElementById('providerSelect').disabled = false;
        })
        .catch(error => {
            console.error("Error fetching services:", error);
            const serviceSelect = document.getElementById('serviceSelect');
            serviceSelect.innerHTML = `
                <option value="" selected disabled>Error loading services</option>
                <option value="" disabled>${error.message}</option>
            `;
            
            if (error.message.includes("Please login again")) {
                setTimeout(() => window.location.href = "login.html", 2000);
            }
        });
    }

    // Add date to the list
    function addDate() {
        const dateInputs = document.querySelectorAll('.date-input');
        selectedDates = [];
        
        dateInputs.forEach(input => {
            if (input.value) {
                selectedDates.push(input.value);
            }
        });
        
        updateSelectedDatesDisplay();
        
        // If we have a service and dates, fetch available providers
        if (serviceSelect.value && selectedDates.length > 0) {
            fetchAvailableProviders(serviceSelect.value, selectedDates);
        }
    }

    // Update the display of selected dates
    function updateSelectedDatesDisplay() {
        selectedDatesList.innerHTML = '';
        selectedDates.forEach(date => {
            const dateElement = document.createElement('span');
            dateElement.className = 'selected-date';
            dateElement.textContent = date;
            selectedDatesList.appendChild(dateElement);
        });
    }

    // Fetch available providers based on service and dates
    function fetchAvailableProviders(serviceId, dates) {
        fetch(`/api/providers/available?service_id=${serviceId}&dates=${JSON.stringify(dates)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            providerSelect.innerHTML = '<option value="" selected disabled>Select a provider</option>';
            if (data.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No available providers for the selected dates';
                option.disabled = true;
                providerSelect.appendChild(option);
                providerSelect.disabled = true;
            } else {
                data.forEach(provider => {
                    const option = document.createElement('option');
                    option.value = provider.id;
                    option.textContent = `${provider.user.username} - ${provider.specialization}`;
                    providerSelect.appendChild(option);
                });
                providerSelect.disabled = false;
            }
        })
        .catch(error => console.error('Error fetching available providers:', error));
    }

    // Add another date input field
    addDateBtn.addEventListener('click', function() {
        const newDateInput = document.createElement('div');
        newDateInput.className = 'date-picker';
        newDateInput.innerHTML = `
            <input type="date" class="form-control date-input" required>
            <button type="button" class="btn btn-sm btn-danger mt-2 remove-date-btn">
                <i class="fas fa-times"></i> Remove
            </button>
        `;
        this.parentNode.insertBefore(newDateInput, this);
        
        // Add event listener to remove button
        newDateInput.querySelector('.remove-date-btn').addEventListener('click', function() {
            newDateInput.remove();
            addDate(); // Update the selected dates
        });
    });

    // When service changes, check if we can fetch providers
    serviceSelect.addEventListener('change', function() {
        if (selectedDates.length > 0) {
            fetchAvailableProviders(this.value, selectedDates);
        }
    });

    // When date changes, update selected dates
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('date-input')) {
            addDate();
        }
    });

    // Form submission
    addRequestForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const requestData = {
            user: userSelect.value,
            service: serviceSelect.value,
            selected_dates: selectedDates,
            request_status: document.getElementById('statusSelect').value
        };
        
        fetch('/api/requests/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create request');
            }
            return response.json();
        })
        .then(data => {
            alert('Request created successfully!');
            window.location.href = 'requests.html';
        })
        .catch(error => {
            console.error('Error creating request:', error);
            alert('Failed to create request. Please try again.');
        });
    });

    // Initialize
    fetchUsers();
    fetchServices();
});

function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    return fetch("http://127.0.0.1:8000/api/token/refresh/", {
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
        localStorage.setItem('access_token', data.access);
        return data.access;
    });
}