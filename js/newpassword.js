document.getElementById('resetPasswordForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Empêche le rechargement de la page

    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Réinitialiser les messages
    errorMessage.textContent = '';
    successMessage.textContent = '';

    // Validation des mots de passe
    if (newPassword === '' || confirmPassword === '') {
        errorMessage.textContent = 'Veuillez remplir tous les champs.';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorMessage.textContent = 'Les mots de passe ne correspondent pas.';
        return;
    }

    // Récupérer l'email depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');

    if (!email) {
        errorMessage.textContent = 'Email non trouvé. Veuillez réessayer.';
        return;
    }

    // Activer l'indicateur de chargement
    const submitButton = document.querySelector('#resetPasswordForm button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Réinitialisation en cours...';

    try {
        const response = await fetch('http://127.0.0.1:8000/password-reset/reset/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email, new_password: newPassword }),
        });

        const data = await response.json();

        if (response.status === 200) {
            // Succès : Afficher un message de succès
            successMessage.textContent = 'Mot de passe réinitialisé avec succès !';
            setTimeout(() => {
                window.location.href = 'login.html'; // Rediriger vers la page de connexion
            }, 2000); // Redirection après 2 secondes
        } else {
            // Erreur : Afficher le message d'erreur
            errorMessage.textContent = data.message || 'La réinitialisation du mot de passe a échoué.';
        }
    } catch (error) {
        errorMessage.textContent = 'Une erreur est survenue. Veuillez réessayer.';
    } finally {
        // Désactiver l'indicateur de chargement
        submitButton.disabled = false;
        submitButton.textContent = 'Reset Password';
    }
});