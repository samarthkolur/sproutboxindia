import { cn } from "@/lib/utils";

// Shown while three.js loads, and kept if WebGL is unavailable: a still picture of a
// tray of sunflower shoots. Purely decorative (the story is in the text beside it).
export function GrowthFallback({ className }: { className?: string }) {
  const shoots = [
    { x: 70, h: 96, lean: -4 },
    { x: 112, h: 128, lean: 3 },
    { x: 154, h: 108, lean: -2 },
    { x: 196, h: 138, lean: 5 },
    { x: 238, h: 100, lean: -3 },
  ];
  return (
    <svg viewBox="0 0 308 230" aria-hidden="true" className={cn("h-full w-full", className)} preserveAspectRatio="xMidYMid meet">
      <rect x="28" y="150" width="252" height="62" rx="8" className="fill-ink/90" />
      <rect x="34" y="150" width="240" height="46" className="fill-[#6a4a30]" opacity="0.85" />
      {shoots.map((shoot) => (
        <g key={shoot.x} transform={`translate(${shoot.x} 150)`}>
          <path d={`M0 0 Q ${shoot.lean} ${-shoot.h / 2} ${shoot.lean * 1.5} ${-shoot.h}`} className="stroke-[#9bc46a]" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx={shoot.lean * 1.5 - 14} cy={-shoot.h + 2} rx="15" ry="6" transform={`rotate(-18 ${shoot.lean * 1.5 - 14} ${-shoot.h + 2})`} className="fill-[#5c9e47]" />
          <ellipse cx={shoot.lean * 1.5 + 14} cy={-shoot.h + 2} rx="15" ry="6" transform={`rotate(18 ${shoot.lean * 1.5 + 14} ${-shoot.h + 2})`} className="fill-[#5c9e47]" />
        </g>
      ))}
    </svg>
  );
}
