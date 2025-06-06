import { copyFileSync, existsSync, mkdirSync, readFileSync, rmdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'tsup'
import { config } from 'dotenv'

config()

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

function parseVersion(versionStr: string): [number, number, number] {
  const parts = versionStr.split('.').map(Number)
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
}

export default defineConfig(({ define }) => {
  const isRelease = define?.release !== undefined
  const bundleName = `${pkg.name}-${pkg.version}-${Date.now()}-${isRelease ? 'prod' : 'dev'}`
  const DIR = resolve(
    __dirname,
    !isRelease && process.env.OUT_DIR ? process.env.OUT_DIR : 'dist',
    isRelease ? `${pkg.name}-${pkg.version}` : pkg.name
  )

  if (existsSync(DIR)) rmdirSync(DIR, { recursive: true })
  mkdirSync(DIR, { recursive: true })

  writeFileSync(
    resolve(DIR, 'manifest.json'),
    JSON.stringify(
      {
        format_version: 2,
        header: {
          name: pkg.name || 'unknown',
          description: pkg.description || '',
          uuid: pkg.mcBuild.uuid[0],
          version: parseVersion(pkg.version || '1.0.0'),
          min_engine_version: [1, 20, 0],
          license: pkg.license || '',
          url: pkg.homepage || ''
        },
        modules: [
          {
            type: 'script',
            language: 'javascript',
            uuid: pkg.mcBuild.uuid[1],
            version: parseVersion(pkg.version || '1.0.0'),
            entry: `scripts/${bundleName}/main.js`
          }
        ],
        dependencies: Object.entries(pkg.dependencies || {})
          .filter(([name]) => name.startsWith('@minecraft/'))
          .map(([module_name, version]) => ({
            module_name,
            version: (version as string).split('.').slice(0, 3).join('.')
          }))
      },
      null,
      2
    )
  )
  mkdirSync(resolve(DIR, 'scripts'), { recursive: true })

  pkg.mcBuild.transform
    .map((value) => (typeof value === 'string' ? [value, value] : value))
    .map(([input, output]) => copyFileSync(resolve(__dirname, input), resolve(DIR, output)))

  return {
    entryPoints: ['./src/main.ts'],
    minify: isRelease,
    outDir: resolve(DIR, `scripts/${bundleName}`),
    bundle: true,
    format: ['esm'],
    tsconfig: 'tsconfig.json',
    banner: {
      js: `
/**
 * @Package ${pkg.name ?? 'unknown'}
 * @Version ${pkg.version ?? 'unknown'}
 * @Author ${Array.isArray(pkg.author) ? pkg.author.join(', ') : pkg.author ?? ''}
 * @Copyright 2025 Arimura Sena. All rights reserved.
 * @License ${pkg.license ?? 'GPL-3.0'}
 * @Link ${pkg.homepage ?? ''}
 * @Date ${new Date().toLocaleString()}
 */
${pkg.mcBuild.header.join('\n')}
`
    },
    outExtension(ctx) {
      return {
        js: '.js'
      }
    }
  }
})
