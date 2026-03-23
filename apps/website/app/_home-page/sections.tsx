import { heroCoverJsonSnippet } from '../../lib/hero-cover-slide'
import { HeroCoverPreview } from '../hero-cover-preview'
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
  HighlightedJsonSnippet,
  HomePageLink,
  primaryButtonClass,
  secondaryButtonClass,
  TransformArrowIcon
} from './shared'

export function HomePageBackground () {
  return (
    <div
      className='pointer-events-none absolute inset-x-0 top-0 h-[920px] blur-[12px] [background:radial-gradient(circle_at_12%_8%,rgba(224,108,97,0.2),transparent_28%),radial-gradient(circle_at_72%_16%,rgba(61,77,179,0.18),transparent_24%),radial-gradient(circle_at_48%_42%,rgba(255,255,255,0.4),transparent_32%)]'
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
    <section className='grid min-h-[calc(100svh-118px)] grid-cols-[minmax(0,0.95fr)_minmax(420px,0.98fr)] items-center gap-[clamp(40px,5vw,76px)] py-[34px] pb-28 max-[1180px]:grid-cols-1 max-[760px]:min-h-0 max-[760px]:py-[18px] max-[760px]:pb-[86px]'>
      <div className='animate-rise-in'>
        <h1 className='mt-5.5 max-w-[7.2ch] font-sans text-[clamp(3.9rem,8vw,6.7rem)] leading-[0.92] font-black tracking-[-0.05em] text-home-ink-strong break-keep max-[760px]:text-[clamp(3.05rem,16vw,4.7rem)]'>
          结构优先
          <br />
          <span className='inline-flex items-center gap-[0.18em] whitespace-nowrap'>
            <span>JSON</span>
            <TransformArrowIcon />
            <span>PPTX</span>
          </span>
          <br />
          转换工具链
        </h1>

        <p className='mt-6 max-w-[60ch] text-[1.02rem] leading-[1.75] text-home-copy'>
          Pipto 以 JSON 驱动内容生成，支持浏览器预览、模板化转换PPTX
        </p>

        <div className='mt-7 flex flex-wrap items-center gap-3.5 max-[560px]:flex-col max-[560px]:items-stretch'>
          <HomePageLink className={primaryButtonClass} href={playgroundHref} external>
            立即体验
          </HomePageLink>
          <HomePageLink className={secondaryButtonClass} href={docsHref} external>
            查看文档
          </HomePageLink>
        </div>
      </div>

      <div className='animate-[rise_0.7s_ease-out_80ms_both] relative min-h-[560px] max-[1180px]:min-h-[620px] max-[760px]:min-h-[540px] max-[560px]:min-h-[500px]' aria-label='封面 JSON 与预览'>
        <div className={cx(glassPanelClass, 'absolute left-0 top-0 w-[min(436px,78%)] rounded-[30px] p-[22px] pb-6 max-[760px]:w-full max-[560px]:rounded-[24px] max-[560px]:p-[18px]')}>
          <div className='mb-5 flex items-center justify-between gap-3 border-b border-[rgba(217,210,199,0.8)] pb-3'>
            <span className='font-mono text-[0.7rem] text-home-subtle'>presentation.json</span>
            <div className='flex gap-[7px]' aria-hidden='true'>
              <span className='h-2 w-2 rounded-full bg-[rgba(215,83,70,0.52)]' />
              <span className='h-2 w-2 rounded-full bg-[rgba(224,108,97,0.38)]' />
              <span className='h-2 w-2 rounded-full bg-[rgba(61,77,179,0.36)]' />
            </div>
          </div>

          <HighlightedJsonSnippet code={heroCoverJsonSnippet} />
        </div>

        <div className={cx(glassPanelClass, 'absolute bottom-0 right-0 w-[min(490px,84%)] rounded-[30px] p-4 max-[760px]:w-[calc(100%-20px)] max-[560px]:rounded-[24px] max-[560px]:p-3')}>
          <div className='relative aspect-[16/9] overflow-hidden rounded-[24px] border border-white/85 bg-white'>
            <HeroCoverPreview />
          </div>
        </div>
      </div>
    </section>
  )
}

