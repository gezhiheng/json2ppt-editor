import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

type PackageManifest = {
  name: string
  version: string
  dependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

type WorkspacePackage = {
  dir: string
  manifest: PackageManifest
  name: string
  version: string
  tarballPath: string | null
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const libDir = path.join(rootDir, 'packages')
const dependencySections = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies'
] as const
const packageInstallTimeout = 300_000
const PPTX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const pptxFixturePath = path.join(
  rootDir,
  'packages',
  'pptx2json',
  'test',
  'assets',
  'template_1.pptx'
)

const workspacePackages = loadWorkspacePackages()
const packageMap = new Map(workspacePackages.map((pkg) => [pkg.name, pkg]))

let tempRootDir = ''
let tarballDir = ''

describe.sequential('npm package install smoke tests', () => {
  beforeAll(async () => {
    tempRootDir = await mkdtemp(path.join(tmpdir(), 'json2ppt-package-install-'))
    tarballDir = path.join(tempRootDir, 'tarballs')
    await mkdir(tarballDir, { recursive: true })

    runCommand('pnpm', ['run', 'prebuild'], rootDir)

    for (const pkg of workspacePackages) {
      runCommand('pnpm', ['pack', '--pack-destination', tarballDir], pkg.dir)
      const tarballPath = path.join(tarballDir, getTarballFileName(pkg))

      if (!existsSync(tarballPath)) {
        throw new Error(`Expected tarball was not created for ${pkg.name}: ${tarballPath}`)
      }

      pkg.tarballPath = tarballPath
    }
  }, packageInstallTimeout)

  afterAll(async () => {
    if (!tempRootDir) return
    await rm(tempRootDir, { recursive: true, force: true })
  })

  for (const pkg of workspacePackages) {
    test(`installs ${pkg.name} into a clean npm project`, async () => {
      const installProjectDir = await mkdtemp(
        path.join(tempRootDir, `${sanitizePackageName(pkg.name)}-`)
      )

      await writeFile(
        path.join(installProjectDir, 'package.json'),
        JSON.stringify(
          {
            name: `install-smoke-${sanitizePackageName(pkg.name)}`,
            private: true,
            type: 'module'
          },
          null,
          2
        )
      )

      const installTarballs = collectInstallTarballs(pkg)
      const extraInstallPackages = getExtraInstallPackages(pkg)

      runCommand(
        'npm',
        [
          'install',
          '--no-audit',
          '--no-fund',
          '--package-lock=false',
          ...installTarballs,
          ...extraInstallPackages
        ],
        installProjectDir
      )

      const installedManifest = JSON.parse(
        await readFile(
          path.join(installProjectDir, 'node_modules', pkg.name, 'package.json'),
          'utf8'
        )
      ) as PackageManifest

      expect(installedManifest.name).toBe(pkg.name)
      expect(installedManifest.version).toBe(pkg.version)

      const smokeScriptPath = path.join(installProjectDir, 'smoke.mjs')
      await writeFile(smokeScriptPath, buildImportSmokeScript(pkg))
      runCommand('node', [smokeScriptPath], installProjectDir)
    }, packageInstallTimeout)
  }
})

function loadWorkspacePackages (): WorkspacePackage[] {
  return readdirSync(libDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(libDir, entry.name)
      const manifestPath = path.join(dir, 'package.json')
      if (!existsSync(manifestPath)) {
        return null
      }

      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest

      return {
        dir,
        manifest,
        name: manifest.name,
        version: manifest.version,
        tarballPath: null
      } satisfies WorkspacePackage
    })
    .filter((pkg): pkg is WorkspacePackage => pkg !== null)
    .sort((left, right) => left.name.localeCompare(right.name))
}

function collectInstallTarballs (pkg: WorkspacePackage): string[] {
  const tarballs: string[] = []
  const seen = new Set<string>()

  function visit (current: WorkspacePackage): void {
    for (const section of dependencySections) {
      const dependencies = current.manifest[section] ?? {}

      for (const [dependencyName, dependencyVersion] of Object.entries(dependencies)) {
        const dependencyPackage = packageMap.get(dependencyName)
        if (!dependencyPackage) continue
        if (dependencyPackage.version !== dependencyVersion) continue
        if (seen.has(dependencyPackage.name)) continue

        visit(dependencyPackage)
        if (!dependencyPackage.tarballPath) {
          throw new Error(`Tarball path not prepared for ${dependencyPackage.name}`)
        }

        seen.add(dependencyPackage.name)
        tarballs.push(dependencyPackage.tarballPath)
      }
    }
  }

  visit(pkg)

  if (!pkg.tarballPath) {
    throw new Error(`Tarball path not prepared for ${pkg.name}`)
  }

  tarballs.push(pkg.tarballPath)
  return tarballs
}

function getTarballFileName (pkg: WorkspacePackage): string {
  return `${sanitizePackageName(pkg.name)}-${pkg.version}.tgz`
}

function getExtraInstallPackages (pkg: WorkspacePackage): string[] {
  switch (pkg.name) {
    case 'pptx-previewer':
    case '@henryge/pipto':
      return ['react@19.2.4', 'react-dom@19.2.4']
    default:
      return []
  }
}

