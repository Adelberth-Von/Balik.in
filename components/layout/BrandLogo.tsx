import Image from 'next/image';

type BrandLogoProps = {
  variant?: 'icon' | 'full';
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({
  variant = 'full',
  className = '',
  priority = false,
}: BrandLogoProps) {
  const isIcon = variant === 'icon';

  return (
    <Image
      src={isIcon ? '/brand/balik-icon.png' : '/brand/balik-logo-full.png'}
      alt={isIcon ? 'Balik.In icon' : 'Balik.In'}
      width={isIcon ? 222 : 655}
      height={isIcon ? 220 : 104}
      priority={priority}
      className={`block object-contain ${className}`}
    />
  );
}
