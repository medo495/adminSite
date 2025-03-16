// charger les prestataires
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes('providers.html')) {
        fetchProviders();
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
                <td><span class="badge ${provider.availability ? 'bg-success' : 'bg-danger'}">${provider.availability ? 'Available' : 'Unavailable'}</span></td>
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
// ajouter prestataire
function handleAddProvider(event) {
    event.preventDefault();
    
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

    fetch("http://127.0.0.1:8000/providers/", {

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
            throw new Error("Token expiré");
        }
        if (!response.ok) {
            throw new Error("Erreur lors de l'ajout du prestataire");
        }
        return response.json();
    })
    .then(data => {
        showAlert("Provider added successfully!", "success");
        setTimeout(() => {
            window.location.href = "providers.html";
        }, 2000);
    })
    .catch(error => {
        showAlert("Error adding provider: " + error.message, "danger");
    });
}

//modifier prestataire
function editProvider(id) {
    const accessToken = localStorage.getItem('access_token');
    
    // Rediriger vers la page d'édition avec l'ID
    window.location.href = `edit_provider.html?id=${id}`;
}


   // Fonction pour charger les données du prestataire dans le formulaire d'édition
function loadProviderData(id) {
    console.log("Loading provider data for ID:", id); // Debug log
    const accessToken = localStorage.getItem('access_token');
    
    fetch(`http://127.0.0.1:8000/providers/?id=${id}`, {
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
        const providerData = provider[0]; // Accéder au premier élément du tableau
        // console.log("Provider data received:", providerData); // Debug log
        document.getElementById("providerName").value = providerData.fullname;
        document.getElementById("providerEmail").value = providerData.email;
        document.getElementById("providerGender").value = providerData.gender;
        document.getElementById("providerPhone").value = providerData.phone;
        document.getElementById("providerAddress").value = providerData.address || '';
        document.getElementById("providerServices").value = providerData.services;
        document.getElementById("providerAvailability").value = providerData.is_disponible ? "Available" : "Unavailable";
    })
    .catch(error => console.error("Error loading provider data:", error));
}

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
// Ajouter un event listener pour charger les données du prestataire lors de l'édition
if (window.location.pathname.includes('edit_provider.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
            loadProviderData(id);
        }
    });
}
