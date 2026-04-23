import preset from '@st6/shared-ui/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../libs/shared-ui/src/**/*.{js,ts,jsx,tsx}',
    './node_modules/flowbite-react/lib/**/*.js',
  ],
};
