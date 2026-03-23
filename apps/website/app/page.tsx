import { HomePageBackground, HomePageContent } from './_home-page/sections'

export default function HomePage () {
  const playgroundHref = process.env.NEXT_PUBLIC_PLAYGROUND_URL ?? '/playground'

  return (
    <main className='relative min-h-screen overflow-clip'>
      <HomePageBackground />
      <HomePageContent playgroundHref={playgroundHref} />
    </main>
  )
}
