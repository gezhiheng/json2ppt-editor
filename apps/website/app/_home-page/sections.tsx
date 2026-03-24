import { HomePageHeroVisual } from './home-page-hero-visual'
import {
  createFooterLinks,
  docsHref,
  navLinks,
  packagePills,
  repositoryHref,
  type HomePageLinkItem,
  workflowSteps
} from './content'
import {
  containerClass,
  cx,
  FeatureCard,
  glassPanelClass,
  HomePageLink,
  primaryButtonClass,
  secondaryButtonClass,
  TransformArrowIcon
} from './shared'

const packageFeatureMeta = {
  'json2pptx-schema': {
    label: 'Schema',
    detail: '校验 / 迁移',
    badgeClassName: 'bg-[rgba(61,77,179,0.1)] text-home-slate',
    accentClassName: 'from-[rgba(61,77,179,0.72)] to-[rgba(61,77,179,0.16)]'
  },
  json2pptx: {
    label: 'Render',
    detail: '导出 / 版面生成',
    badgeClassName: 'bg-[rgba(224,108,97,0.12)] text-home-ink',
    accentClassName: 'from-[rgba(224,108,97,0.72)] to-[rgba(224,108,97,0.14)]'
  },
  pptx2json: {
    label: 'Parse',
    detail: '回读 / 继续编辑',
    badgeClassName: 'bg-[rgba(61,77,179,0.1)] text-home-slate',
    accentClassName: 'from-[rgba(61,77,179,0.68)] to-[rgba(61,77,179,0.14)]'
  },
  'pptx-previewer': {
    label: 'Preview',
    detail: '浏览器预览 / 对齐检查',
    badgeClassName: 'bg-[rgba(111,122,84,0.12)] text-home-olive',
    accentClassName: 'from-[rgba(111,122,84,0.68)] to-[rgba(111,122,84,0.14)]'
  },
  'pptx-custom': {
    label: 'Theme',
    detail: '主题替换 / 内容注入',
    badgeClassName: 'bg-[rgba(224,108,97,0.12)] text-home-ink',
    accentClassName: 'from-[rgba(224,108,97,0.66)] to-[rgba(61,77,179,0.12)]'
  }
} as const

export function HomePageBackground () {
  return (
    <div
      className='pointer-events-none absolute inset-x-0 top-0 h-230 blur-md [background:radial-gradient(circle_at_12%_8%,rgba(224,108,97,0.2),transparent_28%),radial-gradient(circle_at_72%_16%,rgba(61,77,179,0.18),transparent_24%),radial-gradient(circle_at_48%_42%,rgba(255,255,255,0.4),transparent_32%)]'
      aria-hidden='true'
    />
  )
}

export function HomePageContent ({
  playgroundHref
}: {
  playgroundHref: string
}) {
  return (
    <>
      <HomePageHeader />

      <div className={cx(containerClass, 'relative z-1 pt-6.5')}>
        <HomePageHero playgroundHref={playgroundHref} />
        <HomePageFeatures />
        <HomePageWorkflow />
        <HomePageCta playgroundHref={playgroundHref} />
      </div>

      <HomePageFooter links={createFooterLinks(playgroundHref)} />
    </>
  )
}

