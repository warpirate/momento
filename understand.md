# Momento - AI-Powered Personal Diary App
## Deep Concept Document for Development

---

## 🎯 **Core Vision**

We're building a **personal companion app** that transforms traditional journaling into an intelligent, insightful experience. This is NOT a chatbot. This is NOT an AI assistant you talk to. This is a **digital diary that happens to have a brain**.

**The User Experience:**
- Users write freely throughout their day, just like in a physical diary
- No structure, no forms, no forced fields - pure, natural expression
- AI works silently in the background, invisible but powerful
- Days later, users discover patterns they never noticed
- Memories resurface at perfect moments
- The app becomes more valuable the longer you use it

**The Magic:**
Users feel like they're just journaling, but they're actually building a **second brain** that understands them deeply.

---

## 🧠 **The Philosophy: Invisible Intelligence**

### **What Makes This Different**

**Traditional Diary Apps:**
- Empty notebook metaphor
- Manual categorization and tagging
- Search by keyword only
- No insights, just storage

**AI Chatbot Journals:**
- Conversational AI prompts you
- Feels like therapy session
- Interrupts natural flow
- Feels transactional

**Momento (Our Approach):**
- Write naturally, as you would in a physical diary
- AI observes and learns silently
- Discovers patterns you'd never notice manually
- Surfaces memories at meaningful moments
- Feels like magic, not technology

### **The User Journey Arc**

**Week 1: "It's just a diary"**
- User writes a few entries
- Sees basic metrics extracted
- Thinks: "Nice, it saved my sleep hours"

**Week 2-4: "Oh, this is smart"**
- AI starts finding patterns
- "You sleep better after evening walks"
- User gets first "On This Day" memory
- Streak counter becomes motivating

**Month 2-3: "I can't live without this"**
- Deep insights emerge
- Correlations between mood, activities, sleep
- Search becomes incredibly powerful
- Monthly reports feel like self-therapy
- User realizes: "This app knows me"

**6 Months+: "This is my life's archive"**
- Years of memories organized intelligently
- Photo timelines tell your story
- Patterns reveal personal growth
- Becomes irreplaceable life documentation

---

## 🎨 **Design Philosophy**

### **Visual Design Principles**

**Minimalism with Warmth**
- Clean, uncluttered interfaces
- Warm color palette (not cold tech blue)
- Generous white space
- Soft shadows, no harsh edges
- Typography that feels personal (not corporate)

**Information Hierarchy**
- Most important: Your words (the entries)
- Secondary: Time and context
- Tertiary: Metrics and AI insights
- Background: Everything else

**Emotional Design**
- Every interaction should feel personal
- Success states celebrate you (confetti, warm messages)
- Empty states are encouraging, never judgy
- Loading states are optimistic ("Finding patterns...")
- Error states are gentle and helpful

### **Interaction Design**

**Entry Creation Flow**
```
Open app → Immediately ready to write
No "What would you like to do?"
No "Choose entry type"
Just: cursor blinking, ready for your thoughts
```

**The 3-Second Rule**
- Any action should complete in < 3 seconds
- Entry saved? Instant (local first)
- Want to add photo? 1 tap → camera → capture → done
- Voice note? Hold button → speak → release → saved

**Micro-Interactions**
- Gentle haptic feedback when saving
- Smooth animations when cards appear
- Satisfying "streak achieved" animation
- Progress rings that fill smoothly
- Photos that fade in gracefully

### **Content Presentation**

**Entry Display**
```
NOT like this:                 YES like this:
┌─────────────────┐           ┌─────────────────┐
│ [Sleep: 7/10]   │           │ Morning thoughts│
│ [Mood: Happy]   │           │                 │
│ [Energy: 8/10]  │           │ Woke up feeling │
│                 │           │ refreshed after │
│ Entry text here │           │ great sleep...  │
│                 │           │                 │
│ #workout #happy │           │ 7:30 AM • 😊    │
└─────────────────┘           └─────────────────┘
                               ↓ tap for details
                              [AI extracted: 
                               7hrs sleep, happy mood]
```

The entry text is ALWAYS primary. Metadata is subtle, discoverable, never intrusive.

---

## 🤖 **AI Intelligence Architecture**

### **The AI's Role: Silent Observer, Insightful Friend**

The AI should feel like:
- A thoughtful friend who notices things about you
- A personal researcher studying your patterns
- A librarian organizing your memories
- A mirror reflecting insights back to you

The AI should NEVER feel like:
- A robot analyzing data
- A therapist interrogating you
- A teacher grading your entries
- A surveillance system judging you

### **AI Processing Layers**

**Layer 1: Immediate Extraction (< 5 seconds after save)**
```
User writes: "Slept terribly, only 4 hours. Dragged myself to gym anyway."

AI extracts immediately:
- Sleep: 4 hours, quality: 2/10 (inferred from "terribly")
- Workout: Yes, morning (inferred from "anyway" = determination)
- Mood: Tired but determined (sentiment analysis)
- Energy: Low (3/10, inferred from "dragged")

User sees: Entry saved ✓
Behind scenes: All metrics extracted and stored
```

**Layer 2: Contextual Analysis (within 1 hour, background)**
```
AI considers:
- User's typical sleep pattern
- Recent stress mentions
- Workout consistency
- Mood trends this week

AI realizes:
- This is 3 hours less than user's average
- User mentioned work stress yesterday
- User hasn't skipped workout despite poor sleep (positive pattern)

AI stores: "Resilience moment" tag
```

