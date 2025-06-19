import styles from './page.module.css'
import { AggregatorWidget } from '../_components/AggregatorWidget'
import { allProjects, allPosts, allExperiments } from 'contentlayer/generated'
import { filterMockContent } from '@/lib/content-utils'
import { ProjectCard } from '@/app/_components/ProjectCard'
import { PostCard } from '@/app/_components/PostCard'
import Link from 'next/link'

export default function HomePage() {
  // Filter out mock content and get featured items
  const projects = filterMockContent(allProjects)
  const posts = filterMockContent(allPosts)
  const experiments = filterMockContent(allExperiments)
  
  // Get featured projects (or latest if no real featured ones)
  const featuredProjects = projects
    .filter(p => p.featured)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
  
  // If no featured projects, just get the latest 3
  const displayProjects = featuredProjects.length > 0 
    ? featuredProjects 
    : projects.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3)
  
  // Get latest posts
  const latestPosts = posts
    .filter(p => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
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
          <span className={styles.statNumber}>10+</span>
          <span className={styles.statLabel}>Years Experience</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{projects.length || '50+'}</span>
          <span className={styles.statLabel}>Projects Shipped</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>10x</span>
          <span className={styles.statLabel}>Productivity with AI</span>
        </div>
      </section>

      <section className={styles.preview} aria-label="Content preview">
        <h2 className={styles.sectionTitle}>Latest Work</h2>
        {displayProjects.length > 0 ? (
          <>
            <div className={styles.projectGrid}>
              {displayProjects.map(project => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
            <Link href="/projects" className={styles.viewAll}>
              View All Projects →
            </Link>
          </>
        ) : (
          <p className={styles.comingSoon}>Real projects coming soon! Check out the mock projects for examples.</p>
        )}
        
        <div className={styles.widgetSection}>
          <h3 className={styles.widgetTitle}>🤖 Live AI Content Aggregator</h3>
          <p className={styles.widgetDescription}>
            Real-time demonstration of the AI-powered content aggregation system built during this project.
          </p>
          <div className={styles.widgets}>
            <AggregatorWidget 
              profileId="ai-product" 
              autoRefresh={true} 
              refreshInterval={60000}
            />
            <AggregatorWidget 
              profileId="ml-engineering" 
              autoRefresh={true} 
              refreshInterval={60000}
            />
            <AggregatorWidget 
              profileId="design-systems" 
              autoRefresh={true} 
              refreshInterval={60000}
            />
          </div>
        </div>
      </section>
    </div>
  )
}