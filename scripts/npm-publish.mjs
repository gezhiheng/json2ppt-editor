import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const VALID_MODES = new Set(['plan', 'check', 'publish'])
const mode = process.argv[2] ?? 'check'

if (!VALID_MODES.has(mode)) {
  console.error(`Unsupported mode "${mode}". Use one of: ${Array.from(VALID_MODES).join(', ')}`)
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const packageDirs = [
  'src/lib/json2pptx-schema',
  'src/lib/json2pptx',
  'src/lib/pptx-custom',
  'src/lib/pptx-previewer',
  'src/lib/pptx2json'
]
const dependencySections = ['dependencies', 'optionalDependencies', 'peerDependencies']
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const registryCache = new Map()

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function loadPackages() {
  const packages = await Promise.all(
    packageDirs.map(async (relativeDir) => {
      const dir = path.join(rootDir, relativeDir)
      const manifest = await readJson(path.join(dir, 'package.json'))

      return {
        dir,
        relativeDir,
        manifest,
        name: manifest.name,
        version: manifest.version
      }
    })
  )

  return topologicallySortPackages(packages)
}

function topologicallySortPackages(packages) {
  const packageMap = new Map(packages.map((pkg) => [pkg.name, pkg]))
  const visiting = new Set()
  const visited = new Set()
  const sorted = []

  function visit(pkg) {
    if (visited.has(pkg.name)) {
      return
    }

    if (visiting.has(pkg.name)) {
      throw new Error(`Detected a workspace dependency cycle involving ${pkg.name}`)
    }

    visiting.add(pkg.name)

    for (const depName of getLocalDependencyNames(pkg, packageMap)) {
      visit(packageMap.get(depName))
    }

    visiting.delete(pkg.name)
    visited.add(pkg.name)
    sorted.push(pkg)
  }

  for (const pkg of packages) {
    visit(pkg)
  }

  return sorted
}

function getLocalDependencyNames(pkg, packageMap) {
  const localDeps = new Set()

  for (const section of dependencySections) {
    for (const depName of Object.keys(pkg.manifest[section] ?? {})) {
      if (packageMap.has(depName)) {
        localDeps.add(depName)
      }
    }
  }

  return localDeps
}

async function getRegistryMetadata(packageName) {
  if (registryCache.has(packageName)) {
    return registryCache.get(packageName)
  }

  const encodedName = packageName.replace('/', '%2f')
  const response = await fetch(`https://registry.npmjs.org/${encodedName}`, {
    headers: {
      Accept: 'application/json'
    }
  })

  if (response.status === 404) {
    registryCache.set(packageName, null)
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to query npm registry for ${packageName}: ${response.status} ${response.statusText}`)
  }

  const metadata = await response.json()
  registryCache.set(packageName, metadata)
  return metadata
}

function isExactVersion(value) {
  return semverPattern.test(value)
}

function normalizeRepositoryUrl(value) {
  return String(value ?? '')
    .trim()
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/\/+$/, '')
    .toLowerCase()
}

function runCommand(command, args, cwd) {
  const env = { ...process.env }

  if (command === 'npm') {
    for (const key of [
      'npm_config_npm_globalconfig',
      'npm_config_verify_deps_before_run',
      'npm_config__jsr_registry',
      'npm_config_link_workspace_packages',
      'NPM_CONFIG_NPM_GLOBALCONFIG',
      'NPM_CONFIG_VERIFY_DEPS_BEFORE_RUN',
      'NPM_CONFIG__JSR_REGISTRY',
      'NPM_CONFIG_LINK_WORKSPACE_PACKAGES'
    ]) {
      delete env[key]
    }
  }

  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env
  })

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`)
  }
}

