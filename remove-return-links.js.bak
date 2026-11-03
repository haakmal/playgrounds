const fs = require("fs");
const path = require("path");

const projectsDir = path.join(__dirname, "projects");

fs.readdirSync(projectsDir).forEach((project) => {
  const indexPath = path.join(projectsDir, project, "index.html");

  if (fs.existsSync(indexPath)) {
    let contents = fs.readFileSync(indexPath, "utf8");

    if (contents.includes("<!-- BEGIN RETURN LINK -->")) {
      // Remove everything between the markers (include the markers)
      contents = contents.replace(
        /<!-- BEGIN RETURN LINK -->[\s\S]*?<!-- END RETURN LINK -->\s*/i,
        "",
      );

      fs.writeFileSync(indexPath, contents, "utf8");
      console.log(`🧹 Removed return link from: ${project}/index.html`);
    } else {
      console.log(`ℹ️ No return link found in: ${project}/index.html`);
    }
  } else {
    console.log(`❌ No index.html found in: ${project}/`);
  }
});
