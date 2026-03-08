# CLUES Intelligence — Company Mission & Architecture Vision

> **PURPOSE**: This is the permanent mission document for CLUES Intelligence. Every AI agent, every developer,
> and every new conversation MUST read this file to understand what CLUES is, why it exists, and how it works.
> This document captures the founder's vision in its entirety. It is NOT a technical spec — it is the *why*
> behind every line of code.
>
> **Author**: John Desautels, Founder
> **Last Updated**: 2026-03-08

---

## 1. THE PROBLEM CLUES SOLVES

A person calls us and says one of two things:

**Scenario A**: "I hate where I live, but I have no clue where in the world I want to move."

**Scenario B**: "I know I want to live in [Region X] — maybe Western Europe, maybe Southeast Asia, maybe the Pacific Northwest — but I need help identifying the best country, the best cities, the best towns, and the best neighborhoods for my unique situation."

Either way, that person needs CLUES to identify:

1. **The best country** for them
2. **The top 3 cities** within that country
3. **The top 3 towns** within the winning city
4. **The top 3 neighborhoods** within the winning town

Today, that person has terrible options. They spend months — sometimes years — researching magazines, online publications, user groups, YouTube channels, Reddit threads, and opinion feeds. When a publication crowns City X as the "Top City for Retirees" or the "Best City for Digital Nomads," the question is: **based on what, and for whom?**

These rankings are built on narrow, generic, one-size-fits-all data. They are not personalized to the individual. They ignore the enormous divergences between human beings in their wants, needs, values, budget, health requirements, political orientation, family situation, career, hobbies, cultural priorities, climate preferences, and personality.

Beyond that, the current way of searching for the "best" city suffers from:

- **Outdated data**: Articles from 2023 still circulate as if the world hasn't changed. A user looking at year-old publications about the United States might assume a progressive-leaning democracy — yet today, it is a very different country leaning hard right. That user would have made a life-altering mistake.
- **Incomplete data**: Most rankings evaluate 5-10 dimensions at best. A human life has dozens of dimensions that matter.
- **Paywall trickery**: Critical information hidden behind subscriptions and affiliate content designed to sell, not inform.
- **No mathematical rigor**: Rankings based on opinion, anecdote, and editorial judgment — not deep, sourced, verifiable research.
- **No trend analysis**: Static snapshots that miss the direction a city, country, or region is heading. A city that scored well 18 months ago may be declining rapidly.

CLUES exists to solve all of this — permanently.

---

## 2. WHAT CLUES DELIVERS

CLUES Intelligence delivers the **world's most advanced, most detailed, most accurate personalized relocation report** to each user, with a target **margin of error of 2% or less**.

Every claim is sourced. Every score is provable. Every recommendation is defensible. The user can click through to the actual articles, data sets, and indices that back every single number in their report.

The number of personalized metrics varies per user — it might be 28 for a minimalist with simple needs, or 310 for someone with a complex life situation. The user's unique persona and the LLMs' needs for calculation accuracy dictate the final count. There is no fixed range; the system generates exactly as many metrics as the user's data warrants.

### The Three Reports

CLUES produces **three distinct reports**, each serving a different purpose:

#### Report 1: Results Data Report (The Raw Math)
The raw, per-metric, per-LLM data grid showing:
- Every metric's score from each of the 5 evaluating LLMs
- Opus Judge's adjustments to each metric
- Color-coded scoring (red/yellow/green)
- Standard deviation from the mean for each metric
- Mean, median, mode calculations
- Divergence highlights where LLMs disagreed significantly
- Full statistical transparency — this is the "show your work" report

#### Report 2: LLM Analysis Reports (The Narrative Intelligence)
Each LLM's own synthesized analysis with:
- Their interpretation of the data
- Their own visuals, charts, and comparative displays
- Category-by-category breakdowns with narrative explanations
- Trend analysis and forward-looking assessments
- The "intelligence layer" — what the numbers mean in human terms

#### Report 3: CLUES GAMMA Report (The WOW Deliverable)
Everything from Reports 1 and 2 is pushed into **Gamma**, which polishes it all into the final, beautifully designed, shareable report. This is the report the user shares with their spouse, their family, their financial advisor. It includes:
- The best country (1 primary, up to 3 alternatives)
- The top 3 cities in the winning country, scored against all personalized metrics
- The top 3 towns in the winning city
- The top 3 neighborhoods in the winning town
- Full Smart Score breakdowns across 23 life dimensions
- Source citations with direct URLs for every data point
- Cristiano's judicial verdict with cinematic HeyGen avatar video presentation
- 100+ pages of polished, visual, professional content
- Designed to be printed, shared, and referenced during the relocation process

Olivia (AI assistant) is available for follow-up Q&A on every aspect of all three reports.

---

## 3. THE QUESTIONNAIRE CHALLENGE

### The Knowledge Library

