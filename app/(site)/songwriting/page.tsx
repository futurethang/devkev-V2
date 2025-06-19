import styles from './page.module.css'

export default function SongwritingPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Songwriting Techniques & Creative Exercises</h1>
        <p className={styles.subtitle}>A comprehensive collection for 20-minute daily sessions</p>
      </header>

      <nav className={styles.toc}>
        <h2>Quick Navigation</h2>
        <ul>
          <li><a href="#quick-start">Quick-Start Techniques (5-10 min)</a></li>
          <li><a href="#traditional">Traditional Methods</a></li>
          <li><a href="#unconventional">Unconventional Approaches</a></li>
          <li><a href="#block-busters">Writer's Block Busters</a></li>
          <li><a href="#daily-rotation">Daily Exercise Schedule</a></li>
          <li><a href="#inspiration">Inspiration Triggers</a></li>
          <li><a href="#advanced">Advanced Techniques</a></li>
        </ul>
      </nav>

      <section id="quick-start" className={styles.section}>
        <h2 className={styles.sectionTitle}>🚀 Quick-Start Techniques (5-10 Minutes)</h2>
        
        <div className={styles.technique}>
          <h3>Object Writing</h3>
          <ul>
            <li>Pick a random object in your room</li>
            <li>Set timer for 5-10 minutes</li>
            <li>Write continuously about it using all five senses</li>
            <li>Don't stop writing, even if it's nonsense</li>
            <li>Mine this writing for lyrics later</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>The Title Game</h3>
          <ul>
            <li>Open a book/magazine to random page</li>
            <li>Pick 3-5 interesting words</li>
            <li>Combine them into potential song titles</li>
            <li>Choose one and write a chorus in 10 minutes</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Melody Mumbling</h3>
          <ul>
            <li>Record yourself humming/mumbling for 5 minutes</li>
            <li>No words, just melodic sounds</li>
            <li>Listen back and identify the catchiest parts</li>
            <li>Add words to match the rhythm</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Speed Writing</h3>
          <ul>
            <li>Set timer for 7 minutes</li>
            <li>Write about one emotion without stopping</li>
            <li>No editing, no judgment</li>
            <li>Circle powerful phrases after timer ends</li>
          </ul>
        </div>
      </section>

      <section id="traditional" className={styles.section}>
        <h2 className={styles.sectionTitle}>🎵 Traditional Songwriting Methods</h2>
        
        <div className={styles.technique}>
          <h3>Nashville Number System Exercise</h3>
          <ul>
            <li>Pick a key and write out I-IV-V-vi progression</li>
            <li>Play it in different rhythms for 5 minutes</li>
            <li>Sing different melodies over the same progression</li>
            <li>Record everything, review later</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Verse-Chorus-Bridge Structure</h3>
          <ul>
            <li>Spend 7 minutes on verse (story setup)</li>
            <li>7 minutes on chorus (main message/hook)</li>
            <li>6 minutes on bridge (new perspective)</li>
            <li>Don't perfect, just get ideas down</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Call and Response</h3>
          <ul>
            <li>Write a question in the verse</li>
            <li>Answer it in the chorus</li>
            <li>Create tension and resolution</li>
            <li>10 minutes per section</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Chord Progression Exploration</h3>
          <ul>
            <li>Start with familiar progression</li>
            <li>Change one chord each round</li>
            <li>Sing new melodies over each variation</li>
            <li>Document what emotions each evokes</li>
          </ul>
        </div>
      </section>

      <section id="unconventional" className={styles.section}>
        <h2 className={styles.sectionTitle}>🎨 Unconventional Creative Approaches</h2>
        
        <div className={styles.technique}>
          <h3>Cut-Up Method (Bowie/Burroughs Style)</h3>
          <ul>
            <li>Write stream of consciousness for 10 minutes</li>
            <li>Cut paper into strips with one line each</li>
            <li>Randomly rearrange strips</li>
            <li>Find unexpected word combinations</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Backwards Writing</h3>
          <ul>
            <li>Start with the last line of the song</li>
            <li>Work backwards to the beginning</li>
            <li>Forces unexpected narrative choices</li>
            <li>Great for breaking linear thinking</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Translation Telephone</h3>
          <ul>
            <li>Take famous song lyrics</li>
            <li>Translate to another language and back</li>
            <li>Use the garbled results as inspiration</li>
            <li>Creates fresh perspectives on familiar themes</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Character Perspective</h3>
          <p>Write from viewpoint of:</p>
          <ul>
            <li>Historical figure</li>
            <li>Fictional character</li>
            <li>Inanimate object</li>
            <li>Future/past version of yourself</li>
          </ul>
          <p className={styles.note}>Commit fully to the perspective</p>
        </div>

        <div className={styles.technique}>
          <h3>Constraint Writing</h3>
          <p>Limit yourself to:</p>
          <ul>
            <li>50 most common English words</li>
            <li>Words starting with same letter</li>
            <li>One-syllable words only</li>
            <li>No rhyming allowed</li>
          </ul>
          <p className={styles.note}>Constraints force creativity</p>
        </div>
      </section>

      <section id="block-busters" className={styles.section}>
        <h2 className={styles.sectionTitle}>💥 Writer's Block Busters</h2>
        
        <div className={styles.technique}>
          <h3>The Bad Song Challenge</h3>
          <ul>
            <li>Intentionally write the worst song possible</li>
            <li>Make it cliché, cheesy, terrible</li>
            <li>Often leads to unexpected gems</li>
            <li>Removes perfectionism pressure</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Movement Writing</h3>
          <ul>
            <li>Walk/pace while voice recording</li>
            <li>Dance to instrumental track while writing</li>
            <li>Physical movement unlocks mental flow</li>
            <li>Don't sit still</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Timer Pressure</h3>
          <ul>
            <li>2-minute verse sprint</li>
            <li>3-minute chorus sprint</li>
            <li>1-minute bridge sprint</li>
            <li>No time to overthink</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Dream Journaling</h3>
          <ul>
            <li>Keep notebook by bed</li>
            <li>Capture dream fragments immediately</li>
            <li>Dreams bypass logical censors</li>
            <li>Rich source of imagery</li>
          </ul>
        </div>
      </section>

      <section id="daily-rotation" className={styles.section}>
        <h2 className={styles.sectionTitle}>📅 Daily Exercise Rotation Schedule</h2>
        
        <div className={styles.schedule}>
          <div className={styles.day}>
            <h3>Monday: Melody Focus</h3>
            <ul>
              <li>Melody mumbling (5 min)</li>
              <li>Chord progression exploration (10 min)</li>
              <li>Record all ideas (5 min)</li>
            </ul>
          </div>

          <div className={styles.day}>
            <h3>Tuesday: Lyric Mining</h3>
            <ul>
              <li>Object writing (10 min)</li>
              <li>Cut-up method (10 min)</li>
            </ul>
          </div>

          <div className={styles.day}>
            <h3>Wednesday: Structure Day</h3>
            <ul>
              <li>Nashville numbers (5 min)</li>
              <li>Verse-Chorus-Bridge sprint (15 min)</li>
            </ul>
          </div>

          <div className={styles.day}>
            <h3>Thursday: Unconventional Day</h3>
            <ul>
              <li>Character perspective (10 min)</li>
              <li>Constraint writing (10 min)</li>
            </ul>
          </div>

          <div className={styles.day}>
            <h3>Friday: Block Buster Day</h3>
            <ul>
              <li>Bad song challenge (10 min)</li>
              <li>Movement writing (10 min)</li>
            </ul>
          </div>

          <div className={styles.day}>
            <h3>Saturday: Integration Day</h3>
            <ul>
              <li>Combine week's best ideas (20 min)</li>
            </ul>
          </div>

          <div className={styles.day}>
            <h3>Sunday: Free Play</h3>
            <ul>
              <li>Any technique that calls to you</li>
              <li>Or invent your own</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="inspiration" className={styles.section}>
        <h2 className={styles.sectionTitle}>✨ Inspiration Triggers</h2>
        
        <div className={styles.technique}>
          <h3>Photo Prompts</h3>
          <ul>
            <li>Random image from phone</li>
            <li>Write the story behind it</li>
            <li>Describe emotions it evokes</li>
            <li>10 minutes max</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Memory Triggers</h3>
          <ul>
            <li>Specific sensory memories</li>
            <li>"First time I..." prompts</li>
            <li>Childhood perspectives</li>
            <li>Emotional archeology</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Word Association Chains</h3>
          <ul>
            <li>Start with one word</li>
            <li>Write associated words rapidly</li>
            <li>Find unexpected connections</li>
            <li>Build lyrics from chain</li>
          </ul>
        </div>
      </section>

      <section id="advanced" className={styles.section}>
        <h2 className={styles.sectionTitle}>🎯 Advanced Techniques</h2>
        
        <div className={styles.technique}>
          <h3>Prosody Practice</h3>
          <ul>
            <li>Match word rhythms to meaning</li>
            <li>Long notes for "long" concepts</li>
            <li>Short notes for urgency</li>
            <li>Melodic shape mirrors meaning</li>
          </ul>
        </div>

        <div className={styles.technique}>
          <h3>Genre Jumping</h3>
          <p>Write same idea as:</p>
          <ul>
            <li>Country story song</li>
            <li>Pop hook anthem</li>
            <li>Folk narrative</li>
            <li>Hip-hop wordplay</li>
          </ul>
          <p className={styles.note}>Find your natural voice</p>
        </div>

        <div className={styles.technique}>
          <h3>Collaborative Solo</h3>
          <ul>
            <li>Write one line</li>
            <li>Respond as different personality</li>
            <li>Continue alternating</li>
            <li>Creates internal collaboration</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🆘 Quick Reference: When You're Stuck</h2>
        
        <div className={styles.quickRef}>
          <div className={styles.problem}>
            <h3>Feeling Emotionally Flat?</h3>
            <p>→ Try Movement Writing or Memory Triggers</p>
          </div>

          <div className={styles.problem}>
            <h3>Melody Block?</h3>
            <p>→ Use Melody Mumbling or Chord Exploration</p>
          </div>

          <div className={styles.problem}>
            <h3>Lyrical Drought?</h3>
            <p>→ Object Writing or Cut-Up Method</p>
          </div>

          <div className={styles.problem}>
            <h3>Structural Problems?</h3>
            <p>→ Backwards Writing or Timer Pressure</p>
          </div>

          <div className={styles.problem}>
            <h3>Need Fresh Perspective?</h3>
            <p>→ Character Perspective or Genre Jumping</p>
          </div>

          <div className={styles.problem}>
            <h3>Perfectionism Paralysis?</h3>
            <p>→ Bad Song Challenge or Speed Writing</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>💡 Bonus Tips for 20-Minute Sessions</h2>
        
        <div className={styles.tips}>
          <ol>
            <li>Always record everything (phone voice memos work)</li>
            <li>Don't judge during creation time</li>
            <li>Edit in separate sessions</li>
            <li>Keep a "snippet journal" for unused ideas</li>
            <li>Set up your space before starting</li>
            <li>Use airplane mode to avoid distractions</li>
            <li>Same time daily builds habit</li>
            <li>End mid-idea to ease next day's start</li>
            <li>Celebrate small wins</li>
            <li>Track which techniques work best for you</li>
          </ol>
        </div>
      </section>

      <footer className={styles.footer}>
        <p><strong>Remember:</strong> The goal is consistency, not perfection. Twenty minutes daily beats four hours weekly. These techniques are tools - use what works, modify what doesn't, invent your own. The best technique is the one that keeps you writing.</p>
        <p className={styles.update}>Keep this guide handy and refer to it whenever you need a fresh approach. Update it with your own discoveries. Your future songwriter self will thank you.</p>
      </footer>
    </div>
  )
}