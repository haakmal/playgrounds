//----- prepare decks
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
};

//----- random draw function
function drawRandom(deck) {
	return deck[Math.floor(Math.random() * deck.length)];
};

function drawArcCard() {
	const card = drawRandom(cards.arc);
	const gen = drawRandom(cards.generations);
	return `${card}<br><a href="javascript:;" id="gen-btn" class="generation">${gen}</a>`;
};

function drawGeneration() {
	return drawRandom(cards.generations);
}

function drawTerrainCard() {
	return drawRandom(cards.terrain);
};

function drawObjectCard() {
	return drawRandom(cards.object);
};

function drawMoodCard() {
	return drawRandom(cards.mood);
};

//----- connect output with DOM
function drawAll() {
	document.getElementById("arc-card").innerHTML = drawArcCard();
	document.getElementById("terrain-card").textContent = drawTerrainCard();
	document.getElementById("object-card").textContent = drawObjectCard();
	document.getElementById("mood-card").textContent = drawMoodCard();
};

// connect each button for separate draws
document.getElementById("arc-btn").onclick = () => {
	document.getElementById("arc-card").innerHTML = drawArcCard();
};

/*document.getElementById("gen-btn").addEventListener("click", async () => {
	document.getElementById("gen-btn").textContent = drawGeneration();
});*/

document.getElementById("terrain-btn").onclick = () => {
	document.getElementById("terrain-card").textContent = drawTerrainCard();
};

document.getElementById("object-btn").onclick = () => {
	document.getElementById("object-card").textContent = drawObjectCard();
};

document.getElementById("mood-btn").onclick = () => {
	document.getElementById("mood-card").textContent = drawMoodCard();
};

// draw all cards together function
function drawAll() {
	document.getElementById("arc-card").innerHTML = drawArcCard();
	document.getElementById("terrain-card").textContent = drawTerrainCard();
	document.getElementById("object-card").textContent = drawObjectCard();
	document.getElementById("mood-card").textContent = drawMoodCard();
};

document.getElementById("shuffle-all").onclick = drawAll;

/*
document.getElementById("generate-scenario").onclick = addEventListener("click", async () => {
  const arcCard = document.querySelector("#arc-card").innerText.split("\n");
  const terrainCard = document.querySelector("#terrain-card").innerText;
  const objectCard = document.querySelector("#object-card").innerText;
  const moodCard = document.querySelector("#mood-card").innerText;

  const arc = arcCard[0] || "";
  const generation = arcCard[1] || "";

  const prompt = `Write a brief speculative scenario about a future of ${arc} forecasted ${generation}, relating to ${terrainCard}, involving or related to a ${objectCard}. The emotional state of this speculative future is ${moodCard}.`;

// show loading state
const output = document.getElementById("scenario-output");
output.textContent = "Generating scenario...";

  const scenarioText = await fetchScenario(prompt); // ✅ use your original function

  document.getElementById("scenario-output").innerHTML = marked.parse(scenarioText);
});

// AI setup

async function fetchScenario({ arc, generation, terrain, object, mood }) {
	const url = "https://gemimi-worker.hakmal.workers.dev";
	const prompt = `Write a brief speculative scenario about a future of ${arc} forcasted ${generation}, relating to ${terrain}, involving or surrounding a ${object}. The emotional state of this speculative future is ${mood}.`
	
	const body = {
		contents: [{ parts: [{ text: prompt }] }]
	};
	
	const response = await fetchScenario(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body)
	});
	
	const data = await response.json();
	return data.candidates?.[0]?.content?.parts?.[0]?.text || "No scenario generated.";
}

// Generate AI scenario
//document.getElementById("shuffle-all").onclick = drawAll;
//document.getElementById("shuffle-all").onclick = drawAll();
/*document.getElementById("generate-scenario").onclick = async () => {	
	//const prompt = buildPromptFromCards();
	
	// show loading state
	const output = document.getElementById("scenario-output");
	output.textContent = "Generating scenario...";
	
//	const scenario = await fetchScenario(prompt);
	const scenarioText = await fetchScenario({ arc, generation, terrain, object, mood });
	document.getElementById("scenario").innerHTML = marked.parse(scenarioText);
	output.textContent = scenario;
};

// Generate Prompt from Cards
/*
function buildPromptFromCards() {
	const arc = document.getElementById("arc-card").textContent;
	const terrain = document.getElementById("terrain-card").textContent;
	const object = document.getElementById("object-card").textContent;
	const mood = document.getElementById("mood-card").textContent;
	
	return `Imagine a creative scenario involving:
	- An arc: ${arc}
	- A terrain: ${terrain}
	- A mood: ${mood}
	
	Write a vivid, 2-3 sentence story fragment.`;
};*/

// Draw cards
loadCards()