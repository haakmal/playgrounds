# Usability Reporting Tool

A dependency-free client-side tool for building a structured usability report.

This tool emerged out of an observation I had in my classrooms, students often found the process of making a usability report confusing with understanding and applying heuristics. Students add one finding at a time in a single editor in hopes of recreating the experience in similar industry standard heuristic capturing tools.

The heuristic library is possibly the biggest benefit of this tool as it is a large reference point with search, source filters, category filters, definitions, look-for guidance, examples and related principles.

## Privacy and Storage

Reports are stored in browser `LocalStorage`. JSON export/import is used for moving a report between browsers or devices so students can share with their tutors.

## PDF

For submission time, students may generate a print ready PDF by choosing **Print / Save PDF**. The print stylesheet hides the working interface and prints only the condensed findings table with a report title and generated timestamp.

## Heuristic library

The combined library prioritises Nielsen first, then Andy Budd, then Bruce Tognazzini. Shared concepts are consolidated rather than presented as duplicate entries. Source attribution is retained and related principles are shown in the reference modal. For my students I would recommend exploring related principles before commiting to a heuristic.
