import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type IconName = 'terminal' | 'shield' | 'preview' | 'layers'
type FeatureTone = 'ember' | 'slate'
type InternalHref = ComponentPropsWithoutRef<typeof Link>['href']

const jsonTokenPattern = /("(?:\\.|[^"\\])*")(?=\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?)|(\.\.\.)|\b(true|false|null)\b/g
const featureGlowClassNames: Record<FeatureTone, string> = {
  ember: 'bg-[rgba(224,108,97,0.24)]',
  slate: 'bg-[rgba(61,77,179,0.22)]'
}
const featureIconClassNames: Record<FeatureTone, string> = {
  ember: 'text-home-ember',
  slate: 'text-home-slate'
}
const featureIconFrameClassNames: Record<FeatureTone, string> = {
  ember: 'border-[rgba(224,108,97,0.34)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,244,241,0.92))] shadow-[0_0_0_1px_rgba(224,108,97,0.12),0_14px_28px_rgba(224,108,97,0.14)]',
  slate: 'border-[rgba(61,77,179,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,245,255,0.92))] shadow-[0_0_0_1px_rgba(61,77,179,0.12),0_14px_28px_rgba(61,77,179,0.14)]'
}

export const containerClass = 'mx-auto w-full max-w-[1360px] px-6 max-[920px]:px-[14px]'
export const pillClass = 'inline-flex min-h-[30px] items-center rounded-full border border-[rgba(217,210,199,0.9)] bg-white/70 px-3 text-[0.76rem] font-bold tracking-[0.08em] text-home-muted'
export const glassPanelClass = 'border border-line bg-paper shadow-panel backdrop-blur-[20px]'
export const primaryButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ember-500 px-6 text-[0.95rem] font-bold text-white shadow-cta transition duration-200 hover:-translate-y-0.5 hover:bg-ember-400'
export const secondaryButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-paper px-6 text-[0.95rem] font-bold text-ember-500 shadow-panel transition duration-200 hover:-translate-y-0.5 hover:bg-paper-strong hover:text-ember-700'
export const featureCardBaseClass = `${glassPanelClass} animate-rise-in relative flex min-h-[290px] flex-col overflow-hidden rounded-[30px] p-[30px] max-[760px]:rounded-[28px] max-[760px]:p-6`

export function cx (...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type HomePageLinkProps = {
  href: string
  external?: boolean
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<'a'>, 'children' | 'className' | 'href'>

export function HomePageLink ({
  href,
  external,
  className,
  children,
  target,
  rel,
  ...props
}: HomePageLinkProps) {
  const isExternal = external ?? href.startsWith('http')

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        target={target ?? '_blank'}
        rel={rel ?? 'noreferrer'}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href as InternalHref} className={className} {...props}>
      {children}
    </Link>
  )
}

export function HighlightedJsonSnippet ({
  code
}: {
  code: string
}) {
  const lines = code.split('\n')

  return (
    <pre className='m-0 whitespace-pre-wrap font-mono text-[0.82rem] leading-[1.85] text-home-copy [tab-size:2] max-[560px]:text-[0.74rem]'>
      {lines.map((line, lineIndex) => {
        const tokens: ReactNode[] = []
        let cursor = 0

        for (const match of line.matchAll(jsonTokenPattern)) {
          const [token, keyToken, stringToken, numberToken, ellipsisToken, literalToken] = match
          const start = match.index ?? 0

          if (start > cursor) {
            tokens.push(
              <span key={`${lineIndex}-${cursor}-plain`}>
                {line.slice(cursor, start)}
              </span>
            )
          }

          let className: string | undefined

          if (keyToken) className = 'text-home-slate'
          else if (stringToken) className = 'text-home-ember'
          else if (numberToken) className = 'text-home-olive'
          else if (ellipsisToken) className = 'text-home-muted italic'
          else if (literalToken) className = 'text-home-slate-soft'

          tokens.push(
            <span key={`${lineIndex}-${start}-${token}`} className={className}>
              {token}
            </span>
          )

          cursor = start + token.length
        }

        if (cursor < line.length) {
          tokens.push(
            <span key={`${lineIndex}-${cursor}-tail`}>
              {line.slice(cursor)}
            </span>
          )
        }

        return (
          <span key={lineIndex} className='block'>
            {tokens.length > 0 ? tokens : '\u00A0'}
          </span>
        )
      })}
    </pre>
  )
}

function FeatureIcon ({
  name
}: {
  name: IconName
}) {
  if (name === 'terminal') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6.5h16v11H4z" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="m7 10 3 2.5L7 15" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        <path d="M12.5 15h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
    )
  }

  if (name === 'shield') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4.5 6.2 6.8v5.4c0 4.1 2.3 6.8 5.8 8.3 3.5-1.5 5.8-4.2 5.8-8.3V6.8z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <path d="m9.7 12 1.6 1.7 3.2-3.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    )
  }

  if (name === 'preview') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4.5" y="6.5" width="15" height="11" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 10h8M8 13h5M15.5 15.2h.01" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="M8.5 4.5v15M15.5 4.5v15" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  )
}

export function FeatureCard ({
  className,
  tone,
  icon,
  title,
  titleClassName,
  body,
  children
}: {
  className: string
  tone: FeatureTone
  icon: IconName
  title: ReactNode
  titleClassName?: string
  body: ReactNode
  children?: ReactNode
}) {
  return (
    <article className={cx(featureCardBaseClass, className)}>
      <div
        className={cx(
          'pointer-events-none absolute -bottom-[34%] -right-[10%] h-[220px] w-[220px] rounded-full opacity-30 blur-[28px]',
          featureGlowClassNames[tone]
        )}
        aria-hidden='true'
      />
      <div className='relative z-10 flex h-full flex-col'>
        <div className={cx('inline-grid h-12 w-12 place-items-center rounded-2xl border [&>svg]:h-6 [&>svg]:w-6', featureIconClassNames[tone], featureIconFrameClassNames[tone])}>
          <FeatureIcon name={icon} />
        </div>
        <h3 className={cx('mt-4 font-sans leading-[1.02] font-black tracking-[-0.05em] text-home-ink break-keep', titleClassName)}>
          {title}
        </h3>
        <div className='mt-4 max-w-[58ch] leading-[1.75] text-home-copy'>
          {body}
        </div>
        {children ? <div className='mt-7'>{children}</div> : null}
      </div>
    </article>
  )
}

export function TransformArrowIcon () {
  return (
    <span
      className='inline-flex h-[0.6em] w-[1.04em] shrink-0 translate-y-[0.03em] items-center justify-center leading-none text-home-ember max-[560px]:h-[0.56em] max-[560px]:w-[0.98em]'
      aria-hidden='true'
    >
      <svg className='block h-full w-full overflow-visible' viewBox="0 0 72 36" fill="none" aria-hidden="true">
        <path
          d="M4 11h47"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <path
          d="m42 4 9 7-9 7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <path
          d="M68 25H21"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <path
          d="m30 18-9 7 9 7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
      </svg>
    </span>
  )
}
