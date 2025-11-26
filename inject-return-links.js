const fs = require("fs");
const path = require("path");

const projectsDir = path.join(__dirname, "projects");

const returnLinkHTML = `
<!-- BEGIN RETURN LINK -->
<script>
// inject-home-link.js
(function () {
	// Inject Font Awesome stylesheet
	const fa = document.createElement("link");
	fa.rel = "stylesheet";
	fa.href = "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css";
	fa.crossOrigin = "anonymous";
	document.head.appendChild(fa);
	
	// Create the back link
	const link = document.createElement("a");
	link.href = "/";
	link.innerHTML = '← Back to Playgrounds <i class="fab fa-github"><i>';
	Object.assign(link.style, {
	  position: "fixed",
	  bottom: "20px",
	  right: "20px",
	  background: "#000",
	  color: "#fff",
	  padding: "8px 12px",
	  zIndex: 1000,
	  fontSize: "14px",
	  opacity: 0.7,
	  borderRadius: "6px",
	  textDecoration: "none"
	});
	link.onmouseover = () => (link.style.opacity = "1");
	link.onmouseout = () => (link.style.opacity = "0.7");
	document.body.appendChild(link);
})();
</script>
<!-- END RETURN LINK -->
`;

fs.readdirSync(projectsDir).forEach((project) => {
	const indexPath = path.join(projectsDir, project, "index.html");
	
	if (fs.existsSync(indexPath)) {
		const contents = fs.readFileSync(indexPath, "utf8");
		
		// Check if return link already exists
		if (!contents.includes("<!-- BEGIN RETURN LINK -->")) {
			const updated = contents.replace(
				/<\/body>/i,
				`${returnLinkHTML}\n</body>`
			);
			fs.writeFileSync(indexPath, updated, "utf8");
			console.log(`✅ Injected return link into: ${project}/index.html`);
		} else {
			console.log(`☑️ Already has return link: ${project}/index.html`);
		}
	} else {
		console.log(`❌ No index.html found in: ${project}/`);			
		}
	}
);
