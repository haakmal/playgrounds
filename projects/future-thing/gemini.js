async function fetchScenario({ arc, generation, terrain, object, mood }) {
	const apiKey = "AIzaSyCLiIY9FxZqMLbonevTfddYMCetxSZ9GRY"; // use env var or restrict by domain in real use
	const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
	const url = `${endpoint}?key=${apiKey}`;
	
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