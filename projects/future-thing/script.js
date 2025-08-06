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
function drawRandom(type, cards) {
	const options = cards[type];
	const choice = options[Math.floor(Math.random() * options.length)];
	
	if (choice === "Wildcard") {
		const wildcardList = wildcardOptions[type];
		return wildcardList[Math.floor(Math.random() * wildcardList.length)];
	}
	
	return choice
};

function drawArcCard() {
	const card = drawRandom("arc", cards);
	const gen = drawRandom("generations", cards);
	return `${card}<br><a href="javascript:;" id="gen-btn" class="generation">${gen}</a>`;
};

function drawGeneration() {
	return drawRandom("generations", cards);
}

function drawTerrainCard() {
	return drawRandom("terrain", cards);
};

function drawObjectCard() {
	return drawRandom("object", cards);
};

function drawMoodCard() {
	return drawRandom("mood", cards);
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

// Simple scenario
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

// Provoke scenario
document.getElementById("provoke-scenario").onclick = async () => {
	const provokeOutput = document.getElementById("provoke-output");
	const scenarioText = document.getElementById("scenario-output").innerText.trim();
	
	if (!scenarioText) {
		provokeOutput.innerText = "Please generate a scenario first.";
		return;
	}
	
	startProvokingAnimation(provokeOutput); // start animation
	
	const prompt = `Considering this scenario: "${scenarioText}", provide a brief provocation that presents possible controversies, rasies ethical issues, and potential social/cultural/economic pitfalls that may emerge.`;
	
    try {
      const response = await fetch('https://gemini-worker.hakmal.workers.dev/', {
        method: 'POST',
  		headers: {
  			'Content-Type': 'application/json',
  		},
  		body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
  		}),
      });
	  
	  const data = await response.json();
	  console.log("Gemini Worker Response:", data); //debug
	  const provoked = data?.scenario;
	  
      if (!provoked) {
        document.getElementById('provoke-output').innerText = 'No provocation received.';
        return;
      }
	
  	stopGeneratingAnimation(provokeOutput); // stop animation
      document.getElementById('provoke-output').innerHTML = marked.parse(provoked);
    } catch (error) {
      console.error('Error fetching scenario:', error);
  	  	stopGeneratingAnimation(provokeOutput); // stop animation
      document.getElementById('provoke-output').innerText = 'Error fetching provocation.';
    }
}

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
    //const scenario = data?.candidates?.[0]?.content?.parts?.[0]?.text;
	console.log("Gemini Worker Response:", data); //debug
	const scenario = data?.scenario;

    if (!scenario) {
      document.getElementById('scenario-output').innerText = 'No scenario received.';
    	document.getElementById("provoke-scenario").disabled = true;
      return;
    }
	
	stopGeneratingAnimation(output); // stop animation
    document.getElementById('scenario-output').innerHTML = marked.parse(scenario);
    document.getElementById("provoke-scenario").disabled = false;
  } catch (error) {
    console.error('Error fetching scenario:', error);
	stopGeneratingAnimation(output); // stop animation
    document.getElementById('scenario-output').innerText = 'Error fetching scenario.';
    document.getElementById("provoke-scenario").disabled = true;
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

function startProvokingAnimation(element) {
	let dots = 0;
	element.innerText = "Provoking Scenario";
	animationInterval = setInterval(() => {
		dots = (dots + 1) % 4; // cycles 0 -> 3
		element.innerText = "Provoking Scenario" + ".".repeat(dots);
	}, 500);
}

function stopGeneratingAnimation(element) {
	clearInterval(animationInterval);
	element.innerText = "";
}

// Help modal
const helpModal = document.getElementById('help-modal');
const helpBtn = document.getElementById('help-btn');
const helpCloseBtn = document.getElementById('help-close-btn');

helpBtn.addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});

helpCloseBtn.addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

helpModal.addEventListener('click', (e) => {
  if (e.target.id === 'help-modal') {
    helpModal.classList.add('hidden');
  }
});

// Wildcard functionality
const wildcardOptions = {
  terrain: [
    "Biopolitics", "Digital Labor", "Speculative Finance", "Emotional Economies", "Post-Work Society",
    "Surveillance Culture", "Machine Ethics", "Synthetic Ecology", "Collective Memory", "Embodied Computing",
    "Algorithmic Bias", "Climate Futures", "Data Sovereignty", "Urban Mythologies", "Temporal Infrastructures",
    "Invisible Labor", "Neurodivergence", "Platform Capitalism", "Distributed Governance", "Quantum Rituals",
    "Decentralized Trust", "Hybrid Agency", "Mimetic Desire", "Gamified Citizenship", "Affective Networks",
    "Commodified Identity", "Edge Urbanism", "Narrative Warfare", "Psychogeography", "Techno-Shamanism",
    "Displacement Systems", "Cognitive Capital", "Emulated Empathy", "Radical Transparency", "Protocol Cultures",
    "Synthetic Intuition", "Market Intelligences", "Negotiated Presence", "Signal Ecologies", "Temporal Loops",
    "Performative Work", "Post-Truth Media", "Ambient Bureaucracy", "Neoliberal Desire", "Civic Drift",
    "Interfaced Intimacy", "Post-Human Ritual", "Coded Narratives", "Cultural Firewalls", "Semiotic Collapse"
  ],
  object: [
    "Telescope", "Hologram", "Smart Dust", "Neural Lace", "Digital Amulet", "Surveillance Drone", "Encrypted Coin",
    "Reality Filter", "Synthetic Seed", "Data Crystal", "Adaptive Mask", "Quantum Key", "Biochip", "Echo Recorder",
    "Memory Vial", "Emotion Synth", "Kinetic Sculpture", "Voice Capsule", "Anomaly Detector", "Privacy Cloak",
    "Energy Sponge", "Cognitive Mirror", "Proxy Idol", "Protocol Totem", "Feedback Antenna", "Consent Token",
    "Affordance Lens", "Logic Dice", "Symbol Printer", "Tension Meter", "Bias Compass", "Mood Lamp", "Trust Gauge",
    "Future Fossil", "Reputation Beacon", "Story Fragment", "Uncanny Tool", "Trade Token", "Attention Capsule",
    "Reality Anchor", "Legacy Artifact", "Phantom Object", "Context Filter", "Unstable Relic", "Cultural Lens",
    "Time Capsule", "Speculation Box", "Signal Scrambler", "Fictional Interface", "Decision Crystal"
  ]
};

// Draw cards
loadCards()
