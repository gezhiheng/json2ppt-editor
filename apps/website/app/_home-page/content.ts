export type HomePageLinkItem = {
  label: string
  href: string
  external?: boolean
}

export type PackagePillItem = {
  name: string
  href: string
}

export type WorkflowStep = {
  step: string
  title: string
  body: string
}

export const repositoryHref = 'https://github.com/gezhiheng/pipto'
export const docsHref = '/docs/json2pptx'

export const navLinks = [
  { label: 'Feature', href: '#features', external: false },
  { label: 'Workflow', href: '#workflow', external: false },
  { label: 'Docs', href: docsHref, external: true },
  { label: 'GitHub', href: repositoryHref, external: true }
] as const satisfies readonly HomePageLinkItem[]

export const packagePills = [
  {
    name: 'json2pptx-schema',
    href: '/docs/json2pptx-schema'
  },
  {
    name: 'json2pptx',
    href: '/docs/json2pptx'
  },
  {
    name: 'pptx2json',
    href: '/docs/pptx2json'
  },
  {
    name: 'pptx-previewer',
    href: '/docs/pptx-previewer'
  },
  {
    name: 'pptx-custom',
    href: '/docs/pptx-custom'
  }
] as const satisfies readonly PackagePillItem[]

export const workflowSteps = [
  {
    step: '1',
    title: 'JSON Input',
    body: '用 JSON 定义页面、数据和主题输入'
  },
  {
    step: '2',
    title: 'Preview / Transform',
    body: '预览 PPTX，并执行主题替换和模板适配'
  },
  {
    step: '3',
    title: 'Export / Parse',
    body: '导出 PPTX，或解析回 JSON'
  }
] as const satisfies readonly WorkflowStep[]

export function createFooterLinks (playgroundHref: string): readonly HomePageLinkItem[] {
  return [
    { label: 'Playground', href: playgroundHref, external: false },
    { label: 'Docs', href: docsHref, external: true },
    { label: 'GitHub', href: repositoryHref, external: true },
    { label: 'Issues', href: `${repositoryHref}/issues`, external: true }
  ]
}
