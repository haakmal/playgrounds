# Marking Minion

**A lightweight, local-first marking calculator for Moodle-style assessment rubrics.**

When UNSW moved away from Review in favour of Moodle marking, I found myself, along with many of my tutors, missing some of the simplicity that Review offered. Marking Minion is an attempt to bring some of that ease back.

It is a browser-based tool for tutors and course convenors to calculate, organise and review student marks using Moodle's rubric grading midpoints. It supports multiple weighted assessments, shared student rosters and a streamlined marking workspace.

> [!IMPORTANT]
> **Marking advisory:** All marks and grades calculated by Marking Minion are indicative only. Tutors and course convenors should refer to Moodle as the authoritative source for final marking calculations and grades. Marking Minion is a companion to Moodle, not a replacement.

## Features

- **[Moodle-aligned rubric calculations](#how-marking-works):** Select grading bands for individual criteria using Moodle's fixed midpoint values.
- **[Multiple weighted assessments](#multiple-assessments):** Configure assessment criteria and weightings, and calculate students' overall results across a class.
- **[Moodle student roster import](#importing-a-moodle-student-roster):** Maintain one shared roster across assessments, with direct CSV import from Moodle (very handy!).
- **Streamlined marking workspace:** Navigate between students and assessments with automatic calculations and progress tracking, bringing back some of Review's convenience.
- **[Assessment analytics](#assessment-analytics):** Explore averages, grade distributions and other statistics. Not essential for every course, but useful when reviewing marking patterns.
- **[Printable marking records](#printing-marking-records):** Generate assessment registers or consolidated class summaries for recordkeeping and sharing with convenors.
- **[Session import and export](#saving-and-sharing-sessions):** Transfer complete marking sessions between tutors or devices. Convenors can also prepare and distribute sessions with student rosters already populated.
- **[Automatic local saving](#saving-and-sharing-sessions):** Preserve progress in the browser using LocalStorage, without requiring an account or server.

## How marking works

Marking Minion uses the fixed midpoint values configured in Moodle rubrics rather than allowing arbitrary marks within each grading band.

| Rubric band                      | Midpoint |
| -------------------------------- | -------: |
| Failed to meet criterion         |        0 |
| Fail (FL)                        |       30 |
| Pass (PS)                        |       60 |
| Credit (CR)                      |       70 |
| Distinction (DN)                 |       80 |
| High Distinction (HD)            |       90 |
| Perfect application of criterion |      100 |

Each selected midpoint is multiplied by the criterion's weighting to calculate its contribution to the assessment mark.

For example, an assessment with three criteria:

| Criterion     |   Weight | Selected band | Contribution |
| ------------- | -------: | ------------- | -----------: |
| Research      |      30% | CR (70)       |           21 |
| Development   |      40% | DN (80)       |           32 |
| Communication |      30% | HD (90)       |           27 |
| **Total**     | **100%** |               |  **80 (DN)** |

The assessment mark is calculated as:

`Assessment mark = Σ (criterion midpoint × criterion weight / 100)`

### Multiple assessments

Assessments can contribute different percentages towards the overall class grade.

For example:

| Assessment   |   Weight | Student mark | Contribution |
| ------------ | -------: | -----------: | -----------: |
| Assessment 1 |      40% |           70 |           28 |
| Assessment 2 |      60% |           90 |           54 |
| **Overall**  | **100%** |              |  **82 (DN)** |

Combined results are calculated once the required assessment marks are available and the assessment weightings total 100%.

## Importing a Moodle student roster

Marking Minion supports CSV files using Moodle's student roster structure for easy import:

| First name | Last name | Username | Email address    | Groups           |
| ---------- | --------- | -------- | ---------------- | ---------------- |
| John       | Doe       | z000001  | john@example.com | Thursday [12345] |
| Jane       | Smith     | z000002  | jane@example.com | Thursday [12345] |

The importer combines first and last names into a student name and uses the Moodle username as the student identifier.

Existing students are identified by their usernames, allowing additional students to be imported without overwriting previously recorded marks.

## Manual final marks

The pencil beside a student's final assessment mark allows tutors to enter an overall mark from 0–100, including decimals. The manual mark takes precedence over the rubric calculation for that assessment, so it determines the displayed grade, combined class result and analytics. The underlying rubric selections remain saved and visible but become muted and non-interactive while the override is active. Use the reset arrow beside the mark to restore the original rubric calculation without losing those selections.

> [!NOTE]
> An asterisk (`*`) beside a mark indicates that the assessment mark was entered manually. This distinction is also carried into the student roster and printed registers so be mindful when sharing results anywhere. The asterisk signals an override, not an additional penalty or grade adjustment.

> [!IMPORTANT]
> This tool does not calculate late penalties on purpose. It is a companion tool to make marking easier rather than relying on Moodle's clunky interface. We still have to go in and update it there and that is where late penalties can be applied. Use this tool only for reference and own records. Moodle should always be the final calculation source.

## Assessment analytics

Marking Minion provides an overview of marking outcomes for individual assessments and the combined class results.

Available measures include:

- Mean, median and standard deviation
- Grade-band distribution
- Mark distribution and a comparative bell-curve visualisation
- Completed and incomplete marking records

These visualisations support reflection on marking patterns and potential inconsistencies. They do not prescribe a grade distribution or imply that student results should conform to a normal distribution.

## Saving and sharing sessions

Marking Minion automatically saves the current session using the browser's **LocalStorage**.

**Export session** downloads the class roster, assessment definitions, rubric criteria and recorded marks as a portable file. **Import session** restores a previously exported session.

The underlying format is JSON, but no technical knowledge is required to use these controls.

LocalStorage is specific to the browser and device being used. Data may be lost if browser storage is cleared, so regular session exports are recommended, especially when marking across multiple devices.

> [!CAUTION]
> **Student data and privacy:** Sessions and Moodle roster exports may contain personal information. Treat these files as student assessment records, store them in institutionally approved locations and share them only with authorised staff. LocalStorage is not a substitute for an institutionally managed student-record system.

## Printing marking records

The **Print record** controls generate marking registers for individual assessments or a consolidated class summary.

Assessment registers include criterion-level selections, weighted contributions, final marks and grades. Class summaries provide an overview of performance across assessments.

Incomplete records remain distinguishable from completed marking outcomes.

## Limitations

Marking Minion is a calculation and recordkeeping companion, not a learning management system.

- **There is no direct Moodle integration.** Marks must still be entered into Moodle manually.
- Criterion marks are restricted to Moodle's configured midpoint values.
- Course-specific hurdles, moderation, late penalties and manual overrides are not supported.
- LocalStorage is not a secure, centrally managed student-record database.
- Analytics describe recorded results; they do not provide automated assessment recommendations.

All results should be verified in Moodle before finalising student grades.

## AI collaboration

Marking Minion was designed and developed by **Dr Haider Ali Akmal** in collaboration with AI-supported design and development tools. Naming a single model would not accurately reflect the process, as different models may have contributed across successive iterations.

AI supported code development and debugging, interface iteration, content refinement and critical discussion of design decisions. The concept, pedagogical direction, design requirements, evaluation and final decisions remain the work and responsibility of the project author.

This acknowledgement reflects a commitment to transparency in AI-assisted creative and technical practice, alongside an interest in human–AI collaboration as an evolving mode of design practice.
