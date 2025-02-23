// charger les prestataires
document.addEventListener("DOMContentLoaded", function () {
    fetchProviders();
});

function fetchProviders() {
    fetch("http://localhost:8000/providers/")  // Remplace par l'URL correcte de ton backend
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById("providersTableBody");
            tableBody.innerHTML = "";  // Nettoie le tableau avant de le remplir

            data.forEach(provider => {
                let row = `<tr>
                    <td>${provider.id}</td>
                    <td>${provider.full_name}</td>
                    <td>${provider.email}</td>
                    <td>${provider.gender}</td>
                    <td>${provider.phone}</td>
                    <td>${provider.address}</td>
                    <td>${provider.services}</td>
                    <td><span class="badge ${provider.availability ? 'bg-success' : 'bg-danger'}">${provider.availability ? 'Available' : 'Unavailable'}</span></td>
                    <td>${provider.rating} ⭐</td>
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
document.getElementById("addProviderForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Empêcher le rechargement de la page

    let formData = {
        full_name: document.getElementById("providerName").value,
        email: document.getElementById("providerEmail").value,
        gender: document.getElementById("providerGender").value,
        phone: document.getElementById("providerPhone").value,
        address: document.getElementById("providerAddress").value,
        services: document.getElementById("providerServices").value,
        availability: document.getElementById("providerAvailability").checked,
        rating: parseFloat(document.getElementById("providerRating").value) || 0
    };

    console.log("Sending data:", formData); // Debug : Voir les données envoyées

    fetch("http://localhost:8000/api/providers/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        console.log("Success:", data);
        fetchProviders(); // Recharger la liste
        document.getElementById("addProviderForm").reset();
    })
    .catch(error => console.error("Error adding provider:", error));
});

// Form validation
(function () {
    'use strict';
    var forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
})();
// modifier prestataire 
function editProvider(id) {
    fetch(`http://localhost:8000/providers/${id}/`)
        .then(response => response.json())
        .then(provider => {
            document.getElementById("providerId").value = provider.id;
            document.getElementById("providerName").value = provider.full_name;
            document.getElementById("providerEmail").value = provider.email;
            document.getElementById("providerGender").value = provider.gender;
            document.getElementById("providerPhone").value = provider.phone;
            document.getElementById("providerAddress").value = provider.address;
            document.getElementById("providerServices").value = provider.services;
            document.getElementById("providerAvailability").checked = provider.availability;
            document.getElementById("providerRating").value = provider.rating;
        })
        .catch(error => console.error("Error fetching provider:", error));
}
// envoyer modifications
document.getElementById("editProviderForm").addEventListener("submit", function (event) {
    event.preventDefault();

    let id = document.getElementById("providerId").value;
    let formData = {
        full_name: document.getElementById("providerName").value,
        email: document.getElementById("providerEmail").value,
        gender: document.getElementById("providerGender").value,
        phone: document.getElementById("providerPhone").value,
        address: document.getElementById("providerAddress").value,
        services: document.getElementById("providerServices").value,
        availability: document.getElementById("providerAvailability").checked,
        rating: document.getElementById("providerRating").value
    };

    fetch(`http://localhost:8000/providers/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            fetchProviders();
            document.getElementById("editProviderForm").reset();
        })
        .catch(error => console.error("Error updating provider:", error));
});

//supprimer provider 
function deleteProvider(id) {
    if (confirm("Are you sure you want to delete this provider?")) {
        fetch(`http://localhost:8000/providers/${id}/`, {
            method: "DELETE"
        })
            .then(() => fetchProviders())
            .catch(error => console.error("Error deleting provider:", error));
    }
}
