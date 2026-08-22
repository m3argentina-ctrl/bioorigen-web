export interface Banner {
  id: string;
  imageUrl: string;
  imageUrlMobile?: string;
  alt: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaNewTab?: boolean;
  href?: string;
  align: 'left' | 'center' | 'right';
  theme: 'light' | 'dark';
  overlay: number;
  order: number;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export const EMPTY_BANNER: Omit<Banner, 'id'> = {
  imageUrl: '',
  alt: '',
  eyebrow: '',
  title: '',
  subtitle: '',
  ctaLabel: '',
  ctaHref: '',
  ctaNewTab: false,
  align: 'left',
  theme: 'dark',
  overlay: 0.35,
  order: 0,
  active: true,
  startsAt: null,
  endsAt: null,
};

export function visibleBanners(banners: Banner[], now = new Date()): Banner[] {
  return banners
    .filter((b) => b.active && b.imageUrl)
    .filter((b) => !b.startsAt || new Date(b.startsAt) <= now)
    .filter((b) => !b.endsAt || new Date(b.endsAt) >= now)
    .sort((a, b) => a.order - b.order);
}
