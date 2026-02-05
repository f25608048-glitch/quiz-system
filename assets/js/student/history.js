import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Auth Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../auth/login.html';
    } else {
        loadHistory(user);
    }
});

async function loadHistory(user) {
    const list = document.getElementById('historyList');
    // In a real app we'd have a specific node for user submissions
    // For now we iterate exams and find submissions by this user

    const examsRef = ref(db, 'exams');
    onValue(examsRef, (snapshot) => {
        list.innerHTML = '';
        const history = [];

        snapshot.forEach(child => {
            const exam = child.val();
            if (exam.submissions && exam.submissions[user.uid]) {
                const sub = exam.submissions[user.uid];
                history.push({
                    title: exam.title,
                    score: sub.score,
                    total: sub.totalQuestions,
                    date: new Date(sub.timestamp).toLocaleDateString(),
                    status: sub.pass ? 'Pass' : 'Fail'
                });
            }
        });

        if (history.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding:30px; color:var(--gray)">No exams taken yet</div>`;
            return;
        }

        history.reverse().forEach(item => { // Show recent first
            const card = `
                <div class="card" style="margin-bottom:20px;">
                    <div class="card-body" style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h3 style="margin-bottom:5px;">${item.title}</h3>
                            <p style="color:var(--gray); font-size:0.9rem;">Taken on: ${item.date}</p>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:1.5rem; font-weight:700; color:${item.status === 'Pass' ? 'var(--secondary)' : 'var(--error)'}">
                                ${item.score} / ${item.total}
                            </div>
                            <div class="score-badge ${item.status.toLowerCase()}">${item.status}</div>
                        </div>
                    </div>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', card);
        });
    });
}

// Logout
window.logout = function () {
    signOut(auth).then(() => {
        window.location.href = '../index.html';
    });
}
