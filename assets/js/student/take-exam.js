import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let examData = null;
let currentExamId = null;
let timerInterval;

// Auth & Exam Check
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../auth/login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    currentExamId = urlParams.get('id');

    if (!currentExamId) {
        alert('No exam selected');
        window.location.href = 'dashboard.html';
        return;
    }

    await loadExam(currentExamId);
});

async function loadExam(examId) {
    const examRef = ref(db, 'exams/' + examId);
    const snapshot = await get(examRef);

    if (!snapshot.exists()) {
        alert('Exam not found');
        window.location.href = 'dashboard.html';
        return;
    }

    examData = snapshot.val();

    // Check if exam started
    const now = new Date();
    const startTime = new Date(examData.startTime);

    if (now < startTime) {
        alert('Exam has not started yet');
        window.location.href = 'dashboard.html';
        return;
    }

    // Check if already submitted
    const user = auth.currentUser;
    if (examData.submissions && examData.submissions[user.uid]) {
        alert('You have already submitted this exam');
        window.location.href = 'dashboard.html';
        return;
    }

    renderExam();
    startTimer(examData.duration);
    startCheatingDetection();
}

function renderExam() {
    document.getElementById('examTitle').textContent = examData.title;
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';

    if (!examData.questions) return;

    examData.questions.forEach((q, index) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        item.style.marginBottom = '20px';
        item.style.padding = '15px';
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.borderRadius = '8px';

        let inputHtml = '';
        if (q.type === 'mcq') {
            Object.entries(q.options).forEach(([key, val]) => {
                inputHtml += `
                    <div style="margin:8px 0;">
                        <input type="radio" name="q_${index}" value="${key}" id="q_${index}_${key}">
                        <label for="q_${index}_${key}">${val}</label>
                    </div>
                `;
            });
        } else {
            inputHtml = `<textarea name="q_${index}" rows="3" style="width:100%; margin-top:10px; padding:10px; border-radius:8px; background:var(--dark); color:white; border:1px solid rgba(255,255,255,0.1);"></textarea>`;
        }

        item.innerHTML = `
            <div style="font-weight:600; margin-bottom:10px;">
                Q${index + 1}: ${q.text} <span style="font-size:0.8rem; color:var(--gray)">(${q.marks} Marks)</span>
            </div>
            ${inputHtml}
        `;
        container.appendChild(item);
    });
}

function startTimer(durationMinutes) {
    let timeLeft = durationMinutes * 60;
    const timerDisplay = document.getElementById('timer');

    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timeLeft <= 300) { // Last 5 mins
            timerDisplay.style.color = 'red';
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitExam(true); // Auto submit
        }

        timeLeft--;
    }, 1000);
}

// Cheating Detection
function startCheatingDetection() {
    let warnings = 0;
    const overlay = document.getElementById('cheatingOverlay');

    // Detect Tab Switch / Window Blur
    window.addEventListener('blur', () => {
        overlay.style.display = 'flex';
        document.title = "⚠️ ATTENTION REQUIRED ⚠️";

        // Auto submit if cheating detected
        submitExam(true, true);
    });

    // We can remove focus listener since we are auto-submitting on blur
    // window.addEventListener('focus', () => { ... });
}

// Submit Exam
window.submitExam = async function (auto = false, cheated = false) {
    clearInterval(timerInterval);

    const user = auth.currentUser;
    let score = 0;
    let totalQuestions = 0;
    const answers = {};

    // Calculate Score (MCQ only for now)
    examData.questions.forEach((q, index) => {
        totalQuestions++;
        if (q.type === 'mcq') {
            const selected = document.querySelector(`input[name="q_${index}"]:checked`);
            if (selected) {
                answers[index] = selected.value;
                if (selected.value === q.correct) {
                    score += q.marks;
                }
            }
        } else {
            const text = document.querySelector(`textarea[name="q_${index}"]`);
            if (text) answers[index] = text.value;
        }
    });

    const submissionData = {
        studentId: user.uid,
        studentName: user.displayName, // Display name might not be set if directly from dashboard without reload
        rollNo: user.rollNo || 'N/A', // We need to ensure we have this in profile load or fetch content
        score,
        totalQuestions: examData.questions.reduce((acc, q) => acc + q.marks, 0), // Total possible marks
        answers,
        timestamp: new Date().toISOString(),
        autoSubmitted: auto,
        cheated: cheated,
        cheatingReason: cheated ? 'Tab Switch / Window Blur' : null,
        pass: score >= (examData.questions.length / 2) // Simple 50% pass criteria
    };

    // We need to fetch user profile again to ensure name/roll is correct if missing
    // For now, assume it's there or will be updated on server side logic if needed

    try {
        await set(ref(db, `exams/${currentExamId}/submissions/${user.uid}`), submissionData);

        // Update User Stats
        const userStatsRef = ref(db, `students/${user.uid}`);
        const snapshot = await get(userStatsRef);
        let stats = snapshot.val() || { examsTaken: 0, totalScore: 0, bestScore: 0 };

        stats.examsTaken++;
        stats.totalScore = (stats.totalScore || 0) + score;
        const percentage = (score / submissionData.totalQuestions) * 100;
        if (percentage > (stats.bestScore || 0)) stats.bestScore = Math.round(percentage);

        stats.avgScore = Math.round((stats.totalScore / stats.examsTaken)); // This logic is simplified

        await update(userStatsRef, stats);

        alert(cheated ? 'Exam submitted automatically due to suspicious activity.' : 'Exam Submitted Successfully!');
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Error submitting exam: ' + error.message);
    }
}

document.getElementById('examForm').addEventListener('submit', (e) => {
    e.preventDefault();
    submitExam();
});
