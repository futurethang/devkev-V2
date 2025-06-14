import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header} role="banner">
      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.container}>
          <Link href="/" className={styles.logo} aria-label="Kevin Hyde - Home">
            <span className={styles.name}>Kevin Hyde</span>
            <span className={styles.title}>AI-Augmented Product Engineer</span>
          </Link>
          
          <div className={styles.rightSection}>
            <ul className={styles.navList}>
              <li><Link href="/projects" className={styles.navLink}>Projects</Link></li>
              <li><Link href="/lab" className={styles.navLink}>Lab</Link></li>
              <li><Link href="/blog" className={styles.navLink}>Blog</Link></li>
              <li><Link href="/dashboard" className={styles.navLink}>Dashboard</Link></li>
              <li><Link href="/about" className={styles.navLink}>About</Link></li>
            </ul>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  )
}