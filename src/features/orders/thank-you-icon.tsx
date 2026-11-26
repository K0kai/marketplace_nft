/** Envelope do layout de confirmação, redesenhado em SVG (o arquivo original não veio no pacote). */
export function ThankYouIcon() {
  return (
    <svg
      viewBox="0 0 80 98"
      className="text-primary h-[74px] w-auto"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2 38v54a4 4 0 0 0 4 4h68a4 4 0 0 0 4-4V38L68 27M2 38l10-11" />
      <path d="M12 53V12a3 3 0 0 1 3-3h50a3 3 0 0 1 3 3v41M30 9l7-6a5 5 0 0 1 6 0l7 6" />
      <path d="m2 40 31 31M78 40 47 71M3 94l30-33a10 10 0 0 1 14 0l12 13m6 7 12 13" />
      <g fill="currentColor" stroke="none" fontSize="13" fontWeight="700" textAnchor="middle">
        <text x="40" y="28">
          THANK
        </text>
        <text x="40" y="43">
          YOU
        </text>
      </g>
    </svg>
  )
}
