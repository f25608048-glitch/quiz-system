import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, onValue, query, orderByChild } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
        document.getElementById('teacherName').textContent = data.displayName || 'Teacher';
        if (data.photoURL) {
            document.getElementById('profileImg').src = data.photoURL;
        }
    });

    // 2. Load Stats & Recent Submissions
    const examsRef = ref(db, 'exams');
    const studentsRef = ref(db, 'students');

    // Count Exams
    onValue(examsRef, (snapshot) => {
        const exams = snapshot.val();
        document.getElementById('totalExams').textContent = exams ? Object.keys(exams).length : 0;
    });

    // Count Students
    onValue(studentsRef, (snapshot) => {
        const students = snapshot.val();
        document.getElementById('totalStudents').textContent = students ? Object.keys(students).length : 0;
    });

    // Load Submissions (Assuming we have a 'submissions' node - if not, we iterate exams)
    // For now, let's just listen to all exams and aggregate submissions
    onValue(examsRef, (snapshot) => {
        let totalSubmissions = 0;
        let recentSubs = [];

        snapshot.forEach((childSnapshot) => {
            const exam = childSnapshot.val();
            if (exam.submissions) {
                totalSubmissions += Object.keys(exam.submissions).length;

                // Collect recent submissions
                Object.values(exam.submissions).forEach(sub => {
                    recentSubs.push({
                        student: sub.studentName,
                        exam: exam.title,
                        score: sub.score,
                        total: sub.totalQuestions, // Assuming 1 mark per question for now
                        status: sub.pass ? 'Pass' : 'Fail'
                    });
                });
            }
        });

        document.getElementById('totalSubmissions').textContent = totalSubmissions;
        renderRecentSubmissions(recentSubs.slice(-5).reverse());
    });
}

function renderRecentSubmissions(submissions) {
    const list = document.getElementById('recentSubmissions');
    list.innerHTML = '';

    if (submissions.length === 0) {
        list.innerHTML = '<div style="padding:20px; text-align:center; color:var(--gray)">No submissions yet</div>';
        return;
    }

    submissions.forEach(sub => {
        const item = `
            <div class="list-item">
                <div class="student-info">
                    <div class="avatar">${sub.student.charAt(0)}</div>
                    <div>
                        <div style="font-weight:600">${sub.student}</div>
                        <div style="font-size:0.85rem; color:var(--gray)">${sub.exam}</div>
                    </div>
                </div>
                <div class="score-badge ${sub.status.toLowerCase()}">
                    ${sub.score}/${sub.total} • ${sub.status}
                </div>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', item);
    });
}

// Logout
window.logout = function () {
    signOut(auth).then(() => {
        window.location.href = '../index.html';
    });
}
