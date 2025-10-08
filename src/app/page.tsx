import Hero from '@/components/sections/Hero'
import Image from 'next/image'
import CindyCard from '@/components/CindyCard'
import ChrisCard from '@/components/ChrisCard'

export default function Home() {
  return (
    <main>
      {/* Hero Section with Spline 3D */}
      <Hero />

      {/* Content Below Hero - Scrollable */}
      <section className="relative py-16 md:py-24 pb-32 md:pb-48" style={{ backgroundColor: '#01B2D6' }}>
        <div className="px-4 md:px-8" style={{ position: 'relative', zIndex: 1 }}>
          <CindyCard />
          <ChrisCard />
        </div>
      </section>

      <section className="min-h-screen bg-gray-50 px-4 md:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-5xl font-bold">Features</h2>
          <p className="mt-6 text-xl text-gray-700">
            More sections to scroll through...
          </p>
        </div>
      </section>
    </main>
  )
}