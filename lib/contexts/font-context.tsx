'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { sansSerifFonts, monospaceFonts, defaultSansSerifFont, defaultMonospaceFont, getAllFontClassNames } from '@/lib/fonts/font-config'

type FontConfig = {
  name: string
  key: string
  font: any
}

type FontContextType = {
  selectedSansSerifFont: FontConfig
  selectedMonospaceFont: FontConfig
  setSansSerifFont: (font: FontConfig) => void
  setMonospaceFont: (font: FontConfig) => void
  isDevMode: boolean
  getSansSerifClassName: () => string
  getMonospaceClassName: () => string
}

const FontContext = createContext<FontContextType | null>(null)

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [selectedSansSerifFont, setSelectedSansSerifFont] = useState(defaultSansSerifFont)
  const [selectedMonospaceFont, setSelectedMonospaceFont] = useState(defaultMonospaceFont)
  const [isDevMode, setIsDevMode] = useState(false)

  // Check if we're in development mode
  useEffect(() => {
    setIsDevMode(process.env.NODE_ENV === 'development')
  }, [])

  // Add all font class names to the document on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const allFontClasses = getAllFontClassNames()
      document.body.className = `${document.body.className} ${allFontClasses}`.trim()
      console.log('Added font classes to document:', allFontClasses)
    } catch (error) {
      console.warn('Failed to add font classes:', error)
    }
  }, [])

    // Apply font changes by injecting CSS
  useEffect(() => {
    if (typeof window === 'undefined') return

    const styleId = 'font-testing-overrides'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    let observer: MutationObserver | null = null

    try {
      // Apply the selected font classes to body and let CSS inheritance work
      const sansClassName = selectedSansSerifFont.font.className
      const monoClassName = selectedMonospaceFont.font.className

      // Remove existing font classes and add new ones
      const bodyClasses = document.body.className
        .split(' ')
        .filter(cls => !cls.includes('__')) // Remove Next.js font classes
        .join(' ')
      
      document.body.className = `${bodyClasses} ${sansClassName}`.trim()

      // Create targeted CSS that works with class inheritance
      const css = `
        /* Sans-serif elements use body font by default - no override needed */
        
        /* Monospace elements get the selected mono font */
        .${monoClassName} pre,
        .${monoClassName} code:not(.font-selector-code),
        .${monoClassName} .font-testing-mono {
          font-family: inherit !important;
        }
        
        /* Ensure font selector buttons don't inherit the mono font */
        .font-selector-mono-button {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        
        /* Font selector code previews use their own individual font classes */
        .font-selector-code {
          /* Let individual font classes handle this */
        }
      `

      styleElement.textContent = css

      // Apply the monospace class to elements that need it
      const applyMonoFont = () => {
        const codeElements = document.querySelectorAll('code:not(.font-selector-code)')
        const preElements = document.querySelectorAll('pre')
        const monoTestElements = document.querySelectorAll('.font-testing-mono')
        
        // Remove old monospace classes first
        const allElements = [...codeElements, ...preElements, ...monoTestElements]
        allElements.forEach(el => {
          // Remove all Next.js font classes
          el.className = el.className
            .split(' ')
            .filter(cls => !cls.includes('__'))
            .join(' ')
        })
        
        // Add new monospace class
        allElements.forEach(el => {
          el.classList.add(monoClassName)
        })
        
        return allElements.length
      }
      
      // Apply immediately
      const elementCount = applyMonoFont()
      
      // Also set up a mutation observer to catch dynamically added elements
      observer = new MutationObserver((mutations) => {
        let shouldReapply = false
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element
                if (element.tagName === 'CODE' || element.tagName === 'PRE' || 
                    element.querySelector && (element.querySelector('code') || element.querySelector('pre'))) {
                  shouldReapply = true
                }
              }
            })
          }
        })
        if (shouldReapply) {
          applyMonoFont()
        }
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })

      console.log('Applied font override CSS:', {
        sansFont: selectedSansSerifFont.name,
        sansClassName,
        monoFont: selectedMonospaceFont.name,
        monoClassName,
        appliedToElements: elementCount
      })
    } catch (error) {
      console.error('Failed to apply font overrides:', error, {
        selectedSansSerifFont,
        selectedMonospaceFont
      })
    }

    // Clean up observer on unmount
    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [selectedSansSerifFont, selectedMonospaceFont])

  // Load saved font preferences from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedSansSerif = localStorage.getItem('font-test-sans-serif')
    const savedMonospace = localStorage.getItem('font-test-monospace')

    if (savedSansSerif) {
      const font = sansSerifFonts.find(f => f.key === savedSansSerif)
      if (font) setSelectedSansSerifFont(font)
    }

    if (savedMonospace) {
      const font = monospaceFonts.find(f => f.key === savedMonospace)
      if (font) setSelectedMonospaceFont(font)
    }
  }, [])

  const setSansSerifFont = (font: FontConfig) => {
    setSelectedSansSerifFont(font)
    localStorage.setItem('font-test-sans-serif', font.key)
    console.log('Changed sans-serif font to:', font.name, 'className:', font.font.className)
  }

  const setMonospaceFont = (font: FontConfig) => {
    setSelectedMonospaceFont(font)
    localStorage.setItem('font-test-monospace', font.key)
    console.log('Changed monospace font to:', font.name, 'className:', font.font.className)
  }

  const getSansSerifClassName = () => {
    return selectedSansSerifFont.font.className || ''
  }

  const getMonospaceClassName = () => {
    return selectedMonospaceFont.font.className || ''
  }

  return (
    <FontContext.Provider
      value={{
        selectedSansSerifFont,
        selectedMonospaceFont,
        setSansSerifFont,
        setMonospaceFont,
        isDevMode,
        getSansSerifClassName,
        getMonospaceClassName,
      }}
    >
      {children}
    </FontContext.Provider>
  )
}

export function useFontContext() {
  const context = useContext(FontContext)
  if (!context) {
    throw new Error('useFontContext must be used within a FontProvider')
  }
  return context
} 