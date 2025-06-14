import styles from './Footer.module.css'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.copyright}>
            © {currentYear} Kevin Hyde. Built with AI-first development.
          </p>
          <nav aria-label="Social links">
            <ul className={styles.socialLinks}>
              <li>
                <a 
                  href="https://github.com/kevinhyde" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="GitHub profile"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a 
                  href="https://linkedin.com/in/kevinhyde" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="LinkedIn profile"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a 
                  href="mailto:contact@kevinhyde.com"
                  className={styles.socialLink}
                  aria-label="Email contact"
                >
                  Email
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}