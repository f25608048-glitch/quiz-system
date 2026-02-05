import { auth, db } from "../../firebase-config.js";
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let selectedRole = 'student';

// Check URL params for role
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('role')) {
    selectRole(urlParams.get('role'));
}

// Role Selection Logic
window.selectRole = function (role) {
    selectedRole = role;
    document.querySelectorAll('.role-option').forEach(el => el.classList.remove('active'));
    document.getElementById('role-' + role).classList.add('active');
}

// Form Submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUser(userCredential.user, name, selectedRole);
        await sendEmailVerification(userCredential.user);

        alert('Account created! Please verify your email before logging in.');
        window.location.href = 'login.html';
    } catch (error) {
        showError(error.message);
    }
});

// Google Signup
document.getElementById('googleBtn').addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        // Check if user already exists
        const userRef = ref(db, 'users/' + result.user.uid);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            await saveUser(result.user, result.user.displayName, selectedRole);
            alert('Account created successfully!');
        }

        if (selectedRole === 'teacher') {
            window.location.href = '../teacher/dashboard.html';
        } else {
            window.location.href = '../student/dashboard.html';
        }
    } catch (error) {
        showError(error.message);
    }
});

async function saveUser(user, name, role) {
    await set(ref(db, 'users/' + user.uid), {
        displayName: name,
        email: user.email,
        role: role,
        createdAt: new Date().toISOString()
    });

    // Create specific role entry
    if (role === 'teacher') {
        await set(ref(db, 'teachers/' + user.uid), {
            active: true
        });
    } else {
        await set(ref(db, 'students/' + user.uid), {
            examsTaken: 0
        });
    }
}

function showError(msg) {
    const errorDiv = document.getElementById('errorMsg');
    errorDiv.textContent = '❌ ' + msg.replace('Firebase: ', '');
    errorDiv.style.display = 'block';
}

window.checkStrength = function (password) {
    const strengthBar = document.getElementById('strengthBar');
    let strength = 0;
    if (password.length > 5) strength += 20;
    if (password.match(/[A-Z]/)) strength += 20;
    if (password.match(/[0-9]/)) strength += 20;
    if (password.match(/[^A-Za-z0-9]/)) strength += 20;
    if (password.length > 10) strength += 20;

    strengthBar.style.width = strength + '%';
    if (strength < 40) strengthBar.style.backgroundColor = '#ef4444';
    else if (strength < 80) strengthBar.style.backgroundColor = '#f59e0b';
    else strengthBar.style.backgroundColor = '#10b981';
}

window.togglePassword = function () {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
}
