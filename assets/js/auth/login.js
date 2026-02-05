import { auth, db } from "../../firebase-config.js";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const loginForm = document.getElementById('loginForm');
const googleBtn = document.getElementById('googleBtn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMsg');

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await checkUserRole(userCredential.user);
    } catch (error) {
        showError(error.message);
    }
});

googleBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await checkUserRole(result.user);
    } catch (error) {
        showError(error.message);
    }
});

async function checkUserRole(user) {
    const userRef = ref(db, 'users/' + user.uid);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        const role = snapshot.val().role;
        if (role === 'teacher') {
            window.location.href = '../teacher/dashboard.html';
        } else {
            window.location.href = '../student/dashboard.html';
        }
    } else {
        // New Google user without role -> redirect to signup to complete profile
        window.location.href = 'signup.html?email=' + user.email;
    }
}

function showError(msg) {
    const errorDiv = document.getElementById('errorMsg');
    errorDiv.textContent = '❌ ' + msg.replace('Firebase: ', '');
    errorDiv.style.display = 'block';
}

window.togglePassword = function () {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
}
