'use client'

import React, { useState } from 'react'
import { useFontContext } from '@/lib/contexts/font-context'
import { sansSerifFonts, monospaceFonts } from '@/lib/fonts/font-config'
import styles from './FontSelector.module.css'

export function FontSelector() {
  const { selectedSansSerifFont, selectedMonospaceFont, setSansSerifFont, setMonospaceFont, isDevMode } = useFontContext()
  const [isOpen, setIsOpen] = useState(false)

  if (!isDevMode) return null

  return (
    <div className={styles.container}>
      <button
        className={styles.toggle}
        onClick={() => setIsOpen(!isOpen)}
        title="Font Testing Tool (Dev Only)"
      >
        🎨 Fonts
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h3>Font Testing Tool</h3>
            <button
              className={styles.close}
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.section}>
              <h4>Sans-serif Font</h4>
              <p className={styles.current}>Current: {selectedSansSerifFont.name}</p>
              <div className={styles.grid}>
                {sansSerifFonts.map((font) => (
                  <button
                    key={font.key}
                    className={`${styles.fontOption} ${selectedSansSerifFont.key === font.key ? styles.active : ''} ${font.font.className}`}
                    onClick={() => setSansSerifFont(font)}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h4>Monospace Font</h4>
              <p className={styles.current}>Current: {selectedMonospaceFont.name}</p>
              <div className={styles.grid}>
                {monospaceFonts.map((font) => (
                  <button
                    key={font.key}
                    className={`${styles.fontOption} ${selectedMonospaceFont.key === font.key ? styles.active : ''} font-selector-mono-button`}
                    onClick={() => setMonospaceFont(font)}
                  >
                    <span className={`font-selector-code ${font.font.className}`}>{font.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.preview}>
              <h4>Preview</h4>
              <div className={styles.sampleText}>
                <p className="font-testing-sans">
                  The quick brown fox jumps over the lazy dog. ABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890
                </p>
                <code className="font-testing-mono">
                  function hello() &#123; console.log('Hello, World!'); &#125;
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 