# Chapter 5: 80-Question Tiered Pool & Randomized U Gyi Mind Games

A replayable, authentic Myanmar trivia experience for Chapter 5 with a comprehensive 80-question pool across 4 progressive tiers, dynamic 50/50 randomized honest vs. deceptive presenter clues from U Gyi, and duplicate-free checkpoint retry sampling.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during clarification:
> - **U Gyi Clue Psychology**: 50/50 balanced coin toss between honest guidance and persuasive deceptive trick hints. U Gyi acts with identical high confidence in both modes so Pho Htung must weigh his advice critically.
> - **Question Organization**: 80 unique authentic Burmese trivia questions partitioned equally into 4 difficulty tiers (20 Easy, 20 Intermediate, 20 Advanced, 20 Master/Expert). Each 20-question run samples 5 questions per tier.
> - **Checkpoint Resumption**: When Pho Htung is defeated and retries from a tier checkpoint (Q1, Q6, Q11, or Q16), the game draws fresh unseen questions for that tier from the pool so replayed tiers feel distinct and non-repetitive.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms Chapter 5's trivia challenge into a deeply replayable "Quest to a Million Myanmar" contest. The player faces 20 questions drawn from a master repository of 80 questions spanning Myanmar folklore, Bagan dynastic history, classical literature, and traditional riddles.
- **The U Gyi Mind Game**: U Gyi alternates between giving genuinely helpful clues and cunning trap clues designed to mislead Pho Htung toward wrong answers.
- **Fair Progression**: Questions scale in difficulty across 4 distinct checkpoints. If the player exhausts their 3 health strikes and faints, restarting at the tier checkpoint refreshes that tier with new unseen questions from the bank.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Opening Monologue**:
   - U Gyi delivers his dramatic opening speech in a centered mahogany-and-brass modal dialog with progress tracking (`စကားပြော ၁ / ၅`).
   - Pho Htung remains silent. Player can proceed via `[ ဆက်မယ် ▶ ]` or jump straight into the challenge with `[ မေးခွန်းများ စတင်ဖြေဆိုမည် ⚡ ]`.

2. **The 20-Question Tiered Gauntlet**:
   - **Tier 1 (Q1 – Q5) · Basic Tier (`အခြေခံ အဆင့်`)**: Myanmar riddles (`စကားထာ`), foundational proverbs, and seasonal festivals.
   - **Tier 2 (Q6 – Q10) · Intermediate Tier (`အလယ်အလတ် အဆင့်`)**: Bagan monarchs, architectural marvels, and cultural customs.
   - **Tier 3 (Q11 – Q15) · Advanced Tier (`အဆင့်မြင့် အဆင့်`)**: Classical literature, courtly sayings, and ancient historical chronicles.
   - **Tier 4 (Q16 – Q20) · Master/Expert Tier (`ကျွမ်းကျင် အဆင့်`)**: Rare archaic riddles, obscure stone inscriptions, and deep cultural philosophy.

3. **Dynamic Presenter Clue Banner**:
   - Rendered in a royal Bagan wood-and-gold speech ribbon above the arena.
   - U Gyi offers commentary with theatrical flair. On 50% of questions he speaks the truth; on the other 50% he points convincingly to a distractor.

4. **Combat Punishment on Mistakes**:
   - Selecting a wrong answer triggers U Gyi stepping forward to swing his walking stick with both hands (`တုတ်ရိုက်ချက်`).
   - Overhead Bagan wood-and-brass health bar deducts 1 segment with screen shake, hurt flash, and audio crunch (`ဒုန်း! / ခွပ်!`).
   - If health remains ($>0$), the quiz proceeds to the next question.
   - If health reaches 0, Pho Htung collapses, death counter increments, and a Checkpoint Retry dialog offers restart at the current tier with fresh questions.

5. **Prize First Twist & Chapter 6 Teaser**:
   - Conquering Q20 triggers confetti fanfare and U Gyi presenting the glowing "ရွှေမြို့တော်တံခါးဖွင့် ရွှေသော့" (Golden Key).
   - A gleaming treasure pile appears. The player walks Pho Htung toward it using WASD or mouse click.
   - Overlapping the trigger locks controls; U Gyi sneaks behind and strikes Pho Htung down.
   - Instant blackout, 1.5 seconds of dead silence, glowing typewriter reveal, echoing reverberating laugh, and Chapter 6 teaser card.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: 80-Question Tiered Repository vs. Fixed Sets
