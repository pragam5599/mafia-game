import { Image } from 'expo-image';

// Figma: Icon/Lock (45:1320) and Icon/Check (45:1323). 24×24 vectors that scale.
const icons = {
  lock: require('../../assets/icons/lock.svg'),
  check: require('../../assets/icons/check.svg'),
} as const;

export type IconName = keyof typeof icons;

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return <Image source={icons[name]} style={{ width: size, height: size }} contentFit="contain" transition={0} />;
}
