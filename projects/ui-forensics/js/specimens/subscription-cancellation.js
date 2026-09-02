export function render(root) {
    root.innerHTML = `
        <div class="specimen-shell s45">
            <div class="specimen-desktop cancellation-app">
                <header class="s45-head"><strong>Northline Plus</strong><span>Membership</span></header>
                <main class="s45-content">
                    <div class="s45-plan"><span>PREMIUM</span><strong>$18 / month</strong><small>Renews monthly</small></div>
                    <div id="s45-stage" class="s45-stage"><h2>Manage your membership</h2><p>Would you like to keep Premium benefits?</p><div class="s45-actions"><button class="s45-keep">Keep membership</button><button id="s45-start">Change membership</button></div></div>
                    <div id="s45-reason" class="s45-stage" hidden><h2>Before you continue</h2><p>Tell us why you are leaving.</p><select id="s45-select"><option value="">Choose a reason</option><option>Too expensive</option><option>Not using it</option><option>Missing features</option></select><button id="s45-reason-next" disabled>Continue</button></div>
                    <div id="s45-final" class="s45-stage" hidden><h2>Final step</h2><p>Cancel your Premium membership or keep your current plan.</p><div class="s45-actions"><button class="s45-keep">Keep my membership</button><button id="s45-cancel">Continue cancellation</button></div></div>
                    <p id="s45-done" class="s45-done" hidden>Membership cancelled.</p>
                </main>
            </div>
        </div>`;

    const reason = root.querySelector('#s45-reason');
    root.querySelector('#s45-start').addEventListener('click', () => { root.querySelector('#s45-stage').hidden = true; reason.hidden = false; });
    root.querySelector('#s45-select').addEventListener('change', event => { root.querySelector('#s45-reason-next').disabled = !event.target.value; });
    root.querySelector('#s45-reason-next').addEventListener('click', () => { reason.hidden = true; root.querySelector('#s45-final').hidden = false; });
    root.querySelector('#s45-cancel').addEventListener('click', () => { root.querySelector('#s45-done').hidden = false; });
}
