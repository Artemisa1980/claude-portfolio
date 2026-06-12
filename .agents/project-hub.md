# Project Hub — SANDY.SYSDEV v2.0 Portfolio

> **ALL agents read this file first** before reading their individual mission file.
> This is the single source of truth. If it contradicts your agent file, this wins.

---

## What We Are Building

A retro arcade portfolio website for Sandy E. Quintero.  
Stack: **React 19 + Vite 6 + TypeScript**, GSAP (ScrollTrigger), Three.js, WebAudio chiptune engine.  
No Tailwind — all CSS in `src/styles.css`.  
Live at: TBD (Firebase Hosting, pending deploy)

## Repository

`/Users/ahsokartemisa/Documents/Code-ai/projects-website/claude-portfolio/`

## Design System (DO NOT CHANGE THESE)

| Token | Value | Use |
|-------|-------|-----|
| Navy | `#131a43` | Background |
| Cream | `#f2edda` | Text / paper |
| Gold | `#f7c948` | Headings / accents |
| Pink | `#ff6ea9` | Section tags |
| Mint | `#5eead4` | Charts / analytics |
| Cyan | `#67e8f9` | Terminal text |
| Purple | `#a78bfa` | Skills |

Fonts: **Press Start 2P** (pixel headings), **VT323** (terminal), **Space Grotesk** (body).

## Section Map (page order top → bottom)

| Section ID | Component | Nav label |
|------------|-----------|-----------|
| `#top` | Hero | — |
| `#arcade` | Arcade | `./arcade` |
| `#reception` | About | `./about` |
| `#experience` | Experience | `./resume` |
| `#analytics` | Analytics | `./analytics` |
| `#skills` | Skills | — |
| `#tv` | TVStudio | `./tv` |
| `#mail` | SystemRoom | `./mail` |

## Content Source of Truth

All profile data lives in `src/data.ts`. Agents must NOT hardcode content — read from data.ts and modify there.

## Language Rule

**Everything on the website must be in English.** TV channel synopses currently in Spanish — flag for translation when working in that section.

## Status Tracker

| Task | Status | Owner |
|------|--------|-------|
| Framework setup | 🟢 Approved | Clodi |
| Content changes (logo, text, titles) | 🟢 Approved | Clodi |
| Git / GitHub / Firebase deploy | 🟢 Approved | Clodi |
| Arcade station redesign (6 slots) | 🟢 Approved | Clodi |
| Pac-Toe redesign (3x3/5x5/7x7 + 6 levels) | ⚪ Not started | — |
| Zelda in Mario World | ⚪ Not started | — |
| Space Race (Star Wars) | ⚪ Not started | — |
| Stranger Things Pac-Man | ⚪ Not started | — |
| Videos inside TV Studio | ⚪ Not started | — |
| Responsiveness audit (mobile/tablet) | ⚪ Not started | — |

## Quality Rules (non-negotiable)

1. Zero TypeScript errors (`tsc --noEmit` must pass before any phase is marked complete)
2. No placeholder text — everything is real content or explicitly marked "Coming Soon"
3. Every game and section must be responsive (phone, tablet, desktop)
4. All sounds are synthesized WebAudio — no audio file assets
5. Brutal Critic review required before any game ships (code correctness only)

## Agent Roster

| Agent | Tab | Mission file |
|-------|-----|-------------|
| Conductor (Clodi/Gim) | Tab 0 | `conductor.md` |
| Agent: Arcade + Games | Tab 1 | `.agents/agent-arcade.md` (TBD) |
| Agent: Responsiveness | Tab 2 | `.agents/agent-responsive.md` (TBD) |
