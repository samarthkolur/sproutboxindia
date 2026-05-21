import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Sprout, Users, Map, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-sprout-50/30 selection:bg-sprout-200">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="mb-6 text-4xl font-black tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Our Mission is to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sprout-600 to-sprout-800">
                Decentralize Farming
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-text-secondary sm:text-xl">
              We believe that the freshest, most nutritious food shouldn&apos;t travel thousands of miles. By empowering individuals to grow microgreens from home, we&apos;re building a hyper-local food system.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-sprout-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sprout className="w-8 h-8 text-sprout-700" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Hyper-Local</h3>
                <p className="text-text-secondary">Produce grown within a 5km radius of where it&apos;s consumed, maximizing freshness.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Community First</h3>
                <p className="text-text-secondary">Empowering everyday people to become urban farmers and earn sustainable income.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-amber-700" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Health & Quality</h3>
                <p className="text-text-secondary">Microgreens pack up to 40x more nutrients than mature plants. We ensure peak quality.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Map className="w-8 h-8 text-purple-700" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Zero Waste</h3>
                <p className="text-text-secondary">Producing on demand means no over-harvesting. What we grow, we consume.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-text-primary mb-6 text-center">Our Story</h2>
            <div className="space-y-6 rounded-2xl border border-white/60 bg-white/50 p-5 text-base leading-relaxed text-text-secondary shadow-xl shadow-sprout-900/5 backdrop-blur-sm sm:rounded-3xl sm:p-8 sm:text-lg">
              <p>
                SproutBox started with a simple observation: restaurants were struggling to get consistent, fresh, and high-quality microgreens, while urban spaces sat empty and unused.
              </p>
              <p>
                Traditional agriculture requires massive land, water, and transport logistics. But microgreens are different. They grow quickly, require minimal space, and can be cultivated virtually anywhere. We realized we could flip the model upside down.
              </p>
              <p>
                Instead of one massive farm supplying the city, why not have the city be the farm? By providing the seeds, training, and logistics, we allow anyone with a spare room or balcony to become a grower. SproutBox connects these home-growers directly to local restaurants that need premium greens daily.
              </p>
              <p>
                Today, we&apos;re building the infrastructure for a distributed, resilient, and community-driven food network.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
