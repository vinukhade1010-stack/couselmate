import { useEffect, useRef, useState } from 'react';

/** A number that counts smoothly to its new value instead of jumping. */
export default function CountUp({ value, duration = 600 }) {
  const [shown, setShown] = useState(value ?? 0);
  const from = useRef(value ?? 0);

  useEffect(() => {
    if (value === null || value === undefined) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      from.current = value;
      return undefined;
    }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(a + (value - a) * eased);
      setShown(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span>{shown}</span>;
}
