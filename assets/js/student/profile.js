import { auth, db, storage } from "../../firebase-config.js";
import { onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Auth Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../auth/login.html';
    } else {
        loadProfile(user);
    }
});

function loadProfile(user) {
    document.getElementById('name').value = user.displayName;
    document.getElementById('email').value = user.email;

    if (user.photoURL) {
        document.getElementById('profilePreview').src = user.photoURL;
    }

    const userRef = ref(db, 'users/' + user.uid);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        document.getElementById('role').value = data.role.toUpperCase();
        document.getElementById('joinDate').value = new Date(data.createdAt).toLocaleDateString();
        document.getElementById('rollNo').value = data.rollNo || '';
    });
}

// Upload Photo
window.uploadPhoto = async function () {
    const file = document.getElementById('photoInput').files[0];
    if (!file) return;

    const user = auth.currentUser;
    const storageRef = sRef(storage, 'profile_photos/' + user.uid);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        await updateProfile(user, { photoURL: url });
        await update(ref(db, 'users/' + user.uid), { photoURL: url });

        document.getElementById('profilePreview').src = url;
        alert('Photo updated successfully!');
    } catch (error) {
        alert('Error uploading photo: ' + error.message);
    }
}

// Update Profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const rollNo = document.getElementById('rollNo').value;
    const user = auth.currentUser;

    try {
        await updateProfile(user, { displayName: name });

        const updates = {
            displayName: name,
            rollNo: rollNo
        };

        await update(ref(db, 'users/' + user.uid), updates);
        alert('Profile updated successfully!');
    } catch (error) {
        alert('Error updating profile: ' + error.message);
    }
});

// Logout
window.logout = function () {
    signOut(auth).then(() => {
        window.location.href = '../index.html';
    });
}
