export function render(root) {
    root.innerHTML = `
        <div class="specimen-shell s41">
            <div class="specimen-desktop streaming-app">
                <header class="s41-topbar"><strong>Northline Play</strong><span>30 DAY TRIAL</span></header>
                <main class="s41-content">
                    <section class="s41-hero"><p class="s41-kicker">WATCH WITHOUT LIMITS</p><h2>Try Premium free for 30 days</h2><p>Cancel anytime before your trial ends.</p></section>
                    <section class="s41-plan-grid">
                        <button class="s41-plan" data-plan="trial"><span class="s41-badge">FREE TRIAL</span><strong>Premium</strong><small>30 days free</small><em>No charge today</em></button>
                        <button class="s41-plan selected" data-plan="annual"><span class="s41-badge">RECOMMENDED</span><strong>Premium Annual</strong><small>$129 / year after trial</small><em>Best value</em></button>
                    </section>
                    <section id="s41-terms" class="s41-terms"><p>Start with a 30-day trial. Your selected plan continues automatically after the trial period unless cancelled.</p><a href="#" id="s41-cancel-info">Manage your membership</a></section>
                    <button id="s41-start" class="s41-primary">Start free trial</button>
                    <p id="s41-result" class="s41-result" hidden>Trial started. Annual Premium will continue after the trial unless cancelled.</p>
                </main>
            </div>
        </div>`;

    const plans = root.querySelectorAll('.s41-plan');
    plans.forEach(plan => plan.addEventListener('click', () => {
        plans.forEach(item => item.classList.remove('selected'));
        plan.classList.add('selected');
    }));
    root.querySelector('#s41-cancel-info').addEventListener('click', event => {
        event.preventDefault();
        root.querySelector('#s41-terms').classList.add('expanded');
        root.querySelector('#s41-terms').innerHTML += '<p class="s41-fine">Cancellation controls are available from Account > Membership after trial activation.</p>';
    });
    root.querySelector('#s41-start').addEventListener('click', () => {
        root.querySelector('#s41-result').hidden = false;
    });
}
