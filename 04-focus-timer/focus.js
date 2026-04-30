
const card = document.getElementById('card');
const countdownEl = document.getElementById('countdown');
const taskNameEl = document.getElementById('task-name-display');
const setupUI = document.getElementById('setup-ui');
const timerUI = document.getElementById('timer-ui');
const taskInput = document.getElementById('task-input');


const state = {
  endTime: null,
  taskName: '',
  duration: 60 * 1000,
  interval: null,
  paused: false,
  remaining: 0
};


window.onload = () => {
  const savedTime = localStorage.getItem('endTime');
  const savedTask = localStorage.getItem('taskName');

  if (savedTime && savedTask) {
    state.endTime = parseInt(savedTime);
    state.taskName = savedTask;
    resumeTimer(state.endTime);
  }
};


function startTimer() {
  state.taskName = taskInput.value || "Deep Work";
  state.endTime = Date.now() + state.duration;

  localStorage.setItem('endTime', state.endTime);
  localStorage.setItem('taskName', state.taskName);

  resumeTimer(state.endTime);
}

function resumeTimer(endTime) {
  clearInterval(state.interval);

  setupUI.classList.add('hidden');
  timerUI.classList.remove('hidden');

  taskNameEl.innerText = state.taskName;

  state.interval = setInterval(() => {
    const now = Date.now();
    const distance = endTime - now;

    if (distance <= 0) {
      clearInterval(state.interval);
      countdownEl.innerText = "00:00";
      card.classList.add('ring-2', 'ring-green-500');
      return;
    }

    state.remaining = distance;
    countdownEl.innerText = formatTime(distance);

  }, 1000);
}


function formatTime(ms) {
  const min = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const sec = Math.floor((ms % (1000 * 60)) / 1000);

  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}


function togglePause() {
  if (!state.interval) return;

  if (!state.paused) {
    clearInterval(state.interval);
    state.paused = true;
  } else {
    state.endTime = Date.now() + state.remaining;
    state.paused = false;
    resumeTimer(state.endTime);
  }
}

function resetTimer() {
  clearInterval(state.interval);

  localStorage.removeItem('endTime');
  localStorage.removeItem('taskName');

  state.endTime = null;
  state.remaining = 0;
  state.paused = false;

  setupUI.classList.remove('hidden');
  timerUI.classList.add('hidden');

  card.classList.remove('ring-2', 'ring-green-500');
}