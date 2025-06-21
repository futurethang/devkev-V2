import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { allProjects } from 'content-collections'
import { MDXContent } from '@/app/_components/MDXContent'
import styles from './page.module.css'

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return allProjects.map((project) => ({
    slug: project.slug,
  }))
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = allProjects.find((project) => project.slug === slug)
  
  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      type: 'article',
      publishedTime: project.date,
      tags: project.tags,
    },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = allProjects.find((project) => project.slug === slug)

  if (!project) {
    notFound()
  }

  return (
    <article className={styles.container}>
      <header className={styles.header}>
        <div className={styles.meta}>
          <time dateTime={project.date} className={styles.date}>
            {format(new Date(project.date), 'MMMM dd, yyyy')}
          </time>
          <div className={styles.badges}>
            {project.aiAssisted && (
              <span className={styles.aiBadge}>🤖 AI-Assisted</span>
            )}
            {project.featured && (
              <span className={styles.featuredBadge}>Featured</span>
            )}
          </div>
        </div>

        <h1 className={styles.title}>{project.title}</h1>
        <p className={styles.description}>{project.description}</p>

        <div className={styles.projectMeta}>
          {project.buildTime && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Build Time</span>
              <span className={styles.metaValue}>{project.buildTime}</span>
            </div>
          )}
          
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Tags</span>
            <div className={styles.tags}>
              {project.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.links}>
          {project.liveUrl && (
            <a 
              href={project.liveUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.primaryLink}
            >
              🔗 View Live Demo
            </a>
          )}
          {project.githubUrl && (
            <a 
              href={project.githubUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.secondaryLink}
            >
              📱 View Source
            </a>
          )}
        </div>
      </header>

      <div className={styles.content}>
        <MDXContent content={project} />
      </div>

      <footer className={styles.footer}>
        <Link href="/projects" className={styles.backLink}>
          ← Back to Projects
        </Link>
      </footer>
    </article>
  )
}