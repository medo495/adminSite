document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("loginForm").addEventListener("submit", function(event) {
        event.preventDefault();

        const identifier = document.getElementById("identifier").value;
        const password = document.getElementById("password").value;

        // Validation des champs
        if (identifier.trim() === "" || password.trim() === "") {
            document.getElementById("error-message").textContent = "Please enter both username/email and password.";
            return;
        }

        // Envoyer la requête POST à l'API de connexion
        fetch("http://127.0.0.1:8000/admin-login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ identifier: identifier, password: password })
        })
        .then(response => {
            if (response.status === 403) {
                // Si le statut est 403, l'utilisateur n'est pas un admin
                throw new Error("Il semble que vous n'êtes pas un administrateur.");
            } else if (response.ok) {
                // Si la réponse est réussie (statut 200-299), retourner les données JSON
                return response.json();
            } else {
                // Pour les autres erreurs, lever une exception générique
                throw new Error('Identifiants invalides');
            }
        })
        .then(data => {
            if (data.access_token && data.refresh_token) {
                // Stocker les tokens dans le localStorage
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);

                // Rediriger vers la page Dashboard
                window.location.href = "dashboard.html";
            } else {
                document.getElementById("error-message").textContent = "Invalid username or password.";
            }
        })
        .catch(error => {
            console.error("Error:", error);
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block'; // Afficher le message d'erreur
        });
    });
});