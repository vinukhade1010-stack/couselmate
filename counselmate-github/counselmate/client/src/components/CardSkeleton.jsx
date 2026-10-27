export default function CardSkeleton({ count = 6 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="card skeleton" aria-hidden="true" />
  ));
}
