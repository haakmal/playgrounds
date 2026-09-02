export function render(root) {
    root.innerHTML = `<div class="specimen-shell s36"><div class="specimen-desktop"><div class="specimen-topbar"><strong>Northline Learn</strong><span>Module 4</span></div><div class="learning-shell"><div class="learning-grid"><aside class="lesson-sidebar"><strong>Progress</strong><div id="s36-progress" class="module-progress">25%</div><ol><li>Read</li><li>Watch</li><li>Quiz</li></ol></aside><section class="lesson-main"><h2>Interaction states</h2><p>Read this lesson, watch the example, then complete the quiz before continuing.</p><button id="s36-next">Next module</button></section></div></div></div></div>`;
    root.querySelector('#s36-next').addEventListener('click', () => root.querySelector('#s36-progress').textContent='100%');
}
