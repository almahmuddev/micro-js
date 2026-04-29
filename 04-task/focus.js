
const card = document.getElementById('card');
const countdownEl = document.getElementById('countdown');
const taskNameEl = document.getElementById('task-name-display');
const setupUI = document.getElementById('setup-ui');
const timerUI = document.getElementById('timer-ui');

let timerInterval;

window.onload = () => {
    const savedEndTime = localStorage.getItem('endTime');
    if (savedEndTime) {
        resumeTimer(parseInt(savedEndTime));
    }
};

function startTimer() {
    const task = document.getElementById('task-input').value || "Deep Work";
    const duration = 60 * 1000;
    const endTime = Date.now() + duration;

    localStorage.setItem('endTime', endTime);
    localStorage.setItem('taskName', task);

    resumeTimer(endTime);
}

function resumeTimer(endTime) {
    setupUI.style.display = 'none';
    timerUI.style.display = 'block';
    taskNameEl.innerText = localStorage.getItem('taskName');

    timerInterval = setInterval(() => {
        const now = Date.now();
        const distance = endTime - now;

        if (distance <= 0) {
            clearInterval(timerInterval);
            countdownEl.innerText = "00:00";
            card.classList.add('done');
            return;
        }

        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    localStorage.clear();
    location.reload(); 
}
