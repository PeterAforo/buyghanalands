import Image from "next/image";

export function Eyebrow({
  children,
  tone = "gold",
}: {
  children: React.ReactNode;
  tone?: "gold" | "green";
}) {
  const gold = tone === "gold";
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${
        gold ? "text-amber-300" : "text-emerald-700"
      }`}
    >
      <span className={`h-px w-6 ${gold ? "bg-amber-400" : "bg-emerald-500"}`} />
      {children}
    </span>
  );
}

interface PageHeroProps {
  image: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  children?: React.ReactNode;
}

export function PageHero({
  image,
  eyebrow,
  title,
  subtitle,
  align = "left",
  children,
}: PageHeroProps) {
  const centered = align === "center";
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Image src={image} alt="" fill priority className="scale-105 object-cover" />
      </div>
      <div
        className={`absolute inset-0 ${
          centered
            ? "bg-gradient-to-b from-black/70 via-black/55 to-black/70"
            : "bg-gradient-to-r from-black/80 via-black/60 to-black/40"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f2] via-transparent to-black/20" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-20 lg:pt-32 lg:pb-24">
        <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white text-shadow-hero sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p
              className={`mt-6 text-lg leading-relaxed text-white/85 text-shadow-soft ${
                centered ? "mx-auto max-w-2xl" : "max-w-xl"
              }`}
            >
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
