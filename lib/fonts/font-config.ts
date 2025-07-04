import { Inter, JetBrains_Mono, Open_Sans, Roboto, Poppins, Source_Sans_3, Nunito_Sans, Work_Sans, Fira_Code, Source_Code_Pro, Roboto_Mono, Space_Mono, IBM_Plex_Mono, Inconsolata } from 'next/font/google'

// Font declarations - must be const at module level for Next.js
const interFont = Inter({
  subsets: ['latin'],
  display: 'swap',
})

const openSansFont = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
})

const robotoFont = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

const poppinsFont = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const sourceSans3Font = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
})

const nunitoSansFont = Nunito_Sans({
  subsets: ['latin'],
  display: 'swap',
})

const workSansFont = Work_Sans({
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMonoFont = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
})

const firaCodeFont = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
})

const sourceCodeProFont = Source_Code_Pro({
  subsets: ['latin'],
  display: 'swap',
})

const robotoMonoFont = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
})

const spaceMonoFont = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

const ibmPlexMonoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const inconsolataFont = Inconsolata({
  subsets: ['latin'],
  display: 'swap',
})

// Sans-serif fonts configuration
export const sansSerifFonts = [
  {
    name: 'Inter',
    key: 'inter',
    font: interFont
  },
  {
    name: 'Open Sans',
    key: 'open-sans',
    font: openSansFont
  },
  {
    name: 'Roboto',
    key: 'roboto',
    font: robotoFont
  },
  {
    name: 'Poppins',
    key: 'poppins',
    font: poppinsFont
  },
  {
    name: 'Source Sans 3',
    key: 'source-sans-3',
    font: sourceSans3Font
  },
  {
    name: 'Nunito Sans',
    key: 'nunito-sans',
    font: nunitoSansFont
  },
  {
    name: 'Work Sans',
    key: 'work-sans',
    font: workSansFont
  }
]

// Monospace fonts configuration
export const monospaceFonts = [
  {
    name: 'JetBrains Mono',
    key: 'jetbrains-mono',
    font: jetbrainsMonoFont
  },
  {
    name: 'Fira Code',
    key: 'fira-code',
    font: firaCodeFont
  },
  {
    name: 'Source Code Pro',
    key: 'source-code-pro',
    font: sourceCodeProFont
  },
  {
    name: 'Roboto Mono',
    key: 'roboto-mono',
    font: robotoMonoFont
  },
  {
    name: 'Space Mono',
    key: 'space-mono',
    font: spaceMonoFont
  },
  {
    name: 'IBM Plex Mono',
    key: 'ibm-plex-mono',
    font: ibmPlexMonoFont
  },
  {
    name: 'Inconsolata',
    key: 'inconsolata',
    font: inconsolataFont
  }
]

// Helper to get all font class names (for applying to layout)
export const getAllFontClassNames = () => {
  try {
    const sansClassNames = sansSerifFonts.map(font => {
      try {
        return font.font.className || ''
      } catch (e) {
        console.warn(`Failed to get className for ${font.name}:`, e)
        return ''
      }
    }).filter(Boolean)
    
    const monoClassNames = monospaceFonts.map(font => {
      try {
        return font.font.className || ''
      } catch (e) {
        console.warn(`Failed to get className for ${font.name}:`, e)
        return ''
      }
    }).filter(Boolean)
    
    return [...sansClassNames, ...monoClassNames].join(' ')
  } catch (error) {
    console.warn('Failed to get font class names:', error)
    return ''
  }
}

// Default selections
export const defaultSansSerifFont = sansSerifFonts[0] // Inter
export const defaultMonospaceFont = monospaceFonts[0] // JetBrains Mono 