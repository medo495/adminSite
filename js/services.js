//--------------------------------------------------------------------------------------------------------
// Charger les services
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes('services.html')) {
        fetchServices();
    }
    
    // Charger les catégories pour les formulaires
    if (window.location.pathname.includes('add_service.html') || 
        window.location.pathname.includes('edit_service.html')) {
        fetchCategories();
    }
    
    // Ajouter les event listeners pour les formulaires
    const addForm = document.getElementById("addServiceForm");
    if (addForm) {
        addForm.addEventListener("submit", handleAddService);
    }
    
    const editForm = document.getElementById("editServiceForm");
    if (editForm) {
        editForm.addEventListener("submit", handleEditService);
    }
});
//---------------------------------------------------------------------------------------------------------
async function fetchServices() {
    const accessToken = localStorage.getItem('access_token');
    
    try {
        // Fetch both services and categories in parallel
        const [servicesResponse, categoriesResponse] = await Promise.all([
            fetch("http://127.0.0.1:8000/services/", {
                headers: { "Authorization": `Bearer ${accessToken}` }
            }),
            fetch("http://127.0.0.1:8000/categories/", {
                headers: { "Authorization": `Bearer ${accessToken}` }
            })
        ]);

        // Check for expired token
        if (servicesResponse.status === 401 || categoriesResponse.status === 401) {
            refreshToken();
            return;
        }

        const services = await servicesResponse.json();
        const categories = await categoriesResponse.json();

        // Create a map of category IDs to names
        const categoryMap = {};
        categories.forEach(category => {
            categoryMap[category.category_id] = category.category_name;
        });

        // Populate the table
        const tableBody = document.getElementById("servicesTableBody");
        if (!tableBody) {
            console.error("Services table body not found");
            return;
        }

        tableBody.innerHTML = services.map(service => {
            const categoryName = categoryMap[service.category] || "No Category";
            
            return `<tr>
                <td>${service.service_id}</td>
                <td>${service.service_name}</td>
                <td>${service.service_description}</td>
                <td>${service.service_price}</td>
                <td>${categoryName}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editService(${service.service_id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteService(${service.service_id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
        
    } catch (error) {
        console.error("Error fetching data:", error);
        showAlert("Error loading services: " + error.message, "danger");
    }
}
//---------------------------------------------------------------------------------------------------------
// Ajouter un service
function handleAddService(event) {
    event.preventDefault();
    
    const accessToken = localStorage.getItem('access_token');
    const formData = {
        service_name: document.getElementById("serviceName").value,
        service_description: document.getElementById("serviceDescription").value,
        service_price: document.getElementById("servicePrice").value,
        category_id: document.getElementById("serviceCategory").value
    };

    // Convert the data to URL-encoded format
    const urlEncodedData = new URLSearchParams();
    for (const key in formData) {
        urlEncodedData.append(key, formData[key]);
    }

    fetch("http://127.0.0.1:8000/services/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${accessToken}`
        },
        body: urlEncodedData
    })
    .then(response => {
        if (response.status === 401) {
            refreshToken();
            throw new Error("Token expired");
        }
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        showAlert("Service added successfully!", "success");
        setTimeout(() => {
            window.location.href = "services.html";
        }, 2000);
    })
    .catch(error => {
        console.error("Error:", error);
        showAlert("Error adding service: " + error.message, "danger");
    });
}
//-----------------------------------------------------------------------------------------------
// Modifier un service
function editService(id) {
    const accessToken = localStorage.getItem('access_token');
    
    // Rediriger vers la page d'édition avec l'ID
    window.location.href = `edit_service.html?id=${id}`;
}
//-----------------------------------------------------------------------------------------------
// Fonction pour charger les données du service dans le formulaire d'édition
function loadServiceData(id) {
    console.log("Loading service data for ID:", id); // Debug log
    const accessToken = localStorage.getItem('access_token');
    
    fetch(`http://127.0.0.1:8000/services/?id=${id}`, {
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
    .then(service => {
        const serviceData = service[0]; // Accéder au premier élément du tableau
        // console.log("Service data received:", serviceData); // Debug log
        document.getElementById("serviceName").value = serviceData.service_name;
        document.getElementById("serviceDescription").value = serviceData.service_description;
        document.getElementById("servicePrice").value = serviceData.service_price;
        document.getElementById("serviceCategory").value = serviceData.category_name;
    })
    .catch(error => console.error("Error loading service data:", error));
}
//-----------------------------------------------------------------------------------------------
// Fonction pour gérer la soumission du formulaire de modification
function handleEditService(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const accessToken = localStorage.getItem('access_token');
    
    // Prepare form data
    const formData = {
        service_name: document.getElementById("serviceName").value,
        service_description: document.getElementById("serviceDescription").value,
        service_price: document.getElementById("servicePrice").value,
        category_id: document.getElementById("serviceCategory").value
    };

    // Convert to URL-encoded format
    const urlEncodedData = new URLSearchParams();
    for (const key in formData) {
        urlEncodedData.append(key, formData[key]);
    }

    fetch(`http://127.0.0.1:8000/services/?id=${id}`, {
        method: "PUT",  // or "PATCH" depending on your API
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${accessToken}`
        },
        body: urlEncodedData
    })
    .then(response => {
        if (response.status === 401) {
            refreshToken();
            throw new Error("Token expired");
        }
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        showAlert("Service updated successfully!", "success");
        setTimeout(() => {
            window.location.href = "services.html";
        }, 2000);
    })
    .catch(error => {
        console.error("Error updating service:", error);
        showAlert("Error updating service: " + error.message, "danger");
    });
}
//-----------------------------------------------------------------------------------------------
// Supprimer un service
function deleteService(id) {
    if (confirm("Are you sure you want to delete this service?")) {
        const accessToken = localStorage.getItem('access_token'); // Récupérer le token d'accès

        fetch(`http://127.0.0.1:8000/services/?id=${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${accessToken}` // Inclure le token d'accès
            }
        })
        .then(response => {
            if (response.status === 401) {
                refreshToken(); // Rafraîchir le token si expiré
            } else if (!response.ok) {
                throw new Error("Erreur lors de la suppression du service.");
            }
            fetchServices(); // Recharger la liste
        })
        .catch(error => console.error("Error deleting service:", error));
    }
}
//-----------------------------------------------------------------------------------------------
// Search function for services
function setupSearch() {
    const searchInput = document.getElementById('searchServiceInput');
    const searchButton = document.getElementById('searchServiceButton');
    
    if (searchInput && searchButton) {
        // Search when button is clicked
        searchButton.addEventListener('click', performSearch);
        
        // Search when Enter key is pressed
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}
//-----------------------------------------------------------------------------------------------
function performSearch() {
    const searchTerm = document.getElementById('searchServiceInput').value.toLowerCase();
    const tableBody = document.getElementById('servicesTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    let hasMatches = false;

    for (let row of rows) {
        // Skip the "no data" message row if it exists
        if (row.id === 'noDataMessage') continue;
        
        const cells = row.getElementsByTagName('td');
        let rowMatches = false;
        
        // Check each cell in the row (except the last one with actions)
        for (let i = 0; i < cells.length - 1; i++) {
            const cellText = cells[i].textContent.toLowerCase();
            if (cellText.includes(searchTerm)) {
                rowMatches = true;
                break;
            }
        }
        
        // Show/hide row based on match
        row.style.display = rowMatches ? '' : 'none';
        if (rowMatches) hasMatches = true;
    }

    // Show "no results" message if no matches found
    const noDataMessage = document.getElementById('noDataMessage');
    if (noDataMessage) {
        if (!hasMatches && searchTerm) {
            noDataMessage.style.display = '';
            noDataMessage.textContent = 'No services match your search';
        } else if (!hasMatches) {
            noDataMessage.style.display = '';
            noDataMessage.textContent = 'No services found';
        } else {
            noDataMessage.style.display = 'none';
        }
    }
}
//-----------------------------------------------------------------------------------------------
// Initialize search when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupSearch();
    
    // ... rest of your existing DOMContentLoaded code ...
});
//-----------------------------------------------------------------------------------------------
function setupSearch() {
    const searchInput = document.getElementById('searchServiceInput');
    const searchButton = document.getElementById('searchButton');
    
    if (searchInput && searchButton) {
        // Search when button is clicked
        searchButton.addEventListener('click', performSearch);
        
        // Search when Enter key is pressed
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
      
    }
}
//-----------------------------------------------------------------------------------------------
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
        fetchServices(); // Relancer la requête initiale
    })
    .catch(error => {
        console.error("Erreur lors du rafraîchissement du token:", error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = "login.html"; // Rediriger vers la page de connexion
    });
}
//-----------------------------------------------------------------------------------------------
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
//-----------------------------------------------------------------------------------------------
// Ajouter un event listener pour charger les données du service lors de l'édition
if (window.location.pathname.includes('edit_service.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
            loadServiceData(id);
        }
    });
}
//-----------------------------------------------------------------------------------------------
function fetchCategories() {
    const accessToken = localStorage.getItem('access_token');
    
    fetch("http://127.0.0.1:8000/categories/", {
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
    .then(data => {
        const categorySelects = document.querySelectorAll(".category-select");
        
        categorySelects.forEach(select => {
            // Sauvegarder la valeur sélectionnée actuelle
            const currentValue = select.value;
            
            // Vider les options existantes
            select.innerHTML = '';
            
            // Ajouter l'option par défaut
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Sélectionnez une catégorie";
            select.appendChild(defaultOption);
            
            // Ajouter les catégories
            data.forEach(category => {
                const option = document.createElement("option");
                option.value = category.category_id;
                option.textContent = category.category_name;
                select.appendChild(option);
            });
            
            // Restaurer la valeur sélectionnée si elle existe
            if (currentValue) {
                select.value = currentValue;
            }
        });
    })
    .catch(error => console.error("Error fetching categories:", error));
}