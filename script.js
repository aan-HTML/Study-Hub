// ==================== GLOBAL STATE ====================
let currentTab = 'tasks';
let tasks = [];
let grades = [];
let flashcardSets = [];
let currentSet = null;
let currentCardIndex = 0;
let isFlipped = false;

let pomodoroMinutes = 25;
let pomodoroSeconds = 0;
let pomodoroInterval = null;
let isPomodoroRunning = false;
let pomodoroMode = 'focus'; // 'focus' or 'break'

let notes = [];
let editingNoteId = null;

// ==================== AUTO-SAVE & LOAD ====================
function saveData() {
    const data = {
        tasks: tasks,
        grades: grades,
        flashcardSets: flashcardSets,
        notes: notes,
        lastSaved: new Date().toISOString()
    };
    localStorage.setItem('studyhub_data', JSON.stringify(data));
    console.log('✅ Data tersimpan otomatis');
}

function loadData() {
    const savedData = localStorage.getItem('studyhub_data');
    if (savedData) {
        const data = JSON.parse(savedData);
        tasks = data.tasks || [];
        grades = data.grades || [];
        flashcardSets = data.flashcardSets || [];
        notes = data.notes || [];
        console.log('✅ Data berhasil dimuat');
    } else {
        // Data contoh untuk pertama kali
        tasks = [
            { id: 1, title: 'PR Matematika - Halaman 45', subject: 'Matematika', deadline: '2026-01-30', completed: false },
            { id: 2, title: 'Presentasi IPA tentang Fotosintesis', subject: 'IPA', deadline: '2026-02-01', completed: false }
        ];
        flashcardSets = [
            { 
                id: 1, 
                name: 'Vocab Bahasa Inggris', 
                cards: [
                    { id: 1, front: 'Beautiful', back: 'Indah' },
                    { id: 2, front: 'Difficult', back: 'Sulit' }
                ]
            }
        ];
        notes = [
            { id: 1, title: 'Rumus Matematika', content: 'a² + b² = c²\n(a+b)² = a² + 2ab + b²', subject: 'Matematika' }
        ];
        saveData(); // Simpan data contoh
    }
}

// ==================== NOTIFICATION SYSTEM ====================
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('✅ Izin notifikasi diberikan');
            }
        });
    }
}

function sendNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: 'icon-192.png', // Nanti diganti dengan icon kamu
            badge: 'icon-192.png'
        });
    }
}

function checkTaskReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    tasks.forEach(task => {
        if (!task.completed) {
            const deadline = new Date(task.deadline);
            deadline.setHours(0, 0, 0, 0);
            
            const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            
            // Notifikasi jika deadline hari ini atau besok
            if (daysUntil === 0) {
                sendNotification('⚠️ Deadline Hari Ini!', `${task.title} - ${task.subject}`);
            } else if (daysUntil === 1) {
                sendNotification('📅 Deadline Besok!', `${task.title} - ${task.subject}`);
            }
        }
    });
}

// Check reminders setiap 1 jam
setInterval(checkTaskReminders, 3600000);

// ==================== TAB SWITCHING ====================
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');
    
    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// ==================== TASKS ====================
function toggleTaskForm() {
    const form = document.getElementById('task-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function addTask() {
    const title = document.getElementById('task-title').value;
    const subject = document.getElementById('task-subject').value;
    const deadline = document.getElementById('task-deadline').value;
    
    if (!title || !subject || !deadline) {
        alert('Mohon isi semua field!');
        return;
    }
    
    const newTask = {
        id: Date.now(),
        title: title,
        subject: subject,
        deadline: deadline,
        completed: false
    };
    
    tasks.push(newTask);
    
    // Clear form
    document.getElementById('task-title').value = '';
    document.getElementById('task-subject').value = '';
    document.getElementById('task-deadline').value = '';
    toggleTaskForm();
    
    saveData(); // Auto-save
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData(); // Auto-save
        renderTasks();
    }
}

