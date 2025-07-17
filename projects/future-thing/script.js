// prepare decks
let cards = {
	arc: [],
	generations: [],
	terrain: [],
	object: [],
	mood: []
};

async function loadCards() {
	const response = await fetch("cards.json");
	const data = await response.json();
	cards = data;
	drawAll(); // or draw default cards once loaded
}

// random draw function
function drawRandom(deck) {
	return deck[Math.floor(Math.random() * deck.length)];
};

function drawArcCard() {
	const card = drawRandom(cards.arc);
	const gen = drawRandom(cards.generations);
	return `${card}<br><span class="generation">${gen}</span>`;
};

function drawTerrainCard() {
	return drawRandom(cards.terrain);
};

function drawObjectCard() {
	return drawRandom(cards.object);
};

function drawMoodCard() {
	return drawRandom(cards.mood);
};

// Connect with DOM
function drawAll() {
	document.getElementById("arc-card").innerHTML = drawArcCard();
	document.getElementById("terrain-card").textContent = drawTerrainCard();
	document.getElementById("object-card").textContent = drawObjectCard();
	document.getElementById("mood-card").textContent = drawMoodCard();
}

document.getElementById("arc-btn").onclick = () => {
	document.getElementById("arc-card").textContent = drawArcCard();
};

document.getElementById("terrain-btn").onclick = () => {
	document.getElementById("terrain-card").textContent = drawTerrainCard();
};

document.getElementById("object-btn").onclick = () => {
	document.getElementById("object-card").textContent = drawObjectCard();
};

document.getElementById("mood-btn").onclick = () => {
	document.getElementById("mood-card").textContent = drawMoodCard();
};

// draw all cards for shuffle button
function drawAll() {
	document.getElementById("arc-card").innerHTML = drawArcCard();
	document.getElementById("terrain-card").textContent = drawTerrainCard();
	document.getElementById("object-card").textContent = drawObjectCard();
	document.getElementById("mood-card").textContent = drawMoodCard();
}

document.getElementById("shuffle-all").onclick = drawAll;

// Draw cards
loadCards().then(drawAll);