// Defaults and variables
let stars = [];
let sliders = {};
let sliderValues = {};
let canvas;
let backgroundStars = [];
// for slow-down and end
let rotationSpeed = 0.2;
let targetRotationSpeed = 0.2;
let slowingDown = false;
let drawingConstellation = false;
let linesDrawn = 0;
let glowPhase = false;
let orbitOpacity = 255; // controls orbit opacity
let isAnimatingConstellation = false;
let constellationGlowProgress = 0; // 0 -> 1
let constellationDrawn = false;
// for visual change dna->constellation
let visualMode = "constellation";
const toggleButton = document.getElementById('toggle-visual');

// Set to 7 because we only want one star per slider
const sliderIds = [
  "temporal",
  "disruption",
  "optimism",
  "human",
  "tech",
  "scale",
  "obscurity"
];
const numStars = sliderIds.length;

function setup() {
	const canvasContainer = document.getElementById("canvas-container");
	let canvas = createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
	canvas.parent("canvas-container");
	angleMode(DEGREES);
  
  	// Create sparse background stars
  	for (let i = 0; i < 200; i++) {
  		backgroundStars.push({
  			x: random(width),
			y: random(height),
			opacity: random(50, 150),
			size: random(0.5, 2),
			twinkleSpeed: random(0.5, 1.5)
  		});
  	}

  	setupSliders();
  	createStars();
}

// Toggle visual logic
toggleButton.addEventListener('click', () => {
	visualMode = visualMode === "constellation" ? "dna" : "constellation";
	toggleButton.textContent = visualMode === "constellation"
	? "Switch to DNA Mode"
	: "Switch to Constellation Mode";
});

// Create constellation stars
function createStars() {
	for (let i = 0; i < numStars; i++) {
  stars.push(new Star(i));
}
}

function draw() {
	updateSliderValues();
	clear();
	
	if (visualMode === "constellation") {
		drawConstellation(); // continuous animation
	} else if (visualMode === "dna") {
		drawDNAFingerprint(); // static view
		noLoop(); // stop redraw
	}
}

function onSliderChange() {
	sliderValues["tech"] = parseInt(document.getElementById("tech").value);
	sliderValues["temporal"] = parseInt(document.getElementById("temporal").value);
	sliderValues["obscurity"] = parseInt(document.getElementById("obscurity").value);
	sliderValues["human"] = parseInt(document.getElementById("human").value);
	sliderValues["optimism"] = parseInt(document.getElementById("optimism").value);
	sliderValues["disruption"] = parseInt(document.getElementById("disruption").value);
	sliderValues["scale"] = parseInt(document.getElementById("scale").value);
	
	if (visualMode === "dna") {
		loop(); // only re-trigger draw if in DNA mode
	}
}

// Constellation setup
function drawConstellation() {
  background(10, 10, 20);
  
  // Draw starfield
  for (let s of backgroundStars) {
	  s.opacity += random(-s.twinkleSpeed, s.twinkleSpeed);
	  s.opacity = constrain(s.opacity, 40, 180);
	  noStroke();
	  fill(255, s.opacity);
	  circle(s.x, s.y, s.size);
  }
  
  // Smooth deceleration
  if (slowingDown && rotationSpeed > 0.0005) {
	  rotationSpeed *= 0.98; // ease out
  } else if (rotationSpeed <= 0.0005 && slowingDown) {
	  rotationSpeed = 0;
	  slowingDown = false;
	  // draw constellation
	  drawingConstellation = true;
	  linesDrawn = 0;
	  orbitOpacity = 255;
  }
  
  translate(width / 2, height / 2); // center the origin
  
  if (drawingConstellation && linesDrawn < stars.length - 1) {
	  orbitOpacity = max(orbitOpacity - 10, 0); // fade orbits
  }
  
  if (glowPhase) {
	  constellationGlowProgress = min(constellationGlowProgress + 0.02, 1);
  }
  
  stars.forEach(star => star.update());
  stars.forEach(star => star.display());

/*  for (let star of stars) {
    star.update();
    star.display();
  }
  
  if (drawingConstellation) {
	  drawConstellationLines();
  }*/
  
  if (drawingConstellation || constellationDrawn) {
	  drawConstellationLines();
  }
}

