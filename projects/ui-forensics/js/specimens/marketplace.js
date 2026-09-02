export function render(root) {
    root.innerHTML = `
        <div class="specimen-shell s49">
            <div class="specimen-mobile market-app">
                <header class="s49-head"><strong>Market / 01</strong><span>ITEM</span></header>
                <div class="s49-image"><span>STUDIO OBJECT 14</span></div>
                <main class="s49-product"><div class="s49-rating">4.8  /  5.0</div><h2>Stone Desk Tray</h2><p class="s49-price">$42</p><div class="s49-activity"><strong>18 people are viewing this now</strong><span>Only 2 left</span><small>14 people have this in their cart</small></div><button id="s49-cart" class="s49-buy">Add to cart</button><p id="s49-added" hidden class="s49-added">Added to cart.</p></main>
            </div>
        </div>`;
    root.querySelector('#s49-cart').addEventListener('click', () => { root.querySelector('#s49-added').hidden = false; });
}
