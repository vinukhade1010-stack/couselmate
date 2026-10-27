export default function BrandMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="currentColor" />
      <path d="M14 40V24l18-8 18 8v16l-18 8z" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="5" fill="#FFD84D" />
    </svg>
  );
}