**Layer 3: Pattern Detection (weekly, deep analysis)**
```
AI analyzes 30-90 days of entries:

Discovers:
"User sleeps 2 hours better on days with:
 - Evening yoga (85% correlation, 12 data points)
 - No coffee after 2pm (78% correlation, 18 data points)
 - Social interaction (72% correlation, 15 data points)"

"User's mood improves significantly after:
 - Morning workouts (91% correlation, 24 data points)
 - Outdoor time (83% correlation, 19 data points)"

"User mentions anxiety most on:
 - Sunday evenings (anticipatory work stress)
 - Before presentations
 - When not exercising regularly"
```

**Layer 4: Predictive Insights (monthly, proactive)**
```
AI notices trends over time:

"Your sleep quality has improved 40% since starting morning workouts 3 months ago"

"You haven't mentioned anxiety in 2 weeks - the longest streak this year. 
 This coincides with daily meditation practice."

"Your energy levels are 25% lower this week. 
 Similar pattern happened in August when you were working on the project deadline."
```

### **AI Personality Guidelines**

**Tone of AI-Generated Text:**
- Warm, supportive, never clinical
- Observational, not judgmental
- Curious, not intrusive
- Celebrating, not patronizing

**Examples:**

❌ **BAD (Too Clinical):**
"Analysis indicates correlation coefficient of 0.85 between physical exercise and positive mood valence."

✅ **GOOD (Warm & Clear):**
"You're happiest on days you work out! We've noticed this pattern 24 times over the past 2 months."

❌ **BAD (Too Intrusive):**
"You seem to be experiencing increased anxiety. You should consider professional help."

✅ **GOOD (Supportive):**
"You've mentioned feeling anxious more often this week. Your entries show that outdoor walks have helped before."

❌ **BAD (Too Patronizing):**
"Great job! You journaled 7 days in a row! You're doing amazing!"

✅ **GOOD (Genuinely Encouraging):**
"7 days strong 🔥 Your consistency is building a valuable archive of memories."

---

## 📊 **Data Architecture Deep Dive**

### **Data Flow: From Thought to Insight**

```
1. USER WRITES
   ↓
   "Had an amazing workout today! 
    Felt so strong doing deadlifts. 
    Sarah joined me and we pushed each other. 
    Grabbed smoothies after. 
    Energy is through the roof!"

2. IMMEDIATE SAVE (Local DB)
   ↓
   Entry saved with timestamp
   User sees: ✓ Saved
   (0.1 seconds)

3. CLOUD SYNC (Background)
   ↓
   Entry uploaded to Firebase
   Photos uploaded to Storage
   (5-30 seconds, user doesn't wait)

4. AI EXTRACTION (Cloud Function triggered)
   ↓
   Gemini analyzes entry:
   
   Extracted Data:
   {
     workout: {
       type: "strength training",
       exercises: ["deadlifts"],
       intensity: 8/10,
       duration: "estimated 60min",
       mood_during: "strong, confident"
     },
     social: {
       people: ["Sarah"],
       activity: "workout together",
       post_activity: "smoothies"
     },
     mood: {
       primary: "excited/energized",
       intensity: 9/10,
       keywords: ["amazing", "strong", "through the roof"]
     },
     energy: {
       level: 9/10,
       time: "post-workout",
       sustained: true
     },
     tags: ["#workout", "#social", "#strength", "#highenergy"],
     themes: ["fitness", "friendship", "personal_growth"],
     sentiment: {
       score: 0.92,
       summary: "Highly positive, social workout experience"
     }
   }

5. CONTEXTUAL ENRICHMENT
   ↓
   AI fetches user's recent entries
   
   Context discovered:
   - Sarah mentioned 3 times this month (friend who motivates)
   - Deadlifts mentioned 5 times (progressive improvement)
   - Post-workout energy consistently high (pattern)
   - Smoothies = social bonding ritual
   
   Enhanced Understanding:
   "Social workouts with Sarah are a strong positive pattern"

6. PATTERN DETECTION (Weekly Job)
   ↓
   Analyzes last 90 days
   
   Patterns Found:
   - "You work out 3x more when with a friend"
   - "Your energy stays elevated for 6+ hours after strength training"
   - "Social activities boost mood by average 2.3 points"
   
7. MEMORY INDEXING
   ↓
   Entry added to:
   - Timeline: November 6, 2025, 9:15 AM
   - People index: Under "Sarah"
   - Activity index: Under "Workouts" > "Strength Training"
   - Mood index: Under "Happy/Energized"
   - Photo gallery: Tagged automatically
   - Search index: All words tokenized and embedded

8. FUTURE SURFACING
   ↓
   Entry will resurface when:
   - "On This Day" (Nov 6, 2026)
   - User searches "Sarah" or "workout" or "deadlifts"
   - User mentions Sarah again (shows "Last time with Sarah...")
   - Monthly report (included in "Best Workout Moments")
   - Pattern insights ("You're happiest when...")
```

### **Database Schema Philosophy**

**Local Database (SQLite/WatermelonDB):**
```
Purpose: Speed and offline capability
Strategy: Full copy of user's data
Sync: Bidirectional with Firebase

Tables:
- entries (raw journal entries)
- media (photos, voice notes)
- analysis (AI-extracted data)
- patterns (discovered insights)
- cache (temporary data)
```

