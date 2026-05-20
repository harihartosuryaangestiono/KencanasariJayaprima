export default function Logo({ size = 48, className = '' }) {
  return (
    <img
      src="/logo.png"
      alt="PT. Kencana Sari Jaya Logo"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
      }}
    />
  );
}

