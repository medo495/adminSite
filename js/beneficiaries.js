// Charger les bénéficiaires
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes('beneficiaries.html')) {
        fetchBeneficiaries();
    }
    // Ajouter les event listeners pour les formulaires
    const addForm = document.getElementById("addBeneficiaryForm");
    if (addForm) {
        addForm.addEventListener("submit", handleAddBeneficiary);
    }

    const editForm = document.getElementById("editBeneficiaryForm");
    if (editForm) {
        editForm.addEventListener("submit", handleEditBeneficiary);
    }
});

function fetchBeneficiaries() {
    const accessToken = localStorage.getItem('access_token'); // Récupérer le token d'accès

    fetch("http://127.0.0.1:8000/beneficiaries/", {
        headers: {
            "Authorization": `Bearer ${accessToken}` // Inclure le token d'accès
        }
    })
    .then(response => {
        if (response.status === 401) {
            // Si le token est expiré, essayer de le rafraîchir
            refreshToken();
        } else if (!response.ok) {
            throw new Error("Erreur lors de la récupération des bénéficiaires.");
        }
        return response.json();
    })
    .then(data => {
        let tableBody = document.getElementById("beneficiariesTableBody");
        if (!tableBody) {
            console.error("Erreur: Élément #beneficiariesTableBody introuvable.");
            return;
        }
        tableBody.innerHTML = "";  // Nettoie le tableau avant de le remplir

        data.forEach(beneficiary => {
            let row = `<tr>
                <td>${beneficiary.id}</td>
                <td>${beneficiary.username}</td>
                <td>${beneficiary.fullname}</td>
                <td>${beneficiary.email}</td>
                <td>${beneficiary.phone}</td>
                <td>${beneficiary.address}</td>
                <td><span class="badge ${beneficiary.is_vip ? 'bg-success' : 'bg-secondary'}">${beneficiary.is_vip ? 'VIP' : 'Standard'}</span></td>
                <td><img src="${beneficiary.avatarUrl}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%;"></td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editBeneficiary(${beneficiary.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBeneficiary(${beneficiary.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    })
    .catch(error => console.error("Error fetching beneficiaries:", error));
}

// Ajouter un bénéficiaire
function handleAddBeneficiary(event) {
    event.preventDefault();
    
    const accessToken = localStorage.getItem('access_token');
    const formData = {
        username: document.getElementById("beneficiaryUsername").value,
        fullname: document.getElementById("beneficiaryFullname").value,
        email: document.getElementById("beneficiaryEmail").value,
        password: document.getElementById("beneficiaryPassword").value,
        phone: document.getElementById("beneficiaryPhone").value,
        address: document.getElementById("beneficiaryAddress").value,
        is_vip: document.getElementById("beneficiaryIsVip").checked,
        avatarUrl: document.getElementById("beneficiaryAvatarUrl").value
    };

    fetch("http://127.0.0.1:8000/beneficiaries/", {
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
            throw new Error("Erreur lors de l'ajout du bénéficiaire");
        }
        return response.json();
    })
    .then(data => {
        showAlert("Beneficiary added successfully!", "success");
        setTimeout(() => {
            window.location.href = "beneficiaries.html";
        }, 2000);
    })
    .catch(error => {
        showAlert("Error adding beneficiary: " + error.message, "danger");
    });
}

// Modifier un bénéficiaire
function editBeneficiary(id) {
    const accessToken = localStorage.getItem('access_token');
    
    // Rediriger vers la page d'édition avec l'ID
    window.location.href = `edit_beneficiary.html?id=${id}`;
}

// Fonction pour charger les données du bénéficiaire dans le formulaire d'édition
function loadBeneficiaryData(id) {
    console.log("Loading beneficiary data for ID:", id); // Debug log
    const accessToken = localStorage.getItem('access_token');
    
    fetch(`http://127.0.0.1:8000/beneficiaries/?id=${id}`, {
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
    .then(beneficiary => {
        const beneficiaryData = beneficiary[0]; // Accéder au premier élément du tableau
        // console.log("Beneficiary data received:", beneficiaryData); // Debug log
        document.getElementById("beneficiaryUsername").value = beneficiaryData.username;
        document.getElementById("beneficiaryFullname").value = beneficiaryData.fullname;
        document.getElementById("beneficiaryEmail").value = beneficiaryData.email;
        document.getElementById("beneficiaryPassword").value = beneficiaryData.password;
        document.getElementById("beneficiaryPhone").value = beneficiaryData.phone;
        document.getElementById("beneficiaryAddress").value = beneficiaryData.address || '';
        document.getElementById("beneficiaryIsVip").checked = beneficiaryData.is_vip;
        document.getElementById("beneficiaryAvatarUrl").value = beneficiaryData.avatarUrl;
    })
    .catch(error => console.error("Error loading beneficiary data:", error));
}

// Fonction pour gérer la soumission du formulaire de modification
function handleEditBeneficiary(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const accessToken = localStorage.getItem('access_token');
    
    const formData = {
        username: document.getElementById("beneficiaryUsername").value,
        fullname: document.getElementById("beneficiaryFullname").value,
        email: document.getElementById("beneficiaryEmail").value,
        password: document.getElementById("beneficiaryPassword").value,
        phone: document.getElementById("beneficiaryPhone").value,
        address: document.getElementById("beneficiaryAddress").value,
        is_vip: document.getElementById("beneficiaryIsVip").checked,
        avatarUrl: document.getElementById("beneficiaryAvatarUrl").value
    };

    fetch(`http://127.0.0.1:8000/beneficiaries/?id=${id}`, {
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
            throw new Error("Erreur lors de la modification du bénéficiaire");
        }
        return response.json();
    })
    .then(data => {
        showAlert("Beneficiary updated successfully!", "success");
        setTimeout(() => {
            window.location.href = "beneficiaries.html";
        }, 2000);
    })
    .catch(error => {
        showAlert("Error updating beneficiary: " + error.message, "danger");
    });
}

// Supprimer un bénéficiaire
function deleteBeneficiary(id) {
    if (confirm("Are you sure you want to delete this beneficiary?")) {
        const accessToken = localStorage.getItem('access_token'); // Récupérer le token d'accès

        fetch(`http://127.0.0.1:8000/beneficiaries/?id=${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${accessToken}` // Inclure le token d'accès
            }
        })
        .then(response => {
            if (response.status === 401) {
                refreshToken(); // Rafraîchir le token si expiré
            } else if (!response.ok) {
                throw new Error("Erreur lors de la suppression du bénéficiaire.");
            }
            fetchBeneficiaries(); // Recharger la liste
        })
        .catch(error => console.error("Error deleting beneficiary:", error));
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
        fetchBeneficiaries(); // Relancer la requête initiale
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

// Ajouter un event listener pour charger les données du bénéficiaire lors de l'édition
if (window.location.pathname.includes('edit_beneficiary.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
            loadBeneficiaryData(id);
        }
    });
}