**Cloud Database (Firebase Firestore):**
```
Purpose: Backup, sync, multi-device
Strategy: Source of truth
Structure:

users/
  {userId}/
    profile/
    settings/
    
    entries/
      {entryId}/
        text: "Entry content"
        timestamp: 1699264500000
        media: [...]
        quickRatings: {...}
        
    analysis/
      {entryId}/
        sleep: {...}
        mood: {...}
        extracted: {...}
        processedAt: timestamp
        
    patterns/
      {patternId}/
        type: "SLEEP"
        insight: "You sleep better..."
        confidence: 0.85
        discoveredAt: timestamp
        
    summaries/
      2024-11/
        daily/
          2024-11-06/
        weekly/
          week-45/
        monthly/
          summary: {...}
```

### **Search Architecture**

**The Challenge:**
Natural language search like "when did I last feel anxious about work?"

**The Solution: Multi-Layer Search**

**Layer 1: Keyword Match (Fast)**
```
User searches: "anxious about work"
SQL: SELECT * FROM entries WHERE text LIKE '%anxious%' AND text LIKE '%work%'
Returns: 15 entries in 50ms
```

**Layer 2: Semantic Search (Smart)**
```
Gemini interprets query:
"User wants entries where they felt:
 - Anxious, worried, stressed (mood)
 - About work, job, career, project (context)"

Search expanded:
- Mood: anxious, worried, stressed, nervous, overwhelmed
- Context: work, job, office, meeting, project, deadline, boss

Returns: 23 entries in 200ms (includes semantically similar)
```

**Layer 3: AI Ranking (Relevant)**
```
Gemini ranks results by:
- Sentiment intensity (how anxious?)
- Context relevance (definitely work-related?)
- Recency (recent = more relevant)
- User's typical language patterns

Top 5 results presented, most relevant first
```

**Layer 4: Contextual Understanding (Insightful)**
```
AI also shows:
"You've mentioned work anxiety 8 times in the past 3 months.
 The last time was 2 weeks ago.
 Your coping strategies that worked: 
 - Morning run before work
 - Talking to Sarah
 - Breaking project into smaller tasks"
```

---

## 🎮 **Gamification: The Psychology**

### **Why Gamification Matters**

**The Problem:**
Journaling is a habit, and habits are hard to build. 70% of people who start journaling quit within 2 weeks.

