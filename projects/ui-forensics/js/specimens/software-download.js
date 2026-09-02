export function render(root) {
    root.innerHTML = `
        <div class="specimen-shell s50">
            <div class="specimen-desktop software-app">
                <header class="s50-head"><strong>EDITFLOW</strong><span>DOWNLOAD</span></header>
                <main class="s50-content">
                    <p class="s50-kicker">GET EDITFLOW</p><h2>Choose your version</h2><p>Powerful image editing for your workflow.</p>
                    <section class="s50-downloads">
                        <article class="s50-card sponsored"><span class="s50-sponsored">PROMOTED</span><h3>EditFlow Studio Pro</h3><p>Full creative suite with advanced tools.</p><button class="s50-primary">Download</button></article>
                        <article class="s50-card"><h3>EditFlow Free</h3><p>Essential editing tools for personal projects.</p><button id="s50-free">Free download</button></article>
                    </section>
                    <p id="s50-result" class="s50-result" hidden>Free download started.</p>
                </main>
            </div>
        </div>`;
    root.querySelector('#s50-free').addEventListener('click', () => { root.querySelector('#s50-result').hidden = false; });
}
