'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import styles from './Header.module.css'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className={styles.header} role="banner">
      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.container}>
          <Link href="/" className={styles.logo} aria-label="Kevin Hyde - Home">
            <span className={styles.name}>Kevin Hyde</span>
            <span className={styles.title}>AI-Augmented Product Engineer</span>
          </Link>
          
          <div className={styles.rightSection}>
            {/* Desktop Navigation */}
            <ul className={styles.navList}>
              <li><Link href="/projects" className={styles.navLink}>Projects</Link></li>
              <li><Link href="/lab" className={styles.navLink}>Lab</Link></li>
              <li><Link href="/blog" className={styles.navLink}>Blog</Link></li>
              <li><Link href="/digest" className={styles.navLink}>AI Digest</Link></li>
              <li><Link href="/test-suite" className={styles.navLink}>Tests</Link></li>
              <li><Link href="/about" className={styles.navLink}>About</Link></li>
            </ul>
            
            {/* Mobile Menu Button */}
            <button
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerLineOpen : ''}`}></span>
              <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerLineOpen : ''}`}></span>
              <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerLineOpen : ''}`}></span>
            </button>
            
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <ul className={styles.mobileNavList}>
            <li><Link href="/projects" className={styles.mobileNavLink} onClick={closeMobileMenu}>Projects</Link></li>
            <li><Link href="/lab" className={styles.mobileNavLink} onClick={closeMobileMenu}>Lab</Link></li>
            <li><Link href="/blog" className={styles.mobileNavLink} onClick={closeMobileMenu}>Blog</Link></li>
            <li><Link href="/digest" className={styles.mobileNavLink} onClick={closeMobileMenu}>AI Digest</Link></li>
            <li><Link href="/test-suite" className={styles.mobileNavLink} onClick={closeMobileMenu}>Tests</Link></li>
            <li><Link href="/about" className={styles.mobileNavLink} onClick={closeMobileMenu}>About</Link></li>
          </ul>
        </div>
      </nav>
    </header>
  )
}