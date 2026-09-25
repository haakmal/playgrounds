# Dr Daft's Playgrounds

This is a sandbox-style GitHub repo intended for an assortment of curious (mostly speculative) design and coding work, including but not limited to:

- Practicing programming skills
- Showcasing playful and quirky ideas
- Learning through experimentation
- Providing tools for my students (and anyone curious)
- Documenting small prototypes

## Current playgrounds

<!-- PROJECTS:START -->

| Project | Description | Status |
|---|---|---|
| [The Seer's Table](https://play.hakmal.com/projects/seer-table/) | A playful ideation guide to support designing for enchanted objects. | WIP |
| [Systems Insight Lab](https://play.hakmal.com/projects/systems-insight-lab/) | A systems mapping tool for collecting and analysing threads of information. | WIP |
| [Contextual Modelling Companion](https://play.hakmal.com/projects/contextual-modeller/) | A reference guide for helping students map research to contextual design models | Published |
| [Interaction Mapper](https://play.hakmal.com/projects/interaction-map) | A simple tool for mapping interactions against human and system behaviours. | Published |
| [Heuristic Examination](https://play.hakmal.com/projects/ui-forensics/) | A UI forensics tool for learning heuristic evaluation. | Published |
| [Interactive Prototyping Companion](https://play.hakmal.com/projects/prototyping-companion/) | A tool for creating and testing interactive prototypes aimed as companion tool for my students. | Published |
| [Usability Reporting](https://play.hakmal.com/projects/usability-reporting/) | A toolkit for usability reporting shared with my students. | Published |
| [Accessibility Audit](https://play.hakmal.com/projects/accessibility-audit/) | An accessibility audit tool for evaluating interactions. | Published |
| [Interaction Context Map](https://play.hakmal.com/projects/interaction-context-map/) | A digital version of the Interaction Context Mapping tool provided to my students, good for understanding how people, technology, and contexts relate to each other to form an interaction. | WIP |
| [Blindspots](https://hakmal.com/) | A play-based card system for finding hidden biases in the design process | Published |
| [Dice Generator](https://play.hakmal.com/projects/dice-generator/) | A simple tool to generate custom dice. | WIP |
| [Interaction Constraints](https://play.hakmal.com/projects/constraints/) | A handy constraint card deck for interaction design. | Published |
| [My Pantry](https://play.hakmal.com/projects/my-pantry/) | [Work in progress] A simple pantry management app using client-side JS and Supabase. | WIP |
| [Script Gallery](https://play.hakmal.com/projects/script-gallery/) | A collection of scripts that I couldn't find a place for but wanted to share. | Published |
| [Provocator 9000](https://play.hakmal.com/projects/provocator/) | An interactive AI scenario provocation generator, that can yield positive and negative outputs for a given scenario/idea/concept. | WIP |
| [The (Provoked) Thing From The Future](https://play.hakmal.com/projects/future-thing/) | A handy generator for The Thing From The Future for ideation and critique aimed at AI-guided future provocations. | Published |
| [MTG Calculator](https://haakmal.github.io/mtg-calculator/) | A Magic the Gathering attack calculator | WIP |
| [EmojiDice](https://play.hakmal.com/projects/emojidice/) | A storydice variant using emojis, good for brainstorming. | Published |
| [Design Research Methods](https://play.hakmal.com/projects/design-methods/) | A visual guide for understanding when to use design research methods along the Design Double Diamond. | WIP |
| [Design by Play](https://thesis.hakmal.com/) | A thesis on using Object-Oriented Ontology to playfully design for the Internet of Things | Published |
| [RAIL](https://play.hakmal.com/projects/rail/) | An exploration into responsible AI licensing futures made using Twine. | Published |

<!-- PROJECTS:END -->

## How to navigate this repo

You would only be asking this if you wanted to clone the repo which is fine I suppose 🤷‍♂️, please give credit where you can 😄. This repository uses custom and minimal Jekyll to display projects over a single homepage. Each project is independent and works out of individual folders so if you would like to unpack them feel free to!

Here's a break down of how the Jekyll side of things is managed but a more detailed explanation is on my [blog post](https://blog.hakmal.com/post/jekyll-playground/).

```bash
_data/projects/  # project metadata as .yml files
projects/        # where all projects reside
```

### Using metadata

To add new projects simply import them into the `projects/` folder and add the respective metadata in `_data/projects/[project-folder].yml`. **The YAML file should have the same name as the project folder.**

For projects that are not in the `projects/` folder use `external: true` in YAML with a direct link in the `url` field

### Injecting Navigation

Since all projects are independent of the main Jekyll site, adding links back to the root index requires manually inserting a return link. This is tedious and unintutive because any change requires updating all links individually. As a work around the `inject-return-links.js` and `remove-return-links.js` scripts can be used to add/remove the return to root back-link at the bottom of each `index.html`.

Using the script is simple and can be done from the terminal.

```bash
node inject-return-links.js
node remove-return-links.js
```

When any changes are needed such as styling or adding/removing content from the links, the `inject-return-links.js` script can be updated.

### Local Testing

This repo is designed to use Github Pages to deliver content through Github provided Jekyll and a custom setup. To test locally Ruby and Jekyll need to be installed on a local machine where this git repo has been cloned. After installing Ruby + Jekyll the following commands can be run in terminal to test locally from the root of the repo. **The `Gemfile` must be in the root folder for these commands to work.**

```bash
# Ensure all required gems are installed first
bundle install
# Start a local testing copy of site
# The baseurl is setup this way to ensure links are all working
# as they would in Github Pages with the repo name
bundle exec jekyll serve --baseurl="/playgrounds"
# use bottom if using DNS, config.yml needs to have blank baseurl
bundle exec jekyll serve
```

## AI Collaboration

All projects in this repository unless stated otherwise have been design and developed by Dr Haider Ali Akmal with some projects a collaboration with an AI-supported design and development partner. Naming a specific model would be insufficient and inaccurate as multiple iterations may have been analysed and collaborated on with different models.

Credit has been provided where due, in those projects AI was used at key points as a collaborative tool for activities including code development and debugging, interface iteration, content refinement, and critical discussion of design decisions. The concept, pedagogical direction, design requirements, evaluation, and final decision-making remain the work and responsibility of the project author.

This acknowledgement reflects a commitment to transparency around AI-assisted creative and technical practice, and an interest in exploring human–AI collaboration as an evolving mode of design practice.
