import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './*.js',
    './src/**/*.{js,ts,jsx,tsx,html,vue,css}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"SF Pro"', '"Helvetica Neue"', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'sf': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"SF Pro"', 'sans-serif'],
        'mono': ['SF Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        'inter': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
        'hanken': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
        'label-sm': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'sans-serif'],
        'body-lg': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'sans-serif'],
        'body-md': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'sans-serif'],
        'headline-md': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'sans-serif'],
        'headline-lg': ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'sans-serif']
      },
      colors: {
        // Canvas & Surfaces (Apple pure palette)
        background: '#FFFFFF',
        surface: '#FFFFFF',
        'surface-bright': '#FFFFFF',
        'surface-dim': '#F5F5F7',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#FBFBFD',
        'surface-container': '#F5F5F7',
        'surface-container-high': '#E8E8ED',
        'surface-container-highest': '#E1E1E6',

        // Text & Typography
        'on-surface': '#1D1D1F',
        'on-background': '#1D1D1F',
        'on-surface-variant': '#6E6E73',
        outline: '#86868B',
        'outline-variant': '#D2D2D7',

        // Primary Brand & Interactive
        primary: '#0071E3',            // Apple Action Blue
        'primary-container': '#E8F2FD',
        'surface-tint': '#0077ED',
        'on-primary': '#FFFFFF',
        accent: '#2997FF',             // Apple Vibrant Accent

        // Status / Functional
        error: '#FF3B30',              // Apple System Red
        'error-container': '#FFEBEA',
        success: '#34C759',            // Apple System Green
        warning: '#FF9500',            // Apple System Orange

        // Compatibility aliases
        'on-error-container': '#93000a',
        'on-primary-fixed-variant': '#004b72',
        'secondary-fixed-dim': '#9ad1cb',
        'on-secondary-container': '#366b67',
        'on-tertiary-fixed-variant': '#862200',
        'on-secondary-fixed-variant': '#154f4b',
        'tertiary-fixed': '#ffdbd1',
        'on-tertiary-container': '#fffbff',
        'inverse-on-surface': '#f0f1ee',
        'tertiary-container': '#d73b00',
        'primary-fixed-dim': '#90cdff',
        tertiary: '#ac2e00',
        'on-tertiary': '#ffffff',
        'surface-variant': '#E8E8ED',
        'on-error': '#ffffff',
        'tertiary-fixed-dim': '#ffb5a0',
        'on-secondary-fixed': '#00201e',
        'inverse-primary': '#2997FF',
        'on-secondary': '#ffffff',
        'on-primary-container': '#1D1D1F',
        'inverse-surface': '#1D1D1F',
        secondary: '#1D1D1F',
        'primary-fixed': '#cce5ff',
        'secondary-fixed': '#b6ede7',
        'secondary-container': '#F5F5F7',
        'on-tertiary-fixed': '#3b0900',
        'on-primary-fixed': '#001e31'
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.6875rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        full: '9999px'
      },
      spacing: {
        md: '24px',
        gutter: '24px',
        sm: '12px',
        base: '8px',
        'container-max': '1280px',
        lg: '48px',
        xs: '4px',
        xl: '80px'
      },
      fontSize: {
        'label-sm': ['13px', { lineHeight: '1', letterSpacing: '-0.08px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.55', letterSpacing: '-0.37px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.47', letterSpacing: '-0.22px', fontWeight: '400' }],
        'headline-md': ['24px', { lineHeight: '1.2', letterSpacing: '0.22px', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '1.14', letterSpacing: '0.2px', fontWeight: '600' }]
      }
    }
  },
  plugins: [
    forms,
    containerQueries
  ]
};
