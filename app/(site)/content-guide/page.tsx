import styles from './page.module.css'

export default function ContentGuidePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Content Creation Guide</h1>
        <p className={styles.subtitle}>Personal heuristics for overcoming blocks and shipping content</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🎯 Idea Generation Heuristics</h2>
        <div className={styles.content}>
          <div className={styles.heuristic}>
            <h3>The 10-Minute Rule</h3>
            <p><strong>Ask:</strong> "What did I just figure out that took me more than 10 minutes?"</p>
            <p><em>If it took you 10+ minutes, it's worth documenting. Someone else will have the same problem.</em></p>
          </div>
          
          <div className={styles.heuristic}>
            <h3>The Teaching Test</h3>
            <p><strong>Ask:</strong> "What would I explain to a junior developer about this?"</p>
            <p><em>Your explanations to others are already content. Just write them down.</em></p>
          </div>
          
          <div className={styles.heuristic}>
            <h3>The Claude Surprise</h3>
            <p><strong>Ask:</strong> "What did Claude help me with that I didn't expect?"</p>
            <p><em>AI surprises are valuable insights into evolving capabilities.</em></p>
          </div>
          
          <div className={styles.heuristic}>
            <h3>Weekly Failure Review</h3>
            <p><strong>Ask:</strong> "What broke this week and how did I fix it?"</p>
            <p><em>Debugging stories are inherently interesting and useful.</em></p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🚫 Blocker Breakers</h2>
        <div className={styles.content}>
          <div className={styles.blocker}>
            <h3>"I don't know if this is good enough"</h3>
            <ul>
              <li><strong>Value threshold:</strong> Will this save someone 30 minutes? Then ship it.</li>
              <li><strong>Teaching test:</strong> Can you explain it clearly? That's the only quality bar.</li>
              <li><strong>Future you test:</strong> Will you want to reference this in 6 months?</li>
            </ul>
          </div>
          
          <div className={styles.blocker}>
            <h3>"I don't know how long this will take"</h3>
            <ul>
              <li><strong>15-minute rule:</strong> Quick tips, code snippets, single insights</li>
              <li><strong>45-minute rule:</strong> Problem + solution + lesson learned</li>
              <li><strong>90-minute rule:</strong> Full project breakdown with context</li>
              <li><strong>Time box it:</strong> Set a timer and publish whatever you have when it goes off</li>
            </ul>
          </div>
          
          <div className={styles.blocker}>
            <h3>"It's not polished enough"</h3>
            <ul>
              <li><strong>Authenticity beats polish:</strong> Show the messy middle, the iterations, the failures</li>
              <li><strong>Documentation over presentation:</strong> Write for yourself first, others second</li>
              <li><strong>Progress over perfection:</strong> "Here's what I'm figuring out..." is engaging</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>⚡ Quick-Start Templates</h2>
        <div className={styles.content}>
          <div className={styles.template}>
            <h3>Problem-Solution Post (15 min)</h3>
            <div className={styles.templateContent}>
              <p><strong>Opening:</strong> "I ran into [specific problem] while [context]..."</p>
              <p><strong>Solution:</strong> "Here's what worked: [code/approach]"</p>
              <p><strong>Insight:</strong> "The key insight was [learning]"</p>
              <p><strong>Next:</strong> "This could be improved by [future work]"</p>
            </div>
          </div>
          
          <div className={styles.template}>
            <h3>AI-Assisted Build (45 min)</h3>
            <div className={styles.templateContent}>
              <p><strong>Context:</strong> "I needed to build [thing] for [reason]"</p>
              <p><strong>AI Approach:</strong> "I used Claude to [specific task]"</p>
              <p><strong>Surprises:</strong> "What worked better than expected..."</p>
              <p><strong>Learnings:</strong> "Next time I would..."</p>
            </div>
          </div>
          
          <div className={styles.template}>
            <h3>Project Deep Dive (90 min)</h3>
            <div className={styles.templateContent}>
              <p><strong>The Problem:</strong> Why this mattered</p>
              <p><strong>The Approach:</strong> Architecture and decisions</p>
              <p><strong>The Build:</strong> Key implementation details</p>
              <p><strong>The Lessons:</strong> What you'd do differently</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🔥 Motivation Mantras</h2>
        <div className={styles.content}>
          <div className={styles.mantra}>
            <h3>Your Unique Perspective</h3>
            <p>You're building at the intersection of design, engineering, and AI. This combination is rare and valuable. Your perspective on AI-first development is exactly what the community needs.</p>
          </div>
          
          <div className={styles.mantra}>
            <h3>Documentation Compounds</h3>
            <p>Every post you write becomes a reference for future you and others. The value compounds over time. That quick tip today becomes a lifesaver for someone next year.</p>
          </div>
          
          <div className={styles.mantra}>
            <h3>Learning in Public Accelerates Growth</h3>
            <p>Writing about what you're learning forces you to understand it better. Teaching is the best way to learn, and content creation is teaching at scale.</p>
          </div>
          
          <div className={styles.mantra}>
            <h3>Perfect is the Enemy of Published</h3>
            <p>A published imperfect post is infinitely more valuable than a perfect post that never ships. You can always iterate and improve.</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🎮 Content Creation Game</h2>
        <div className={styles.content}>
          <div className={styles.game}>
            <h3>Weekly Challenges</h3>
            <ul>
              <li><strong>Monday:</strong> Document one thing you learned last week</li>
              <li><strong>Wednesday:</strong> Share a code snippet that saved you time</li>
              <li><strong>Friday:</strong> Write about a problem you solved with AI</li>
            </ul>
          </div>
          
          <div className={styles.game}>
            <h3>Content Streaks</h3>
            <ul>
              <li><strong>Day 1-7:</strong> Daily quick tips (build the habit)</li>
              <li><strong>Week 2-4:</strong> Weekly project updates (maintain momentum)</li>
              <li><strong>Month 2+:</strong> Monthly deep dives (sustainable pace)</li>
            </ul>
          </div>
          
          <div className={styles.game}>
            <h3>Idea Bank</h3>
            <p>Keep a running list of content ideas. When inspiration strikes, you can immediately start writing instead of thinking "what should I write about?"</p>
            <ul>
              <li>Claude prompts that changed your workflow</li>
              <li>Design decisions you're proud of</li>
              <li>Bugs that taught you something</li>
              <li>Tools that surprised you</li>
              <li>Patterns you keep reusing</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p><strong>Remember:</strong> You're not writing for everyone. You're writing for someone exactly like you, 6 months ago, who needs to solve the same problem. That person will be incredibly grateful you took the time to share.</p>
      </footer>
    </div>
  )
}