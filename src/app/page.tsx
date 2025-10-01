import Hero from '@/components/sections/Hero'

export default function Home() {
  return (
    <main>
      {/* Hero Section with Spline 3D */}
      <Hero />

      {/* Content Below Hero - Scrollable */}
      <section className="min-h-screen px-8 py-24" style={{ backgroundColor: '#01B2D6' }}>
        <div className="mx-auto max-w-7xl">
          <h2 className="text-5xl font-bold text-white">About</h2>
          <p className="mt-6 text-xl text-white">
            Your content sections go here...
          </p>
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