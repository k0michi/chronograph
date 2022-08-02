import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path';
import license from 'rollup-plugin-license';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    license({
      banner: {
        content: `Please see /toolbox/license.txt for license information`,
        commentStyle: 'ignored',
      },
      thirdParty: {
        includePrivate: false,
        output: {
          file: path.join('dist', 'license.txt')
        },
      },
    }),
    react()
  ]
});