export function render(root) {
    root.innerHTML = `
        <div class="specimen-shell s43">
            <div class="specimen-desktop privacy-app">
                <header class="s43-header"><strong>Northline</strong><span>Privacy centre</span></header>
                <main class="s43-panel">
                    <p class="s43-kicker">YOUR PRIVACY</p><h2>Choose how your data is used</h2><p>We use cookies and related technologies to keep the service working and improve your experience.</p>
                    <div class="s43-option"><div><strong>Necessary data</strong><span>Required for core service functions.</span></div><b>Always on</b></div>
                    <div class="s43-option"><div><strong>Analytics and personalisation</strong><span>Helps us improve content and recommendations.</span></div><button class="s43-switch selected" id="s43-optional">ON</button></div>
                    <div class="s43-actions"><button id="s43-accept" class="s43-accept">Accept recommended settings</button><button id="s43-reject" class="s43-reject">Reject optional data</button></div>
                    <a href="#" id="s43-customise">Manage individual purposes</a>
                    <div id="s43-extra" class="s43-extra" hidden><label><input type="checkbox" checked> Analytics</label><label><input type="checkbox" checked> Personalisation</label><label><input type="checkbox" checked> Advertising</label></div>
                </main>
            </div>
        </div>`;

    root.querySelector('#s43-optional').addEventListener('click', event => {
        const button = event.currentTarget;
        button.classList.toggle('selected');
        button.textContent = button.classList.contains('selected') ? 'ON' : 'OFF';
    });
    root.querySelector('#s43-accept').addEventListener('click', () => {
        root.querySelector('#s43-extra').hidden = true;
        root.querySelector('.s43-actions').insertAdjacentHTML('afterend', '<p class="s43-confirm">Recommended settings accepted.</p>');
    });
    root.querySelector('#s43-reject').addEventListener('click', () => {
        root.querySelector('#s43-optional').classList.remove('selected');
        root.querySelector('#s43-optional').textContent = 'OFF';
        root.querySelector('.s43-actions').insertAdjacentHTML('afterend', '<p class="s43-confirm">Optional data use disabled.</p>');
    });
    root.querySelector('#s43-customise').addEventListener('click', event => {
        event.preventDefault();
        root.querySelector('#s43-extra').hidden = false;
    });
}
