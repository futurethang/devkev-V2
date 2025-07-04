'use client'

import React, { useEffect, useState } from 'react'
import { useFontContext } from '@/lib/contexts/font-context'
import { sansSerifFonts, monospaceFonts } from '@/lib/fonts/font-config'

export function FontDebugger() {
  const { selectedSansSerifFont, selectedMonospaceFont, isDevMode } = useFontContext()
  const [computedFonts, setComputedFonts] = useState({ body: '', code: '' })
  const [fontFamilies, setFontFamilies] = useState({ sans: '', mono: '' })

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Get computed font families from actual elements
    const bodyFont = getComputedStyle(document.body).fontFamily
    const codeElement = document.querySelector('code') || document.createElement('code')
    document.body.appendChild(codeElement)
    const codeFont = getComputedStyle(codeElement).fontFamily
    if (!document.querySelector('code')) {
      document.body.removeChild(codeElement)
    }
    
    setComputedFonts({
      body: bodyFont,
      code: codeFont
    })

    // Get font family names from font objects
    try {
      const sansFamily = selectedSansSerifFont.font.style?.fontFamily || 'Not available'
      const monoFamily = selectedMonospaceFont.font.style?.fontFamily || 'Not available'
      
      setFontFamilies({
        sans: sansFamily,
        mono: monoFamily
      })

      console.log('Font Family Debug:', {
        selectedSansFont: selectedSansSerifFont.name,
        sansFontObject: selectedSansSerifFont.font,
        sansStyle: selectedSansSerifFont.font.style,
        sansFontFamily: sansFamily,
        selectedMonoFont: selectedMonospaceFont.name,
        monoFontObject: selectedMonospaceFont.font,
        monoStyle: selectedMonospaceFont.font.style,
        monoFontFamily: monoFamily,
        computedBodyFont: bodyFont,
        computedCodeFont: codeFont
      })
    } catch (error) {
      console.error('Error getting font families:', error)
    }
  }, [selectedSansSerifFont, selectedMonospaceFont])

  const testDirectApplication = () => {
    try {
      const sansFamily = selectedSansSerifFont.font.style.fontFamily
      const monoFamily = selectedMonospaceFont.font.style.fontFamily
      
      document.body.style.fontFamily = `${sansFamily} !important`
      
      const codeElements = document.querySelectorAll('code, pre')
      codeElements.forEach(el => {
        (el as HTMLElement).style.fontFamily = `${monoFamily} !important`
      })
      
      console.log('Applied fonts directly to elements:', { sansFamily, monoFamily })
    } catch (error) {
      console.error('Failed to apply fonts directly:', error)
    }
  }

  const inspectAllFonts = () => {
    console.log('=== ALL FONTS INSPECTION ===')
    sansSerifFonts.forEach(font => {
      console.log(`Sans Font: ${font.name}`, {
        key: font.key,
        fontObject: font.font,
        className: font.font?.className,
        style: font.font?.style,
        fontFamily: font.font?.style?.fontFamily
      })
    })
    
    monospaceFonts.forEach(font => {
      console.log(`Mono Font: ${font.name}`, {
        key: font.key,
        fontObject: font.font,
        className: font.font?.className,
        style: font.font?.style,
        fontFamily: font.font?.style?.fontFamily
      })
    })
  }

  const checkInjectedCSS = () => {
    const styleElement = document.getElementById('font-testing-overrides')
    if (styleElement) {
      console.log('Injected CSS:', styleElement.textContent)
    } else {
      console.log('No injected CSS found')
    }
  }

  const debugMonospaceFonts = () => {
    console.log('=== MONOSPACE FONT DEBUG ===')
    
    // Check all font selector code elements
    const fontSelectorCodes = document.querySelectorAll('.font-selector-code')
    fontSelectorCodes.forEach((el, index) => {
      const computedStyle = getComputedStyle(el)
      console.log(`Font Selector ${index}:`, {
        element: el,
        textContent: el.textContent,
        className: el.className,
        computedFontFamily: computedStyle.fontFamily,
        visibility: computedStyle.visibility,
        display: computedStyle.display,
        color: computedStyle.color,
        opacity: computedStyle.opacity
      })
    })
    
    // Check regular code elements
    const codeElements = document.querySelectorAll('code:not(.font-selector-code)')
    console.log(`Found ${codeElements.length} regular code elements`)
    codeElements.forEach((el, index) => {
      const computedStyle = getComputedStyle(el)
      console.log(`Code Element ${index}:`, {
        element: el,
        textContent: el.textContent?.substring(0, 50),
        computedFontFamily: computedStyle.fontFamily,
        visibility: computedStyle.visibility,
        display: computedStyle.display
      })
    })
  }

  if (!isDevMode) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      maxWidth: '600px',
      zIndex: 1001,
      border: '1px solid #333'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#ffa500' }}>Font Debug Info</h4>
      
      <div>
        <strong>Selected Sans:</strong> {selectedSansSerifFont.name}<br/>
        <strong>Sans Font Family:</strong> {fontFamilies.sans}<br/>
        <strong>Computed Body Font:</strong> {computedFonts.body}<br/>
      </div>
      
      <div style={{ marginTop: '8px' }}>
        <strong>Selected Mono:</strong> {selectedMonospaceFont.name}<br/>
        <strong>Mono Font Family:</strong> {fontFamilies.mono}<br/>
        <strong>Computed Code Font:</strong> {computedFonts.code}<br/>
      </div>

             <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
         <button onClick={testDirectApplication} style={{ padding: '3px 6px', fontSize: '10px' }}>
           Apply Direct
         </button>
         <button onClick={inspectAllFonts} style={{ padding: '3px 6px', fontSize: '10px' }}>
           Inspect Fonts
         </button>
         <button onClick={checkInjectedCSS} style={{ padding: '3px 6px', fontSize: '10px' }}>
           Check CSS
         </button>
         <button onClick={debugMonospaceFonts} style={{ padding: '3px 6px', fontSize: '10px' }}>
           Debug Mono
         </button>
       </div>
      
      <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
        <div className="font-testing-sans">
          Sans test: The quick brown fox jumps
        </div>
        <div className="font-testing-mono" style={{ marginTop: '4px' }}>
          Mono test: function hello() &#123;&#125;
        </div>
      </div>
    </div>
  )
} 