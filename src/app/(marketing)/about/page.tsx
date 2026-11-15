import { Heart, Leaf, MapPin, Users } from "lucide-react";
import { ClosingCta } from "@/components/marketing/landing/ClosingCta";
import { Panel } from "@/components/ui/panel";

const VALUES = [
  {
    icon: MapPin,
    title: "Hyper-Local",
    description: "Produce grown close to where it's eaten, so it reaches the kitchen fresher.",
  },
  {
    icon: Users,
    title: "Community First",
    description: "Empowering everyday people to become urban farmers and earn sustainable income.",
  },
  {
    icon: Heart,
    title: "Health & Quality",
    description: "Microgreens are dense in nutrients, and every harvest passes quality control before it ships.",
  },
  {
    icon: Leaf,
    title: "Less Waste",
    description: "We plan production around confirmed orders, which keeps surplus small.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-light leading-tight tracking-tight text-ink text-balance sm:text-5xl lg:text-6xl">
            Our mission is to decentralize farming
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-ink-soft sm:text-xl">
            We believe that the freshest, most nutritious food shouldn&apos;t travel thousands of miles. By empowering
            individuals to grow microgreens from home, we&apos;re building a hyper-local food system.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6">
        <ul className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <li key={value.title}>
                <Panel className="h-full">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-soft text-ink">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-ink">{value.title}</h2>
                  <p className="mt-2 text-sm text-ink-soft">{value.description}</p>
                </Panel>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-3xl font-light tracking-tight text-ink">Our Story</h2>
          <Panel padding="lg" className="space-y-5 text-base leading-relaxed text-ink-soft">
            <p className="text-lg text-ink sm:text-xl">
              SproutBox started with a simple observation: restaurants were struggling to get consistent, fresh, and
              high-quality microgreens, while urban spaces sat empty and unused.
            </p>
            <p>
              Traditional agriculture requires massive land, water, and transport logistics. But microgreens are
              different. They grow quickly, require minimal space, and can be cultivated virtually anywhere. We realized
              we could flip the model upside down.
            </p>
            <p>
              Instead of one massive farm supplying the city, why not have the city be the farm? By providing the seeds,
              training, and logistics, we allow anyone with a spare room or balcony to become a grower. SproutBox
              connects these home-growers directly to local restaurants that need premium greens daily.
            </p>
            <p>
              Today, we&apos;re building the infrastructure for a distributed, resilient, and community-driven food
              network.
            </p>
          </Panel>
        </div>
      </section>

      <ClosingCta />
    </>
  );
}
