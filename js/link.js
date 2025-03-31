//---------------------------------------------------------------------------------------------
 document.addEventListener("DOMContentLoaded", function() {
    // Initialize date picker
    const datePicker = flatpickr("#flatpickrDateTime", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: false,
        allowInput: true,
        mode: "multiple",
        onClose: function(selectedDates, dateStr, instance) {
            const container = document.getElementById('selectedFlatpickrDateTimes');
            container.innerHTML = '';
            selectedDates.forEach(date => {
                const badge = document.createElement('div');
                badge.className = 'badge bg-primary d-flex align-items-center';
                badge.textContent = date.toLocaleString();
                container.appendChild(badge);
            });
        }
    });
//---------------------------------------------------------------------------------------------
    // Form submission
    document.getElementById("addLinkForm").addEventListener("submit", function(e) {
        e.preventDefault();
        
        const selectedDates = datePicker.selectedDates.map(date => 
            date.toISOString().split('T')[0]
        );
        
        const formData = {
            provider_id: document.getElementById("provider").value,
            beneficiary_id: document.getElementById("beneficiary").value,
            service_id: document.getElementById("service").value,
            selected_dates: selectedDates,
            status: document.getElementById("status").value
        };

        fetch("http://127.0.0.1:8000/links/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            alert("Link created successfully!");
            window.location.href = "links.html";
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Error creating link");
        });
    });

    // Fetch initial data
    fetchProviders();
    fetchBeneficiaries();
    fetchServices();
});
//---------------------------------------------------------------------------------------------
// function for providers fetching
function fetchProviders() {
    fetch("http://127.0.0.1:8000/providers/", {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('access_token')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to fetch providers");
        return response.json();
    })
    .then(data => {
        const providerSelect = document.getElementById("provider");
        providerSelect.innerHTML = '<option value="">Choose a Provider</option>';
        
        data.forEach(provider => {
            providerSelect.innerHTML += `<option value="${provider.id}">${provider.fullname}</option>`;
        });
    })
    .catch(error => {
        console.error("Error fetching providers:", error);
        alert("Failed to load providers. Check console for details.");
    });
}
//---------------------------------------------------------------------------------------------
// function for beneficiaries fetching
async function fetchBeneficiaries() {
    try {
        const response = await fetch("http://127.0.0.1:8000/users/", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('access_token')}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Users Endpoint Response:", response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Users Data:", data);

        const beneficiarySelect = document.getElementById("beneficiary");
        beneficiarySelect.innerHTML = '<option value="">Choose a Beneficiary</option>';
        
        data.forEach(user => {
            beneficiarySelect.innerHTML += `
                <option value="${user.id}">
                    ${user.fullname || user.username}
                </option>
            `;
        });
    } catch (error) {
        console.error("Error fetching users:", {
            error: error.message,
            stack: error.stack,
            time: new Date().toISOString()
        });
        showError("Failed to load user list. Please try again.");
    }
}
//---------------------------------------------------------------------------------------------
// fetching services function 
function fetchServices() {
    fetch("http://127.0.0.1:8000/services/", {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem('access_token')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to fetch services");
        return response.json();
    })
    .then(data => {
        const serviceSelect = document.getElementById("service");
        serviceSelect.innerHTML = '<option value="">Choose a Service</option>';
        
        data.forEach(service => {
            serviceSelect.innerHTML += `<option value="${service.id}">${service.name}</option>`;
        });
    })
    .catch(error => {
        console.error("Error fetching services:", error);
        alert("Failed to load services. Check console for details.");
    });
}
//---------------------------------------------------------------------------------------------
// Fetch and display links
async function fetchLinks() {
    try {
        const response = await fetch("http://127.0.0.1:8000/links/", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch links');
        }

        const links = await response.json();
        const tableBody = document.getElementById("LinksTableBody");
        
        tableBody.innerHTML = links.length ? links.map(link => `
            <tr>
                <td>${link.link_id}</td>
                <td>${link.provider}</td> <!-- Shows provider ID -->
                <td>${link.request}</td> <!-- Shows request ID -->
                <td>${new Date(link.linked_date).toLocaleString()}</td>
                <td>
                    <span class="badge ${getStatusClass(link.status)}">
                        ${link.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="editLink(${link.link_id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteLink(${link.link_id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="6" class="text-center">No links found</td></tr>';

    } catch (error) {
        console.error("Error fetching links:", error);
        showAlert(`Error: ${error.message}`, 'danger');
    }
}

// Add new link
async function handleAddLink(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    try {
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

        const formData = {
            provider: parseInt(document.getElementById("provider").value),
            request: parseInt(document.getElementById("request").value),
            status: document.getElementById("status").value || 'pending'
        };

        // Basic validation
        if (isNaN(formData.provider)) throw new Error('Please select a provider');
        if (isNaN(formData.request)) throw new Error('Please select a request');

        const response = await fetch("http://127.0.0.1:8000/links/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || errorData.message || 'Failed to create link');
        }

        showAlert('Link created successfully!', 'success');
        form.reset();
        fetchLinks(); // Refresh the list

    } catch (error) {
        console.error("Error adding link:", error);
        showAlert(`Error: ${error.message}`, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Add Link';
    }
}

// Helper functions
function getStatusClass(status) {
    const statusClasses = {
        'pending': 'bg-warning',
        'in progress': 'bg-info',
        'finished': 'bg-success'
    };
    return statusClasses[status] || 'bg-secondary';
}

function showAlert(message, type) {
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
document.addEventListener('DOMContentLoaded', () => {
    fetchLinks();
    
    // Add form submit handler
    const addForm = document.getElementById('addLinkForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddLink);
    }
});
//---------------------------------------------------------------------------------------------
// function for link delete
function deleteLink(id) {
    if (confirm("Are you sure you want to delete this link?")) {
        fetch(`http://127.0.0.1:8000/links/${id}/`, {
            method: "DELETE"
        })
        .then(() => {
            alert("Link deleted successfully!");
            fetchLinks();
        })
        .catch(error => alert("Error deleting link: " + error.message));
    }
}
//---------------------------------------------------------------------------------------------
// function for link edit
function editLink(id) {
    window.location.href = `edit_link.html?id=${id}`;
}
