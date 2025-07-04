# Font Testing System

A comprehensive font testing system that allows you to easily swap between different font combinations in development mode.

## Features

- ✅ **Easy Configuration**: Just edit arrays in `font-config.ts`
- ✅ **Dev-Only**: Only shows in development mode (feature flagged)
- ✅ **Real-time Preview**: See changes instantly across the entire app
- ✅ **Persistent Selection**: Remembers your choices in localStorage
- ✅ **Sans + Mono Fonts**: Test both text and code fonts independently

## How to Use

### 1. Access the Font Selector
- **Development mode only**: The "🎨 Fonts" button appears in the top-right corner
- Click to open the font testing panel

### 2. Test Fonts
- **Sans-serif**: Choose from 7 high-quality fonts (Inter, Open Sans, Roboto, etc.)
- **Monospace**: Choose from 7 developer-focused fonts (JetBrains Mono, Fira Code, etc.)
- **Live Preview**: See sample text in the current fonts
- **Instant Apply**: Changes apply immediately across the entire app

### 3. Add New Fonts

Edit `lib/fonts/font-config.ts`:

```typescript
// Add to sansSerifFonts array
{
  name: 'Your Font Name',
  key: 'your-font-key',
  font: YourFont({
    subsets: ['latin'],
    variable: '--font-test-your-font-key',
    display: 'swap',
  })
}
```

## Current Font Options

### Sans-serif Fonts
- **Inter** (default) - Excellent for UIs
- **Open Sans** - Clean and readable
- **Roboto** - Google's material design font
- **Poppins** - Modern geometric sans
- **Source Sans 3** - Adobe's readable font
- **Nunito Sans** - Rounded and friendly
- **Work Sans** - Professional and versatile

### Monospace Fonts
- **JetBrains Mono** (default) - Developer-focused with ligatures
- **Fira Code** - Programming font with ligatures
- **Source Code Pro** - Adobe's code font
- **Roboto Mono** - Clean monospace
- **Space Mono** - Quirky space-age design
- **IBM Plex Mono** - Corporate but readable
- **Inconsolata** - Humanist monospace

## Architecture

```
lib/fonts/
├── font-config.ts      # Font definitions and configuration
└── README.md          # This file

lib/contexts/
└── font-context.tsx   # React context for font state management

app/_components/
├── FontSelector.tsx         # Font testing UI component
└── FontSelector.module.css  # Styles for the font selector
```

## Technical Details

- **Next.js Fonts**: Uses `next/font/google` for optimal loading
- **CSS Variables**: Dynamic font switching via CSS custom properties
- **Feature Flag**: Only loads in `NODE_ENV === 'development'`
- **Performance**: All fonts loaded once, switched via CSS variables
- **Persistence**: Selections saved to localStorage

## Notes

- The font selector only appears in development mode
- Font choices persist between browser sessions
- Changes apply instantly without page reload
- All Google Fonts are pre-optimized by Next.js 