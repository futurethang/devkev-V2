import Link from 'next/link'
import { format } from 'date-fns'
import type { Project } from 'contentlayer/generated'
import styles from './ProjectCard.module.css'

interface ProjectCardProps {
  project: Project
  featured?: boolean
}

export function ProjectCard({ project, featured = false }: ProjectCardProps) {
  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <Link href={project.url as any} className={styles.link}>
        <div className={styles.header}>
          <div className={styles.meta}>
            <time dateTime={project.date} className={styles.date}>
              {format(new Date(project.date), 'MMM dd, yyyy')}
            </time>
            {project.aiAssisted && (
              <span className={styles.aiBadge} title="Built with AI assistance">
                🤖 AI
              </span>
            )}
            {featured && (
              <span className={styles.featuredBadge}>Featured</span>
            )}
          </div>
          
          <h3 className={styles.title}>{project.title}</h3>
          <p className={styles.description}>{project.description}</p>
        </div>

        <div className={styles.content}>
          <div className={styles.tags}>
            {project.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className={styles.tag}>+{project.tags.length - 3}</span>
            )}
          </div>

          <div className={styles.metrics}>
            {project.buildTime && (
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Build Time</span>
                <span className={styles.metricValue}>{project.buildTime}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.links}>
            {project.liveUrl && (
              <span className={styles.linkText}>🔗 Live Demo</span>
            )}
            {project.githubUrl && (
              <span className={styles.linkText}>📱 Source</span>
            )}
          </div>
          <span className={styles.readMore}>Read more →</span>
        </div>
      </Link>
    </article>
  )
}