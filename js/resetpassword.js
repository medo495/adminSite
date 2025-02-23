document.getElementById('resetPasswordForm').addEventListener('submit', async function (event) {
  event.preventDefault(); // Empêche le rechargement de la page

  const email = document.getElementById('email').value.trim();
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');
  
  // Réinitialiser les messages
  errorMessage.textContent = '';
  successMessage.textContent = '';

  if (email === '') {
      errorMessage.textContent = 'Veuillez entrer une adresse email valide.';
      return;
  }

  // Activer l'indicateur de chargement (vous pouvez ajouter un spinner ici)
  const submitButton = document.querySelector('#resetPasswordForm button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Envoi en cours...';

  try {
      const response = await fetch('http://127.0.0.1:8000/password-reset/send-otp/', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email }),
      });

      const data = await response.json();

      if (response.status === 200) {
          // Succès : Rediriger vers la page OTP
          successMessage.textContent = 'Code de réinitialisation envoyé avec succès !';
          setTimeout(() => {
              window.location.href = `otp.html?email=${encodeURIComponent(email)}`;
          }, 2000); // Redirection après 2 secondes
      } else {
          // Erreur : Afficher le message d'erreur
          errorMessage.textContent = data.error || 'Une erreur est survenue.';
      }
  } catch (error) {
      errorMessage.textContent = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  } finally {
      // Désactiver l'indicateur de chargement
      submitButton.disabled = false;
      submitButton.textContent = 'Send Reset Code';
  }
});