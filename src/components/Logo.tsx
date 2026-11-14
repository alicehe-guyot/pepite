// Logo Pépite : un cadeau jaune soleil, ruban framboise, deux étincelles (DA plus joyeuse, #68).
export function GiftMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M50 6l1.6 4.4L56 12l-4.4 1.6L50 18l-1.6-4.4L44 12l4.4-1.6z" fill="#1E7A5A" />
      <path d="M11 8l1 2.8 2.8 1-2.8 1L11 15.6l-1-2.8-2.8-1 2.8-1z" fill="#7B4FD6" />
      <rect x="12" y="30" width="40" height="26" rx="4" fill="#FFD45C" />
      <rect x="9" y="22" width="46" height="11" rx="4" fill="#FFC21A" />
      <rect x="28" y="22" width="8" height="34" fill="#C2255C" />
      <path d="M32 22c-4-9-15-11-15-4 0 4 7 5 15 4zM32 22c4-9 15-11 15-4 0 4-7 5-15 4z" fill="#E0457B" stroke="#C2255C" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="32" cy="22" r="3.5" fill="#C2255C" />
    </svg>
  );
}
