import styles from './page.module.css'

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            <div className={styles.avatarPlaceholder}>
              <span className={styles.initials}>KH</span>
            </div>
          </div>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Kevin Hyde</h1>
            <p className={styles.subtitle}>AI-Augmented Product Engineer</p>
            <p className={styles.location}>Seattle, WA</p>
          </div>
        </div>
      </header>

      <section className={styles.intro}>
        <h2 className={styles.sectionTitle}>About</h2>
        <div className={styles.introContent}>
          <p className={styles.lead}>
            I'm a Seattle-based Design Engineer who uniquely bridges the gap between design and development. 
            Whether you're looking for a developer that "speaks designer" or a designer that "speaks developer", 
            I help What's Possible!™️
          </p>
          <p>
            With expertise spanning from UX research and design to full-stack engineering, I position myself 
            as a professional who can navigate the entire product development lifecycle. My current focus is 
            on leveraging AI as a "multiplier" technology to enhance both design and development workflows, 
            carefully scrutinizing generative output for hallucinations or poor quality while maximizing 
            productivity gains.
          </p>
        </div>
      </section>

      <section className={styles.experience}>
        <h2 className={styles.sectionTitle}>Experience</h2>
        
        <div className={styles.job}>
          <div className={styles.jobHeader}>
            <h3 className={styles.jobTitle}>Sr. UI Engineer</h3>
            <div className={styles.jobMeta}>
              <span className={styles.company}>Voltron Data</span>
              <span className={styles.period}>Feb 2024 - Present</span>
            </div>
          </div>
          <ul className={styles.achievements}>
            <li>Successfully delivered "Test Drive" user interface within aggressive one-month timeline</li>
            <li>Built custom SQL notebook UI solution when third-party integration proved inadequate</li>
            <li>Leading web-based GUI development for enterprise big data query products</li>
          </ul>
        </div>

        <div className={styles.job}>
          <div className={styles.jobHeader}>
            <h3 className={styles.jobTitle}>Sr. UX Engineer</h3>
            <div className={styles.jobMeta}>
              <span className={styles.company}>Swivel Finance</span>
              <span className={styles.period}>2022 - 2024</span>
            </div>
          </div>
          <ul className={styles.achievements}>
            <li>Pioneered front-end development using Web Components in the dynamic DeFi landscape</li>
            <li>Built responsive, accessible interfaces for complex financial protocols</li>
            <li>Collaborated with cross-functional teams to deliver user-centric solutions</li>
          </ul>
        </div>

        <div className={styles.job}>
          <div className={styles.jobHeader}>
            <h3 className={styles.jobTitle}>UX Engineer II</h3>
            <div className={styles.jobMeta}>
              <span className={styles.company}>Cisco</span>
              <span className={styles.period}>2020 - 2022</span>
            </div>
          </div>
          <ul className={styles.achievements}>
            <li>Optimized modular design system libraries and built standards-compliant Web Components</li>
            <li>Enhanced developer experience through improved component APIs and documentation</li>
            <li>Contributed to enterprise-scale design system adoption across multiple product teams</li>
          </ul>
        </div>

        <div className={styles.job}>
          <div className={styles.jobHeader}>
            <h3 className={styles.jobTitle}>Course Instructor</h3>
            <div className={styles.jobMeta}>
              <span className={styles.company}>University of Washington</span>
              <span className={styles.period}>2019 - 2021</span>
            </div>
          </div>
          <ul className={styles.achievements}>
            <li>Taught Full Stack Web Development to aspiring developers</li>
            <li>Designed curriculum covering modern web technologies and best practices</li>
            <li>Mentored students through hands-on projects and career development</li>
          </ul>
        </div>
      </section>

      <section className={styles.skills}>
        <h2 className={styles.sectionTitle}>Skills & Expertise</h2>
        
        <div className={styles.skillGroups}>
          <div className={styles.skillGroup}>
            <h3 className={styles.skillGroupTitle}>Technical Skills</h3>
            <ul className={styles.skillList}>
              <li>React & TypeScript</li>
              <li>Web Components</li>
              <li>Node.js & Python</li>
              <li>HTML/CSS & Modern Frameworks</li>
              <li>Design Systems</li>
              <li>Git & CI/CD</li>
            </ul>
          </div>
          
          <div className={styles.skillGroup}>
            <h3 className={styles.skillGroupTitle}>AI Integration</h3>
            <ul className={styles.skillList}>
              <li>OpenAI & Claude APIs</li>
              <li>LangChain</li>
              <li>GitHub Copilot</li>
              <li>AI-Enhanced Workflows</li>
              <li>Prompt Engineering</li>
              <li>Quality Assurance</li>
            </ul>
          </div>
          
          <div className={styles.skillGroup}>
            <h3 className={styles.skillGroupTitle}>Design & UX</h3>
            <ul className={styles.skillList}>
              <li>Figma & Adobe Creative Suite</li>
              <li>UX Research & Testing</li>
              <li>Design Thinking</li>
              <li>Prototyping</li>
              <li>Accessibility (WCAG)</li>
              <li>Information Architecture</li>
            </ul>
          </div>
          
          <div className={styles.skillGroup}>
            <h3 className={styles.skillGroupTitle}>Leadership</h3>
            <ul className={styles.skillList}>
              <li>Cross-functional Collaboration</li>
              <li>Technical Mentoring</li>
              <li>Product Strategy</li>
              <li>Agile Methodologies</li>
              <li>Team Leadership</li>
              <li>Project Management</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.education}>
        <h2 className={styles.sectionTitle}>Education</h2>
        
        <div className={styles.degree}>
          <h3 className={styles.degreeTitle}>Full Stack Web Development Certification</h3>
          <div className={styles.degreeMeta}>
            <span className={styles.school}>University of Washington</span>
            <span className={styles.year}>2019</span>
          </div>
        </div>
        
        <div className={styles.degree}>
          <h3 className={styles.degreeTitle}>BSFA in Liberal Arts/Design</h3>
          <div className={styles.degreeMeta}>
            <span className={styles.school}>Valparaiso University</span>
            <span className={styles.year}>2010</span>
          </div>
        </div>
      </section>

      <section className={styles.philosophy}>
        <h2 className={styles.sectionTitle}>Philosophy</h2>
        <blockquote className={styles.quote}>
          <p>
            I view AI as a multiplier for productivity while maintaining critical oversight. 
            My approach involves carefully scrutinizing generative output for hallucinations 
            or poor quality while leveraging these powerful tools to deliver high-quality 
            solutions rapidly and stay at the forefront of technological innovation.
          </p>
        </blockquote>
      </section>

      <section className={styles.contact}>
        <h2 className={styles.sectionTitle}>Get In Touch</h2>
        <div className={styles.contactLinks}>
          <a href="mailto:kphyde@gmail.com" className={styles.contactLink}>
            <span className={styles.contactIcon}>📧</span>
            kphyde@gmail.com
          </a>
          <a href="https://github.com/futurethang" className={styles.contactLink} target="_blank" rel="noopener noreferrer">
            <span className={styles.contactIcon}>💻</span>
            GitHub: @futurethang
          </a>
          <a href="https://linkedin.com/in/kevinhyde" className={styles.contactLink} target="_blank" rel="noopener noreferrer">
            <span className={styles.contactIcon}>💼</span>
            LinkedIn: Kevin Hyde
          </a>
          <a href="https://t.me/futurethang" className={styles.contactLink} target="_blank" rel="noopener noreferrer">
            <span className={styles.contactIcon}>📱</span>
            Telegram: @futurethang
          </a>
        </div>
      </section>
    </div>
  )
}