import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Auth Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../auth/login.html';
    } else {
        loadDashboardData(user);
    }
});

function loadDashboardData(user) {
    // 1. User Profile
    const userRef = ref(db, 'users/' + user.uid);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        document.getElementById('studentName').textContent = data.displayName || 'Student';
        if (data.photoURL) {
            document.getElementById('profileImg').src = data.photoURL;
        }
    });

    // 2. Load Stats
    const studentStatsRef = ref(db, 'students/' + user.uid);
    onValue(studentStatsRef, (snapshot) => {
        const data = snapshot.val() || {};
        document.getElementById('examsTaken').textContent = data.examsTaken || 0;
        document.getElementById('avgScore').textContent = (data.avgScore || 0) + '%';
        document.getElementById('bestScore').textContent = (data.bestScore || 0) + '%';
    });

    // 3. Load Recent Results (from history mainly)
    // For now, let's load joined exams
    // Ideally we should have a `students/{uid}/history` node
}

// Join Exam
document.getElementById('joinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const teacherId = document.getElementById('teacherId').value;
    const rollNo = document.getElementById('rollNo').value;

    // Save Roll No to profile
    const user = auth.currentUser;
    await update(ref(db, 'users/' + user.uid), { rollNo: rollNo });

    // Check if any active exam exists for this teacher
    // In a real app, we would query active exams directly
    // For specific exam join, we might need Exam ID. 
    // If joining by Teacher ID, we find active exam of that teacher.

    const examsRef = ref(db, 'exams');
    const snapshot = await get(examsRef);
    let foundExamId = null;

    snapshot.forEach(child => {
        const exam = child.val();
        if (exam.createdBy === teacherId && exam.active) {
            // Check if roll number allowed
            if (exam.allowedRolls === 'all' || exam.allowedRolls.includes(rollNo)) {
                foundExamId = child.key;
            }
        }
    });

    if (foundExamId) {
        window.location.href = `take-exam.html?id=${foundExamId}`;
    } else {
        alert('No active exam found for this Teacher ID or Roll Number not allowed.');
    }
});

// Logout
window.logout = function () {
    signOut(auth).then(() => {
        window.location.href = '../index.html';
    });
}
