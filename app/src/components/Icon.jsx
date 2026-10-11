// The few UI glyphs the app needs, drawn in the same soft line as the brand.
const PATHS = {
  back: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  heart: <path d="M12 19.5s-7.2-4.4-7.2-9.4A4 4 0 0 1 12 7.9a4 4 0 0 1 7.2 2.2c0 5-7.2 9.4-7.2 9.4z" />,
  share: <><path d="M12 4v11M8 8l4-4 4 4" /><path d="M6 12.5V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5.5" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  download: <><path d="M12 4v11M8 11l4 4 4-4" /><path d="M5 19.5h14" /></>,
  star: <path d="M12 4.3l2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 16.1l-4.6 2.5.9-5.2-3.8-3.6 5.2-.7z" />,
  check: <path d="M5.5 12.5l4.2 4.2L18.5 8" />,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2.2" /><path d="M15.5 8.5V6.7a2.2 2.2 0 0 0-2.2-2.2H6.7a2.2 2.2 0 0 0-2.2 2.2v6.6a2.2 2.2 0 0 0 2.2 2.2h1.8" /></>,
  alert: <><path d="M12 4.5l8.5 15h-17z" /><path d="M12 10.5v4M12 17.4v.1" /></>,
};

export default function Icon({ name, size = 22, fill = 'none', stroke = 'currentColor', width = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
