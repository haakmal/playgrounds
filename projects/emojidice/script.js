let emojis = [];

async function loadEmojis() {
  try {
    const response = await fetch('emojis.json');
    emojis = await response.json();
  } catch (error) {
    console.error('Failed to load emojis:', error);
    emojis = ['❌']; // fallback emoji
  }
}

function getRandomEmoji() {
  const index = Math.floor(Math.random() * emojis.length);
  return emojis[index];
}

function rollDice() {
  const count = parseInt(document.getElementById('diceCount').value);
  const diceContainer = document.getElementById('dice');
  diceContainer.innerHTML = '';

  if (emojis.length < count) {
    alert("Not enough unique emojis to roll that many dice");
    return;
  }

  const shuffled = [...emojis].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  for (let emoji of selected) {
    const die = document.createElement('div');
    die.classList.add('die');
    die.textContent = emoji;
    diceContainer.appendChild(die);
  }
}

window.addEventListener('DOMContentLoaded', loadEmojis);
