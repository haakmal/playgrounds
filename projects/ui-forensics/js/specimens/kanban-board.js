export function render(root) {
    root.innerHTML = `<div class="specimen-shell s32"><div class="specimen-desktop"><div class="specimen-topbar"><strong>Northline Tasks</strong><span>Studio board</span></div><div class="kanban-shell"><div class="board"><section class="kanban-column"><strong>TO DO</strong><div class="task-card" id="s32-task"><strong>Prepare critique</strong><p class="specimen-muted">Priority: !!!</p><button id="s32-high">High</button></div></section><section class="kanban-column"><strong>IN PROGRESS</strong></section><section class="kanban-column" id="s32-done"><strong>DONE</strong><div class="drop-zone">Drop task here</div></section></div></div></div></div>`;
    const task = root.querySelector('#s32-task');
    task.addEventListener('click', event => {
        if (event.target.id === 's32-high') return;
        const target = root.querySelector('#s32-done');
        task.classList.add('moved');
        target.appendChild(task);
        setTimeout(() => {
            const todo = root.querySelector('.kanban-column');
            todo.appendChild(task);
            task.classList.remove('moved');
        }, 2200);
    });
}