// DNA setup
function drawDNAFingerprint() {
	clear();
	
	// read and map slider values, constraining and remapping where necessary
	let temporalValue = constrain(sliderValues["temporal"], 30, 70);
	let obscurityValue = constrain(sliderValues["obscurity"], 30, 50);
	let humanValue = constrain(sliderValues["human"], 30, 100);
	let scaleValue = constrain(sliderValues["scale"], 20, 50);
	let optimismValue = sliderValues["optimism"];
	let techValue = sliderValues["tech"];
	let disruptionValue = sliderValues["disruption"];
	
	// map sliders to visual parameters
	let rowSpacing = map(temporalValue, 30, 100, 8, 24); // more space at lower slider
	let columnSpacing = map(obscurityValue, 100, 30, 12, 36); // reverse logic
	let noiseDensity = map(humanValue, 30, 100, 0.002, 0.015); // density up with slider
	let brightness = map(optimismValue, 0, 100, 120, 255);
	let maxBlur = map(techValue, 20, 80, 6, 2);
	let skipProbability = map(disruptionValue, 0, 100, 0.05, 0.4); // skip % of bars
	let thicknessMin = map(humanValue, 30, 100, 1, 3);
	let thicknessMax = map(humanValue, 30,100, 4, 12);
	let smearPasses = 2;
	
	// colour strategy
	let colourPresence = map(humanValue, 30, 100, 0, 1); // 0 = grey
	let saturationRange = map(humanValue, 30, 100, 5, 100);
	
	// curated hue pool
	let huePool = [ 260, 280, 310, 10, 30, 100, 130]; // purples, blues, magentas, warms

	// create offscreen graphics buffer
	let gfx = createGraphics(width, height);
	gfx.colorMode(HSB, 360, 100, 100, 255);
	gfx.clear();
	gfx.noStroke();
	gfx.rectMode(CORNER);
	gfx.blendMode(MULTIPLY);
	
	// lightbox
	let bg = createGraphics(width, height);
	for (let y = 0; y < height; y++) {
		let gradientAlpha = map(y, 0, height, 50, 0);
		bg.stroke(255, gradientAlpha);
		bg.line(0, y, width, y);
	}
	image(bg, 0, 0);
	
	// main smear pass with bars
	for (let pass = 0; pass < smearPasses; pass++) {
		let opacityFactor = pass === 0 ? 1.0 : 0.35;
		let xOffset = pass === 0 ? 0 : 2;
		let yOffset = pass === 0 ? 0 : 2;
		
		for (let y = 0; y < height; y += rowSpacing) {
			let clumpOffset = (noise(y * noiseDensity) - 0.5) * 10;
			
			for (let x = 0; x < width; x += columnSpacing) {
				if (random() < skipProbability) continue;
				
				// Random alpha for bar brightness
				let alpha = random(80, brightness) * opacityFactor;
				let barWidth = random(thicknessMin, thicknessMax);
				let barHeight = map(scaleValue, 0, 100, 20, 40) * random(0.8, 1.2);
				
				// Randomised HSB colour
				let useColour = random() < colourPresence;
				if (useColour) {
					let hue = random(huePool) + random(-10, 10);
					let sat = random(saturationRange, 100);
					let bright = map(brightness, 120, 255, 50, 100);
					gfx.fill(hue, sat, bright, alpha);
				} else {
					let gray = random(60, 100);
					gfx.fill(0, 0, gray, alpha);
				}
				
				// clump and jitter
				let jitter = random(-2, 2);
				gfx.rect(
					x + xOffset,
					y + clumpOffset + jitter + yOffset,
					barHeight,
					barWidth,
				);
			}
		
		}
	}
	
	// add faint ink artefacts
	for (let i = 0; i < 50; i++) {
		let blobX = random(width);
		let blobY = random(height);
		let blobSize = random(4, 12);
		let blobAlpha = random(10, 30);
		gfx.fill(0, blobAlpha);
		gfx.ellipse(blobX, blobY, blobSize);
		
		if (random() < colourPresence) {
			let hue = random(huePool) + random(-15, 15);
			let sat = random(saturationRange, 100);
			let bright = random(60, 100);
			gfx.fill(hue, sat, bright, blobAlpha);
		} else {
			let gray = random(50, 80);
			gfx.fill(0, 0, gray, blobAlpha);
		}
		
		gfx.ellipse(blobX, blobY, blobSize);
	}
	
	// gel lanes
	let gelLaneSpacing = 80;
	let gelLaneWidth = 12;
	for (let x = 0; x < width; x += gelLaneSpacing) {
		let laneAlpha = 20;
		gfx.fill(0, 0, 30, laneAlpha);
		gfx.rect(x, 0, gelLaneWidth, height);
	}
	
	// Apply blur once to entire fingerprint
	drawingContext.filter = `blur(${maxBlur}px)`;
	image(gfx, 0, 0);
	drawingContext.filter = "none"; // reset filter

}
/*	clear();
	//blendMode(MULTIPLY); // also SOFT_LIGHT, DARKEST
	let ctx = drawingContext;
	
	// remap for cleaner view
	let temporalValue = constrain(sliderValues["temporal"], 30, 100);
	let obscurityValue = constrain(sliderValues["obscurity"], 30, 100);
	let humanValue = constrain(sliderValues["human"], 30, 100);
	// reverse some mappings and apply floors
	let rowSpacing = map(temporalValue, 30, 100, 8, 24); // more space at lower slider
	let columnSpacing = map(obscurityValue, 100, 30, 12, 36); // reverse logic
	let noiseDensity = map(humanValue, 30, 100, 0.002, 0.015); // density up with slider
	let bandWidth = map(sliderValues["scale"], 0, 100, 20, 40);
	let bandHeight = 8;
	let brightness = map(sliderValues["optimism"], 0, 100, 120, 255);
	let skewAmount = map(sliderValues["disruption"], 0, 100, 0, 0.5);
	let blurAmount = map((sliderValues["tech"] ?? 50), 0, 100, 0, 15);
	let blurAlpha = map(sliderValues["tech"], 0, 100, 0, 15);
	let time = millis() * 0.0005;
	let maxBars = 100;
	let barsDrawn = 0;
	
	background(255, 0); // white bg with alpha 0
	
	drawingContext.save();
	drawingContext.filter = `blur(${blurAmount}px)`;
	
	let numRows = Math.floor(height / rowSpacing);
	let numCols = Math.floor(width / columnSpacing);
	
	for (let i = 0; i < numRows; i ++) {
		// Random-ish horizontal pos
		let y = i * rowSpacing;
		let noiseVal = noise(i * 0.3, time);
		
		for (let y = 0; y < height; y += rowSpacing) {
			// clump offset for bands
			let clumpOffset = (noise(y * 0.05, frameCount * 0.005) - 0.5) * 10;
			
			for (let x = 0; x < width; x += columnSpacing) {
				// Skip some ands randomly for gap
				if (random() < 0.15) continue;
				
				// each bar has slightly diff blur
				const bandBlur = blurAmount * random(0.5, 1.5);
				const barAlpha = random(80, brightness); // random opacity
				const barHeight = bandWidth * random(0.8, 1.2); // height variance
				const verticalJitter = random(-2, 2); // sim smearing across y
				
				ctx.filter = `blur(${bandBlur}px)`;
				ctx.fillStyle = `rgba(255, 255, 255, ${barAlpha / 255})`;
				
				ctx.fillRect(
					x,
					y + clumpOffset + verticalJitter,
					bandWidth,
					barHeight
				);
			}
/*			let x = j * columnSpacing;
			let skew = sin(i * 0.05 + j * 0.01) * skewAmount * 10;
			let intensity = noise(i * noiseDensity, j * noiseDensity);
			
			if (intensity < 0.5 && barsDrawn < maxBars) {
				ctx.shadowBlur = blurAmount;
				ctx.shadowColor = color(0, 100); // black glow with trans
				fill(0, brightness); // black bar with mapped brightness
				rect(j + skew, y, bandWidth, bandHeight, 4);
				ctx.shadowBlur = 0; // reset
				barsDrawn++; // count bars drawn
		}
	}
}
drawingContext.restore();
}
*/


