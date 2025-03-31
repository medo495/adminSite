document.addEventListener('DOMContentLoaded', function () {
    const apiUrl = 'http://127.0.0.1:8000/categories/'; // Remplacez par votre endpoint API
    let categories = []; // Pour stocker les catégories récupérées

    // Fonction pour récupérer et afficher les catégories
    function fetchCategories() {
        const accessToken = localStorage.getItem('access_token'); // Récupérer le token d'accès

        fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}` // Ajouter l'en-tête d'autorisation
            }
        })
        .then(response => {
            if (response.status === 401) {
                return refreshToken().then(fetchCategories); // Réessayer après rafraîchissement
            } else if (!response.ok) {
                throw new Error('Erreur lors de la récupération des catégories.');
            }
            return response.json();
        })
        .then(data => {
            categories = data; // Stocker les catégories
            displayCategories(categories); // Afficher les catégories
        })
        .catch(error => console.error('Erreur lors de la récupération des catégories :', error));
    }

    // Fonction pour afficher les catégories dans le tableau
    function displayCategories(categoriesToDisplay) {
        const tableBody = document.getElementById('categoriesTableBody');
        if (!tableBody) {
            console.error('Erreur: Élément #categoriesTableBody introuvable.');
            return;
        }
    
        tableBody.innerHTML = ''; // Effacer les lignes existantes
    
        if (!Array.isArray(categoriesToDisplay)) {
            console.error('Erreur: Les données reçues ne sont pas un tableau.');
            return;
        }
        categoriesToDisplay.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.category_id}</td>
                <td>${category.category_name}</td>
                <td>${category.category_description}</td>
                <td>
                    <button onclick="deleteCategory(${category.category_id})" class="btn btn-danger btn-sm">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    
    // Fonction pour ajouter une nouvelle catégorie
    document.getElementById('addCategoryForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const accessToken = localStorage.getItem('access_token');
        const categoryName = document.getElementById('categoryName').value;
        const categoryDescription = document.getElementById('categoryDescription').value;

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                category_name: categoryName,
                category_description: categoryDescription
            })
        })
        .then(response => {
            if (response.status === 401) {
                return refreshToken().then(fetchCategories); // Rafraîchir et recharger
            } else if (!response.ok) {
                throw new Error("Erreur lors de l'ajout de la catégorie.");
            }
            return response.json();
        })
        .then(() => {
            fetchCategories(); // Rafraîchir la liste des catégories
            document.getElementById('addCategoryForm').reset(); // Réinitialiser le formulaire
        })
        .catch(error => console.error("Erreur lors de l'ajout de la catégorie :", error));
    });

    // Fonction pour supprimer une catégorie
    window.deleteCategory = function (categoryId) {
        const accessToken = localStorage.getItem('access_token');

        fetch(`${apiUrl}?id=${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => {
            if (response.status === 401) {
                return refreshToken().then(() => deleteCategory(categoryId));
            } else if (!response.ok) {
                throw new Error("Erreur lors de la suppression de la catégorie.");
            }
            fetchCategories(); // Rafraîchir la liste
        })
        .catch(error => console.error("Erreur lors de la suppression de la catégorie :", error));
    };

    // Fonction de recherche de catégories
    document.getElementById('searchButton').addEventListener('click', function (event) {
        event.preventDefault();
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filteredCategories = categories.filter(category =>
            category.category_name.toLowerCase().includes(searchTerm) ||
            category.category_description.toLowerCase().includes(searchTerm)
        );
        displayCategories(filteredCategories);
    });

    // Fonction pour rafraîchir le token d'accès
    function refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');

        return fetch('http://127.0.0.1:8000/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh: refreshToken })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Échec du rafraîchissement du token.');
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('access_token', data.access);
            console.log('Token rafraîchi avec succès.');
        })
        .catch(error => {
            console.error('Erreur lors du rafraîchissement du token :', error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = 'login.html'; // Redirection vers la page de connexion
        });
    }

    // Charger les catégories au démarrage
    fetchCategories();
});
