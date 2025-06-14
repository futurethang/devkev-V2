import { Header } from '@/app/_components/Header'
import { Footer } from '@/app/_components/Footer'
import styles from './layout.module.css'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <Footer />
    </>
  )
}