function setupSliders() {
  sliderIds.forEach(id => {
    sliders[id] = document.getElementById(id);
  });
}

function updateSliderValues() {
  for (let id in sliders) {
    sliderValues[id] = parseFloat(sliders[id].value);
  }
}

class Star {
  constructor(index) {
    this.index = index;
    this.angle = random(360);
    this.baseDistance = 40 + index * 40;
    this.orbitTilt = random(0.2, 1.2);
    this.brightness = random(150, 255);
    this.hasGlow = random() > 0.5;
    this.hasSatellite = random() > 0.5; // Pre-randomized, but shown only if tech > 50
    this.scale = random(0.5, 1.5);
    this.orbitEccentricity = random(0.8, 1.2);
  }

  update() {
	  this.angle += rotationSpeed; // movement assigned to global rotation speed
  }

  display() {
    let temporalDistance = sliderValues["temporal"] || 0;
    let disruptionLevel = sliderValues["disruption"] || 0;
    let optimism = sliderValues["optimism"] || 0;
    let humanElement = sliderValues["human"] || 0;
    let techInfluence = sliderValues["tech"] || 0;
    let scaleSlider = sliderValues["scale"] || 0;
    let obscurity = sliderValues["obscurity"] || 0;

    // Orbit radius (controlled ONLY by temporal slider now)
    let distance = this.baseDistance + temporalDistance * 2;
    distance = constrain(distance, 50, min(width, height) / 2 - 50);

    // Orbit tilt and rotation (controlled by disruption)
    let tilt = this.orbitTilt + map(disruptionLevel, 0, 100, -0.5, 0.5);
    let orbitRotation = map(disruptionLevel, 0, 100, 0, 180); // rotate orbit

    // Orbit eccentricity (controlled by obscurity)
    let eccentricity = map(obscurity, 0, 100, 1, this.orbitEccentricity);

    // Orbit center offset using obscurity
    let offsetAmount = map(obscurity, 0, 100, 0, 100);
    let offsetAngle = this.index * (360 / numStars);
    let cx = offsetAmount * cos(offsetAngle);
    let cy = offsetAmount * sin(offsetAngle);

    // Compute star position using orbitRotation and orbit shape
    let rotatedAngle = this.angle + orbitRotation;
    let x = distance * cos(rotatedAngle);
    let y = distance * sin(rotatedAngle) * tilt * eccentricity;

    // Apply orbit center offset
    x += cx;
    y += cy;

    // Orbit outline (hide during constellation animation)
	if (!isAnimatingConstellation) {
	    push();
	    translate(cx, cy);
	    rotate(orbitRotation);
	    noFill();
	    stroke(100, orbitOpacity); // semi-transparent by default
	    strokeWeight(0.5);
	    ellipse(0, 0, distance * 2, distance * 2 * tilt * eccentricity);
	    pop();
	}

    // Star style
    noStroke();
    let b = map(optimism, 0, 100, 100, 255);
    fill(b);

    let s = this.scale * map(scaleSlider, 0, 100, 0.5, 2);
	let glowActive = false;
	if (this.hasGlow && humanElement > 50) {
		glowActive = true;
	}
	
	if (constellationGlowProgress > 0.0) {
		glowActive = true;
		drawingContext.shadowBlur = 30 * constellationGlowProgress;
		drawingContext.shadowColor = color(255, 25, 255, 200 * constellationGlowProgress);
	} else if (glowActive) {
		drawingContext.shadowBlur = 15;
		drawingContext.shadowColor = color(255, 255, 255, 150);
	} else {
      drawingContext.shadowBlur = 0;
    }

    ellipse(x, y, 8 * s, 8 * s);

    // Reset shadow
    drawingContext.shadowBlur = 0;

    // Satellite
    if (this.hasSatellite && techInfluence > 50) {
      let satAngle = this.angle * 2;
      let sx = x + 15 * cos(satAngle);
      let sy = y + 15 * sin(satAngle);
      fill(180);
      ellipse(sx, sy, 4, 4);
    }
  }
  
