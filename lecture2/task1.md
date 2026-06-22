# Lab Practice & Prompting Report: AI Prompting in 2026

* **Course:** AI-101 (AI-Driven Development & Agentic Fundamentals)
* **Document Referenced:** `ai-prompting-lab.pdf`
* **Prepared by:** Fatima Naeem

---

## 1. What I Learned from the Lab
Executing the 13 hands-on exercises in the `ai-prompting-lab.pdf` document shifted my understanding of AI interaction from a casual conversation to an intentional, context-driven engineering process. The primary law governing all 13 concepts is clear: **"Get the right context in, keep the wrong context out."**

Key insights gained include:
* **The Power of Framing (Novice vs. Power User):** Bare prompts yield generic, unhelpful responses. Adding concrete parameters (e.g., budget, constraints, specific target audiences) completely changes the quality and utility of the output.
* **The Reality of Hallucinations (Knows vs. Guesses):** Models sound identically confident whether they are stating a static factual truth or guessing dynamic/local realities (like current news or local legal policies). I learned to explicitly command the AI to admit uncertainty or search when dealing with time-sensitive facts.
* **Wording Dictates Capability (Retrieval Modes & Reasoning):** I learned that we do not manually toggle search or deep reasoning modes; instead, our specific vocabulary (e.g., "cite sources," "research thoroughly," "think hard") structurally guides the model's internal processing pipeline.
* **Silent Failure Modes in Code:** AI models will routinely guess math and data insights rather than calculate them, which introduces severe errors. Forcing code generation and execution is the only reliable way to process numerical data safely.

---

## 2. How My Prompting Improved During the Process
My approach to prompting evolved significantly from a trial-and-error approach to a structured framework:
I discontinued using biased verbs like *"prove"* or *"defend,"* which trigger sycophantic behavior where the model simply mirrors my input. Instead, I transitioned to objective, neutral verbs like *"compare,"* *"evaluate,"* and *"list both sides."* I also stopped accepting the first response, building a structural habit of requesting multiple options up-front, feeding back specific critique, and expanding on the winner.

---

## 3. Which Prompting Techniques Helped the Most

### A. The Three-Slot Recipe (Goal / Input / Output)
When generating small digital tools or structured assets, leveraging the Three-Slot framework proved incredibly effective. Clearly defining the overarching **Goal**, exactly what **Input** data I will provide, and the precise layout or behavioral requirements of the **Output** ensures that single-screen builds function properly on the first try.

### B. Multi-Model Cross-Checking (Models Checking Models)
Using the "jagged" nature of AI development to my advantage by running a generated draft through two distinct model families (e.g., Claude and ChatGPT) completely exposed individual model blind spots. Forcing one model to grade another on clarity, structure, and evidence provided an objective quality signal that completely eliminated errors.

### C. Explicit Execution Demands
Adding the strict phrase, *"Write and run code, and show me the code you ran"* completely mitigated the silent failure mode during data analysis. Seeing the physical verification code block ensures the output relies on exact mathematical calculation rather than language prediction.

---

## 4. Challenges Faced & Solutions Implemented

### Challenge 1: The AI Over-Agreed with Biased Inquiries (Sycophancy)
* **The Issue:** In trying to explore complex topics, using phrases like *"Don't you think working from home is clearly better...?"* resulted in the model immediately agreeing and echoing my thoughts back to me, creating an echo chamber.
* **The Solution:** I stripped out all emotional or leading phrasing. I pivoted the prompt format to: *"Compare option A and option B. List the strongest arguments for each without declaring a winner."* This forced balanced, high-integrity responses.

### Challenge 2: Trusting AI with Desktop File Systems and Code Operations
* **The Issue:** Managing tasks that interact with local data arrays or environment files can risk accidental data loss or bad automation errors.
* **The Solution:** I internalized the rigorous **"Plan, Don't Act"** safety loop practiced in Concept 11. I modified my workflow to force a strict operational sequence before any file actions run:
  1. Pitch the task.
  2. Ask the tool to write out a step-by-step safe workflow plan.
  3. Review and manually edit the constraints.
  4. Only then issue explicit, tight approval.