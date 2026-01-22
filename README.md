# Dr Daft's Playgrounds

This is a sandbox-style GitHub repo intended for an assortment of curious (mostly speculative) design and coding work, including but not limited to:

- Practicing programming skills
- Showcasing playful and quirky ideas
- Learning through experimentation
- Documenting small prototypes

## How to navigate this repo

This repository uses custom and minimal Jekyll to display projects over a single homepage. Each project is independent and works out of individual folders so if you would like to unpack them feel free to!

Here's a break down of how the Jekyll side of things is managed but a more detailed explanation is on my [blog post](https://blog.hakmal.com/post/jekyll-playground/).

```bash
_data/projects/  # project metadata as .yml files
projects/        # where all projects reside
```

## Using metadata

To add new projects simply import them into the `projects/` folder and add the respective metadata in `_data/projects/[project-folder].yml`. **The YAML file should have the same name as the project folder.**

For projects that are not in the `projects/` folder use `external: true` in YAML with a direct link in the `url` field

## Injecting Navigation

Since all projects are independent of the main Jekyll site, adding links back to the root index requires manually inserting a return link. This is tedious and unintutive because any change requires updating all links individually. As a work around the `inject-return-links.js` and `remove-return-links.js` scripts can be used to add/remove the return to root back-link at the bottom of each `index.html`.

Using the script is simple and can be done from the terminal.

```bash
node inject-return-links.js
node remove-return-links.js
```

When any changes are needed such as styling or adding/removing content from the links, the `inject-return-links.js` script can be updated.

## Local Testing

This repo is designed to use Github Pages to deliver content through Github provided Jekyll and a custom setup. To test locally Ruby and Jekyll need to be installed on a local machine where this git repo has been cloned. After installing Ruby + Jekyll the following commands can be run in terminal to test locally from the root of the repo. **The `Gemfile` must be in the root folder for these commands to work.**

```bash
# Ensure all required gems are installed first
bundle install
# Start a local testing copy of site
# The baseurl is setup this way to ensure links are all working
# as they would in Github Pages with the repo name
bundle exec jekyll serve --baseurl="/playgrounds"
# use bottom if using DNS

```
