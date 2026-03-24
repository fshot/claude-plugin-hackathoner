---
title: "Hackathoner Plugin Design"
created: 2026-03-24
status: approved
source: fshot/crux docs/plans/2026-03-24-1630-hackathoner-plugin-design.md
---

# Hackathoner: Claude Code Plugin for Hackathon Execution

## Overview

A Claude Code plugin that structures and optimizes hackathon projects. It encodes a methodology for compressed-timeline development: research sponsor tools, assemble project-specific skills, route tasks across a team, enforce checkpoints, and prepare a winning demo.

The plugin operates at two levels:
- **System-level skills** (reusable across any hackathon): the machines that build the machines
- **Project-level skills** (generated per-hackathon): working knowledge Claude uses during development

## Core Philosophy

- Humans design, Claude builds. Maximize human time on architecture, testing, and refinement.
- Spec-driven development. No code without an approved plan.
- Bias to action. `/hack` with no args picks up the next task and goes.
- Feature Zero: if test data matters, the test data manager is the first deliverable.
- Plans committed before implementation. Timestamped to the minute: `docs/plans/YYYY-MM-DD-HHMM-<description>.md`

See the full design in the source file linked above, or in the plugin's skill files.
