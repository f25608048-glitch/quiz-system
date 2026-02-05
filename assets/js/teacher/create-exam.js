import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let questions = [];

// Auth Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../auth/login.html';
    }
});

// Add Question Logic
document.getElementById('addQuestionBtn').addEventListener('click', () => {
    const type = document.getElementById('qType').value;
    const text = document.getElementById('qText').value;
    const marks = parseInt(document.getElementById('qMarks').value);

    if (!text) return alert('Question text is required');

    let question = {
        id: Date.now(),
        type,
        text,
        marks
    };

    if (type === 'mcq') {
        const opt1 = document.getElementById('opt1').value;
        const opt2 = document.getElementById('opt2').value;
        const opt3 = document.getElementById('opt3').value;
        const opt4 = document.getElementById('opt4').value;
        const correct = document.getElementById('correctOpt').value;

        if (!opt1 || !opt2 || !opt3 || !opt4) return alert('All options are required');

        question.options = { 1: opt1, 2: opt2, 3: opt3, 4: opt4 };
        question.correct = correct;
    }

    questions.push(question);
    renderQuestions();

    // Reset Form
    document.getElementById('qText').value = '';
    if (type === 'mcq') {
        document.getElementById('opt1').value = '';
        document.getElementById('opt2').value = '';
        document.getElementById('opt3').value = '';
        document.getElementById('opt4').value = '';
    }
});

// Render Questions List
function renderQuestions() {
    const list = document.getElementById('questionsList');
    list.innerHTML = '';

    questions.forEach((q, index) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.padding = '15px';
        item.style.marginBottom = '10px';
        item.style.borderRadius = '8px';

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>Q${index + 1}: ${q.text}</strong>
                <span style="color:var(--gray)">${q.marks} Marks</span>
            </div>
            <div style="font-size:0.9rem; color:var(--gray); margin-top:5px;">
                Type: ${q.type.toUpperCase()}
            </div>
            <button onclick="removeQuestion(${index})" style="color:red; background:none; border:none; cursor:pointer; margin-top:10px;">Delete</button>
        `;
        list.appendChild(item);
    });
}

window.removeQuestion = function (index) {
    questions.splice(index, 1);
    renderQuestions();
}

// Show/Hide MCQ Options
document.getElementById('qType').addEventListener('change', (e) => {
    const mcqOptions = document.getElementById('mcqOptions');
    if (e.target.value === 'mcq') {
        mcqOptions.style.display = 'block';
    } else {
        mcqOptions.style.display = 'none';
    }
});

// Create Exam
document.getElementById('createExamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (questions.length === 0) return alert('Please add at least one question');

    const title = document.getElementById('examTitle').value;
    const duration = document.getElementById('duration').value;
    const startTime = document.getElementById('startTime').value;
    const allowedRolls = document.getElementById('allowedRolls').value;

    const examData = {
        title,
        duration: parseInt(duration),
        startTime,
        questions,
        createdBy: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        active: true,
        allowedRolls: allowedRolls ? allowedRolls.split(',').map(r => r.trim()) : 'all'
    };

    try {
        const newExamRef = push(ref(db, 'exams'));
        await set(newExamRef, examData);
        alert('Exam Created Successfully! Exam ID: ' + newExamRef.key);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Logout
window.logout = function () {
    signOut(auth).then(() => {
        window.location.href = '../index.html';
    });
}
