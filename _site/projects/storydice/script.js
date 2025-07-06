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
  return emojis(index);
}

function rollDice() {
  const count = parseInt(document.getElementById('diceCount').value);
  const diceContainer = document.getElementById('dice');
  diceContainer.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const die = document.createElement('div');
    die.classList.add('die');
    die.textContent = getRandomEmoji();
    diceContainer.appendChild(die);
  }
}

window.addEventListener('DOMContentLoaded', loadEmojis);
