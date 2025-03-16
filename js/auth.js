document.addEventListener("DOMContentLoaded", function () {
    // Gestion de la connexion (uniquement si le formulaire de connexion existe)
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
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
    }

    // Gestion de la déconnexion (uniquement si le bouton de déconnexion existe)
    const confirmLogout = document.getElementById("confirmLogout");
    if (confirmLogout) {
        confirmLogout.addEventListener("click", function (event) {
            event.preventDefault(); // Empêcher le comportement par défaut du lien

            const accessToken = localStorage.getItem("access_token"); // Récupérer le token d'accès
            const refreshToken = localStorage.getItem("refresh_token"); // Récupérer le token de rafraîchissement

            // Fonction pour effectuer la déconnexion
            function performLogout(token) {
                fetch("http://127.0.0.1:8000/logout/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` // Inclure le token d'accès dans l'en-tête
                    },
                    body: JSON.stringify({
                        refresh_token: refreshToken // Inclure le token de rafraîchissement dans le corps de la requête
                    })
                })
                .then(response => {
                    if (response.ok) {
                        // Si la déconnexion est réussie, supprimer les tokens du localStorage
                        localStorage.removeItem("access_token");
                        localStorage.removeItem("refresh_token");

                        // Rediriger vers la page de connexion
                        window.location.href = "login.html";
                    } else if (response.status === 401) {
                        // Si le token d'accès est expiré, rafraîchir le token
                        refreshAccessToken();
                    } else {
                        throw new Error("Échec de la déconnexion.");
                    }
                })
                .catch(error => {
                    console.error("Erreur lors de la déconnexion :", error);
                    alert("Une erreur s'est produite lors de la déconnexion. Veuillez réessayer.");
                });
            }

            // Fonction pour rafraîchir le token d'accès
            function refreshAccessToken() {
                fetch("http://127.0.0.1:8000/token/refresh/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        refresh: refreshToken // Envoyer le token de rafraîchissement
                    })
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error("Échec du rafraîchissement du token.");
                    }
                })
                .then(data => {
                    // Stocker le nouveau token d'accès
                    localStorage.setItem("access_token", data.access_token);

                    // Réessayer la déconnexion avec le nouveau token
                    performLogout(data.access_token);
                })
                .catch(error => {
                    console.error("Erreur lors du rafraîchissement du token :", error);
                    // Si le rafraîchissement échoue, déconnecter l'utilisateur de force
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    window.location.href = "login.html";
                });
            }
       // Tenter la déconnexion avec le token d'accès actuel
       performLogout(accessToken);
        });
    }
});