function HomePageFeatures () {
  return (
    <section className='scroll-mt-[110px] pb-36 max-[760px]:pb-28' id='features'>
      <div className='mx-auto mb-[52px] max-w-[760px] text-center'>
        <h2 className='font-sans text-[clamp(2.35rem,4vw,4.2rem)] leading-[1.02] font-black tracking-[-0.05em] text-home-ink [word-break:keep-all]'>
          把 PPT 纳入工程流程
        </h2>
        <p className='mt-[18px] leading-[1.75] text-home-copy'>
          结构定义、预览、导出、回读和模板处理，围绕同一份 JSON 协作
        </p>
      </div>

      <div className='grid grid-cols-12 gap-5'>
        <FeatureCard
          className='col-span-8 max-[1180px]:col-span-12'
          tone='slate'
          icon='terminal'
          title='核心能力拆包，组合更自由'
          titleClassName='max-w-[14ch] text-[clamp(1.7rem,2.6vw,2.8rem)]'
          body={
            <>
              schema、渲染、预览、回读和主题处理各自独立
            </>
          }
        >
          <div className='mt-auto grid gap-4 min-[960px]:grid-cols-[minmax(0,1.15fr)_minmax(230px,0.85fr)]'>
            <ul className='flex list-none flex-wrap content-start gap-3 p-0' aria-label='核心能力包'>
              {packagePills.map((item) => (
                <li key={item.name} className='rounded-full shadow-panel'>
                  <HomePageLink
                    className='inline-flex items-center rounded-full border border-[rgba(217,210,199,0.86)] bg-white/76 px-[14px] py-2.5 font-mono text-[0.78rem] text-home-ink transition duration-150 hover:-translate-y-0.5 hover:border-[rgba(224,108,97,0.35)] hover:bg-white/92 hover:text-home-ember'
                    href={item.href}
                    external
                  >
                    {item.name}
                  </HomePageLink>
                </li>
              ))}
            </ul>

            <div className='grid gap-3'>
              <div className='rounded-[24px] border border-[rgba(217,210,199,0.92)] bg-white/74 p-4 shadow-panel'>
                <p className='text-[0.72rem] font-bold tracking-[0.08em] text-home-muted'>Pipeline</p>
                <div className='mt-3 flex flex-wrap gap-2' aria-hidden='true'>
                  {['Schema', 'Render', 'Preview', 'Parse'].map((label) => (
                    <span
                      key={label}
                      className='inline-flex min-h-8 items-center rounded-full bg-[rgba(61,77,179,0.08)] px-3 font-mono text-[0.74rem] font-bold text-home-slate'
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FeatureCard>

        <FeatureCard
          className='col-span-4 max-[1180px]:col-span-6 max-[920px]:col-span-12'
          tone='ember'
          icon='shield'
          title='PPTX 与 JSON 互相转换'
          titleClassName='max-w-[12ch] text-[2rem]'
          body={
            <>
              <code className='rounded-md bg-[rgba(61,77,179,0.08)] px-[0.35em] font-mono text-[0.92em] text-home-slate'>pptx2json</code> 与{' '}
              <code className='rounded-md bg-[rgba(61,77,179,0.08)] px-[0.35em] font-mono text-[0.92em] text-home-slate'>json2pptx-schema</code> 让PPTX
              回到 JSON 层继续编辑和校验
            </>
          }
        >
          <div
            className='mt-auto flex items-center gap-3 rounded-[22px] border border-[rgba(217,210,199,0.92)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,244,239,0.92))] p-4 shadow-panel'
            aria-hidden='true'
          >
            <span className='inline-flex min-h-9 items-center rounded-full bg-[rgba(224,108,97,0.12)] px-3 font-mono text-[0.78rem] font-bold text-home-ink'>
              PPTX
            </span>
            <div className='h-px flex-1 bg-[linear-gradient(90deg,rgba(224,108,97,0.4),rgba(61,77,179,0.45))]' />
            <span className='inline-flex min-h-9 items-center rounded-full bg-[rgba(61,77,179,0.1)] px-3 font-mono text-[0.78rem] font-bold text-home-slate'>
              JSON
            </span>
          </div>
        </FeatureCard>

        <FeatureCard
          className='col-span-4 max-[1180px]:col-span-6 max-[920px]:col-span-12'
          tone='slate'
          icon='preview'
          title='版式问题先在浏览器发现'
          titleClassName='max-w-[12ch] text-[2rem]'
          body={
            <>
              直接预览 presentation JSON，减少反复导出和打开 Office
            </>
          }
        >
          <div
            className='mt-auto rounded-[22px] border border-[rgba(217,210,199,0.92)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,244,239,0.92))] p-4 shadow-panel'
            aria-hidden='true'
          >
            <div className='mb-3 flex items-center justify-between text-[0.72rem] font-bold tracking-[0.08em] text-home-muted'>
              <span>Preview</span>
              <span>Live</span>
            </div>
            <div className='space-y-2.5'>
              <span className='block h-2.5 w-full rounded-full bg-[rgba(79,70,63,0.12)]' />
              <span className='block h-2.5 w-[82%] rounded-full bg-[linear-gradient(90deg,rgba(61,77,179,0.55),rgba(61,77,179,0.18))]' />
              <span className='block h-2.5 w-[62%] rounded-full bg-[linear-gradient(90deg,rgba(224,108,97,0.5),rgba(224,108,97,0.12))]' />
            </div>
          </div>
        </FeatureCard>

        <FeatureCard
          className='col-span-8 max-[1180px]:col-span-12'
          tone='ember'
          icon='layers'
          title='自定义 PPT 样式'
          titleClassName='max-w-[14ch] text-[clamp(1.7rem,2.6vw,2.8rem)]'
          body={
            <>
              支持主题色替换、内容注入
            </>
          }
        >
          <div className='mt-auto grid gap-4 min-[960px]:grid-cols-[minmax(0,0.82fr)_minmax(260px,1.18fr)]'>
            <div className='rounded-[24px] border border-[rgba(217,210,199,0.92)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,244,239,0.92))] p-5 shadow-panel'>
              <p className='text-[0.72rem] font-bold tracking-[0.08em] text-home-muted'>Style Tokens</p>
              <div className='mt-3 flex flex-wrap gap-2'>
                <span className='inline-flex min-h-8 items-center rounded-full bg-[rgba(224,108,97,0.12)] px-3 text-[0.78rem] font-bold text-home-ink'>Theme</span>
                <span className='inline-flex min-h-8 items-center rounded-full bg-[rgba(61,77,179,0.1)] px-3 text-[0.78rem] font-bold text-home-slate'>Accent</span>
                <span className='inline-flex min-h-8 items-center rounded-full bg-[rgba(111,122,84,0.12)] px-3 text-[0.78rem] font-bold text-home-olive'>Content</span>
              </div>
            </div>

            <div className='grid gap-3 min-[560px]:grid-cols-2' aria-hidden='true'>
              <div className='rounded-[24px] border border-[rgba(217,210,199,0.92)] bg-white/74 p-4 shadow-panel'>
                <div className='flex items-center gap-2 text-[0.72rem] font-bold tracking-[0.08em] text-home-muted'>
                  <span className='h-2.5 w-2.5 rounded-full bg-home-ember' />
                  <span>Theme A</span>
                </div>
                <div className='mt-4 space-y-2.5'>
                  <span className='block h-2.5 w-[74%] rounded-full bg-[rgba(79,70,63,0.18)]' />
                  <span className='block h-2.5 w-full rounded-full bg-[linear-gradient(90deg,rgba(224,108,97,0.5),rgba(224,108,97,0.14))]' />
                  <span className='block h-2.5 w-[58%] rounded-full bg-[rgba(79,70,63,0.12)]' />
                </div>
              </div>

              <div className='rounded-[24px] border border-[rgba(217,210,199,0.92)] bg-white/74 p-4 shadow-panel'>
                <div className='flex items-center gap-2 text-[0.72rem] font-bold tracking-[0.08em] text-home-muted'>
                  <span className='h-2.5 w-2.5 rounded-full bg-home-slate' />
                  <span>Theme B</span>
                </div>
                <div className='mt-4 space-y-2.5'>
                  <span className='block h-2.5 w-[64%] rounded-full bg-[rgba(79,70,63,0.18)]' />
                  <span className='block h-2.5 w-full rounded-full bg-[linear-gradient(90deg,rgba(61,77,179,0.55),rgba(61,77,179,0.16))]' />
                  <span className='block h-2.5 w-[72%] rounded-full bg-[rgba(79,70,63,0.12)]' />
                </div>
              </div>
            </div>
          </div>
        </FeatureCard>
      </div>
    </section>
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
                'relative z-[1] mx-auto mb-[18px] grid h-14 w-14 place-items-center rounded-[18px] border border-white/88 bg-white/82 font-display text-base font-extrabold text-home-ink shadow-panel',
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
            先在 Playground 验证流程，再接入业务或模板系统
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
      <div className={cx(containerClass, 'flex min-h-[100px] items-center justify-between gap-6 max-[920px]:flex-col max-[920px]:justify-center max-[920px]:py-7')}>
        <div className='inline-flex items-center gap-2.5 font-display text-[1.02rem] font-extrabold tracking-[-0.06em] text-home-ink-strong'>
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
