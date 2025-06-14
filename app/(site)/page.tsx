import styles from './page.module.css'

export default function HomePage() {
  return (
    <div className={styles.container}>
      <section className={styles.hero} aria-label="Introduction">
        <h1 className={styles.headline}>
          Building at the speed of thought
          <span className={styles.subheadline}>with AI-first development</span>
        </h1>
        <p className={styles.intro}>
          I'm Kevin Hyde, an AI-Augmented Product Engineer who ships 10x faster by mastering 
          the art of human-AI collaboration. This portfolio showcases my high-velocity 
          development practice and the tools that make it possible.
        </p>
      </section>

      <section className={styles.stats} aria-label="Development metrics">
        <div className={styles.statCard}>
          <span className={styles.statNumber}>50+</span>
          <span className={styles.statLabel}>Projects Shipped</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>80%</span>
          <span className={styles.statLabel}>AI-Assisted Code</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>10x</span>
          <span className={styles.statLabel}>Productivity Gain</span>
        </div>
      </section>

      <section className={styles.preview} aria-label="Content preview">
        <h2 className={styles.sectionTitle}>Latest Work</h2>
        <p className={styles.comingSoon}>Projects loading soon...</p>
      </section>
    </div>
  )
}