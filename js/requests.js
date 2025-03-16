// Load requests when the page is loaded
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes('requests.html')) {
        fetchRequests();
    }

    // Add event listeners for forms
    const addForm = document.getElementById("addRequestForm");
    if (addForm) {
        addForm.addEventListener("submit", handleAddRequest);
    }

    const editForm = document.getElementById("editRequestForm");
    if (editForm) {
        editForm.addEventListener("submit", handleEditRequest);
    }
});

// Fetch all requests
function fetchRequests() {
    const accessToken = localStorage.getItem('access_token'); // Get the access token

    fetch("http://127.0.0.1:8000/requests/", {
        headers: {
            "Authorization": `Bearer ${accessToken}` // Include the access token
        }
    })
    .then(response => {
        if (response.status === 401) {
            // If the token is expired, try to refresh it
            refreshToken();
        } else if (!response.ok) {
            throw new Error("Error fetching requests.");
        }
        return response.json();
    })
    .then(data => {
        let tableBody = document.getElementById("requestsTableBody");
        if (!tableBody) {
            console.error("Error: #requestsTableBody element not found.");
            return;
        }
        tableBody.innerHTML = ""; // Clear the table before populating

        data.forEach(request => {
            let row = `<tr>
                <td>${request.id}</td>
                <td>${request.user_id}</td>
                <td>${request.service_id}</td>
                <td>${request.start_date}</td>
                <td>${request.end_date}</td>
                <td>${request.request_date}</td>
                <td><span class="badge ${request.status === 'Approved' ? 'bg-success' : request.status === 'Pending' ? 'bg-warning text-dark' : 'bg-danger'}">${request.status}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="viewRequest(${request.id})"><i class="fas fa-eye"></i> View</button>
                    <button class="btn btn-success btn-sm" onclick="approveRequest(${request.id})"><i class="fas fa-check"></i> Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectRequest(${request.id})"><i class="fas fa-times"></i> Reject</button>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    })
    .catch(error => console.error("Error fetching requests:", error));
}

// Add a new request
function handleAddRequest(event) {
    event.preventDefault();

    const accessToken = localStorage.getItem('access_token');
    const formData = {
        user_id: document.getElementById("userId").value,
        service_id: document.getElementById("serviceId").value,
        start_date: document.getElementById("startDate").value,
        end_date: document.getElementById("endDate").value,
        request_date: document.getElementById("requestDate").value,
        status: document.getElementById("status").value
    };

    fetch("http://127.0.0.1:8000/requests/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.status === 401) {
            refreshToken();
            throw new Error("Token expired");
        }
        if (!response.ok) {
            throw new Error("Error adding request.");
        }
        return response.json();
    })
    .then(data => {
        showAlert("Request added successfully!", "success");
        setTimeout(() => {
            window.location.href = "requests.html";
        }, 2000);
    })
    .catch(error => {
        showAlert("Error adding request: " + error.message, "danger");
    });
}

// View a request (redirect to edit page)
function viewRequest(id) {
    window.location.href = `edit_request.html?id=${id}`;
}

// Load request data into the edit form
function loadRequestData(id) {
    const accessToken = localStorage.getItem('access_token');

    fetch(`http://127.0.0.1:8000/requests/${id}`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            refreshToken();
        }
        return response.json();
    })
    .then(request => {
        document.getElementById("userId").value = request.user_id;
        document.getElementById("serviceId").value = request.service_id;
        document.getElementById("startDate").value = request.start_date;
        document.getElementById("endDate").value = request.end_date;
        document.getElementById("requestDate").value = request.request_date;
        document.getElementById("status").value = request.status;
    })
    .catch(error => console.error("Error loading request data:", error));
}

// Handle the edit form submission
function handleEditRequest(event) {
    event.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const accessToken = localStorage.getItem('access_token');

    const formData = {
        user_id: document.getElementById("userId").value,
        service_id: document.getElementById("serviceId").value,
        start_date: document.getElementById("startDate").value,
        end_date: document.getElementById("endDate").value,
        request_date: document.getElementById("requestDate").value,
        status: document.getElementById("status").value
    };

    fetch(`http://127.0.0.1:8000/requests/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.status === 401) {
            refreshToken();
            throw new Error("Token expired");
        }
        if (!response.ok) {
            throw new Error("Error updating request.");
        }
        return response.json();
    })
    .then(data => {
        showAlert("Request updated successfully!", "success");
        setTimeout(() => {
            window.location.href = "requests.html";
        }, 2000);
    })
    .catch(error => {
        showAlert("Error updating request: " + error.message, "danger");
    });
}

// Approve a request
function approveRequest(id) {
    const accessToken = localStorage.getItem('access_token');

    fetch(`http://127.0.0.1:8000/requests/${id}/approve`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            refreshToken();
        } else if (!response.ok) {
            throw new Error("Error approving request.");
        }
        fetchRequests(); // Refresh the list
    })
    .catch(error => console.error("Error approving request:", error));
}

// Reject a request
function rejectRequest(id) {
    const accessToken = localStorage.getItem('access_token');

    fetch(`http://127.0.0.1:8000/requests/${id}/reject`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            refreshToken();
        } else if (!response.ok) {
            throw new Error("Error rejecting request.");
        }
        fetchRequests(); // Refresh the list
    })
    .catch(error => console.error("Error rejecting request:", error));
}

// Refresh the access token
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
        fetchRequests(); // Retry the initial request
    })
    .catch(error => {
        console.error("Error refreshing token:", error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = "login.html"; // Redirect to login page
    });
}

// Show an alert message
function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.classList.remove('d-none');

        // Hide the alert after 3 seconds
        setTimeout(() => {
            alertDiv.classList.add('d-none');
        }, 3000);
    }
}

// Load request data when editing
if (window.location.pathname.includes('edit_request.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
            loadRequestData(id);
        }
    });
}