document.addEventListener('DOMContentLoaded', function() {
    const apiUrl = 'http://127.0.0.1:8000/users/';
    let users = [];

    // Fetch users with token authentication
    // Modifiez la fonction fetchUsers pour mieux gérer les erreurs
function fetchUsers() {
    const accessToken = localStorage.getItem('access_token');
    
    console.log('Fetching users with token:', accessToken); // Debug

    fetch(apiUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Response status:', response.status); // Debug
        if (response.status === 401) {
            return refreshToken().then(fetchUsers);
        } else if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("API Response:", data);
        users = Array.isArray(data) ? data : [data]; // S'assurer que c'est un array
        renderUsers(users);
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Failed to load users: ' + error.message);
    });
}

    // Render users to table
    function renderUsers(data) {
        const tableBody = document.getElementById('benificiariesTableBody');
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No customers found</td></tr>`;
            return;
        }
    
        tableBody.innerHTML = data.map(user => `
            <tr>
                <!-- Only showing your specified columns -->
                <td>${user.id}</td>
                <td>${user.username || 'N/A'}</td>
                <td>${user.fullname || user.full_name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${user.address || 'N/A'}</td>
                <td>
                    <span class="badge ${user.is_vip ? 'bg-success' : 'bg-secondary'}">
                        ${user.is_vip ? 'VIP' : 'Standard'}
                    </span>
                </td>
                <!-- Keep actions column -->
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewUser(${user.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    

    // View user details
    window.viewUser = function(id) {
        const accessToken = localStorage.getItem('access_token');
        
        fetch(`${apiUrl}${id}/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.status === 401) {
                return refreshToken().then(() => viewUser(id));
            } else if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }
            return response.json();
        })
        .then(user => {
            Swal.fire({
                title: 'User Details',
                html: `
                    <div class="text-start">
                        <p><strong>ID:</strong> ${user.id}</p>
                        <p><strong>Username:</strong> ${user.username}</p>
                        <p><strong>Full Name:</strong> ${user.full_name || user.fullname || 'N/A'}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${user.address || 'N/A'}</p>
                        <p><strong>Gender:</strong> ${user.gender || 'N/A'}</p>
                        <p><strong>Status:</strong> <span class="badge ${user.is_active ? 'bg-success' : 'bg-danger'}">
                            ${user.is_active ? 'Active' : 'Suspended'}
                        </span></p>
                        <p><strong>VIP Status:</strong> <span class="badge ${user.is_vip ? 'bg-success' : 'bg-secondary'}">
                            ${user.is_vip ? 'VIP' : 'Standard'}
                        </span></p>
                    </div>
                `,
                confirmButtonText: 'OK'
            });
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Failed to load user details');
        });
    };

    // Toggle user active status
    window.toggleUserStatus = function(id, isActive) {
        const accessToken = localStorage.getItem('access_token');
        
        Swal.fire({
            title: 'Confirm Action',
            text: `Are you sure you want to ${isActive ? 'suspend' : 'activate'} this user?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: `Yes, ${isActive ? 'suspend' : 'activate'}`,
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`${apiUrl}${id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        is_active: !isActive
                    })
                })
                .then(response => {
                    if (response.status === 401) {
                        return refreshToken().then(() => toggleUserStatus(id, isActive));
                    } else if (!response.ok) {
                        throw new Error('Failed to update user status');
                    }
                    return response.json();
                })
                .then(() => {
                    fetchUsers();
                    Swal.fire(
                        'Success!',
                        `User has been ${isActive ? 'suspended' : 'activated'}.`,
                        'success'
                    );
                })
                .catch(error => {
                    console.error('Error:', error);
                    showError('Failed to update user status');
                });
            }
        });
    };

    // Search functionality
    function searchUsers() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const filtered = users.filter(user => 
            (user.username && user.username.toLowerCase().includes(query)) ||
            ((user.full_name || user.fullname) && (user.full_name || user.fullname).toLowerCase().includes(query)) ||
            (user.email && user.email.toLowerCase().includes(query)) ||
            (user.phone && user.phone.toLowerCase().includes(query)) ||
            (user.address && user.address.toLowerCase().includes(query))
        );
        renderUsers(filtered);
    }

    // Token refresh function
    function refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');

        return fetch('http://127.0.0.1:8000/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh: refreshToken })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Token refresh failed');
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('access_token', data.access);
            return Promise.resolve();
        })
        .catch(error => {
            console.error('Error:', error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login.html';
            return Promise.reject();
        });
    }

    // Show error message
    function showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonText: 'OK'
        });
    }

    // Event listeners
    document.getElementById('searchButton').addEventListener('click', searchUsers);
    document.getElementById('searchInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') searchUsers();
    });

    // Initial fetch
    fetchUsers();
});