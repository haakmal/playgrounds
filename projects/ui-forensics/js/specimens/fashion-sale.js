export function render(root) {
    root.innerHTML = `
        <div class="specimen-shell s44">
            <div class="specimen-mobile fashion-app">
                <header class="s44-top"><strong>FORM / OBJECT</strong><span>SALE</span></header>
                <div class="s44-image"><span>FIELD JACKET / 02</span></div>
                <main class="s44-product"><p class="s44-sale">PRIVATE SALE · ENDS IN <span id="s44-timer">00:08</span></p><h2>Field Jacket</h2><p class="s44-price">$168</p><p class="s44-stock">Selling fast - limited availability</p><button id="s44-buy" class="s44-buy">Add to bag</button><p id="s44-message" hidden class="s44-message">Added to bag.</p></main>
            </div>
        </div>`;

    let seconds = 8;
    const timer = root.querySelector('#s44-timer');
    const interval = setInterval(() => {
        seconds -= 1;
        timer.textContent = `00:${String(Math.max(seconds, 0)).padStart(2, '0')}`;
        if (seconds <= 0) {
            clearInterval(interval);
            timer.textContent = '00:00';
            root.querySelector('.s44-sale').insertAdjacentHTML('afterend', '<p class="s44-continued">Offer still available.</p>');
        }
    }, 1000);
    root.querySelector('#s44-buy').addEventListener('click', () => { root.querySelector('#s44-message').hidden = false; });
}
