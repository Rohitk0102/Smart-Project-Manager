/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Custom colors for the dark theme
                primary: '#6366f1', // Indigo
                'dark-bg': '#0f172a', // Slate 900
                'dark-card': '#1e293b', // Slate 800
            }
        },
    },
    plugins: [],
}
