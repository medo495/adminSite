//--------------------------------------------------------------------------------------------------------
// charger les prestataires
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes('providers.html')) {
        fetchProviders();
    }

    const searchButton = document.getElementById("searchButton");
    if (searchButton) {
        searchButton.addEventListener("click", function () {
            const searchQuery = document.getElementById("searchProviderInput").value;
            handleSearch(searchQuery);
        });
    }

    // Ajouter les event listeners pour les formulaires
    const addForm = document.getElementById("addProviderForm");
    if (addForm) {
        addForm.addEventListener("submit", handleAddProvider);
    }

    const editForm = document.getElementById("editProviderForm");
    if (editForm) {
        editForm.addEventListener("submit", handleEditProvider);
    }
});
//--------------------------------------------------------------------------------------------------------
function fetchProviders() {
    const accessToken = localStorage.getItem('access_token'); // Récupérer le token d'accès

    fetch("http://127.0.0.1:8000/providers/", {
        headers: {
            "Authorization": `Bearer ${accessToken}` // Inclure le token d'accès
        }
    })
        .then(response => {
            if (response.status === 401) {
                // Si le token est expiré, essayer de le rafraîchir
                refreshToken();
            } else if (!response.ok) {
                throw new Error("Erreur lors de la récupération des prestataires.");
            }
            return response.json();
        })
        .then(data => {
            let tableBody = document.getElementById("providersTableBody");
            if (!tableBody) {
                console.error("Erreur: Élément #providersTableBody introuvable.");
                return;
            }
            tableBody.innerHTML = "";  // Nettoie le tableau avant de le remplir

            data.forEach(provider => {
                let row = `<tr>
                <td>${provider.id}</td>
                <td>${provider.fullname}</td>
                <td>${provider.email}</td>
                <td>${provider.gender}</td>
                <td>${provider.phone}</td>
                <td>${provider.address}</td>
                <td>${provider.services}</td>
                <td><span class="badge ${provider.is_disponible ? 'bg-success' : 'bg-danger'}">${provider.is_disponible ? 'Available' : 'Unavailable'}</span></td>
                <td>${provider.rating_avg} ⭐</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editProvider(${provider.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProvider(${provider.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => console.error("Error fetching providers:", error));
}
//-------------------------------------------------------------------------------------------
// Add provider function
async function handleAddProvider(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    try {
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

        const accessToken = localStorage.getItem('access_token');
        const formData = {
            fullname: document.getElementById('providerName').value.trim(),
            email: document.getElementById('providerEmail').value.trim(),
            gender: document.getElementById('providerGender').value,
            phone: document.getElementById('providerPhone').value.trim(),
            address: document.getElementById('providerAddress').value.trim(),
            service: parseInt(document.getElementById('providerServices').value),
            is_disponible: document.getElementById('providerAvailability').value === 'Available'
        };

        console.log("Request payload:", formData);

        const response = await fetch('http://127.0.0.1:8000/providers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(formData)
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
            let errorDetails = '';
            
            try {
                const errorData = await response.json();
                console.error("Error details:", errorData);
                
                // Handle different backend error formats
                if (errorData.detail) {
                    errorDetails = errorData.detail;
                } else if (errorData.message) {
                    errorDetails = errorData.message;
                } else if (errorData.errors) {
                    errorDetails = JSON.stringify(errorData.errors);
                }
            } catch (e) {
                console.error("Error parsing error response:", e);
            }
            
            throw new Error(`Server error (${response.status}): ${errorDetails || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log("Success:", result);
        
        showAlert('Provider added successfully!', 'success');
        setTimeout(() => window.location.href = 'providers.html', 1500);

    } catch (error) {
        console.error('Full error:', error);
        
        let userMessage = error.message;
        if (error.message.includes('500')) {
            userMessage = 'Server error - please check the data and try again';
        }
        
        showAlert(userMessage, 'danger');
        
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Helper function to show alerts
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container-fluid') || document.body;
    container.prepend(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}
//--------------------------------------------------------------------------------------
// Fetch and populate services dropdown
async function populateServicesDropdown() {
    const dropdown = document.getElementById('providerServices');
    const accessToken = localStorage.getItem('access_token');

    try {
        // Show loading state
        dropdown.innerHTML = '<option value="">Loading services...</option>';
        dropdown.disabled = true;

        const response = await fetch('http://127.0.0.1:8000/services/', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                await refreshToken();
                return populateServicesDropdown(); // Retry with new token
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Clear and populate dropdown
        dropdown.innerHTML = '<option value="" selected disabled>Select a service</option>';

        data.forEach(service => {
            const option = new Option(service.service_name, service.service_id);
            dropdown.add(option);
        });

        dropdown.disabled = false;

    } catch (error) {
        console.error('Service loading failed:', error);
        dropdown.innerHTML = '<option value="" selected disabled>Error loading services</option>';
        showAlert('Failed to load services. Please refresh the page.', 'danger');
    }
}
//--------------------------------------------------------------------------------------------------------
// Call when page loads
document.addEventListener('DOMContentLoaded', populateServicesDropdown);
//--------------------------------------------------------------------------------------------------------
// Call this when the page loads
document.addEventListener('DOMContentLoaded', populateServicesDropdown);
//--------------------------------------------------------------------------------------------------------
//modifier prestataire
function editProvider(id) {
    const accessToken = localStorage.getItem('access_token');

    // Rediriger vers la page d'édition avec l'ID
    window.location.href = `edit_provider.html?id=${id}`;
}

//--------------------------------------------------------------------------------------------------------
// Fonction pour charger les données du prestataire dans le formulaire d'édition
function loadProviderData(id) {
    console.log("Loading provider data for ID:", id); // Debug log
    const accessToken = localStorage.getItem('access_token');

    // Update the fetch URL to target the specific provider by ID
    fetch(`http://127.0.0.1:8000/providers/${id}/`, { // Use `/id/` in the URL
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
        .then(provider => {
            console.log("Provider data received:", provider); // Debug log

            // Populate form fields with the provider data
            document.getElementById("providerName").value = provider.fullname;
            document.getElementById("providerEmail").value = provider.email;
            document.getElementById("providerGender").value = provider.gender;
            document.getElementById("providerPhone").value = provider.phone;
            document.getElementById("providerAddress").value = provider.address || '';
            document.getElementById("providerServices").value = provider.services;
            document.getElementById("providerAvailability").value = provider.is_disponible ? "Available" : "Unavailable";
        })
        .catch(error => console.error("Error loading provider data:", error));
}
//--------------------------------------------------------------------------------------------------------
// Fonction pour gérer la soumission du formulaire de modification
function handleEditProvider(event) {
    event.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const accessToken = localStorage.getItem('access_token');

    const formData = {
        fullname: document.getElementById("providerName").value,
        email: document.getElementById("providerEmail").value,
        gender: document.getElementById("providerGender").value,
        phone: document.getElementById("providerPhone").value,
        address: document.getElementById("providerAddress").value,
        services: document.getElementById("providerServices").value,
        is_disponible: document.getElementById("providerAvailability").value === "Available"
    };

    fetch(`http://127.0.0.1:8000/providers/?id=${id}`, {
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
                throw new Error("Token expiré");
            }
            if (!response.ok) {
                throw new Error("Erreur lors de la modification du prestataire");
            }
            return response.json();
        })
        .then(data => {
            showAlert("Provider updated successfully!", "success");
            setTimeout(() => {
                window.location.href = "providers.html";
            }, 2000);
        })
        .catch(error => {
            showAlert("Error updating provider: " + error.message, "danger");
        });
}
//--------------------------------------------------------------------------------------------------------
//supprimer provider 
function deleteProvider(id) {
    if (confirm("Are you sure you want to delete this provider?")) {
        const accessToken = localStorage.getItem('access_token'); // Récupérer le token d'accès

        fetch(`http://127.0.0.1:8000/providers/?id=${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${accessToken}` // Inclure le token d'accès
            }
        })
            .then(response => {
                if (response.status === 401) {
                    refreshToken(); // Rafraîchir le token si expiré
                } else if (!response.ok) {
                    throw new Error("Erreur lors de la suppression du prestataire.");
                }
                fetchProviders(); // Recharger la liste
            })
            .catch(error => console.error("Error deleting provider:", error));
    }
}
//--------------------------------------------------------------------------------------------------------
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
            console.log("Token rafraîchi avec succès.");
            fetchProviders(); // Relancer la requête initiale
        })
        .catch(error => {
            console.error("Erreur lors du rafraîchissement du token:", error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = "login.html"; // Rediriger vers la page de connexion
        });
}
//--------------------------------------------------------------------------------------------------------
function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.classList.remove('d-none');

        // Masquer l'alerte après 3 secondes
        setTimeout(() => {
            alertDiv.classList.add('d-none');
        }, 3000);
    }
}
//--------------------------------------------------------------------------------------------------------
//charger les données du prestataire lors de l'édition
if (window.location.pathname.includes('edit_provider.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
            loadProviderData(id);
        }
    });
}
//--------------------------------------------------------------------------------------------------------
// chercher prestataires
function handleSearch(searchQuery) {
    const tableRows = document.querySelectorAll("#providersTableBody tr");

    tableRows.forEach((row) => {
        const rowText = row.textContent.toLowerCase(); // Get all the text content of the row
        if (rowText.includes(searchQuery.toLowerCase())) {
            row.style.display = ""; // Show the row if it matches the query
        } else {
            row.style.display = "none"; // Hide the row if it doesn't match
        }
    });
}