export function render(root) {
    root.innerHTML = `
        <div class="specimen-shell s46">
            <div class="specimen-mobile productivity-app">
                <header class="s46-head"><strong>Focusday</strong><button id="s46-bell">Notifications</button></header>
                <main class="s46-content"><p class="s46-kicker">TODAY</p><h2>Your tasks</h2><div class="s46-task">Prepare tutorial materials <span>Today</span></div><button id="s46-add" class="s46-add">+ New task</button><div id="s46-form" hidden><input id="s46-input" placeholder="Task name"><button id="s46-save">Create task</button></div><div id="s46-prompt" class="s46-prompt"><strong>Stay on top of your day</strong><p>Allow notifications for reminders and updates.</p><button id="s46-allow">Allow notifications</button><button id="s46-later">Not now</button></div></main>
            </div>
        </div>`;

    root.querySelector('#s46-add').addEventListener('click', () => { root.querySelector('#s46-form').hidden = false; });
    root.querySelector('#s46-save').addEventListener('click', () => {
        const value = root.querySelector('#s46-input').value.trim() || 'Untitled task';
        root.querySelector('#s46-task-list')?.remove();
        root.querySelector('#s46-form').insertAdjacentHTML('afterend', `<div id="s46-task-list" class="s46-task">${value}<span>Today</span></div>`);
    });
    root.querySelector('#s46-allow').addEventListener('click', () => root.querySelector('#s46-prompt').remove());
    root.querySelector('#s46-later').addEventListener('click', () => {
        const prompt = root.querySelector('#s46-prompt');
        prompt.classList.add('dismissed');
        setTimeout(() => {
            if (!prompt.isConnected) return;
            prompt.classList.remove('dismissed');
            prompt.querySelector('p').textContent = 'Notifications can help you stay on track.';
        }, 1500);
    });
    root.querySelector('#s46-bell').addEventListener('click', () => root.querySelector('#s46-prompt').classList.remove('dismissed'));
}
