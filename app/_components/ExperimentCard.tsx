import Link from 'next/link'
import { format } from 'date-fns'
import type { Experiment } from 'contentlayer/generated'
import styles from './ExperimentCard.module.css'

interface ExperimentCardProps {
  experiment: Experiment
}

export function ExperimentCard({ experiment }: ExperimentCardProps) {
  return (
    <article className={styles.card}>
      <Link href={experiment.url as any} className={styles.link}>
        <header className={styles.header}>
          <div className={styles.meta}>
            <time dateTime={experiment.date} className={styles.date}>
              {format(new Date(experiment.date), 'MMM dd')}
            </time>
            <span className={styles.experimentBadge}>Experiment</span>
          </div>
          
          <h3 className={styles.title}>{experiment.title}</h3>
          <p className={styles.description}>{experiment.description}</p>
        </header>

        <div className={styles.content}>
          <div className={styles.tags}>
            {experiment.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>

          {experiment.buildPrompt && (
            <div className={styles.prompt}>
              <span className={styles.promptLabel}>Built with prompt:</span>
              <p className={styles.promptText}>"{experiment.buildPrompt}"</p>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.links}>
            {experiment.demoUrl && (
              <span className={styles.linkText}>🎯 Demo</span>
            )}
            {experiment.sourceUrl && (
              <span className={styles.linkText}>📂 Source</span>
            )}
          </div>
          <span className={styles.readMore}>Explore →</span>
        </footer>
      </Link>
    </article>
  )
}