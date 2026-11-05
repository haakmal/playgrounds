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
| [Speed Testing](https://play.hakmal.com/projects/speed-testing/) | A quick way to do speed tests in class with students. | Published |
| [Inquiry Plates](https://play.hakmal.com/projects/inquiry-plates/) | A set of inquiry-based learning materials for exploring cultural probing directions. | WIP |
| [Family Atlas](https://play.hakmal.com/projects/family-atlas/) | A family tree management and visualisation tool. | WIP |
| [Marking Minion](https://play.hakmal.com/projects/marking-minion/) | A lightweight, local-first marking calculator for Moodle-style assessment rubrics. | Published |
| [Possibility Engine](https://play.hakmal.com/projects/possibility-engine/) | An engine for idea disruption and exploring new perspectives and possibilities. | Published |
| [Groupings Tool](https://play.hakmal.com/projects/groupings/) | A handy tool for creating and managing assigned groups. | Published |
| [Cardboard](https://play.hakmal.com/projects/cardboard/) | A handy card deck maker for drafting, shuffling, and revealing card-based activities. | WIP |
| [Interaction Principles Mapper](https://play.hakmal.com/projects/principles-mapper) | A tool for mapping scenarios against Norman's interaction principles. | Published |
| [Design Shuffler](https://play.hakmal.com/projects/design-shuffler) | A tool for shuffling design contexts and factors to explore new design possibilities. | WIP |
| [The Seer's Table](https://play.hakmal.com/projects/seer-table/) | A playful ideation guide to support designing for enchanted objects. | Published |
| [Systems Insight Lab](https://play.hakmal.com/projects/systems-insight-lab/) | A systems mapping tool for collecting and analysing threads of information. | WIP |
| [Interaction Mapper](https://play.hakmal.com/projects/interaction-map) | A simple tool for mapping interactions against human and system behaviours. | Published |
| [Contextual Modelling Companion](https://play.hakmal.com/projects/contextual-modeller/) | A reference guide for helping students map research to contextual design models | Published |
| [Heuristic Examination](https://play.hakmal.com/projects/ui-forensics/) | A UI forensics tool for learning heuristic evaluation. | Published |
| [Interactive Prototyping Companion](https://play.hakmal.com/projects/prototyping-companion/) | A tool for creating and testing interactive prototypes aimed as companion tool for my students. | Published |
| [Usability Reporting](https://play.hakmal.com/projects/usability-reporting/) | A toolkit for usability reporting shared with my students. | Published |
| [Accessibility Audit](https://play.hakmal.com/projects/accessibility-audit/) | An accessibility audit tool for evaluating interactions. | Published |
| [Interaction Context Map](https://play.hakmal.com/projects/interaction-context-map/) | A digital version of the Interaction Context Mapping tool provided to my students, good for understanding how people, technology, and contexts relate to each other to form an interaction. | WIP |
| [Blindspots](https://hakmal.com/) | A play-based card system for finding hidden biases in the design process | Published |
| [Dice Generator](https://play.hakmal.com/projects/dice-generator/) | A simple tool to generate custom dice. | WIP |
| [Interaction Constraints](https://play.hakmal.com/projects/constraints/) | A handy constraint card deck for interaction design. | Published |
| [My Pantry](https://play.hakmal.com/projects/my-pantry/) | A simple pantry management app using client-side JS and Supabase. | WIP |
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

Since each playground operates independently of the main Jekyll site, a shared navigation utility is injected into individual projects. This provides access to the Playgrounds homepage, GitHub source, feedback, contribution options, and contact information without maintaining navigation separately within each project.

The utility is managed through two scripts, run from the repository root:

```bash
node inject-return-links.js
node remove-return-links.js
```

- **Inject:** Adds the shared utility reference to eligible `projects/[folder]/index.html` files and registers new projects in the configuration.
- **Remove:** Removes the injected utility while preserving project configuration for future use.

#### Configuration

The utility uses `_data/playgrounds_utility.yml` as its **single source of truth**. This file includes annotated global settings and project-specific overrides, including desktop/mobile positioning, alignment, and navigation options.

Each project is identified by its folder name:

```yaml
projects:
  family-atlas:
    side: left
    bottom: 155
    mobileSide: right
    mobileBottom: 16
    mobileInset: 0
```

Projects without overrides inherit the global defaults. Jekyll automatically converts the YAML configuration into browser-readable JSON during site builds. **Configuration changes do not require reinjection**—simply edit the YAML and rebuild or publish the site.

The shared interface itself is maintained in `assets/playgrounds-utility.js`. Changes to its appearance or behaviour apply across all injected playgrounds without modifying their individual HTML files.

For local testing, use the Jekyll commands documented below rather than a basic Python HTTP server, which cannot process the YAML configuration.

#### Dependencies and Fresh Installation

The navigation utility requires **Node.js** for the injection/removal scripts and **Ruby, Bundler, and Jekyll** for building the site locally. No additional npm packages or JavaScript build tools are required.

On a fresh system (including Linux), ensure Node.js and Ruby are installed, then install the Jekyll dependencies from the repository root:

```bash
# Check installed prerequisites
node --version
ruby --version
bundle --version

# Install Ruby dependencies from the Gemfile
bundle install
```

After cloning the repository, run the injector once if new projects require navigation:

```bash
node inject-return-links.js
```

Configuration is managed exclusively through `_data/playgrounds_utility.yml`. Jekyll automatically processes changes during builds, so updating configuration does not require running Node.js or reinjecting the utility.

For local development, start the Jekyll server:

```bash
bundle exec jekyll serve --livereload
```

GitHub Pages processes the YAML configuration during deployment, so no separate npm build or configuration synchronisation is required.

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
# refer to above --livereload if testing injection updates
```

## AI Collaboration

All projects in this repository unless stated otherwise have been design and developed by Dr Haider Ali Akmal with some projects a collaboration with an AI-supported design and development partner. Naming a specific model would be insufficient and inaccurate as multiple iterations may have been analysed and collaborated on with different models.

Credit has been provided where due, in those projects AI was used at key points as a collaborative tool for activities including code development and debugging, interface iteration, content refinement, and critical discussion of design decisions. The concept, pedagogical direction, design requirements, evaluation, and final decision-making remain the work and responsibility of the project author.

This acknowledgement reflects a commitment to transparency around AI-assisted creative and technical practice, and an interest in exploring human–AI collaboration as an evolving mode of design practice.
