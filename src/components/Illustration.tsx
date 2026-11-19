import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

// Figma illustrations, exported as PNG @3x into assets/illustrations (docs/DESIGN.md).
export const illustrations = {
  scene: require('../../assets/illustrations/scene.png'), // Illustration/Scene 36:82, 360×640
  duo: require('../../assets/illustrations/duo.png'), // Illustration/Duo 36:83, 260×200
  radio: require('../../assets/illustrations/radio.png'), // Illustration/Radio 45:1357, 280×250
  doctor: require('../../assets/illustrations/role-doctor.png'), // 47:1849
  detective: require('../../assets/illustrations/role-detective.png'), // 47:1957
  villager: require('../../assets/illustrations/role-villager.png'), // 49:1918
  narrator: require('../../assets/illustrations/role-narrator.png'), // 49:2042
  hidden: require('../../assets/illustrations/role-hidden.png'), // 49:2093
  glowMask: require('../../assets/illustrations/glow-mask.png'), // screen "Glow" ellipse (white, tinted per screen), 680×560
  backdropA: require('../../assets/illustrations/backdrop-a.png'), // A5 Backdrop A, 512×876 incl. blur
  backdropB: require('../../assets/illustrations/backdrop-b.png'), // A5b Backdrop B, 1004×902 incl. blur
} as const;

export type IllustrationName = keyof typeof illustrations;

type Props = { name: IllustrationName; style: StyleProp<ImageStyle>; tintColor?: string };

export function Illustration({ name, style, tintColor }: Props) {
  return <Image source={illustrations[name]} style={style} contentFit="fill" transition={0} tintColor={tintColor} />;
}