**The Solution:**
Make it intrinsically rewarding through:
- Progress visualization (streaks)
- Achievement recognition (badges)
- Momentum building (don't break the chain)
- Skill development (level up)

**Critical Balance:**
Gamification should feel like **celebration**, not **manipulation**.

### **Streak System Design**

**The Psychology:**
- Streaks create commitment (loss aversion)
- But: Too rigid = anxiety and failure
- Balance: Forgiving yet motivating

**Our Approach:**
```
Streak Mechanics:
- 1 entry per day = streak continues
- Miss a day = streak freezes (not reset!)
- "Freeze tokens" (2 per month) = skip a day without breaking streak
- Longest streak saved separately = always have a "personal best"

Visual Design:
- Fire emoji 🔥 for active streak
- Number grows with satisfaction
- Milestone celebrations: 7, 14, 30, 60, 90, 180, 365 days
- Animations get more impressive with longer streaks

Motivation Messages:
Day 1: "🔥 1 day! You've started something great"
Day 7: "🔥 7 days! You're building a habit"
Day 30: "🔥 30 days! This is powerful"
Day 90: "🔥 90 days! This is who you are now"
Day 365: "🔥 365 days! A full year of your life, documented. Incredible."
```

### **Badge System**

**Philosophy:**
Badges recognize **diversity of engagement**, not just frequency.

**Badge Categories:**

**Consistency Badges:**
- First Entry
- Week Warrior (7 days)
- Month Master (30 days)
- Quarter Champion (90 days)
- Year Legend (365 days)

**Content Badges:**
- Wordsmith (10,000 words written)
- Novelist (50,000 words)
- Photographer (100 photos shared)
- Voice of Reason (50 voice notes)
- Deep Thinker (10 entries > 500 words)

**Insight Badges:**
- Self Aware (viewed insights 10 times)
- Pattern Seeker (discovered 5 patterns)
- Memory Lane (visited memories 20 times)
- Search Master (used search 50 times)

**Life Event Badges:**
- First Workout Logged
- Gratitude Master (50 grateful moments)
- Social Butterfly (mentioned 10 different people)
- World Traveler (entries from 5 cities)

**Special Badges:**
- Night Owl (10 entries after midnight)
- Early Bird (10 entries before 6 AM)
- Renaissance Soul (wrote about 10 different topics)

### **Progress Visualization**

**Daily Completion Ring:**
```
Visual: Circular progress ring
Fills based on "completeness" of today's documentation

Segments:
- Morning entry (25%)
- Physical activity logged (25%)
- Reflection/thoughts (25%)
- Photo/media added (25%)

BUT: No pressure. 1% is still progress.
Message when incomplete: "Every word counts"
Message when complete: "Fully documented! 🌟"
```

**Level System:**
```
XP Sources:
- Write entry: 10 XP
- Add photo: 5 XP
- Voice note: 5 XP
- Fill quick ratings: 2 XP
- Reach daily completion: 20 XP bonus
- Weekly summary: 50 XP bonus

Levels unlock features:
Level 5: Advanced search
Level 10: Custom tags
Level 15: Export features
Level 20: AI-generated reflections
Level 25: Collaboration features

NOT pay-to-win, time-to-unlock = encourages sustained use
```

---

## 🔍 **Memory & Discovery Systems**

### **"On This Day" Feature**

**The Experience:**
```
User opens app on November 6, 2025
Banner at top:
"🎉 On This Day"

Tap to see:
→ November 6, 2024 (1 year ago)
→ November 6, 2023 (2 years ago)
→ Maybe even older if they've been using that long

Each with full entry, photos, AI summary of that day
```

**The Algorithm:**
```
1. Check exact date match (Nov 6)
2. Pull all entries from that date in previous years
3. Rank by:
   - Emotional significance (sentiment score)
   - Media richness (photos make memories vivid)
   - Length/detail (longer = more memorable)
   - Uniqueness (unusual words/events)

4. Present top 3 memories
5. Allow browsing all

6. AI generates contextual intro:
   "A year ago today, you were..."
   "Two years ago, you wrote about..."
```

**Notification Timing:**
```
Send notification at user's typical journaling time
(AI learns when user usually writes)

Example:
If user typically writes at 9 PM,
send "On This Day" notification at 8:45 PM
When they open app to write today's entry,
they first see the memory - creates beautiful continuity
```

### **Contextual Memory Surfacing**

**The Magic:**
AI connects past and present automatically.

**Example Scenario:**
```
User writes today:
"Nervous about tomorrow's presentation at work"

AI immediately (in sidebar or subtle card):
"💭 Familiar feeling?"

Tap to see:
→ Aug 15, 2024: "Nervous about client pitch"
   You wrote: "Ended up going great! Prepared more than I needed to."
   
→ May 3, 2024: "Presentation anxiety kicking in"
   You wrote: "Realized I always feel this way before, and I always do fine."

→ Your pattern: 
   "You've felt this way before 8 presentations.
    All of them went well.
    Your prep routine that works:
    - Practice alone first
    - Good night's sleep
    - Morning workout"
```

**Implementation:**
```
Trigger: User mentions keyword like "presentation", "nervous", "interview"
AI searches: Similar sentiment + context from past
Surfaces: 2-3 most relevant past entries
Adds: Pattern insight if available

Position: Subtle, non-intrusive
- Small card at bottom of entry screen
- "You might find this interesting..."
- Swipe away if not relevant
```

### **Photo Timeline Intelligence**

**The Vision:**
Your photos tell your story.

**Organization:**
```
AI Auto-Tags Photos:
- People (if mentioned in entry)
- Location (if mentioned or GPS data)
- Activity (workout, food, travel, social)
- Mood (happy moments have happy photos)
- Season/weather (beach day, snow day)
- Events (birthday, graduation - detected from context)

Timeline Views:
1. Chronological (classic)
2. By people ("All photos with Sarah")
3. By activity ("All workouts")
4. By location ("All beach entries")
5. By mood ("Happy moments")
6. By season ("Summer 2024")
```

**Memory Collections:**
```
AI Auto-Generates:
- "Your Year in Photos" (December)
- "This Month's Best Moments"
- "Your Fitness Journey" (all workout photos chronologically)
- "Places You've Been" (map view)
- "People Who Matter Most" (most-mentioned people's photos)
```

---

## 🔐 **Privacy & Security: Non-Negotiable Principles**

### **Core Beliefs**

1. **Your diary is sacred**
   - Most personal data imaginable
   - Must be protected absolutely
   - Any breach is catastrophic

2. **Privacy by default**
   - Everything private unless explicitly shared
   - No social features without opt-in
   - No data selling, ever

3. **User control**
   - Export everything anytime
   - Delete everything permanently
   - Control what AI sees

### **Security Architecture**

**Encryption:**
```
At Rest:
- Firebase: Encrypted by default
- Local DB: SQLCipher (encrypted SQLite)
- Media: Encrypted before upload

In Transit:
- All API calls: HTTPS/TLS 1.3
- Firebase: Built-in encryption

End-to-End (Future):
- Option for E2E encryption
- Only user has decryption key
- Trade-off: No cloud AI processing
```

**Authentication:**
```
Methods:
- Email/Password (Firebase Auth)
- Google Sign-In
- Apple Sign-In (required for iOS)
- Biometric (Face ID, Touch ID)

Security:
- 2FA optional but recommended
- Session management
- Device authorization
```

**Data Access Control:**
```
AI Processing:
- Option to disable AI entirely
- Mark entries as "private" (skip AI)
- AI processing logs transparent
- No human ever reads entries

Third-Party:
- Zero third-party SDKs with data access
- Analytics: Anonymous only
- Crash reporting: No personal data
```

**GDPR/Privacy Compliance:**
```
User Rights:
- Right to access: Export everything
- Right to deletion: Delete account = delete all data
- Right to portability: JSON export format
- Right to object: Disable AI processing

Transparency:
- Clear privacy policy (human-readable)
- Audit log of data processing
- No hidden data collection
```

---

## 💰 **Business Model Philosophy**

### **Free vs Premium: The Dilemma**

**The Challenge:**
- AI processing costs money (Gemini API)
- Storage costs money (Firebase/photos)
- We want everyone to journal
- But we need sustainability

**Our Approach: Freemium Done Right**

### **Free Tier (Generous)**

**What's Free:**
- Unlimited text entries (core value)
- Basic AI extraction (sleep, mood, energy)
- 30 days of history access
- 100 photos/month
- Basic insights dashboard
- Search (last 30 days)
- Daily streak
- On This Day (limited)

**Why Generous:**
- Build habit first
- Let users discover value
- Word of mouth growth
- Most users won't hit limits

### **Premium Tier ($4.99/month or $39.99/year)**

**What's Premium:**
- Unlimited AI processing
- Unlimited photo/voice storage
- Full history (forever)
- Advanced pattern detection
- Monthly detailed reports
- Unlimited search (all time)
- Export features (PDF, JSON)
- Priority processing
- Early access to new features
- Custom themes (future)

**Why People Pay:**
- After 30 days, they're hooked
- "I can't lose my memories"
- "The insights are too valuable"
- "I want to support this"

**Pricing Psychology:**
- $4.99/month = Less than coffee
- $39.99/year = 33% savings (encourages annual)
- 7-day free trial of Premium
- Downgrade anytime, keep all data

### **Alternative: Keep It Free**

**If we decide to keep it free:**
- Seeking grant funding (mental health, research)
- Open-source with donations
- Later: Optional paid features (themes, exports)
- Focus on user base first, monetize later

**Why this might be better:**
- No paywall friction
- More users = better AI training
- Goodwill and brand love
- Can monetize differently later (B2B therapist version?)

---

## 🚀 **Launch Strategy**

### **Pre-Launch (Month 1-2)**

**Build Anticipation:**
- Landing page with email signup
- "Join the waitlist" = early access
- Share journey on social media
- Beta testing with 50-100 users
- Iterate based on feedback

**Beta Focus:**
- Test core journaling flow
- Validate AI accuracy
- Measure engagement/retention
- Fix critical bugs
- Gather testimonials

### **Soft Launch (Month 3)**

**Platform:**
- iOS first (if targeting mobile)
- Or Android first (larger market)
- Or both (React Native advantage)

**Strategy:**
- Invite-only for first 1000 users
- Personal onboarding for early users
- Active community (Discord/Slack)
- Weekly updates and improvements
- Build core user base

### **Public Launch (Month 4-5)**

**Channels:**
- Product Hunt launch
- Reddit (r/productivity, r/journaling, r/selfimprovement)
- Hacker News (if tech-focused story)
- Twitter/X (thread about building it)
- Instagram/TikTok (if visual content)
- Blog post: "Why I built this"

**App Store Optimization:**
- Screenshots showing key features
- Video preview (30 seconds)
- Description optimized for keywords
- Regular updates (signals active development)

### **Growth Strategy**

**Organic:**
- Word of mouth (best marketing)
- Social proof (testimonials)
- Content marketing (journaling tips blog)
- SEO (journaling-related keywords)

**Referral Program:**
- "Gift a friend 1 month Premium"
- Both get reward
- Builds community

**Partnerships:**
- Mental health organizations
- Productivity influencers
- Therapy/coaching professionals
- Mindfulness apps

---

## 📈 **Success Metrics: What Matters**

### **North Star Metric**
**Weekly Active Journalers**: Users who write at least 2 entries per week

Why this metric:
- Indicates habit formation
- Predicts long-term retention
- More valuable than DAU (daily pressure is bad for journaling)

### **Key Performance Indicators**

**Engagement:**
- Average entries per user per week
- Average session time
- Insights view rate
- Search usage
- Memory engagement

**Retention:**
- Day 7 retention (critical)
- Day 30 retention (habit formed)
- Day 90 retention (sticky user)
- Churn rate (month-over-month)

**Quality:**
- Average entry length (longer = more engaged)
- Media attachment rate
- AI extraction accuracy
- Pattern discovery rate
- User satisfaction (in-app surveys)

**Conversion:**
- Free-to-Premium conversion rate
- Trial-to-paid conversion
- Annual vs monthly split
- Lifetime value (LTV)
- Churn rate (Premium)

### **Red Flags to Watch**

- Drop in average entry length (users losing interest)
- Decreasing session frequency (habit breaking)
- High Day 7 churn (onboarding failing)
- Low insights engagement (AI not valuable)
- Negative reviews about privacy (critical issue)

---

## 🎓 **User Psychology: Understanding Journalers**

### **Why People Journal**

**Primary Motivations:**
1. **Self-reflection** (60%): Understand themselves better
2. **Memory preservation** (50%): Don't forget important moments
3. **Stress relief** (45%): Process emotions
4. **Goal tracking** (35%): Monitor progress
5. **Gratitude practice** (30%): Cultivate positivity

*(People have multiple motivations)*

### **Why People Stop Journaling**

**Common Barriers:**
1. **Forgot** (40%): Life got busy
2. **Felt like chore** (35%): Too much pressure
3. **Didn't see value** (20%): No benefits perceived
4. **Too time-consuming** (20%): Takes too long
5. **Nothing to write** (15%): Blank page syndrome

### **Our Solutions**

**Against "Forgot":**
- Smart notifications at user's preferred time
- Streaks create accountability
- Widget reminder on home screen

**Against "Felt like chore":**
- No minimum length required
- One sentence is enough
- Voice notes for lazy days
- Quick ratings as fallback

**Against "Didn't see value":**
- Immediate AI extraction shows utility
- Insights appear within weeks
- "On This Day" creates emotional connection
- Monthly reports showcase growth

**Against "Too time-consuming":**
- Mobile-first (journal anywhere)
- Voice notes (faster than typing)
- No editing pressure (just dump thoughts)
- Auto-save (never lose progress)

**Against "Nothing to write":**
- Optional prompts (never forced)
- Review yesterday's entry for inspiration
- Photo-first entry option
- "What made you smile today?" prompt

---

## 🔮 **Future Vision (Year 2-3)**

### **Advanced AI Features**

**Mood Prediction:**
```
AI notices: "Based on your patterns, you might feel 
anxious tomorrow (Sunday evening work anticipation).

Suggestions that have helped:
- Evening walk
- Prepare Monday's to-do list tonight
- Call a friend"
```

**Life Coach Mode:**
```
Monthly AI-generated reflections:
"This month, you overcame [challenge].
Your growth is evident in how you handled [situation].
Consider: [thoughtful question for next month]"
```

**Dream Analysis:**
```
User logs dreams consistently
AI finds patterns in dream themes
Correlates with waking life events
"You dream about flying when feeling empowered"
```

### **Social Features (Optional)**

**Shared Journals:**
- Couple's journal (two people, one diary)
- Family journal (kids growing up)
- Travel journal (group trip)
- Project journal (team working together)

**Private by Default:**
- Must explicitly choose to share
- Granular permissions (what they can see)
- Can always revert to private

**Anonymous Community:**
- Optional: Share insights (not entries)
- "Others with similar patterns found..."
- Support without identifying

### **Health Integration**

**Data Sources:**
- Apple Health / Google Fit
- Sleep tracking apps (AutoSleep)
- Fitness apps (Strava)
- Meditation apps (Headspace)

**Correlations:**
- "Your mood improves with 8+ hours sleep"
- "Heart rate variability drops on stressed days"
- "Meditation correlates with journal positivity"

### **Enterprise/Therapy Version**

**For Therapists:**
- Clients journal between sessions
- Therapist sees anonymized insights
- Better informed therapy
- Track progress objectively

**For Researchers:**
- Anonymized, aggregated data
- Mental health research
- Pattern discovery at scale
- User consent required

---

## 🛠️ **Technical Debt & Scalability**

### **Performance at Scale**

**When we have 100,000 users:**

**Database:**
- Firestore: Partitioned by userId (automatic)
- Local DB: Per-device, no scaling issue
- Indexes optimized for common queries
- Archiving old entries (cold storage for 2+ years)

**AI Processing:**
- Queue system for Gemini calls (rate limiting)
- Batch processing during off-peak hours
- Caching common analysis patterns
- Fallback when AI unavailable

**Media Storage:**
- Image compression before upload
- Multiple resolutions (thumbnail, medium, full)
- CDN for fast delivery
- Progressive loading

**Cost Management:**
- Gemini API: ~$0.002-0.01 per entry analysis
- At 100K users, 3 entries/week avg = 1.2M analyses/month
- Budget: ~$12,000-24,000/month for AI alone
- Optimization: Cache similar patterns, batch processing

### **Technical Decisions to Make Early**

**React Native: Expo vs Bare?**
```
Expo Managed:
+ Faster development
+ Easier updates (OTA)
+ Less native complexity
- Limited native modules
- Larger app size

Expo Bare / Bare React Native:
+ Full native access
+ Smaller app size
+ More control
- More complex setup
- Manual native updates

Recommendation: Start with Expo, eject if needed
```

**State Management:**
```
Options:
1. Zustand (simple, lightweight) ← Recommended for MVP
2. Redux Toolkit (powerful, verbose)
3. Jotai/Recoil (atomic, modern)
4. React Query (for server state)

Recommendation: Zustand + React Query combo
- Zustand for local state
- React Query for server sync
```

**Local Database:**
```
Options:
1. AsyncStorage (simple key-value)
2. SQLite (powerful, standard)
3. WatermelonDB (reactive, performant) ← Recommended
4. Realm (sync built-in, but vendor lock)

Recommendation: WatermelonDB
- Built for React Native
- Lazy loading (fast with 10K+ entries)
- Observable queries (reactive UI)
- SQLite under the hood
```

**Navigation:**
```
React Navigation 6:
- Industry standard
- Well documented
- Stack + Tab navigators
- Deep linking support

Structure:
- AuthStack (login, signup, forgot password)
- MainTabs (Journal, Insights, Search, Profile)
- Modal stack (New Entry, Settings)
```

---

## 🧪 **Testing Strategy**

### **Testing Philosophy**

**What to Test:**
1. Business logic (extraction, patterns, calculations)
2. User flows (critical paths)
3. Edge cases (offline, errors, empty states)
4. AI integration (mock responses)

**What NOT to Over-Test:**
1. UI styling (visual regression is enough)
2. Third-party libraries (they test themselves)
3. Firebase internals (trust the SDK)

### **Test Types**

**Unit Tests (Jest):**
```
Target: Pure functions, utilities, business logic
Coverage goal: 80%+

Examples:
- Date formatting functions
- Streak calculation logic
- Entry validation
- Pattern detection algorithms
- Search query parsing
```

**Integration Tests (Testing Library):**
```
Target: Component interactions, stores, API calls
Coverage goal: Critical paths

Examples:
- Entry creation flow (write → save → sync)
- Authentication flow (login → token → redirect)
- Search flow (query → results → detail)
```

**E2E Tests (Detox):**
```
Target: Full user journeys, real device
Coverage goal: Happy paths only

Examples:
- New user signup → first entry → saves
- Existing user → writes entry → sees in timeline
- User → opens insights → views pattern
```

**Manual Testing Checklist:**
```
Before each release:
□ Fresh install flow
□ Upgrade from previous version
□ Offline mode behavior
□ Poor network conditions
□ Background/foreground transitions
□ Push notification interaction
□ Deep link handling
□ Various screen sizes
□ Dark mode
□ Accessibility (VoiceOver/TalkBack)
```

---

## 📱 **Platform-Specific Considerations**

### **iOS Specifics**

**Requirements:**
- iOS 14+ (balance reach vs features)
- iPhone only initially (iPad later)
- Face ID / Touch ID integration
- iCloud Keychain for secure storage
- Apple Sign-In required (App Store rule)

**Design:**
- Follow Human Interface Guidelines
- SF Symbols for icons
- Native feel (bounce, haptics)
- Swipe gestures where appropriate
- Dynamic Type support

**App Store:**
- Privacy labels (accurate and complete)
- Health data integration requires review
- Subscriptions require clear UX
- Review guidelines compliance

### **Android Specifics**

**Requirements:**
- Android 8+ (API 26) - covers 95%+ devices
- Material Design 3 / Material You
- Google Sign-In integration
- Biometric API for fingerprint

**Design:**
- Follow Material Design guidelines
- Adaptive icons
- Edge-to-edge design
- Back gesture handling
- Various screen sizes and densities

**Play Store:**
- Data safety section (accurate)
- Target API level (latest required)
- App Bundle format (smaller downloads)
- In-app purchases compliance

### **Cross-Platform Consistency**

**Same across platforms:**
- Core functionality
- Data models
- Business logic
- AI features
- Content

**Platform-specific:**
- Navigation patterns (iOS back swipe, Android back button)
- Typography (SF Pro vs Roboto)
- Icons (SF Symbols vs Material Icons)
- System integrations (Share sheet, widgets)
- Notifications appearance

---

## 🎨 **Brand & Identity**

### **App Name: Momento**

**Why this name:**
- "Momento" = moment (Latin/Italian/Spanish)
- Easy to pronounce globally
- Memorable and unique
- Captures the essence (documenting moments)
- Available domains likely
- Sounds personal, not corporate

**Alternatives considered:**
- Reverie (too hard to spell)
- Chronicle (too formal)
- Reflect (too common)
- Companion (too generic)

### **Brand Voice**

**Personality:**
- Warm friend, not cold robot
- Encouraging, not pushy
- Curious, not intrusive
- Wise, not preachy
- Playful, not childish

**Example copy:**

*Empty state (no entries yet):*
❌ "No entries found. Create your first entry."
✅ "Your story starts here. What's on your mind?"

*Streak achievement:*
❌ "Congratulations! You have achieved a 7-day streak!"
✅ "7 days of showing up for yourself 🔥"

*AI insight:*
❌ "Analysis indicates correlation between exercise and mood improvement."
✅ "Here's something interesting: you seem happiest on days you move your body."

*Error message:*
❌ "Error: Failed to save entry. Please try again."
✅ "Hmm, that didn't save. We'll keep trying, and your words are safe locally."

### **Visual Identity**

**Color Palette:**
```
Primary: Warm coral/salmon (#FF6B6B) - energy, warmth
Secondary: Soft teal (#4ECDC4) - calm, balance
Background: Warm white (#FFF9F5) - not cold white
Text: Warm dark (#2D3436) - not pure black
Accent: Golden yellow (#FFE66D) - highlights, celebrations

Dark mode:
Background: Soft black (#1A1A2E)
Surface: Dark blue-gray (#16213E)
Text: Off-white (#E8E8E8)
```

**Typography:**
```
Headlines: Poppins (friendly, modern)
Body: Inter (readable, neutral)
Monospace: JetBrains Mono (code, if needed)

Sizes:
- Title: 28sp bold
- Headline: 22sp semibold
- Body: 16sp regular
- Caption: 14sp regular
- Small: 12sp regular
```

**Iconography:**
- Rounded, friendly icons
- Consistent stroke width
- Filled for active states
- Outlined for inactive
- Custom icons for key features (streak fire, insight lightbulb)

**App Icon:**
```
Concept: Stylized book/journal with warm glow
- Simple, recognizable at small sizes
- Warm colors (coral background)
- Subtle texture/depth
- Works on light and dark backgrounds
- Adaptive icon for Android
```

---

## 📋 **Development Checklist (For Cursor)**

### **Phase 1: Foundation (Week 1-2)**

**Project Setup:**
- [ ] Initialize React Native project (Expo recommended)
- [ ] Configure TypeScript
- [ ] Set up ESLint + Prettier
- [ ] Initialize Git repository
- [ ] Create folder structure
- [ ] Set up environment variables

**Core Dependencies:**
- [ ] Install React Navigation
- [ ] Install Zustand (state management)
- [ ] Install React Query (server state)
- [ ] Install React Native Paper (UI)
- [ ] Install Reanimated (animations)
- [ ] Configure Firebase SDK

**Basic Screens (Placeholder):**
- [ ] Auth: Login, Signup, Forgot Password
- [ ] Main: Timeline, New Entry, Entry Detail
- [ ] Insights: Dashboard (placeholder)
- [ ] Profile: Settings

**Navigation Setup:**
- [ ] Auth stack
- [ ] Main tab navigator
- [ ] Modal stack for entry creation

### **Phase 2: Core Features (Week 3-4)**

**Authentication:**
- [ ] Email/password auth (Firebase)
- [ ] Google Sign-In
- [ ] Apple Sign-In (iOS)
- [ ] Auth state persistence
- [ ] Logout functionality

**Entry System:**
- [ ] Entry creation screen (text input)
- [ ] Save to local database (WatermelonDB/SQLite)
- [ ] Entry list (Timeline)
- [ ] Entry detail view
- [ ] Edit entry
- [ ] Delete entry (with confirmation)

**Data Sync:**
- [ ] Firebase Firestore setup
- [ ] Sync entries to cloud
- [ ] Handle offline → online transition
- [ ] Conflict resolution (last write wins)

### **Phase 3: AI Integration (Week 5-6)**

**Gemini Setup:**
- [ ] Firebase Cloud Function for AI processing
- [ ] Gemini API integration
- [ ] Entry analysis prompt engineering
- [ ] Parse AI response to structured data

**Processing Pipeline:**
- [ ] Trigger analysis on entry save
- [ ] Store analysis results
- [ ] Display extracted metrics in UI
- [ ] Handle AI failures gracefully

**Basic Insights:**
- [ ] Show sleep/mood/energy for each entry
- [ ] Simple weekly stats
- [ ] Pattern placeholder

### **Phase 4: Enhanced Features (Week 7-8)**

**Media Support:**
- [ ] Photo picker integration
- [ ] Camera capture
- [ ] Voice recording
- [ ] Media upload to Firebase Storage
- [ ] Display media in entries

**Quick Ratings:**
- [ ] Mood emoji picker
- [ ] Energy slider
- [ ] Sleep rating

**Streak & Gamification:**
- [ ] Streak counter logic
- [ ] Streak display (fire emoji)
- [ ] Streak persistence
- [ ] Basic milestone celebrations

### **Phase 5: Polish (Week 9-10)**

**Insights Dashboard:**
- [ ] Weekly summary card
- [ ] Sleep chart (line graph)
- [ ] Mood distribution
- [ ] AI patterns display

**Memories:**
- [ ] "On This Day" feature
- [ ] Photo timeline view
- [ ] Memory notifications

**Search:**
- [ ] Basic text search
- [ ] Search results display
- [ ] Filter by date range

**Final Polish:**
- [ ] Loading states (skeletons)
- [ ] Empty states (friendly messages)
- [ ] Error handling (graceful)
- [ ] Animations (smooth transitions)
- [ ] Dark mode support
- [ ] App icon & splash screen

### **Phase 6: Testing & Launch (Week 11-12)**

**Testing:**
- [ ] Unit tests for critical logic
- [ ] Manual testing on real devices
- [ ] Beta testing (TestFlight / Internal Testing)
- [ ] Bug fixes

**Launch Prep:**
- [ ] App Store assets (screenshots, description)
- [ ] Play Store assets
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Analytics integration
- [ ] Crash reporting setup

---

## 💡 **Key Technical Decisions Summary**

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Framework | React Native (Expo) | Cross-platform, fast iteration |
| Language | TypeScript | Type safety, better DX |
| State | Zustand + React Query | Simple, powerful combo |
| Local DB | WatermelonDB | Performant, reactive |
| Backend | Firebase | Fast setup, scales well |
| AI | Gemini via Cloud Functions | Secure, rate-limited |
| UI Library | React Native Paper | Material Design, customizable |
| Navigation | React Navigation 6 | Industry standard |
| Animations | Reanimated 2 | Native performance |
| Testing | Jest + Detox | Unit + E2E coverage |

---

## 🎯 **Success Definition**

### **MVP Success (3 months)**
- 1,000 beta users
- 70% Day-7 retention
- Average 3 entries/user/week
- AI extraction accuracy > 85%
- < 1% crash rate
- 4.0+ star rating in testing

### **Product-Market Fit (6 months)**
- 10,000 active users
- 50% Day-30 retention
- Growing organically (30%+ from referrals)
- Users saying "I can't live without this"
- Premium conversion > 5%

### **Scale (12 months)**
- 100,000 active users
- Self-sustaining revenue (or funded)
- Platform for expansion (new features)
- Team growth (2-3 additional developers)
- International expansion (localization)

---

## 📚 **Resources for Development**

### **Documentation**
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Gemini AI Docs](https://ai.google.dev/docs)
- [React Navigation](https://reactnavigation.org/)
- [WatermelonDB](https://nozbe.github.io/WatermelonDB/)

### **Design Resources**
- [Material Design 3](https://m3.material.io/)
- [Human Interface Guidelines](https://developer.apple.com/design/)
- [Figma Community](https://www.figma.com/community)

### **Learning Resources**
- [React Native Express](https://www.reactnative.express/)
- [Fireship (YouTube)](https://www.youtube.com/c/Fireship)
- [William Candillon (Reanimated)](https://www.youtube.com/c/wcandillon)

---

## 🚀 **Final Words**

This isn't just another journaling app. This is a **personal life documentation system** that helps users understand themselves better over time.

**The Core Promise:**
"Write naturally. Discover yourself. Remember everything."

**The Technical Challenge:**
Build something that feels simple but is deeply intelligent underneath.

**The Human Challenge:**
Create genuine value without being creepy, pushy, or annoying.

**The Business Challenge:**
Make something people love so much they want to pay for it.

---

**Ready to build Momento. Let's create something meaningful. 🚀**