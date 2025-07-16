// inject-home-link.js
(function () {
	const link = document.createElement("a");
	link.href = "/playgrounds/";
	link.textContent = "← Back to <i class='fab fa-github'><i> Playgrounds";
	link.style.position = "fixed";
	link.style.bottom = "20px";
	link.style.right = "20px";
	link.style.background = "#000";
	link.style.color = "#fff";
	link.style.padding = "8px 12px";
	link.style.borderRadius = "6px";
	link.style.textDecoration =  "none";
	link.style.zIndex = "1000";
	link.style.opacity = "0.7";
	link.onmouseover = () => (link.style.opacity = "1");
	link.onmouseout = () => (link.style.opacity = "0.7");
	
	document.body.appendChild(link);
})();