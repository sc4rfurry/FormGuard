import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';

const banner = `/*!
 * FormGuard v1.0.0
 * Enterprise-grade form validation library with zero dependencies
 * https://github.com/sc4rfurry/FormGuard
 *
 * Copyright (c) 2024 sc4rfurry
 * Released under the MIT License
 */`;

const createConfig = (format, minify = false) => {
  const suffix = minify ? '.min' : '';
  const extension = format === 'es' ? 'esm' : 'js';
  const input = (format === 'umd' || format === 'iife') ? 'src/umd.js' : 'src/index.js';

  return {
    input,
    output: {
      file: `dist/formguard${format === 'es' ? '.esm' : ''}${suffix}.js`,
      format: format === 'es' ? 'es' : format,
      name: format === 'umd' ? 'FormGuard' : undefined,
      banner,
      sourcemap: true,
      exports: (format === 'umd' || format === 'iife') ? 'default' : 'named'
    },
    plugins: [
      resolve({
        browser: true
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['Chrome >= 90', 'Firefox >= 88', 'Safari >= 14', 'Edge >= 90']
            },
            modules: false
          }]
        ]
      }),
      ...(minify ? [terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.warn']
        },
        mangle: {
          properties: {
            regex: /^_/
          }
        },
        format: {
          comments: /^!/
        }
      })] : []),
      filesize({
        showBrotliSize: true,
        showGzippedSize: true
      })
    ]
  };
};

export default [
  // UMD development build
  createConfig('umd', false),
  
  // UMD production build (minified)
  createConfig('umd', true),
  
  // ES module build
  createConfig('es', false),
  
  // IIFE build for direct browser usage
  {
    input: 'src/umd.js',
    output: {
      file: 'dist/formguard.iife.js',
      format: 'iife',
      name: 'FormGuard',
      banner,
      sourcemap: true,
      exports: 'default'
    },
    plugins: [
      resolve({
        browser: true
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['Chrome >= 90', 'Firefox >= 88', 'Safari >= 14', 'Edge >= 90']
            },
            modules: false
          }]
        ]
      }),
      filesize({
        showBrotliSize: true,
        showGzippedSize: true
      })
    ]
  }
];