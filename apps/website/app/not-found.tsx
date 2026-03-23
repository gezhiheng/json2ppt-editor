export default function NotFound () {
  const primaryButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ember-500 px-6 text-[0.95rem] font-bold text-[#fffaf7] shadow-cta transition duration-200 hover:-translate-y-0.5 hover:bg-ember-400'
  const secondaryButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-paper px-6 text-[0.95rem] font-bold text-ink-800 shadow-panel transition duration-200 hover:-translate-y-0.5 hover:bg-paper-strong'

  return (
    <main className='relative min-h-screen overflow-clip'>
      <div
        className='pointer-events-none absolute inset-x-0 top-0 h-[920px] blur-[12px] [background:radial-gradient(circle_at_12%_8%,rgba(224,108,97,0.2),transparent_28%),radial-gradient(circle_at_72%_16%,rgba(61,77,179,0.18),transparent_24%),radial-gradient(circle_at_48%_42%,rgba(255,255,255,0.4),transparent_32%)]'
        aria-hidden='true'
      />

      <div className='relative z-[1] mx-auto w-full max-w-[1360px] px-6 pt-[26px] max-[920px]:px-[14px]'>
        <section className='pb-24 pt-10'>
          <div className='relative overflow-hidden rounded-[36px] border border-line bg-paper px-8 py-[72px] shadow-panel backdrop-blur-[20px] max-[760px]:rounded-[28px] max-[760px]:px-6 max-[760px]:py-10'>
            <div
              className='absolute -bottom-[180px] -left-20 h-[340px] w-[340px] rounded-full bg-[rgba(224,108,97,0.24)] blur-[90px]'
              aria-hidden='true'
            />
            <div
              className='absolute -right-[6%] -top-[16%] h-[360px] w-[360px] rounded-full bg-[rgba(61,77,179,0.14)] blur-[90px]'
              aria-hidden='true'
            />

            <div className='relative z-10 mx-auto max-w-[760px] text-center'>
              <h2>页面不存在</h2>
              <p className='mt-5 text-[1.02rem] leading-[1.75] text-ink-700'>
                你访问的内容可能已经移动，或者当前地址本身就是无效链接。
              </p>
              <div className='mt-8 flex flex-wrap items-center justify-center gap-3.5 max-[560px]:flex-col max-[560px]:items-stretch'>
                <a className={primaryButtonClass} href='/'>
                  返回首页
                </a>
                <a className={secondaryButtonClass} href='/playground'>
                  打开 Playground
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
