export function render(root) {
    root.innerHTML = `
        <div class="specimen-shell s48">
            <div class="specimen-desktop news-app">
                <header class="s48-head"><strong>THE DAILY NORTH</strong><nav><span>Latest</span><span>Ideas</span><span>Culture</span></nav></header>
                <article class="s48-article"><p class="s48-kicker">WEEKEND EDITION</p><h2>Why small rituals matter</h2><p class="s48-deck">A short essay on routines, attention and the spaces between busy days.</p><p>There is something useful about repeating a small action until it becomes familiar. It changes the pace of a day and gives attention somewhere to land.</p><p>Across cultures, people have developed rituals around meals, work and rest. The details vary, but the intention is often the same...</p></article>
                <div class="s48-modal" id="s48-modal"><div><span class="s48-kicker">KEEP READING</span><h2>Get the stories that matter.</h2><p>Join our weekly email for the latest ideas and essays.</p><button id="s48-join" class="s48-join">Keep me informed</button><button id="s48-no" class="s48-no">No thanks, I prefer to miss important stories.</button></div></div>
            </div>
        </div>`;
    root.querySelector('#s48-join').addEventListener('click', () => root.querySelector('#s48-modal').remove());
    root.querySelector('#s48-no').addEventListener('click', () => root.querySelector('#s48-modal').remove());
}
