import Hero from '@/components/sections/Hero'

export default function Home() {
  return (
    <main>
      {/* Hero Section with Spline 3D */}
      <Hero />

      {/* Content Below Hero - Scrollable */}
      <section className="min-h-screen py-24" style={{ backgroundColor: '#01B2D6' }}>
        <div className="mx-auto max-w-7xl px-8 mb-12">
          <h2 className="text-5xl font-bold text-white">About</h2>
        </div>

        <div className="pr-12 max-w-7xl mx-auto">
          {/* Glassy Card */}
          <div
            className="relative p-12 shadow-2xl ml-auto"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '3rem',
              minHeight: '500px',
              width: '85%'
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

            {/* Card Content */}
            <div style={{ marginTop: '2rem' }}>
              <p className="text-xl text-white leading-relaxed">
                Content about Cindy goes here...
              </p>
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