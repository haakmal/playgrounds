export function render(root) {
    root.innerHTML = `
        <div class="specimen-shell s42">
            <div class="specimen-mobile travel-app">
                <header class="s42-header"><strong>Northline Air</strong><span>2 / 4</span></header>
                <main class="s42-body">
                    <p class="s42-kicker">SYDNEY TO AUCKLAND</p><h2>Your extras</h2><p class="s42-muted">You can change these selections before payment.</p>
                    <button class="s42-extra selected" id="s42-baggage"><span><strong>Checked baggage</strong><small>20 kg</small></span><b>$48</b></button>
                    <button class="s42-extra" id="s42-insurance"><span><strong>Trip protection</strong><small>Recommended for peace of mind</small></span><b>$19</b></button>
                    <div class="s42-summary"><span>Flight</span><strong>$189</strong><span>Extras</span><strong id="s42-extra-total">$48</strong></div>
                    <button id="s42-continue" class="s42-primary">Continue</button>
                    <button id="s42-decline" class="s42-decline">Continue without extras</button>
                    <div id="s42-next" hidden class="s42-next">Booking summary includes selected services.</div>
                </main>
            </div>
        </div>`;

    const baggage = root.querySelector('#s42-baggage');
    const insurance = root.querySelector('#s42-insurance');
    const total = root.querySelector('#s42-extra-total');
    baggage.addEventListener('click', () => baggage.classList.toggle('selected'));
    insurance.addEventListener('click', () => insurance.classList.toggle('selected'));
    root.querySelector('#s42-continue').addEventListener('click', () => {
        root.querySelector('#s42-next').hidden = false;
        total.textContent = '$67';
        const summary = root.querySelector('.s42-summary');
        if (!summary.querySelector('.insurance-row')) {
            summary.insertAdjacentHTML('beforeend', '<span class="insurance-row">Trip protection</span><strong class="insurance-row">$19</strong>');
        }
    });
    root.querySelector('#s42-decline').addEventListener('click', () => {
        baggage.classList.remove('selected');
        insurance.classList.remove('selected');
        total.textContent = '$0';
        root.querySelector('#s42-next').hidden = false;
    });
}
