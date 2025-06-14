import Link from 'next/link'
import { format } from 'date-fns'
import type { Post } from 'contentlayer/generated'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className={styles.card}>
      <Link href={post.url as any} className={styles.link}>
        <header className={styles.header}>
          <time dateTime={post.date} className={styles.date}>
            {format(new Date(post.date), 'MMMM dd, yyyy')}
          </time>
          <h2 className={styles.title}>{post.title}</h2>
          <p className={styles.description}>{post.description}</p>
        </header>

        <div className={styles.content}>
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
          
          <span className={styles.readMore}>
            Read article →
          </span>
        </div>
      </Link>
    </article>
  )
}