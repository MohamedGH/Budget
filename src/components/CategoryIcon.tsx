import React from 'react';
import {
  ShoppingBag,
  Car,
  Home,
  Banknote,
  Film,
  HeartPulse,
  Smartphone,
  CreditCard,
  Plane,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  HelpCircle,
  LucideIcon,
  Tag,
  Hammer,
  Wrench,
  HardHat,
  Paintbrush,
  Sparkles,
  Layers
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag,
  Car,
  Home,
  Banknote,
  Film,
  HeartPulse,
  Smartphone,
  CreditCard,
  Plane,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  Tag,
  Hammer,
  Wrench,
  HardHat,
  Paintbrush,
  Sparkles,
  Layers,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4', color }) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};

export function getCategoryColor(categoryName: string): string {
  switch (categoryName?.toLowerCase()) {
    case 'travaux':
      return '#ea580c'; // Orange-600
    case 'vie quotidienne':
      return '#0284c7'; // Sky-600
    case 'auto et moto':
      return '#d97706'; // Amber-600
    case 'logement':
      return '#7c3aed'; // Violet-600
    case 'retraits':
      return '#475569'; // Slate-600
    case 'loisirs':
      return '#db2777'; // Pink-600
    case 'santé':
      return '#059669'; // Emerald-600
    case 'abonnements et téléphonie':
      return '#0891b2'; // Cyan-600
    case 'services financiers / professionnels':
      return '#4f46e5'; // Indigo-600
    case 'voyages et transports':
      return '#0d9488'; // Teal-600
    case 'allocations':
      return '#16a34a'; // Green-600
    case 'virements reçus':
      return '#15803d'; // Emerald-700
    case 'virements émis':
      return '#e11d48'; // Rose-600
    default:
      return '#64748b'; // Slate-500
  }
}
