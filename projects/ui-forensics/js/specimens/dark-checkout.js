export function render(root) {
    root.innerHTML = `
        <div class="specimen-shell s47">
            <div class="specimen-desktop dark-checkout-app">
                <header class="s47-head"><strong>Arc Objects</strong><span>Checkout</span></header>
                <main class="s47-grid">
                    <section><div class="s47-product"><div class="s47-thumb"></div><div><strong>Desk Lamp</strong><p>Matte / 01</p><span>$79</span></div></div><button id="s47-continue" class="s47-primary">Continue to payment</button><div id="s47-fee" hidden class="s47-fee">Service facilitation adjustment <strong>$12.50</strong></div><button id="s47-pay" hidden class="s47-primary">Pay $91.50</button></section>
                    <aside class="s47-summary"><p>SUMMARY</p><div><span>Desk Lamp</span><strong>$79</strong></div><div class="s47-hidden-fee"><span>Additional charges</span><strong>Calculated later</strong></div><hr><div class="s47-total"><span>Total</span><strong id="s47-total">$79</strong></div></aside>
                </main>
            </div>
        </div>`;
    root.querySelector('#s47-continue').addEventListener('click', () => {
        root.querySelector('#s47-fee').hidden = false;
        root.querySelector('#s47-pay').hidden = false;
        root.querySelector('#s47-total').textContent = '$91.50';
    });
    root.querySelector('#s47-pay').addEventListener('click', () => {
        root.querySelector('.s47-summary').insertAdjacentHTML('beforeend', '<p class="s47-note">Payment ready to process.</p>');
    });
}
