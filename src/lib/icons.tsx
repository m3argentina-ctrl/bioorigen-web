import {
  Sprout, Sun, MapPin, Leaf, Heart, Shield, Truck, Star,
  Clock, Award, Recycle, Package, ThumbsUp, Zap, Apple,
  FlameKindling, Wheat, Droplets, Wind, Mountain,
  CreditCard, Banknote, Phone, Headphones, CheckCircle, Gift,
  Percent, Tag, ShoppingBag, BadgePercent, Handshake, Lock,
  RefreshCw, Sparkles, Flame, Dumbbell, TreePine,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Sprout, Sun, MapPin, Leaf, Heart, Shield, Truck, Star,
  Clock, Award, Recycle, Package, ThumbsUp, Zap, Apple,
  FlameKindling, Wheat, Droplets, Wind, Mountain,
  CreditCard, Banknote, Phone, Headphones, CheckCircle, Gift,
  Percent, Tag, ShoppingBag, BadgePercent, Handshake, Lock,
  RefreshCw, Sparkles, Flame, Dumbbell, TreePine,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICON_MAP[name] ?? Sprout;
  return <Icon {...props} />;
}
