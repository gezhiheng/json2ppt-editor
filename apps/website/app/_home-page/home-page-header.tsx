'use client'

import { useEffect, useState } from 'react'

import { navLinks } from './content'
import { containerClass, cx, HomePageLink } from './shared'

export function HomePageHeader () {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const updateHeader = () => {
      setIsScrolled(window.scrollY > 8)
    }

    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateHeader)
    }
  }, [])

  return (
    <header
      className={cx(
        'sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-200 ease-out',
        isScrolled
          ? 'border-[rgba(217,210,199,0.36)] bg-[rgba(246,241,235,0.86)] shadow-[0_10px_28px_rgba(79,70,63,0.06)] backdrop-blur-[22px]'
          : 'border-transparent bg-transparent backdrop-blur-[18px]'
      )}
    >
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
