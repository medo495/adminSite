document.addEventListener('DOMContentLoaded', function() {
    const apiUrl = 'https://your-api-endpoint.com/categories'; // Replace with your API endpoint
    let categories = []; // To store fetched categories

    // Fetch and display categories
    function fetchCategories() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                categories = data; // Store categories
                displayCategories(categories); // Display all categories initially
            })
            .catch(error => console.error('Error fetching categories:', error));
    }

    // Display categories in the table
    function displayCategories(categoriesToDisplay) {
        const tableBody = document.getElementById('categoriesTableBody');
        tableBody.innerHTML = ''; // Clear existing rows
        categoriesToDisplay.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>${category.description}</td>
                <td>
                    <button onclick="deleteCategory(${category.id})" class="btn btn-danger btn-sm">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Add a new category
    document.getElementById('addCategoryForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const categoryName = document.getElementById('categoryName').value;
        const categoryDescription = document.getElementById('categoryDescription').value;

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: categoryName,
                description: categoryDescription
            })
        })
        .then(response => response.json())
        .then(data => {
            fetchCategories(); // Refresh the list
            document.getElementById('addCategoryForm').reset(); // Clear the form
        })
        .catch(error => console.error('Error adding category:', error));
    });

    // Delete a category
    window.deleteCategory = function(categoryId) {
        fetch(`${apiUrl}/${categoryId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                fetchCategories(); // Refresh the list
            }
        })
        .catch(error => console.error('Error deleting category:', error));
    };

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(event) {
        const searchTerm = event.target.value.toLowerCase();
        const filteredCategories = categories.filter(category => 
            category.name.toLowerCase().includes(searchTerm) || 
            category.description.toLowerCase().includes(searchTerm)
        );
        displayCategories(filteredCategories);
    });

    // Initial fetch to populate the table
    fetchCategories();
});