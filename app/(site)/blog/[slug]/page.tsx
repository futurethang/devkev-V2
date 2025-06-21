import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { allPosts } from 'content-collections'
import { MDXContent } from '@/app/_components/MDXContent'
import styles from './page.module.css'

interface PostPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params
  const post = allPosts.find((post) => post.slug === slug)
  
  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = allPosts.find((post) => post.slug === slug)

  if (!post || !post.published) {
    notFound()
  }

  return (
    <article className={styles.container}>
      <header className={styles.header}>
        <div className={styles.meta}>
          <time dateTime={post.date} className={styles.date}>
            {format(new Date(post.date), 'MMMM dd, yyyy')}
          </time>
          <div className={styles.readingTime}>
            {Math.ceil(post.content.split(' ').length / 200)} min read
          </div>
        </div>

        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.description}>{post.description}</p>

        <div className={styles.tags}>
          {post.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className={styles.content}>
        <MDXContent content={post} />
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.author}>
            <div className={styles.authorInfo}>
              <strong>Kevin Hyde</strong>
              <span>AI-Augmented Product Engineer</span>
            </div>
          </div>
          
          <Link href="/blog" className={styles.backLink}>
            ← Back to Blog
          </Link>
        </div>
      </footer>
    </article>
  )
}