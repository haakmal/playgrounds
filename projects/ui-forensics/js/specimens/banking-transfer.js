export function render(root) {
    root.innerHTML = `<div class="specimen-shell s29"><div class="specimen-mobile"><div class="specimen-topbar"><strong>Northline Money</strong><span>Transfer</span></div><div class="bank-shell"><div class="transfer-card"><h2>Review transfer</h2><div class="review-row"><span>Recipient</span><strong>A. Smith</strong></div><div class="review-row"><span>Amount</span><strong>$240.00</strong></div><button id="s29-send">Transfer now</button><button id="s29-cancel">Cancel transfer</button><div id="s29-error" class="transfer-error" hidden>Something went wrong.</div></div></div></div></div>`;
    root.querySelector('#s29-send').addEventListener('click', () => root.querySelector('#s29-error').hidden = false);
}