function deleteTask(id) {
    if (confirm('Yakin ingin menghapus tugas ini?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveData(); // Auto-save
        renderTasks();
    }
}

function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p style="text-align: center; color: #64748b;">Belum ada tugas. Yuk tambah tugas baru!</p>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => {
        const deadlineDate = new Date(task.deadline).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                    <div class="task-meta">
                        <span class="task-badge">${task.subject}</span>
                        <span class="task-deadline">📅 ${deadlineDate}</span>
                    </div>
                </div>
                <button class="btn-danger" onclick="deleteTask(${task.id})">🗑️</button>
            </div>
        `;
    }).join('');
}

// ==================== GRADES ====================
function addGrade() {
    const subject = document.getElementById('grade-subject').value;
    const score = parseFloat(document.getElementById('grade-score').value);
    const note = document.getElementById('grade-note').value;
    
    if (!subject || isNaN(score) || score < 0 || score > 100) {
        alert('Mohon isi mata pelajaran dan nilai yang valid (0-100)!');
        return;
    }
    
    const existingGrade = grades.find(g => g.subject === subject);
    
    if (existingGrade) {
        existingGrade.scores.push({
            value: score,
            note: note || '-'
        });
    } else {
        grades.push({
            id: Date.now(),
            subject: subject,
            scores: [{
                value: score,
                note: note || '-'
            }]
        });
    }
    
    // Clear form
    document.getElementById('grade-subject').value = '';
    document.getElementById('grade-score').value = '';
    document.getElementById('grade-note').value = '';
    
    saveData(); // Auto-save
    renderGrades();
}

function calculateAverage(scores) {
    const sum = scores.reduce((a, b) => a + b.value, 0);
    return (sum / scores.length).toFixed(2);
}

function renderGrades() {
    const gradesList = document.getElementById('grades-list');
    
    if (grades.length === 0) {
        gradesList.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Belum ada nilai. Silakan tambah nilai baru menggunakan form di atas! 📝</p>';
        return;
    }
    
    gradesList.innerHTML = grades.map(grade => `
        <div class="grade-card">
            <h3>${grade.subject}</h3>
            <div class="grade-scores">
                ${grade.scores.map((score, idx) => `
                    <div class="grade-row-detailed">
                        <div class="grade-row-header">
                            <span class="grade-label">Nilai ${idx + 1}</span>
                            <span class="grade-value">${score.value}</span>
                        </div>
                        <span class="grade-note-text">${score.note}</span>
                    </div>
                `).join('')}
            </div>
            <div class="grade-average">
                <span class="grade-average-label">Rata-rata</span>
                <span class="grade-average-value">${calculateAverage(grade.scores)}</span>
            </div>
        </div>
    `).join('');
}

// ==================== FLASHCARDS ====================
function toggleSetForm() {
    const form = document.getElementById('set-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function createSet() {
    const name = document.getElementById('set-name').value;
    
    if (!name) {
        alert('Mohon isi nama set!');
        return;
    }
    
    flashcardSets.push({
        id: Date.now(),
        name: name,
        cards: []
    });
    
    document.getElementById('set-name').value = '';
    toggleSetForm();
    saveData(); // Auto-save
    renderSets();
}

function openSet(setId) {
    currentSet = flashcardSets.find(s => s.id === setId);
    currentCardIndex = 0;
    isFlipped = false;
    
    document.getElementById('flashcard-sets-view').style.display = 'none';
    document.getElementById('flashcard-study-view').style.display = 'block';
    
    renderCurrentCard();
}

function backToSets() {
    currentSet = null;
    currentCardIndex = 0;
    isFlipped = false;
    
    document.getElementById('flashcard-sets-view').style.display = 'block';
    document.getElementById('flashcard-study-view').style.display = 'none';
}

function flipCard() {
    isFlipped = !isFlipped;
    renderCurrentCard();
}

function nextCard() {
    if (currentCardIndex < currentSet.cards.length - 1) {
        currentCardIndex++;
        isFlipped = false;
        renderCurrentCard();
    }
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        isFlipped = false;
        renderCurrentCard();
    }
}

function addCard() {
    const front = document.getElementById('card-front').value;
    const back = document.getElementById('card-back').value;
    
    if (!front || !back) {
        alert('Mohon isi kedua sisi kartu!');
        return;
    }
    
    currentSet.cards.push({
        id: Date.now(),
        front: front,
        back: back
    });
    
    document.getElementById('card-front').value = '';
    document.getElementById('card-back').value = '';
    
    saveData(); // Auto-save
    renderCurrentCard();
}

function renderSets() {
    const setsList = document.getElementById('sets-list');
    
    if (flashcardSets.length === 0) {
        setsList.innerHTML = '<p style="text-align: center; color: #64748b;">Belum ada set flashcard. Yuk buat set baru!</p>';
        return;
    }
    
    setsList.innerHTML = flashcardSets.map(set => `
        <div class="set-card" onclick="openSet(${set.id})">
            <h3>${set.name}</h3>
            <p>${set.cards.length} kartu</p>
        </div>
    `).join('');
}

function renderCurrentCard() {
    if (!currentSet) return;
    
    document.getElementById('current-set-name').textContent = currentSet.name;
    
    if (currentSet.cards.length === 0) {
        document.getElementById('card-display').innerHTML = `
            <p style="text-align: center; color: #64748b;">Belum ada kartu di set ini. Tambah kartu baru di bawah!</p>
        `;
        document.getElementById('card-counter').textContent = '0 / 0';
        return;
    }
    
    const card = currentSet.cards[currentCardIndex];
    document.getElementById('card-label').textContent = isFlipped ? 'JAWABAN' : 'PERTANYAAN';
    document.getElementById('card-text').textContent = isFlipped ? card.back : card.front;
    document.getElementById('card-counter').textContent = `${currentCardIndex + 1} / ${currentSet.cards.length}`;
    
    // Update button states
    const prevBtn = document.querySelector('.card-navigation button:first-child');
    const nextBtn = document.querySelector('.card-navigation button:last-child');
    
    prevBtn.disabled = currentCardIndex === 0;
    nextBtn.disabled = currentCardIndex === currentSet.cards.length - 1;
}

// ==================== POMODORO ====================
function toggleTimer() {
    isPomodoroRunning = !isPomodoroRunning;
    
    if (isPomodoroRunning) {
        document.getElementById('timer-btn-icon').textContent = '⏸';
        document.getElementById('timer-btn-text').textContent = 'Pause';
        startPomodoro();
    } else {
        document.getElementById('timer-btn-icon').textContent = '▶';
        document.getElementById('timer-btn-text').textContent = 'Mulai';
        stopPomodoro();
    }
}

function resetTimer() {
    stopPomodoro();
    isPomodoroRunning = false;
    pomodoroMinutes = pomodoroMode === 'focus' ? 25 : 5;
    pomodoroSeconds = 0;
    
    document.getElementById('timer-btn-icon').textContent = '▶';
    document.getElementById('timer-btn-text').textContent = 'Mulai';
    updateTimerDisplay();
}

function startPomodoro() {
    pomodoroInterval = setInterval(() => {
        if (pomodoroSeconds === 0) {
            if (pomodoroMinutes === 0) {
                // Timer selesai
                stopPomodoro();
                isPomodoroRunning = false;
                
                if (pomodoroMode === 'focus') {
                    alert('🎉 Waktu fokus selesai! Waktunya istirahat!');
                    pomodoroMode = 'break';
                    pomodoroMinutes = 5;
                } else {
                    alert('✅ Istirahat selesai! Siap fokus lagi?');
                    pomodoroMode = 'focus';
                    pomodoroMinutes = 25;
                }
                
                document.getElementById('timer-btn-icon').textContent = '▶';
                document.getElementById('timer-btn-text').textContent = 'Mulai';
                updatePomodoroMode();
                updateTimerDisplay();
            } else {
                pomodoroMinutes--;
                pomodoroSeconds = 59;
            }
        } else {
            pomodoroSeconds--;
        }
        
        updateTimerDisplay();
    }, 1000);
}

function stopPomodoro() {
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }
}

function updateTimerDisplay() {
    const minutes = String(pomodoroMinutes).padStart(2, '0');
    const seconds = String(pomodoroSeconds).padStart(2, '0');
    document.getElementById('timer-text').textContent = `${minutes}:${seconds}`;
}

function updatePomodoroMode() {
    const modeBadge = document.getElementById('pomodoro-mode');
    if (pomodoroMode === 'focus') {
        modeBadge.textContent = '🔥 WAKTU FOKUS';
        modeBadge.classList.remove('break');
    } else {
        modeBadge.textContent = '☕ WAKTU ISTIRAHAT';
        modeBadge.classList.add('break');
    }
}

// ==================== NOTES ====================
function toggleNoteForm() {
    const form = document.getElementById('note-form');
    
    if (form.style.display === 'none') {
        form.style.display = 'block';
        editingNoteId = null;
        document.getElementById('note-title').value = '';
        document.getElementById('note-subject').value = '';
        document.getElementById('note-content').value = '';
    } else {
        form.style.display = 'none';
    }
}

function saveNote() {
    const title = document.getElementById('note-title').value;
    const subject = document.getElementById('note-subject').value;
    const content = document.getElementById('note-content').value;
    
    if (!title || !content) {
        alert('Mohon isi judul dan isi catatan!');
        return;
    }
    
    if (editingNoteId) {
        // Edit existing note
        const note = notes.find(n => n.id === editingNoteId);
        if (note) {
            note.title = title;
            note.subject = subject;
            note.content = content;
        }
        editingNoteId = null;
    } else {
        // Add new note
        notes.push({
            id: Date.now(),
            title: title,
            subject: subject,
            content: content
        });
    }
    
    toggleNoteForm();
    saveData(); // Auto-save
    renderNotes();
}

function cancelNote() {
    editingNoteId = null;
    toggleNoteForm();
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    editingNoteId = id;
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-subject').value = note.subject || '';
    document.getElementById('note-content').value = note.content;
    document.getElementById('note-form').style.display = 'block';
}

function deleteNote(id) {
    if (confirm('Yakin ingin menghapus catatan ini?')) {
        notes = notes.filter(n => n.id !== id);
        saveData(); // Auto-save
        renderNotes();
    }
}

function renderNotes() {
    const notesList = document.getElementById('notes-list');
    
    if (notes.length === 0) {
        notesList.innerHTML = '<p style="text-align: center; color: #64748b;">Belum ada catatan. Yuk buat catatan baru!</p>';
        return;
    }
    
    notesList.innerHTML = notes.map(note => `
        <div class="note-card">
            <div class="note-header">
                <h3 class="note-title">${note.title}</h3>
                <div class="note-actions">
                    <button class="btn-edit" onclick="editNote(${note.id})">✏️</button>
                    <button class="btn-danger" onclick="deleteNote(${note.id})">🗑️</button>
                </div>
            </div>
            ${note.subject ? `<span class="note-subject-badge">${note.subject}</span>` : ''}
            <p class="note-content">${note.content}</p>
        </div>
    `).join('');
}

// ==================== EXPORT DATA ====================
function exportToPDF() {
    // Membuat konten HTML untuk PDF
    let html = `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #059669; }
                h2 { color: #0d9488; margin-top: 30px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f0fdfa; color: #064e3b; font-weight: bold; }
                .completed { text-decoration: line-through; color: #888; }
                .section { margin-bottom: 40px; }
            </style>
        </head>
        <body>
            <h1>📚 StudyHub - Laporan Data</h1>
            <p><strong>Tanggal Export:</strong> ${new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}</p>
            
            <div class="section">
                <h2>📅 Tugas & Jadwal</h2>
                <table>
                    <tr>
                        <th>Tugas</th>
                        <th>Mata Pelajaran</th>
                        <th>Deadline</th>
                        <th>Status</th>
                    </tr>
                    ${tasks.map(task => `
                        <tr>
                            <td class="${task.completed ? 'completed' : ''}">${task.title}</td>
                            <td>${task.subject}</td>
                            <td>${new Date(task.deadline).toLocaleDateString('id-ID')}</td>
                            <td>${task.completed ? '✅ Selesai' : '⏳ Belum'}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            
            <div class="section">
                <h2>🧮 Nilai</h2>
                ${grades.map(grade => `
                    <h3>${grade.subject}</h3>
                    <table>
                        <tr>
                            <th>Nilai</th>
                            <th>Catatan</th>
                        </tr>
                        ${grade.scores.map((score, idx) => `
                            <tr>
                                <td>${score.value}</td>
                                <td>${score.note}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <th>Rata-rata</th>
                            <th>${calculateAverage(grade.scores)}</th>
                        </tr>
                    </table>
                `).join('')}
            </div>
            
            <div class="section">
                <h2>📝 Catatan</h2>
                ${notes.map(note => `
                    <h3>${note.title} ${note.subject ? `(${note.subject})` : ''}</h3>
                    <p style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-left: 4px solid #059669;">${note.content}</p>
                `).join('')}
            </div>
        </body>
        </html>
    `;
    
    // Buka window baru untuk print/save as PDF
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

function exportToExcel() {
    // Membuat CSV (bisa dibuka di Excel)
    let csv = 'StudyHub Data Export\n\n';
    
    // Tasks
    csv += '=== TUGAS & JADWAL ===\n';
    csv += 'Tugas,Mata Pelajaran,Deadline,Status\n';
    tasks.forEach(task => {
        csv += `"${task.title}","${task.subject}","${task.deadline}","${task.completed ? 'Selesai' : 'Belum'}"\n`;
    });
    csv += '\n\n';
    
    // Grades
    csv += '=== NILAI ===\n';
    grades.forEach(grade => {
        csv += `\n${grade.subject}\n`;
        csv += 'Nilai,Catatan\n';
        grade.scores.forEach(score => {
            csv += `${score.value},"${score.note}"\n`;
        });
        csv += `Rata-rata,${calculateAverage(grade.scores)}\n`;
    });
    csv += '\n\n';
    
    // Notes
    csv += '=== CATATAN ===\n';
    csv += 'Judul,Mata Pelajaran,Isi\n';
    notes.forEach(note => {
        csv += `"${note.title}","${note.subject || '-'}","${note.content.replace(/"/g, '""')}"\n`;
    });
    
    // Download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `StudyHub_Data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportAllData() {
    const dataStr = JSON.stringify({
        tasks: tasks,
        grades: grades,
        flashcardSets: flashcardSets,
        notes: notes,
        exportDate: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `StudyHub_Backup_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (confirm('Import data akan menimpa data yang ada. Lanjutkan?')) {
                    tasks = data.tasks || [];
                    grades = data.grades || [];
                    flashcardSets = data.flashcardSets || [];
                    notes = data.notes || [];
                    saveData();
                    renderTasks();
                    renderGrades();
                    renderSets();
                    renderNotes();
                    alert('✅ Data berhasil diimport!');
                }
            } catch (error) {
                alert('❌ File tidak valid!');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    loadData(); // Load saved data
    requestNotificationPermission(); // Request notification permission
    checkTaskReminders(); // Check for reminders on load
    
    renderTasks();
    renderGrades();
    renderSets();
    renderNotes();
    updateTimerDisplay();
    updatePomodoroMode();
});