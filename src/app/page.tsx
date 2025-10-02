import Hero from '@/components/sections/Hero'
import Image from 'next/image'

export default function Home() {
  return (
    <main>
      {/* Hero Section with Spline 3D */}
      <Hero />

      {/* Content Below Hero - Scrollable */}
      <section className="min-h-screen py-24" style={{ backgroundColor: '#01B2D6' }}>
        <div className="px-8">
          {/* Glassy Card */}
          <div
            className="relative p-12 shadow-2xl flex items-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '3rem',
              minHeight: '500px',
              maxWidth: '1200px',
              marginLeft: 'auto',
              marginRight: '3rem'
            }}
          >
            {/* Top Left Corner Label */}
            <div
              className="absolute px-6 py-2 rounded-full shadow-lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                top: '-1rem',
                left: '2rem'
              }}
            >
              <span className="text-gray-900 font-semibold text-lg">Have you met Cindy?</span>
            </div>

            {/* Cindy Image */}
            <div className="flex items-center justify-start" style={{ marginTop: '3rem' }}>
              <Image
                src="/images/ChatGPT Image Oct 1, 2025, 03_12_24 PM.png"
                alt="Cindy AI Avatar"
                width={345}
                height={345}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-screen bg-gray-50 px-8 py-24">
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