async function validatePackages(packages, releasePlan) {
  const packageMap = new Map(packages.map((pkg) => [pkg.name, pkg]))
  const releaseNames = new Set(releasePlan.map((pkg) => pkg.name))
  const warnings = []
  const errors = []
  const expectedRepositoryUrl = process.env.GITHUB_REPOSITORY
    ? normalizeRepositoryUrl(`https://github.com/${process.env.GITHUB_REPOSITORY}`)
    : ''

  for (const pkg of releasePlan) {
    if (!pkg.name || !pkg.version) {
      errors.push(`${pkg.relativeDir}: package.json is missing name or version`)
      continue
    }

    if (pkg.manifest.private) {
      errors.push(`${pkg.name}: private packages cannot be published`)
    }

    if (!isExactVersion(pkg.version)) {
      errors.push(`${pkg.name}: version "${pkg.version}" must be an exact semver version`)
    }

    if (!pkg.manifest.repository) {
      warnings.push(`${pkg.name}: package.json is missing repository metadata, which weakens npm provenance links`)
    }

    for (const section of dependencySections) {
      const dependencies = pkg.manifest[section] ?? {}

      for (const [depName, depVersion] of Object.entries(dependencies)) {
        const localDep = packageMap.get(depName)

        if (!localDep) {
          continue
        }

        if (typeof depVersion !== 'string' || depVersion.startsWith('workspace:')) {
          errors.push(
            `${pkg.name}: ${section}.${depName} uses "${depVersion}". Use a published exact version string when publishing with npm CLI.`
          )
          continue
        }

        if (!isExactVersion(depVersion)) {
          errors.push(
            `${pkg.name}: ${section}.${depName} must be pinned to an exact version, received "${depVersion}"`
          )
          continue
        }

        const depRegistryMetadata = await getRegistryMetadata(depName)
        const depVersionPublished = Boolean(depRegistryMetadata?.versions?.[depVersion])
        const matchesLocalVersion = depVersion === localDep.version

        if (!depVersionPublished && !matchesLocalVersion) {
          errors.push(
            `${pkg.name}: ${section}.${depName}@${depVersion} is neither published on npm nor available as the current workspace version (${localDep.version})`
          )
          continue
        }

        if (depVersion !== localDep.version && releaseNames.has(pkg.name)) {
          warnings.push(
            `${pkg.name}: ${depName} is pinned to ${depVersion}, while the workspace currently has ${localDep.version}. This package will publish against ${depVersion}.`
          )
        }
      }
    }

    if (expectedRepositoryUrl) {
      const actualRepositoryUrl = normalizeRepositoryUrl(pkg.manifest.repository?.url)
      if (actualRepositoryUrl !== expectedRepositoryUrl) {
        errors.push(
          `${pkg.name}: repository.url resolves to "${pkg.manifest.repository?.url}", expected the current GitHub repository "${expectedRepositoryUrl}"`
        )
      }
    }
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:')
    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }

  if (errors.length > 0) {
    console.error('\nRelease validation failed:')
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }
}

function printPlan(packages, releasePlan) {
  const releaseNames = new Set(releasePlan.map((pkg) => pkg.name))

  console.log(`Mode: ${mode}`)
  console.log('\nWorkspace packages:')

  for (const pkg of packages) {
    const action = releaseNames.has(pkg.name) ? 'publish' : 'skip'
    console.log(`- ${pkg.name}@${pkg.version} [${action}]`)
  }

  if (releasePlan.length === 0) {
    console.log('\nAll workspace package versions are already published on npm.')
    return
  }

  console.log('\nRelease order:')
  for (const pkg of releasePlan) {
    console.log(`- ${pkg.name}@${pkg.version}`)
  }
}

async function buildAndPack(releasePlan) {
  const packageMap = new Map((await loadPackages()).map((pkg) => [pkg.name, pkg]))
  const releaseNames = new Set(releasePlan.map((pkg) => pkg.name))
  const buildNames = new Set()

  function includeBuildDependencies(pkg) {
    if (buildNames.has(pkg.name)) {
      return
    }

    buildNames.add(pkg.name)

    for (const depName of getLocalDependencyNames(pkg, packageMap)) {
      includeBuildDependencies(packageMap.get(depName))
    }
  }

  for (const pkg of releasePlan) {
    includeBuildDependencies(pkg)
  }

  const buildPlan = Array.from(packageMap.values()).filter((pkg) => buildNames.has(pkg.name))

  console.log('\nBuild order:')
  for (const pkg of buildPlan) {
    const role = releaseNames.has(pkg.name) ? 'release target' : 'local dependency'
    console.log(`- ${pkg.name}@${pkg.version} [${role}]`)
  }

  for (const pkg of buildPlan) {
    console.log(`\nBuilding ${pkg.name}@${pkg.version}`)
    runCommand('pnpm', ['run', 'build'], pkg.dir)
  }

  for (const pkg of releasePlan) {
    console.log(`Packing ${pkg.name}@${pkg.version} (dry-run)`)
    runCommand('npm', ['pack', '--dry-run', '--json'], pkg.dir)
  }
}

async function publishPackages(releasePlan) {
  for (const pkg of releasePlan) {
    const args = ['publish', '--provenance']
    const access = pkg.manifest.publishConfig?.access

    if (typeof access === 'string' && access.length > 0) {
      args.push('--access', access)
    }

    console.log(`\nPublishing ${pkg.name}@${pkg.version}`)
    runCommand('npm', args, pkg.dir)
  }
}

async function main() {
  const packages = await loadPackages()

  for (const pkg of packages) {
    pkg.registryMetadata = await getRegistryMetadata(pkg.name)
  }

  const releasePlan = packages.filter((pkg) => !pkg.registryMetadata?.versions?.[pkg.version])

  printPlan(packages, releasePlan)

  if (releasePlan.length === 0) {
    return
  }

  await validatePackages(packages, releasePlan)

  if (mode === 'plan') {
    return
  }

  await buildAndPack(releasePlan)

  if (mode === 'check') {
    console.log('\nRelease check passed.')
    return
  }

  await publishPackages(releasePlan)
  console.log('\nPublish flow completed.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
