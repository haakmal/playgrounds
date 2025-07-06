# DrDaft's Playgrounds

This is a sandbox-style GitHub repo intended for an assortment of curious (mostly speculative) design and coding work, including but not limited to:

- Practicing programming skills
- Showcasing playful and quirky ideas
- Learning through experimentation
- Documenting small prototypes

## How to navigate this repo

This repository uses custom and minimal Jekyll to display projects over a single homepage. Each project is independent and works out of individual folders so if you would like to unpack them feel free to!

Here's a break down of how the Jekyll side of things is managed but a more detailed explanation is on my blog post.

```bash
_data/projects/  # project metadata as .yml files
projects/        # where all projects reside
```

## Using metadata

To add new projects simply import them into the `projects/` folder and add the respective metadata in `_data/projects/[project-folder].yml`. **The YAML file should have the same name as the project folder.**

For projects that are not in the `projects/` folder use `external: true` in YAML with a direct link in the `url` field