function HomePageHeader () {
  return (
    <header className='sticky top-0 z-40 backdrop-blur-[18px]'>
      <div className={cx(containerClass, 'flex min-h-[92px] items-center justify-between gap-6 max-[760px]:min-h-0 max-[760px]:flex-wrap max-[760px]:py-4')}>
        <HomePageLink className='inline-flex items-center gap-3 text-home-ink-strong' href='/'>
          <img className='h-9 w-9 shrink-0' src='/favicon.svg' alt='' aria-hidden='true' />
          <span className='font-display text-[1.1rem] font-extrabold'>Pipto</span>
        </HomePageLink>

        <nav className='flex items-center gap-7 text-[0.95rem] font-semibold text-home-copy max-[920px]:hidden' aria-label='主导航'>
          {navLinks.map((item) => (
            <HomePageLink
              key={item.label}
              className='transition duration-150 hover:text-home-ember'
              href={item.href}
              external={item.external}
            >
              {item.label}
            </HomePageLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

function HomePageHero ({
  playgroundHref
}: {
  playgroundHref: string
}) {
  return (
    <section className='grid min-h-[calc(100svh-118px)] grid-cols-[minmax(0,0.95fr)_minmax(420px,0.98fr)] items-center gap-[clamp(40px,5vw,76px)] py-[34px] pb-28 max-[1180px]:grid-cols-1 min-[761px]:max-[1180px]:min-h-0 min-[761px]:max-[1180px]:justify-items-center min-[761px]:max-[1180px]:gap-14 min-[761px]:max-[1180px]:py-8 min-[761px]:max-[1180px]:pb-24 max-[760px]:min-h-0 max-[760px]:py-[18px] max-[760px]:pb-[86px]'>
      <div className='animate-rise-in min-[761px]:max-[1180px]:mx-auto min-[761px]:max-[1180px]:max-w-215 min-[761px]:max-[1180px]:text-center'>
        <h1 className='mt-5.5 max-w-[7.2ch] font-sans text-[clamp(3.9rem,8vw,6.7rem)] leading-[0.93] font-extrabold tracking-[-0.042em] text-home-ink break-keep min-[761px]:max-[1180px]:mx-auto min-[761px]:max-[1180px]:max-w-[9.4ch] min-[761px]:max-[1180px]:text-[clamp(3.15rem,9vw,5rem)] min-[761px]:max-[1180px]:leading-[0.95] max-[760px]:text-[clamp(2.8rem,14vw,4.25rem)] max-[560px]:text-[clamp(2.34rem,13.2vw,3.3rem)] max-[560px]:leading-[0.97]'>
          结构优先
          <br />
          <span className='inline-flex items-center gap-[0.18em] whitespace-nowrap max-[560px]:gap-[0.14em]'>
            <span>JSON</span>
            <TransformArrowIcon />
            <span>PPT</span>
          </span>
          <br />
          转换工具链
        </h1>

        <p className='mt-6 max-w-[60ch] text-[1.02rem] leading-[1.75] text-home-copy min-[761px]:max-[1180px]:mx-auto min-[761px]:max-[1180px]:max-w-[42ch] min-[761px]:max-[1180px]:text-[1rem]'>
          Pipto 用 JSON 定义内容，浏览器即时预览，一键生成 PPT
        </p>

        <div className='mt-7 flex flex-wrap items-center gap-3.5 min-[761px]:max-[1180px]:justify-center max-[560px]:flex-col max-[560px]:items-stretch'>
          <HomePageLink className={primaryButtonClass} href={playgroundHref} external>
            立即体验
          </HomePageLink>
          <HomePageLink className={secondaryButtonClass} href={docsHref} external>
            查看文档
          </HomePageLink>
        </div>
      </div>

      <HomePageHeroVisual />
    </section>
  )
}

function HomePageFeatures () {
  return (
    <section className='scroll-mt-27.5 pb-36 max-[760px]:pb-28' id='features'>
      <div className='mx-auto mb-13 max-w-190 text-center'>
        <h2 className='font-sans text-[clamp(2.35rem,4vw,4.2rem)] leading-[1.02] font-black tracking-[-0.05em] text-home-ink [word-break:keep-all]'>
          把 PPT 纳入工程体系
        </h2>
        <p className='mt-4.5 leading-[1.75] text-home-copy'>
          结构定义、预览、导出、回读和模板处理，围绕同一份 JSON 协作
        </p>
      </div>

      <div className='grid grid-cols-12 gap-5'>
        <FeatureCard
          className='col-span-8 max-[1180px]:col-span-12'
          tone='slate'
          icon='terminal'
          title='核心能力拆包 组合更自由'
          titleClassName='max-w-[14ch] text-[clamp(1.7rem,2.6vw,2.8rem)]'
          body={
            <>
              各环节独立：Schema、渲染、预览、回读与主题处理
            </>
          }
        >
          <FeatureModulesVisual />
        </FeatureCard>

        <FeatureCard
          className='col-span-4 max-[1180px]:col-span-6 max-[920px]:col-span-12'
          tone='ember'
          icon='shield'
          title='PPT 与 JSON 互相转换'
          titleClassName='max-w-[12ch] text-[2rem]'
          body={
            <>
              <code className='rounded-md bg-[rgba(61,77,179,0.08)] px-[0.35em] font-mono text-[0.92em] text-home-slate'>pptx2json</code> 与{' '}
              <code className='rounded-md bg-[rgba(61,77,179,0.08)] px-[0.35em] font-mono text-[0.92em] text-home-slate'>json2pptx-schema</code> 让PPT
              回到 JSON 层继续编辑和校验
            </>
          }
        >
          <FeatureRoundTripVisual />
        </FeatureCard>

        <FeatureCard
          className='col-span-4 max-[1180px]:col-span-6 max-[920px]:col-span-12'
          tone='slate'
          icon='preview'
          title='预览PPT'
          titleClassName='max-w-[14ch] text-[clamp(1.7rem,2.6vw,2.8rem)]'
          body={
            <>
              直接预览 JSON 演示内容，减少反复导出与打开 Office
            </>
          }
        >
          <FeaturePreviewVisual />
        </FeatureCard>

        <FeatureCard
          className='col-span-8 max-[1180px]:col-span-12'
          tone='ember'
          icon='layers'
          title='自定义 PPT 样式'
          titleClassName='max-w-[14ch] text-[clamp(1.7rem,2.6vw,2.8rem)]'
          body={
            <>
              一键替换主题，灵活注入内容
            </>
          }
        >
          <FeatureThemeStudioVisual />
        </FeatureCard>
      </div>
    </section>
  )
}

function FeatureModulesVisual () {
  return (
    <div className='rounded-[28px] border border-[rgba(217,210,199,0.92)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(246,242,236,0.94))] p-5'>
      <div className='mt-5 grid gap-3 min-[1040px]:grid-cols-5 min-[620px]:grid-cols-2'>
        {packagePills.map((item) => {
          const meta = packageFeatureMeta[item.name]

          return (
            <HomePageLink
              key={item.name}
              className='group rounded-[22px] border border-[rgba(217,210,199,0.88)] bg-white/82 p-4 shadow-[0_18px_40px_rgba(79,70,63,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(224,108,97,0.26)] hover:bg-white/94'
              href={item.href}
              external
            >
              <span className={cx('inline-flex min-h-8 items-center rounded-full px-3 text-[0.72rem] font-bold tracking-[0.06em]', meta.badgeClassName)}>
                {meta.label}
              </span>
              <strong className='mt-4 block font-mono text-[0.84rem] leading-[1.55] text-home-ink'>
                {item.name}
              </strong>
              <span className='mt-2 block text-[0.77rem] leading-[1.65] text-home-copy'>
                {meta.detail}
              </span>
              <span className={cx('mt-4 block h-0.75 w-13.5 rounded-full bg-linear-to-r transition duration-200 group-hover:w-18', meta.accentClassName)} aria-hidden='true' />
            </HomePageLink>
          )
        })}
      </div>
    </div>
  )
}

function FeatureRoundTripVisual () {
  return (
    <div
      className='rounded-3xl border border-[rgba(217,210,199,0.92)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(247,244,239,0.94))] p-4'
      aria-hidden='true'
    >
      <div className='grid items-center gap-3 min-[561px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'>
        <div className='rounded-[20px] border border-[rgba(217,210,199,0.82)] bg-white/86 p-3.5'>
          <div className='flex items-center justify-between text-[0.68rem] font-bold tracking-[0.08em] text-home-muted'>
            <span>PPTX</span>
            <span>Slide</span>
          </div>
          <div className='mt-3 rounded-2xl bg-[rgba(224,108,97,0.06)] p-3'>
            <span className='block h-2.5 w-[72%] rounded-full bg-[rgba(79,70,63,0.18)]' />
            <div className='mt-3 grid grid-cols-[1.05fr_0.95fr] gap-2.5'>
              <span className='h-18 rounded-xl bg-[linear-gradient(160deg,rgba(224,108,97,0.28),rgba(255,255,255,0.7))]' />
              <div className='space-y-2'>
                <span className='block h-2.5 w-full rounded-full bg-[rgba(224,108,97,0.34)]' />
                <span className='block h-2.5 w-[84%] rounded-full bg-[rgba(79,70,63,0.12)]' />
                <span className='block h-2.5 w-[66%] rounded-full bg-[rgba(79,70,63,0.12)]' />
              </div>
            </div>
          </div>
        </div>

        <div className='grid justify-items-center gap-2 text-[2rem]'>
          <TransformArrowIcon />
        </div>

        <div className='rounded-[20px] border border-[rgba(217,210,199,0.82)] bg-white/86 p-3.5'>
          <div className='flex items-center justify-between text-[0.68rem] font-bold tracking-[0.08em] text-home-muted'>
            <span>JSON</span>
            <span>Schema</span>
          </div>
          <div className='mt-3 rounded-[16px] bg-[rgba(61,77,179,0.06)] p-3 font-mono text-[0.72rem] leading-[1.7] text-home-copy'>
            <span className='block text-home-slate'>{'{'} "slides": [</span>
            <span className='block pl-3'>{'{'} "type": <span className='text-home-ember'>"title"</span>,</span>
            <span className='block pl-3'><span className='text-home-slate'>"theme"</span>: <span className='text-home-ember'>"deck-a"</span></span>
            <span className='block text-home-slate'>] {'}'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturePreviewVisual () {
  return (
    <div
      className='overflow-hidden rounded-[24px] border border-[rgba(217,210,199,0.92)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(247,244,239,0.94))] shadow-panel'
      aria-hidden='true'
    >
      <div className='p-4'>
        <div className='grid gap-3 min-[560px]:grid-cols-[minmax(0,1fr)_118px]'>
          <div className='rounded-[18px] border border-[rgba(217,210,199,0.82)] bg-white/88 p-4'>
            <span className='block h-3 w-[46%] rounded-full bg-[rgba(79,70,63,0.2)]' />
            <div className='mt-4 grid grid-cols-[1.04fr_0.96fr] gap-3'>
              <span className='h-20 rounded-[14px] bg-[linear-gradient(165deg,rgba(61,77,179,0.24),rgba(255,255,255,0.92))]' />
              <div className='space-y-2.5'>
                <span className='block h-2.5 w-full rounded-full bg-[rgba(79,70,63,0.14)]' />
                <span className='block h-2.5 w-[84%] rounded-full bg-[rgba(61,77,179,0.28)]' />
                <span className='block h-2.5 w-[66%] rounded-full bg-[rgba(224,108,97,0.26)]' />
              </div>
            </div>
            <div className='mt-4 grid grid-cols-3 gap-2.5'>
              <span className='h-11 rounded-[12px] bg-[rgba(61,77,179,0.08)]' />
              <span className='h-11 rounded-[12px] bg-[rgba(224,108,97,0.08)]' />
              <span className='h-11 rounded-[12px] bg-[rgba(111,122,84,0.08)]' />
            </div>
          </div>

          <div className='rounded-[18px] border border-[rgba(217,210,199,0.82)] bg-[rgba(61,77,179,0.05)] p-3.5'>
            <p className='text-[0.68rem] font-bold tracking-[0.08em] text-home-muted'>Checks</p>
            <div className='mt-3 space-y-2.5'>
              {['标题层级', '图片边距', '文本溢出'].map((label, index) => (
                <div key={label} className='flex items-center gap-2'>
                  <span className={cx('h-2.5 w-2.5 rounded-full', index === 2 ? 'bg-[rgba(224,108,97,0.52)]' : 'bg-[rgba(61,77,179,0.48)]')} />
                  <span className='text-[0.72rem] font-bold text-home-copy'>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureThemeStudioVisual () {
  return (
    <div aria-hidden='true'>
      <div className='grid gap-3 min-[760px]:grid-cols-2'>
        <ThemeVariantCard
          accentBarClassName='bg-[linear-gradient(90deg,rgba(224,108,97,0.56),rgba(224,108,97,0.14))]'
          accentBlockClassName='bg-[linear-gradient(165deg,rgba(224,108,97,0.24),rgba(255,255,255,0.94))]'
          chipClassName='bg-[rgba(224,108,97,0.12)] text-home-ink'
          dotClassName='bg-home-ember'
          title='Theme A'
        />
        <ThemeVariantCard
          accentBarClassName='bg-[linear-gradient(90deg,rgba(61,77,179,0.58),rgba(61,77,179,0.16))]'
          accentBlockClassName='bg-[linear-gradient(165deg,rgba(61,77,179,0.24),rgba(255,255,255,0.94))]'
          chipClassName='bg-[rgba(61,77,179,0.1)] text-home-slate'
          dotClassName='bg-home-slate'
          title='Theme B'
        />
      </div>
    </div>
  )
}

function ThemeVariantCard ({
  accentBarClassName,
  accentBlockClassName,
  chipClassName,
  dotClassName,
  title
}: {
  accentBarClassName: string
  accentBlockClassName: string
  chipClassName: string
  dotClassName: string
  title: string
}) {
  return (
    <div className='rounded-[22px] border border-[rgba(217,210,199,0.84)] bg-white/82 p-4'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2 text-[0.72rem] font-bold tracking-[0.08em] text-home-muted'>
          <span className={cx('h-2.5 w-2.5 rounded-full', dotClassName)} />
          <span>{title}</span>
        </div>
        <span className={cx('inline-flex min-h-8 items-center rounded-full px-2.5 text-[0.68rem] font-bold', chipClassName)}>Applied</span>
      </div>

      <div className='mt-4 rounded-2xl border border-[rgba(217,210,199,0.78)] bg-[rgba(247,244,239,0.76)] p-3'>
        <span className='block h-10.5 w-[58%] rounded-full bg-[rgba(79,70,63,0.18)]' />
        <div className='mt-3 grid grid-cols-[0.9fr_1.1fr] gap-3'>
          <span className={cx('h-18 rounded-xl', accentBlockClassName)} />
          <div className='space-y-2.5'>
            <span className={cx('block h-2.5 w-full rounded-full', accentBarClassName)} />
            <span className='block h-2.5 w-[82%] rounded-full bg-[rgba(79,70,63,0.12)]' />
            <span className='block h-2.5 w-[66%] rounded-full bg-[rgba(79,70,63,0.12)]' />
          </div>
        </div>
      </div>
    </div>
  )
}

function HomePageWorkflow () {
  return (
    <section className='scroll-mt-[110px] pb-36 max-[760px]:pb-28' id='workflow'>
      <div className='mx-auto mb-[52px] max-w-[760px] text-center'>
        <h2 className='font-sans text-[clamp(2.35rem,4vw,4.2rem)] leading-[1.02] font-black tracking-[-0.05em] text-home-ink [word-break:keep-all]'>
          定义到导出流程
        </h2>
        <span className='mx-auto mt-[18px] block h-1 w-[84px] rounded-full bg-[linear-gradient(90deg,var(--ember-400),var(--slateblue-500))]' aria-hidden='true' />
        <p className='mt-[18px] leading-[1.75] text-home-copy'>
          一份 JSON，完成定义到导出
        </p>
      </div>

      <div className="relative grid grid-cols-3 gap-[26px] before:absolute before:left-[18%] before:right-[18%] before:top-[30px] before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(197,187,175,0.9),transparent)] before:content-[''] max-[920px]:grid-cols-1 max-[920px]:before:hidden">
        {workflowSteps.map((item) => (
          <article key={item.step} className='relative px-4 text-center max-[560px]:px-0'>
            <div
              className={cx(
                'relative z-[1] mx-auto mb-[18px] grid h-14 w-14 place-items-center rounded-[18px] border border-white/88 bg-white/82 font-display text-base font-extrabold text-home-ink',
                item.step === '2' && 'text-home-slate',
                item.step === '3' && 'border-transparent bg-[linear-gradient(135deg,rgba(224,108,97,0.92),rgba(61,77,179,0.88))] text-white'
              )}
            >
              {item.step}
            </div>
            <h3 className='m-0 text-[1.12rem] font-black text-home-ink'>{item.title}</h3>
            <p className='mt-3 text-[0.95rem] leading-[1.75] text-home-copy'>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function HomePageCta ({
  playgroundHref
}: {
  playgroundHref: string
}) {
  return (
    <section className='pb-[132px] max-[760px]:pb-24'>
      <div className={cx(glassPanelClass, 'relative overflow-hidden rounded-[36px] px-8 py-[72px] max-[760px]:rounded-[28px] max-[760px]:p-6 animate-rise-in')}>
        <div
          className='absolute -bottom-[180px] -left-20 h-[340px] w-[340px] rounded-full bg-[rgba(224,108,97,0.24)] blur-[90px]'
          aria-hidden='true'
        />
        <div
          className='absolute -right-[6%] -top-[16%] h-[360px] w-[360px] rounded-full bg-[rgba(61,77,179,0.14)] blur-[90px]'
          aria-hidden='true'
        />
        <div className='relative z-10 mx-auto max-w-[760px] text-center'>
          <h2 className='font-sans text-[clamp(2.9rem,6vw,5.4rem)] leading-[0.96] font-black tracking-[-0.05em] text-home-ink'>
            搭建你的 PPT Pipeline
          </h2>
          <p className='mt-5 leading-[1.75] text-home-copy'>
            先在 Playground 定义与调试 JSON，再接入业务
          </p>
          <div className='mt-[30px] flex flex-wrap items-center justify-center gap-3.5 max-[560px]:flex-col max-[560px]:items-stretch'>
            <HomePageLink className={primaryButtonClass} href={playgroundHref}>
              打开 Playground
            </HomePageLink>
            <HomePageLink className={secondaryButtonClass} href={docsHref} external>
              查看文档
            </HomePageLink>
          </div>
        </div>
      </div>
    </section>
  )
}

function HomePageFooter ({
  links
}: {
  links: readonly HomePageLinkItem[]
}) {
  return (
    <footer className='border-t border-white/70 bg-white/42 backdrop-blur-[18px]'>
      <div className={cx(containerClass, 'flex min-h-25 items-center justify-between gap-6 max-[920px]:flex-col max-[920px]:justify-center max-[920px]:py-7')}>
        <div className='inline-flex items-center gap-2.5 font-display text-[1.02rem] font-extrabold text-home-ink-strong'>
          <img className='h-7 w-7 shrink-0' src='/favicon.svg' alt='' aria-hidden='true' />
          <span>Pipto</span>
        </div>

        <div className='flex flex-wrap justify-center gap-6 text-[0.76rem] font-bold tracking-[0.08em] text-home-muted'>
          {links.map((item) => (
            <HomePageLink
              key={item.label}
              href={item.href}
              className='transition duration-150 hover:text-home-ember'
              aria-label={item.label}
              title={item.label}
              external={item.external}
            >
              {item.label}
            </HomePageLink>
          ))}
        </div>

        <p className='max-w-[30ch] text-right text-[0.78rem] leading-[1.75] text-home-copy max-[920px]:max-w-none max-[920px]:text-center'>
          © 2026 Henry Ge
        </p>
      </div>
    </footer>
  )
}
