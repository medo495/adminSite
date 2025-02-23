// Wait until the document is fully loaded
document.addEventListener('DOMContentLoaded', function () {

    // Variables for login page
    const loginForm = document.querySelector('#loginForm');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const rememberMe = document.getElementById('rememberMe');
    const errorMessage = document.getElementById('error-message');

    // Variables for forgot password page
    const forgotPasswordForm = document.getElementById('resetPasswordForm');
    const emailInput = document.getElementById('email');
    const forgotErrorMessage = document.getElementById('errorMessage');
    const forgotSuccessMessage = document.getElementById('successMessage');

    // Handling Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent default form submission

            // Clear previous error messages
            errorMessage.textContent = '';

            // Validate the username and password
            if (username.value.trim() === '' || password.value.trim() === '') {
                errorMessage.textContent = 'Username and Password cannot be empty.';
                return;
            }

            // Handle "Remember Me"
            if (rememberMe.checked) {
                localStorage.setItem('username', username.value);
            } else {
                localStorage.removeItem('username');
            }

            // Here, add the real login logic like sending data to the server or API
            console.log('Login form submitted');
            // Simulate a successful login
            // window.location.href = 'dashboard.html'; // Redirect to another page on success
        });

        // Auto-fill the username field if stored in localStorage
        if (localStorage.getItem('username')) {
            username.value = localStorage.getItem('username');
            rememberMe.checked = true; // Keep "Remember Me" checked if username is saved
        }
    }

    // Handling Forgot Password Form Submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent default form submission

            // Clear any previous messages
            forgotErrorMessage.textContent = '';
            forgotSuccessMessage.textContent = '';

            // Get the email value
            const email = emailInput.value.trim();

            // Basic email validation (you can improve this later)
            const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
            if (!emailPattern.test(email)) {
                forgotErrorMessage.textContent = 'Please enter a valid email address.';
                return;
            }

            // Simulate sending a reset link (replace this with actual backend logic)
            setTimeout(() => {
                // Simulate success (password reset email sent)
                forgotSuccessMessage.textContent = 'A password reset link has been sent to your email address.';
                // You can also redirect the user to the login page after success
                // window.location.href = 'login.html'; // Redirect to login page after success
            }, 1000);
        });
    }

});
