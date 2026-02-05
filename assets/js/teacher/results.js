import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Auth Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../auth/login.html';
    } else {
        loadResults();
    }
});

let allSubmissions = [];

function loadResults() {
    const examsRef = ref(db, 'exams');
    const loadingDiv = document.getElementById('loading');
    const tbody = document.getElementById('resultsBody');

    onValue(examsRef, (snapshot) => {
        allSubmissions = [];
        tbody.innerHTML = '';

        snapshot.forEach((childSnapshot) => {
            const exam = childSnapshot.val();
            if (exam.submissions) {
                Object.values(exam.submissions).forEach(sub => {
                    allSubmissions.push({
                        student: sub.studentName, // Assuming we saved name
                        roll: sub.rollNo || 'N/A',
                        exam: exam.title,
                        score: sub.score,
                        total: sub.totalQuestions,
                        status: sub.pass ? 'Pass' : 'Fail',
                        date: new Date(sub.timestamp).toLocaleDateString(),
                        cheated: sub.cheated ? 'Yes' : 'No'
                    });
                });
            }
        });

        renderTable(allSubmissions);
        loadingDiv.style.display = 'none';
    });
}

function renderTable(data) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">No submissions found</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = `
            <tr>
                <td><div class="student-info"><div class="avatar" style="width:30px; height:30px; font-size:0.8rem;">${item.student.charAt(0)}</div> ${item.student}</div></td>
                <td>${item.roll}</td>
                <td>${item.exam}</td>
                <td><span class="score-badge ${item.status.toLowerCase()}">${item.score}/${item.total}</span></td>
                <td>${item.date}</td>
                <td><span style="color:${item.cheated === 'Yes' ? 'red' : 'green'}">${item.cheated}</span></td>
                <td><button class="btn btn-outline" style="padding:4px 10px; font-size:0.8rem;">Details</button></td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allSubmissions.filter(item =>
        item.student.toLowerCase().includes(term) ||
        item.exam.toLowerCase().includes(term) ||
        item.roll.toLowerCase().includes(term)
    );
    renderTable(filtered);
});

// Export to Excel
window.exportToExcel = function () {
    if (allSubmissions.length === 0) return alert('No data to export');

    const workbook = new ExcelJS.Workbook(); // Assuming ExcelJS is loaded globally
    const sheet = workbook.addWorksheet('Results');

    sheet.columns = [
        { header: 'Student Name', key: 'student', width: 20 },
        { header: 'Roll No', key: 'roll', width: 15 },
        { header: 'Exam', key: 'exam', width: 25 },
        { header: 'Score', key: 'score', width: 10 },
        { header: 'Total', key: 'total', width: 10 },
        { header: 'Pass/Fail', key: 'status', width: 10 },
        { header: 'Cheated', key: 'cheated', width: 10 },
        { header: 'Date', key: 'date', width: 15 }
    ];

    allSubmissions.forEach(sub => {
        sheet.addRow(sub);
    });

    // Style Header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };

    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SmartQuiz_Results.xlsx';
        a.click();
    });
}

// Logout
window.logout = function () {
    signOut(auth).then(() => {
        window.location.href = '../index.html';
    });
}
