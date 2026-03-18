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
const libDir = path.join(rootDir, 'src/lib')
const dependencySections = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies'
] as const
const packageInstallTimeout = 300_000

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

      runCommand(
        'npm',
        [
          'install',
          '--no-audit',
          '--no-fund',
          '--package-lock=false',
          ...installTarballs
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
