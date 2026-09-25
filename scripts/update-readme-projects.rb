#!/usr/bin/env ruby

require "yaml"
require "date"
require "pathname"

ROOT = Pathname.new(__dir__).parent
DATA_DIR = ROOT.join("_data", "projects")
README = ROOT.join("README.md")

START_MARKER = "<!-- PROJECTS:START -->"
END_MARKER = "<!-- PROJECTS:END -->"

# update if url changes in future
SITE_BASE_URL = "https://play.hakmal.com"

def markdown_escape(text)
  text.to_s
    .gsub("\\", "\\\\")
    .gsub("|", "\\|")
    .gsub("\n", " ")
end

def project_url(info)
  url = info["url"].to_s.strip

  return url if info["external"] && !url.empty?

  return nil if url.empty?

  "#{SITE_BASE_URL}#{url}"
end

project_files = DATA_DIR.glob("*.yml").sort

projects = project_files.map do |file|
  info = YAML.safe_load_file(
    file,
    permitted_classes: [Date],
    aliases: true
  )

  {
    titile: info["title"].to_s,
    description: info["description"].to_s,
    url: project_url(info),
    wip: info["wip"] == true,
    date: info["date"].to_s,
    categories: Array(info["categories"])
  }
end

# Newest projects first
projects.sort_by! do |project|
  begin
    Date.parse(project[:date].to_s)
  rescue ArgumentError
    Date.new(1900, 1, 1)
  end
end

projects.reverse!

rows = projects.map do |project|
  title = markdown_escape(project[:titile])
  description = markdown_escape(project[:description])
  
  project_name =
    if project[:url]
      "[#{title}](#{project[:url]})"
    else
      title
    end

    status = project[:wip] ? "WIP" : "Published"

    "| #{project_name} | #{description} | #{status} |"
end

table = [
  "| Project | Description | Status |",
  "|---|---|---|",
  *rows
].join("\n")

readme = README.read

start_index = readme.index(START_MARKER)
end_index = readme.index(END_MARKER)

unless start_index
  abort "Could not find #{START_MARKER} in README.md"
end

unless end_index
  abort "Could not find #{END_MARKER} in README.md"
end

unless end_index > start_index
  abort "README.md markers are in the wrong order"
end

content_start = start_index + START_MARKER.length

new_readme =
  readme[0...content_start] +
  "\n\n" +
  table +
  "\n\n" +
  readme[end_index..]

README.write(new_readme)

puts "Updated README project list with #{projects.length} projects."