CLUES maintains a knowledge library of approximately **2,500 potential questions** organized across:
- **The Paragraphical**: 30 free-form narrative paragraphs (P1-P30) across 6 phases
- **The Main Module**: Structured questionnaire with detailed questions
- **23 Mini Modules**: Self-contained focused modules, one per life dimension (Climate, Safety, Healthcare, Financial, etc.)

### The Fatigue Problem

No human should answer all 2,500 questions. Asking any user — even a college professor with unlimited time — to complete 30 paragraphs AND a massive main module AND 23 detailed focus modules would create unbearable questionnaire fatigue.

### Different Users, Different Preferences

Each user has a different preferred way of responding:
- **Writers** (like John's father) are excellent writers who prefer to craft narrative responses in their own words
- **Selectors** who prefer multiple-choice, checkboxes, and structured options
- **Completionists** who have time and want to fill out many modules in depth
- **Minimalists** who want to provide the bare essentials and let the AI do the work

The system must accommodate all of them while maintaining the same depth of analysis.

### The Solution: Adaptive Intelligence

CLUES uses a **Bayesian-like adaptive system** that learns each user's persona as their answers arrive. The target is for most users to reach report-ready accuracy at approximately **250 answers** out of the 2,500 available — though the exact number varies per user (it might be 227, or 243, or 318).

The system tracks **coverage** across 23 dimensions. At the start of a questionnaire, only basic demographics are known. The system cannot yet understand the user's true persona. But as each answer arrives — whether a written paragraph, a multiple-choice selection, or a module response — it slowly paints the picture:

- It points the LLMs toward more relevant questions
- It simultaneously points them away from questions that are now redundant or irrelevant
- It pre-fills answers that can be reliably inferred from prior responses
- It skips questions whose expected information gain is below a threshold

A **real-time status indicator** shows the user not just how many questions they've completed, but how thorough and accurate their session is toward achieving the 2% MOE target. This second meter is the critical one. When it turns green, **Olivia congratulates them** — their CLUES questionnaire modules are complete, and the system can now generate a full, accurate CLUES GAMMA Report.

---

## 4. WHY FIVE LLMS (AND WHY EACH ONE)

### The Core Discovery: No Single LLM Is Trustworthy

Hundreds of hours of testing across the LifeScore and CLUES platforms taught us that every LLM has distinct strengths and weaknesses. No single model can be trusted to deliver accurate results across all dimensions of analysis.

### LLM Capabilities Map

| Model | Strengths | Weaknesses |
|-------|-----------|------------|
| **Gemini 3.1 Pro Preview** | Best at plain-language extraction and inferential reasoning from written text. Excellent at understanding what a user *means* from what they *wrote*. | Not strong at pure mathematics. |
| **Grok 4.1 Fast Reasoning** | Very strong at mathematical calculations and quantitative analysis. 2M context window, ~99 tokens/sec. | Far more likely to hallucinate than other models. |
| **GPT-4o** | Enormous factual knowledge base. Strong on facts and figures. | Can hallucinate. Poor at nuanced verbal observations — misses subtlety in human language. |
| **Perplexity Sonar Reasoning Pro High** | Best web search of all models (built-in, native). Excels at finding current, relevant data with deep reasoning. | Context window limitations and internal use of other models can introduce bias. |
| **Claude Sonnet 4.6** | Fast, efficient, affordable. Reliable for structured evaluation. | Can miss subtle temporal differences — may not properly weigh a 2023 article against a contradicting late-2025 article. |
| **Claude Opus 4.6** | The most powerful reasoning and mathematical brain. Unmatched ability to weigh evidence, detect inconsistencies, and render judgment. | No built-in web search (by design — he is the judge, not the investigator). |

### The Hallucination Problem

All LLMs hallucinate — or in human terms, they lie. We cannot build a product where people's life decisions depend on lies. This led to a critical architectural decision: **every evaluating LLM must use web search to find and cite real sources, not just rely on training data.**

By forcing LLMs to search the web (via their native search capabilities plus Tavily) and validate their calculations against proven, cited sources, we reduced hallucinations dramatically. Tavily paired with LLM-native web search gave us phenomenal, truthful, verifiable results.

### The Disagreement Problem

Even with web search, LLMs frequently disagree on scores for the same metric in the same city. Example:

- **LLM 1** scores London Bermondsey at **20** (red — bad) based on one article
- **LLM 2** scores London Bermondsey at **43** (yellow — average) based on a similar article

When hundreds of these metric-level divergences occur across the full evaluation, how does the system arrive at a conclusive answer? How does CLUES build toward or away from a city recommendation?

This is why the **five-LLM consensus system** exists. All five LLMs independently evaluate each metric using web search and Tavily. Their scores are gridded per LLM and per metric. Then **Opus Judge** resolves the disagreements.

---

## 5. OPUS JUDGE (CRISTIANO)

### The Courtroom Analogy

Opus is the **judge in a courtroom**. He does not conduct his own investigation. He does not search the web. He reviews what the five "attorneys" (the evaluating LLMs) brought to court and renders a verdict.

### What Opus Judge Does

For each metric where the five LLMs disagree:

1. **Examines all 5 conclusions** and their source data
2. **Evaluates source recency** — which LLM cited the most recent articles?
3. **Evaluates source reliability** — which sources are the most trustworthy (government data vs. blog post)?
4. **Identifies outliers** — is one score wildly different from the other four? Maybe discard it — but maybe that outlier found a real, accurate data point the others missed (like a false article the other 4 all cited)
5. **Applies statistical weights** — mean, median, mode, standard deviation from the mean
6. **Can override** when he detects something the pure math misses — a recently passed law, an emerging trend, a data source that will shift a metric's score dramatically in the near future
7. **Renders a final score** for each metric with full reasoning

### Statistical Rigor

Every metric in the final report includes:
- The final judged score
- Mean across all 5 LLMs
- Median across all 5 LLMs
- Mode (if applicable)
- Standard deviation
- Which LLM scores were weighted up or down and why
- Any overrides Opus applied and the reasoning behind them

---

## 6. THE TRANSPARENCY PROMISE

CLUES does not deliver a black-box answer. The user sees:

- **The cited articles** backing every data point, with direct clickable links
- **The methodology** used for each metric's scoring
- **The adjustments** Opus made and why
- **How every final score was calculated** — the math is visible
- **The weights applied** through all sections to arrive at final scores
- **The full funnel** — from thousands of ruled-out countries, cities, and towns down to the final 3-3-3 recommendation
- **What was ruled out and why** — the hundreds or thousands of locations that didn't make the cut, filtered by the user's demographics, dealbreakers, must-haves, and trade-offs from the Paragraphical and module answers

---

## 7. THE USER JOURNEY

1. **Region Selection**: User selects a target region via the globe zoom tool on cluesintelligence.com — or indicates they have no idea and need global analysis
2. **Data Collection**: User completes some combination of the Paragraphical (free-form paragraphs), Main Module (structured questions), and/or 23 Mini Modules — in whatever input style suits them
3. **Adaptive Guidance**: Olivia (AI assistant) guides them in real time, skipping redundant questions, surfacing the most information-rich questions next, and pre-filling answers that can be inferred
4. **Coverage Tracking**: A real-time status meter shows how close the session is to the 2% MOE target — not just question count, but answer quality and dimensional coverage
5. **Completion**: When sufficient data is collected, the indicator turns green. Olivia congratulates the user and announces that CLUES can now fully process their data
6. **Report Generation**: The system generates the CLUES GAMMA Report — 100+ pages, fully sourced, with Smart Scores, city-by-city comparisons, town and neighborhood drill-downs
7. **Judicial Presentation**: Cristiano (Opus Judge avatar) presents detailed judicial findings, verdict, summary, and a cinematic HeyGen avatar video — "Your New Life in [Winning City]"
8. **Follow-Up**: Olivia returns as a video agent and chat companion, walking the user through their report, answering questions, and helping them plan next steps

---

## 8. THE 2% MARGIN OF ERROR TARGET

The 2% MOE is not aspirational — it is the engineering target that drives every architectural decision:

- **Why 5 LLMs instead of 1**: Single-model error rates are too high. Consensus reduces variance.
- **Why web search is mandatory**: Knowledge-base-only answers introduce temporal drift and fabrication.
- **Why Opus judges**: Unresolved disagreements between evaluators would widen the error margin.
- **Why ~250 answers from ~2,500**: Fewer than ~250 answers typically leaves too many dimensions uncovered. More than ~250 shows diminishing returns for most users.
- **Why adaptive skip logic**: Asking irrelevant questions wastes user time without improving accuracy.
- **Why Tavily + native search**: Double-sourcing catches single-source errors.
- **Why mean, median, mode, and standard deviation**: A single average can be skewed by one bad LLM output. Full statistical analysis catches and corrects this.

The MOE is validated empirically through backtesting — not through theoretical Bayesian proofs. The system's accuracy is measured by comparing its recommendations against known-good outcomes and expert evaluations.

---

## 9. NON-NEGOTIABLE PRINCIPLES

1. **Every data point has multiple sources with direct, clickable links.** No unsourced claims. Ever.
2. **Every score is mathematically defensible.** Show the work.
3. **No LLM is trusted alone.** Consensus or nothing.
4. **Opus is the judge, not the investigator.** He reviews evidence; he doesn't gather it.
5. **The Paragraphical alone produces a complete report.** Modules enhance accuracy; they don't enable it.
6. **Currency is detected from context and displayed in dual format** (user's home currency + destination currency).
7. **Trend analysis matters.** A city's trajectory is as important as its current state.
8. **The user's unique persona drives everything.** Generic rankings are the enemy.
9. **Transparency is not optional.** The user can verify every claim in the report.
10. **Questionnaire fatigue is a design failure.** The system adapts; the user doesn't suffer.

---

*This document is the permanent record of the CLUES Intelligence mission and architecture vision. It must be read by every AI agent before starting work on any part of the CLUES platform. No future agent may claim ignorance of these principles.*