  getPosition() {
	  let temporalDistance = sliderValues["temporal"] || 0;
	  let disruptionLevel = sliderValues["disruption"] || 0;
	  let obscurity = sliderValues["obscurity"] || 0;
	  
	  let distance = this.baseDistance + temporalDistance * 2;
	  distance = constrain(distance, 50, min(width, height) / 2 - 50);
	  
	  let tilt = this.orbitTilt + map(disruptionLevel, 0, 100, -0.5, 0.5);
	  let orbitRotation = map(disruptionLevel, 0, 100, 0, 180);
	  let eccentricity = map(obscurity, 0, 100, 1, this.orbitEccentricity);
	  
	  let offsetAmount = map(obscurity, 0, 100, 0, 100);
	  let offsetAngle = this.index * (360 / numStars);
	  let cx = offsetAmount * cos(offsetAngle);
	  let cy = offsetAmount * sin(offsetAngle);
	  
	  let rotatedAngle = this.angle + orbitRotation;
	  let x = distance * cos(rotatedAngle);
	  let y = distance * sin(rotatedAngle) * tilt * eccentricity;
	  
	  x += cx;
	  y += cy;
	  
	  return createVector(x, y);
  }
  
}

function drawConstellationLines() {
	stroke(255, 180);
	strokeWeight(2);
	noFill();
	
	let origin = stars[0].getPosition();
	
	for (let i = 1; i <= linesDrawn && i < stars.length; i++) {
		let target = stars[i].getPosition();
		line(origin.x, origin.y, target.x, target.y);
	}
	
	if (frameCount % 10 === 0 && linesDrawn < stars.length - 1) {
		linesDrawn++;
	}
	
	if (linesDrawn >= stars.length - 1 && !constellationDrawn) {
		drawingConstellation = false;
		glowPhase = true;
		constellationDrawn = true; // keep lines rendered
		document.getElementById("generate").disabled = false;
	}
}

function glowConstellation() {
	let origin = stars[0].getPosition();
	stroke(255, random(180, 255));
	strokeWeight(3);
	
	for (let i = 1; i < stars.length; i++) {
		let target = stars[i].getPosition();
		line(origin.x, origin.y, target.x, target.y);
	}
	
	// Brighten stars
	for (let s of stars) {
		let pos = s.getPosition();
		fill(255, 255, 200, random(180, 255));
		noStroke();
		ellipse(pos.x, pos.y, 8);
	}
}


document.getElementById("generate").addEventListener("click", () => {
	if (isAnimatingConstellation) return;
	
	// Trigger slowdown
	slowingDown = true;
	document.getElementById("generate").disabled = true;
});

function windowResized() {
	const canvasContainer = document.getElementById("canvas-container");
  	resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
}

document.getElementById("reset").addEventListener("click", () => {
	slowingDown = false;
	drawingConstellation = false;
	glowPhase = false;
	constellationDrawn = false;
	isAnimatingConstellation = false;
	constellationGlowProgress = 0;
	linesDrawn = 0;
	orbitOpacity = 255;
	rotationSpeed = targetRotationSpeed;
	
	// reset stars
	stars = [];
	createStars();
	
	document.getElementById("generate").disabled = false;
});
