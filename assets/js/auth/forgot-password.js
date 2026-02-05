import { auth } from "../../firebase-config.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const msgDiv = document.getElementById('message');

    try {
        await sendPasswordResetEmail(auth, email);
        msgDiv.style.display = 'block';
        msgDiv.className = 'success-message';
        msgDiv.textContent = '✅ Password reset email sent! Check your inbox.';
    } catch (error) {
        msgDiv.style.display = 'block';
        msgDiv.className = 'error-message';
        msgDiv.textContent = '❌ ' + error.message.replace('Firebase: ', '');
    }
});
