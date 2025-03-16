document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes('links.html')) {
        fetchProviders();
        fetchBeneficiaries();
        fetchServices();
        fetchLinks();
    }
    
    const addLinkForm = document.getElementById("addLinkForm");
    if (addLinkForm) {
        addLinkForm.addEventListener("submit", handleAddLink);
    }
});

function fetchProviders() {
    fetch("http://127.0.0.1:8000/providers/")
        .then(response => response.json())
        .then(data => {
            let providerSelect = document.getElementById("providerSelect");
            providerSelect.innerHTML = "";
            data.forEach(provider => {
                providerSelect.innerHTML += `<option value="${provider.id}">${provider.fullname}</option>`;
            });
        })
        .catch(error => console.error("Error fetching providers:", error));
}

function fetchBeneficiaries() {
    fetch("http://127.0.0.1:8000/beneficiaries/")
        .then(response => response.json())
        .then(data => {
            let beneficiarySelect = document.getElementById("beneficiarySelect");
            beneficiarySelect.innerHTML = "";
            data.forEach(beneficiary => {
                beneficiarySelect.innerHTML += `<option value="${beneficiary.id}">${beneficiary.fullname}</option>`;
            });
        })
        .catch(error => console.error("Error fetching beneficiaries:", error));
}

function fetchServices() {
    fetch("http://127.0.0.1:8000/services/")
        .then(response => response.json())
        .then(data => {
            let serviceSelect = document.getElementById("serviceSelect");
            serviceSelect.innerHTML = "";
            data.forEach(service => {
                serviceSelect.innerHTML += `<option value="${service.id}">${service.name}</option>`;
            });
        })
        .catch(error => console.error("Error fetching services:", error));
}

function fetchLinks() {
    fetch("http://127.0.0.1:8000/links/")
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById("linksTableBody");
            tableBody.innerHTML = "";
            data.forEach(link => {
                let row = `<tr>
                    <td>${link.id}</td>
                    <td>${link.provider_name}</td>
                    <td>${link.beneficiary_name}</td>
                    <td>${link.service_name}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editLink(${link.id})">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteLink(${link.id})">🗑️</button>
                    </td>
                </tr>`;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => console.error("Error fetching links:", error));
}

function handleAddLink(event) {
    event.preventDefault();
    
    const formData = {
        provider_id: document.getElementById("providerSelect").value,
        beneficiary_id: document.getElementById("beneficiarySelect").value,
        service_id: document.getElementById("serviceSelect").value
    };

    fetch("http://127.0.0.1:8000/links/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        alert("Link added successfully!");
        fetchLinks();
    })
    .catch(error => alert("Error adding link: " + error.message));
}

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

function editLink(id) {
    window.location.href = `edit_link.html?id=${id}`;
}
