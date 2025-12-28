import { copyFileSync, existsSync, mkdirSync, readFileSync, rmdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from 'tsup'

config()

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

function parseVersion(versionStr: string): [number, number, number] {
  const parts = versionStr.split('.').map(Number)
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
}

// TODO: pack directories and rename to `.mcpack` in release mode

export default defineConfig(({ define }) => {
  const isRelease = define?.release !== undefined
  const bundleName = `${pkg.name}-${pkg.version}-${Date.now()}-${isRelease ? 'prod' : 'dev'}`
  const isClientVersion = isRelease ? define?.is_client_version !== undefined : process.env.IS_CLIENT_VERSION === 'on'
  const versionType = isClientVersion ? 'client' : 'server'
  const DIR =
    !isRelease && !isClientVersion && process.env.BDS_DIR
      ? resolve(__dirname, process.env.BDS_DIR, 'behavior_packs', pkg.name)
      : resolve(
          __dirname,
          !isRelease && process.env.OUT_DIR ? process.env.OUT_DIR : 'dist',
          isRelease ? `${versionType}/${pkg.name}-${pkg.version}` : pkg.name
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
          min_engine_version: [1, 21, 100],
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
        capabilities: ['script_eval'],
        dependencies: Object.entries(pkg.dependencies || {})
          .filter(([name]) => name.startsWith('@minecraft/') && (!isClientVersion || name !== '@minecraft/server-net'))
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

  const outDir = resolve(DIR, `scripts/${bundleName}`)

  return {
    entryPoints: ['./src-ts/main.ts', `./src-ts/${versionType}.ts`],
    minify: isRelease,
    outDir,
    name: `${versionType}/${bundleName.split('-').pop()}`,
    bundle: true,
    format: ['esm'],
    tsconfig: 'tsconfig.json',
    banner: {
      js: `
/**
 * @Package ${pkg.name ?? 'unknown'}
 * @Version ${pkg.version ?? 'unknown'}
 * @Author ${Array.isArray(pkg.author) ? pkg.author.join(', ') : (pkg.author ?? '')}
 * @Copyright 2025 Arimura Sena. All rights reserved.
 * @License ${pkg.license ?? 'GPL-3.0'}
 * @Link ${pkg.homepage ?? ''}
 * @Date ${new Date().toLocaleString()}
 */
${isClientVersion ? '' : `\nimport SIRIUS_CONFIG from '../config.js';`}
`
    },
    outExtension() {
      return {
        js: '.js'
      }
    },
    async onSuccess() {
      writeFileSync(
        resolve(outDir, 'main.js'),
        `\nimport AdapterDataSome from './${versionType}.js';\n${readFileSync(resolve(outDir, 'main.js'), 'utf-8')}`
      )
      if (!isClientVersion) {
      }
      /* TODO: JS Encrypted */
      console.log(`Build ${isRelease ? 'Release' : 'Dev'} ${versionType} ${pkg.name} v${pkg.version} success!`)
    }
  }
})
