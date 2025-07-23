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

document.addEventListener("click", (even) => {
	if (event.target && event.target.id === "gen-btn") {
		event.target.textContent = drawGeneration();
}
});

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


document.getElementById("generate-scenario").onclick = async () => {
  const arcLine = document.querySelector("#arc-card").innerText.split("\n")[0] || "";
  const generation = document.querySelector(".generation")?.innerText || "";
  const terrainCard = document.querySelector("#terrain-card")?.innerText || "";
  const objectCard = document.querySelector("#object-card")?.innerText || "";
  const moodCard = document.querySelector("#mood-card")?.innerText || "";

  const prompt = `Write a brief speculative scenario about a future of ${arcLine} forecasted ${generation}, relating to ${terrainCard}, involving or related to a ${objectCard}. The emotional state of this speculative future is related to ${moodCard}.`;

  const output = document.getElementById("scenario-output");
  //output.textContent = "Generating scenario...";
  startGeneratingAnimation(output); // start animation
  
  console.log("Prompt:", prompt);

  fetchScenario(prompt);
};


async function fetchScenario(prompt) {
  const output = document.getElementById("scenario-output");
  try {
    const response = await fetch('https://gemini-worker.hakmal.workers.dev/', {
      method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
		}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const scenario = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!scenario) {
      document.getElementById('scenario-output').innerText = 'No scenario received.';
      return;
    }
	
	stopGeneratingAnimation(output); // stop animation
    document.getElementById('scenario-output').innerHTML = marked.parse(scenario);
  } catch (error) {
    console.error('Error fetching scenario:', error);
	stopGeneratingAnimation(output); // stop animation
    document.getElementById('scenario-output').innerText = 'Error fetching scenario.';
  }
}

// Animate progress for scenario
let animationInterval;

function startGeneratingAnimation(element) {
	let dots = 0;
	element.innerText = "Generating Scenario";
	animationInterval = setInterval(() => {
		dots = (dots + 1) % 4; // cycles 0 -> 3
		element.innerText = "Generating Scenario" + ".".repeat(dots);
	}, 500);
}

function stopGeneratingAnimation(element) {
	clearInterval(animationInterval);
	element.innerText = "";
}

// Draw cards
loadCards()