- **Chosen Approach**: A structured repository of 80 questions (20 per tier). Each playthrough draws 5 non-repeating questions per tier in strict order (Tier 1 $\rightarrow$ Tier 2 $\rightarrow$ Tier 3 $\rightarrow$ Tier 4).
- **Why**: Purely random 20-question sets could mix master-level history with basic riddles. Tiered sampling guarantees smooth, fair difficulty pacing while providing $4 \times 4 \times 4 \times 4 = 256$ initial run combinations and ensuring replayability.
- **Alternatives Considered**: 4 static 20-question sets (A, B, C, D) — rejected because seeing question #3 again on set A makes every checkpoint retry predictable.

### Decision 2: Dual Clues per Question (`honestClue` + `deceptiveClue`)
- **Chosen Approach**: Every question in the repository defines both a truthful clue and a deceptive clue. A runtime pseudo-random coin toss (50/50) selects which clue U Gyi delivers.
- **Why**: Prevents player from simply reversing U Gyi's advice (if he were always wrong, he would effectively be a cheat code). A 50/50 mix forces the player to analyze the question itself.

### Decision 3: Checkpoint Sampling with Unseen Priority
- **Chosen Approach**: The game maintains a `Set<number>` of recently used question IDs in the current session. When retrying at a checkpoint (e.g., Tier 2 at Q6), the generator prioritizes questions from that tier that have not been asked yet.
- **Why**: Keeps retries engaging and rewarding, eliminating the frustration of answering the exact same 5 questions repeatedly after an unlucky defeat.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Chapter 5 Quiz Pipeline                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     80-Question Master Pool                            │
│  ├── Tier 1 (Q1-Q20 Pool): Basic Riddles & Everyday Culture           │
│  ├── Tier 2 (Q21-Q40 Pool): Bagan History & Famous Kings              │
│  ├── Tier 3 (Q41-Q60 Pool): Classical Proverbs & Literature           │
│  └── Tier 4 (Q61-Q80 Pool): Archaic Inscriptions & Philosophy         │
│  Each Question: { question, options[4], correctIndex, honestClue,      │
│                   deceptiveClue, explanation }                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     QuizSessionManager                                 │
│  ├── generateRun(usedIds): 5 from Tier 1 + 5 from Tier 2 +             │
│  │                         5 from Tier 3 + 5 from Tier 4               │
│  ├── refreshTier(tier, usedIds): 5 fresh unused questions for retry   │
│  └── selectClue(question): 50% honestClue / 50% deceptiveClue          │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FinalChapterScene (Phaser)                         │
│  ├── DOM: #quiz-card, #ugyi-speech-box, #opening-dialogue-box         │
│  ├── State: currentRunQuestions[20], currentQIndex (0..19), health (3) │
│  ├── Turn-based walking stick combat animation on mistake              │
│  └── Act IV & V Twist: Key delivery, bait walk, ambush, blackout card  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Interfaces

```typescript
export interface QuizOption {
  label: 'က' | 'ခ' | 'ဂ' | 'ဃ';
  text: string;
}

export interface QuizQuestionData {
  id: number;
  tier: 1 | 2 | 3 | 4;
  tierName: string;
  category: 'စကားထာ' | 'စကားပုံ' | 'ပုဂံသမိုင်း' | 'မြန်မာ့ယဉ်ကျေးမှု' | 'စာပေနှင့် အနုပညာ';
  question: string;
  options: QuizOption[];
  correctIndex: number; // 0..3
  honestClue: string;   // Sincere, truthful tip from U Gyi
  deceptiveClue: string;// Deceptive, tricky suggestion from U Gyi
  explanation: string;
}

export interface ActiveQuizQuestion extends QuizQuestionData {
  activeClue: string;       // Chosen by 50/50 coin toss
  isClueHonest: boolean;
}
```

### File Changes Planned

1. **`src/content/chapter5Quiz.ts`**:
   - Author full pool of 80 authentic, researched Burmese questions across all 4 tiers with both `honestClue` and `deceptiveClue`.
   - Implement `generateQuizRun(historySet?: Set<number>): ActiveQuizQuestion[]`.
   - Implement `refreshTierQuestions(tier: number, historySet: Set<number>): ActiveQuizQuestion[]`.
   - Implement `getCheckpointTier(questionIndex: number): { tier: number, startQIndex: number }`.

2. **`src/scenes/FinalChapterScene.ts`**:
   - Integrate `activeQuestions` array instead of fixed 20-item constant.
   - On new run, generate 20 active questions from the pool.
   - On checkpoint restart, refresh the target tier's 5 questions from unused bank.
   - Display `q.activeClue` in `#ugyi-speech-text`.
