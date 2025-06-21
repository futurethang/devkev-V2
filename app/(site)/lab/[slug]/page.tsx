import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { allExperiments } from 'content-collections'
import { MDXContent } from '@/app/_components/MDXContent'
import styles from './page.module.css'

interface ExperimentPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return allExperiments.map((experiment) => ({
    slug: experiment.slug,
  }))
}

export async function generateMetadata({ params }: ExperimentPageProps) {
  const { slug } = await params
  const experiment = allExperiments.find((experiment) => experiment.slug === slug)
  
  if (!experiment) {
    return {
      title: 'Experiment Not Found',
    }
  }

  return {
    title: experiment.title,
    description: experiment.description,
    openGraph: {
      title: experiment.title,
      description: experiment.description,
      type: 'article',
      publishedTime: experiment.date,
      tags: experiment.tags,
    },
  }
}

export default async function ExperimentPage({ params }: ExperimentPageProps) {
  const { slug } = await params
  const experiment = allExperiments.find((experiment) => experiment.slug === slug)

  if (!experiment) {
    notFound()
  }

  return (
    <article className={styles.container}>
      <header className={styles.header}>
        <div className={styles.meta}>
          <time dateTime={experiment.date} className={styles.date}>
            {format(new Date(experiment.date), 'MMMM dd, yyyy')}
          </time>
          <span className={styles.experimentBadge}>Lab Experiment</span>
        </div>

        <h1 className={styles.title}>{experiment.title}</h1>
        <p className={styles.description}>{experiment.description}</p>

        {experiment.buildPrompt && (
          <div className={styles.prompt}>
            <h2 className={styles.promptTitle}>Build Prompt</h2>
            <blockquote className={styles.promptText}>
              "{experiment.buildPrompt}"
            </blockquote>
          </div>
        )}

        <div className={styles.experimentMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Tags</span>
            <div className={styles.tags}>
              {experiment.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.links}>
          {experiment.demoUrl && (
            <a 
              href={experiment.demoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.primaryLink}
            >
              🎯 Try Demo
            </a>
          )}
          {experiment.sourceUrl && (
            <a 
              href={experiment.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.secondaryLink}
            >
              📂 View Source
            </a>
          )}
        </div>
      </header>

      <div className={styles.content}>
        <MDXContent content={experiment} />
      </div>

      <footer className={styles.footer}>
        <Link href="/lab" className={styles.backLink}>
          ← Back to Lab
        </Link>
      </footer>
    </article>
  )
}