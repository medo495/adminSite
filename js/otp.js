document.getElementById('otpForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Empêche le rechargement de la page

    const otp = document.getElementById('otp').value.trim();
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Réinitialiser les messages
    errorMessage.textContent = '';
    successMessage.textContent = '';

    // Validation du code OTP
    if (otp === '' || otp.length !== 6) {
        errorMessage.textContent = 'Veuillez entrer un code OTP valide de 6 chiffres.';
        return;
    }

    // Récupérer l'email depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    console.log('Email récupéré:', email);

    if (!email) {
        errorMessage.textContent = 'Email non trouvé. Veuillez réessayer.';
        return;
    }

    // Activer l'indicateur de chargement
    const submitButton = document.querySelector('#otpForm button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Vérification en cours...';

    try {
        const response = await fetch('http://127.0.0.1:8000/password-reset/verify-otp/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email, otp: otp }),
        });

        const data = await response.json();

        if (response.status === 200) {
            // Succès : Rediriger vers la page de réinitialisation du mot de passe
            successMessage.textContent = 'OTP vérifié avec succès !';
            setTimeout(() => {
                window.location.href = `newpassword.html?email=${encodeURIComponent(email)}`;
            }, 2000); // Redirection après 2 secondes
        } else {
            // Erreur : Afficher le message d'erreur
            errorMessage.textContent = data.message || 'La vérification du code OTP a échoué.';
        }
    } catch (error) {
        errorMessage.textContent = 'Une erreur est survenue. Veuillez réessayer.';
    } finally {
        // Désactiver l'indicateur de chargement
        submitButton.disabled = false;
        submitButton.textContent = 'Verify OTP';
    }
});