export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            SEO Research Portal
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Internal SEO Research Portal powered by DataForSEO APIs and AI-assisted analysis
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <div className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
              Get Started
            </div>
            <div className="text-sm font-semibold leading-6 text-foreground">
              Learn more <span aria-hidden="true">→</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}