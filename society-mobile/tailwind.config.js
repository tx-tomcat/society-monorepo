const colors = require('./src/components/ui/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    fontFamily: {
      // Override default sans font with Urbanist
      sans: [
        'Urbanist_400Regular',
        'Urbanist_500Medium',
        'Urbanist_600SemiBold',
        'Urbanist_700Bold',
        '-apple-system',
        'BlinkMacSystemFont',
        'system-ui',
        'sans-serif',
      ],
    },
    extend: {
      fontFamily: {
        // Primary font family - Urbanist
        urbanist: [
          'Urbanist_400Regular',
          'Urbanist_500Medium',
          'Urbanist_600SemiBold',
          'Urbanist_700Bold',
          'sans-serif',
        ],
        'urbanist-thin': ['Urbanist_100Thin', 'sans-serif'],
        'urbanist-extralight': ['Urbanist_200ExtraLight', 'sans-serif'],
        'urbanist-light': ['Urbanist_300Light', 'sans-serif'],
        'urbanist-regular': ['Urbanist_400Regular', 'sans-serif'],
        'urbanist-medium': ['Urbanist_500Medium', 'sans-serif'],
        'urbanist-semibold': ['Urbanist_600SemiBold', 'sans-serif'],
        'urbanist-bold': ['Urbanist_700Bold', 'sans-serif'],
        'urbanist-extrabold': ['Urbanist_800ExtraBold', 'sans-serif'],
        'urbanist-black': ['Urbanist_900Black', 'sans-serif'],

        // Old Money Editorial Typography (legacy)
        cormorant: [
          'CormorantGaramond-Bold',
          'CormorantGaramond-SemiBold',
          'serif',
        ],
        montserrat: [
          'Montserrat-SemiBold',
          'Montserrat-Bold',
          'Montserrat-Medium',
          'sans-serif',
        ],
        inter: [
          'Inter-Regular',
          'Inter-Medium',
          'Inter-SemiBold',
          'sans-serif',
        ],
        bodoni: ['BodoniModa-Bold', 'serif'],

        // Default fonts - now using Urbanist
        heading: [
          'Urbanist_700Bold',
          'Urbanist_600SemiBold',
          '-apple-system',
          'system-ui',
          'sans-serif',
        ],
        subheading: [
          'Urbanist_600SemiBold',
          'Urbanist_500Medium',
          '-apple-system',
          'system-ui',
          'sans-serif',
        ],
        body: [
          'Urbanist_400Regular',
          'Urbanist_500Medium',
          '-apple-system',
          'system-ui',
          'sans-serif',
        ],
        accent: [
          'Urbanist_700Bold',
          'Urbanist_800ExtraBold',
          '-apple-system',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        // Typography scale matching Old Money Editorial
        'h1-desktop': [
          '72px',
          { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' },
        ],
        'h1-mobile': [
          '42px',
          { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' },
        ],
        'h2-desktop': [
          '48px',
          { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' },
        ],
        'h2-mobile': [
          '32px',
          { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' },
        ],
        h3: [
          '36px',
          { lineHeight: '1.3', letterSpacing: '0em', fontWeight: '700' },
        ],
        h4: [
          '24px',
          { lineHeight: '1.3', letterSpacing: '0em', fontWeight: '600' },
        ],
        h5: [
          '20px',
          { lineHeight: '1.3', letterSpacing: '0.01em', fontWeight: '600' },
        ],
        h6: [
          '18px',
          { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '600' },
        ],
        'body-lg': [
          '18px',
          { lineHeight: '1.7', letterSpacing: '0.005em', fontWeight: '400' },
        ],
        body: [
          '16px',
          { lineHeight: '1.6', letterSpacing: '0.005em', fontWeight: '400' },
        ],
        'body-sm': [
          '14px',
          { lineHeight: '1.6', letterSpacing: '0.005em', fontWeight: '400' },
        ],
        caption: [
          '12px',
          { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' },
        ],
        button: [
          '14px',
          { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '600' },
        ],
      },
      colors: {
        ...colors,
      },
    },
  },
  plugins: [],
};