function buildImportSmokeScript (pkg: WorkspacePackage): string {
  switch (pkg.name) {
    case 'json2pptx-schema':
      return `
import assert from 'node:assert/strict'
import { parseDocument, validateDocument, DEFAULT_SCHEMA_VERSION } from 'json2pptx-schema'

const parsed = parseDocument({
  title: 'Schema Smoke',
  theme: {},
  slides: [{ elements: [] }]
})

validateDocument(parsed)
assert.equal(parsed.schemaVersion, DEFAULT_SCHEMA_VERSION)
assert.equal(parsed.slides.length, 1)
`

    case 'json2pptx':
      return `
import assert from 'node:assert/strict'
import { createPPTX } from 'json2pptx'

const { blob, fileName } = await createPPTX({
  title: 'Install Smoke',
  theme: {},
  slides: [{ elements: [] }]
})

assert.ok(blob instanceof Blob)
assert.ok(blob.size > 0)
assert.equal(fileName, 'Install Smoke.pptx')
`

    case 'ppt2json':
      return `
import assert from 'node:assert/strict'
import { File } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { parsePptxToJson } from 'ppt2json'

const fixture = await readFile(${JSON.stringify(pptxFixturePath)})
const file = new File([fixture], 'template_1.pptx', { type: ${JSON.stringify(PPTX_MIME_TYPE)} })
const { presentation, warnings } = await parsePptxToJson(file)

assert.deepEqual(warnings, [])
assert.ok((presentation.slides?.length ?? 0) > 0)
`

    case 'pptx-custom':
      return `
import assert from 'node:assert/strict'
import { applyCustomTheme, parseCustomContent } from 'pptx-custom'

const slides = parseCustomContent(JSON.stringify([
  { type: 'cover', data: { title: 'Smoke', text: 'Install test' } },
  { type: 'end' }
]))
const themed = applyCustomTheme(
  {
    title: 'Custom Smoke',
    theme: {
      themeColors: ['#111111'],
      fontColor: '#000000'
    },
    slides: [
      {
        elements: [
          {
            type: 'text',
            left: 0,
            top: 0,
            width: 320,
            height: 40,
            content: '<p>Hello</p>',
            defaultColor: '#000000'
          }
        ]
      }
    ]
  },
  {
    themeColors: ['#222222'],
    fontColor: '#123456'
  }
)

assert.equal(slides.length, 2)
assert.equal(themed.theme?.fontColor, '#123456')
assert.equal(themed.slides?.length, 1)
`

    case 'pptx-previewer':
      return `
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PPTXPreviewer } from 'pptx-previewer'

const markup = renderToStaticMarkup(
  React.createElement(PPTXPreviewer, {
    slide: {
      elements: [
        {
          type: 'text',
          left: 0,
          top: 0,
          width: 320,
          height: 40,
          content: '<p>Hello smoke</p>'
        }
      ]
    }
  })
)

assert.ok(markup.includes('Hello smoke'))
`

    case '@henryge/pipto':
      return `
import assert from 'node:assert/strict'
import { File } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  DEFAULT_SCHEMA_VERSION,
  applyCustomTheme,
  createPPTX,
  importPPTXPreviewer,
  parseDocument
} from '@henryge/pipto'
import { parsePptxToJson } from '@henryge/pipto/ppt2json'
import { parseCustomContent } from '@henryge/pipto/pptx-custom'

const parsed = parseDocument({
  title: 'Umbrella Smoke',
  theme: {},
  slides: [{ elements: [] }]
})

assert.equal(parsed.schemaVersion, DEFAULT_SCHEMA_VERSION)

const { blob, fileName } = await createPPTX({
  title: 'Umbrella Smoke',
  theme: {},
  slides: [{ elements: [] }]
})

assert.ok(blob instanceof Blob)
assert.equal(fileName, 'Umbrella Smoke.pptx')

const fixture = await readFile(${JSON.stringify(pptxFixturePath)})
const file = new File([fixture], 'template_1.pptx', { type: ${JSON.stringify(PPTX_MIME_TYPE)} })
const { presentation } = await parsePptxToJson(file)

assert.ok((presentation.slides?.length ?? 0) > 0)
assert.equal(parseCustomContent(JSON.stringify([{ type: 'end' }])).length, 1)
assert.equal(
  applyCustomTheme(
    {
      title: 'Theme Smoke',
      theme: {
        themeColors: ['#111111'],
        fontColor: '#111111'
      },
      slides: [{ elements: [] }]
    },
    {
      themeColors: ['#222222'],
      fontColor: '#222222'
    }
  ).theme?.fontColor,
  '#222222'
)

const { PPTXPreviewer } = await importPPTXPreviewer()
const markup = renderToStaticMarkup(
  React.createElement(PPTXPreviewer, {
    slide: {
      elements: [
        {
          type: 'text',
          left: 0,
          top: 0,
          width: 320,
          height: 40,
          content: '<p>Hello umbrella</p>'
        }
      ]
    }
  })
)

assert.ok(markup.includes('Hello umbrella'))
`

    default:
      throw new Error(`No import smoke script configured for ${pkg.name}`)
  }
}

function sanitizePackageName (name: string): string {
  return name.replace(/^@/, '').replace(/\//g, '-')
}

function runCommand (command: string, args: string[], cwd: string): string {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      CI: 'true',
      npm_config_audit: 'false',
      npm_config_fund: 'false'
    }
  })

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(' ')}`,
        `cwd: ${cwd}`,
        result.stdout ? `stdout:\n${result.stdout}` : '',
        result.stderr ? `stderr:\n${result.stderr}` : ''
      ]
        .filter(Boolean)
        .join('\n\n')
    )
  }

  return result.stdout
}
