import React, { type ComponentProps } from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

type FeatherProps = ComponentProps<typeof Feather>;

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string | 'transparent' | 'none';
} & Partial<FeatherProps>;

const NAME_MAP: Record<string, string> = {
  home: 'home',
  'shopping-bag': 'shopping-bag',
  'shopping-cart': 'shopping-cart',
  heart: 'heart',
  user: 'user',
  search: 'search',
  bell: 'bell',
  minus: 'minus',
  plus: 'plus',
  'trash-2': 'trash-2',
  grid: 'grid',
  tag: 'tag',
  sparkles: 'star',
  truck: 'truck',
  store: 'shopping-bag',
  mail: 'mail',
  'chevron-right': 'chevron-right',
  'chevron-left': 'chevron-left',
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  package: 'box',
  settings: 'settings',
  'help-circle': 'help-circle',
  'log-out': 'log-out',
  'map-pin': 'map-pin',
  'credit-card': 'credit-card',
  'refresh-cw': 'refresh-cw',
  'arrow-left': 'arrow-left',
  list: 'list',
  'edit-2': 'edit-2',
  edit: 'edit',
  check: 'check',
  x: 'x',
  'more-vertical': 'more-vertical',
  'more-horizontal': 'more-horizontal',
  'file-plus': 'file-plus',
  'file-text': 'file-text',
  info: 'info',
  'share-2': 'share-2',
  share: 'share',
  clock: 'clock',
  'check-circle': 'check-circle',
  'alert-circle': 'alert-circle',
  'x-circle': 'x-circle',
  shield: 'shield',
  award: 'award',
  'dollar-sign': 'dollar-sign',
  filter: 'filter',
  sliders: 'sliders',
};

function makeIcon(lucideName: string) {
  const featherName = NAME_MAP[lucideName] || NAME_MAP[lucideName.toLowerCase()] || 'square';

  return function Icon({ size = 24, color = '#000', fill, ...rest }: Props) {
    const useColor = fill && fill !== 'transparent' && fill !== 'none' ? fill : color;
    return <Feather name={featherName as any} size={size} color={useColor} {...(rest as any)} />;
  };
}

export function Heart({ size = 24, color = '#000', fill, ...rest }: Props) {
  if (fill && fill !== 'transparent' && fill !== 'none') {
    return <MaterialCommunityIcons name="heart" size={size} color={fill} {...(rest as any)} />;
  }
  return <Feather name="heart" size={size} color={color} {...(rest as any)} />;
}

export const Home = makeIcon('home');
export const ShoppingBag = makeIcon('shopping-bag');
export const ShoppingCart = makeIcon('shopping-cart');
export const User = makeIcon('user');
export const Search = makeIcon('search');
export const Bell = makeIcon('bell');
export const Minus = makeIcon('minus');
export const Plus = makeIcon('plus');
export const Trash2 = makeIcon('trash-2');
export const Grid = makeIcon('grid');
export const Tag = makeIcon('tag');
export const Sparkles = makeIcon('sparkles');
export const Truck = makeIcon('truck');
export const Store = makeIcon('store');
export const Mail = makeIcon('mail');
export const ChevronRight = makeIcon('chevron-right');
export const ChevronLeft = makeIcon('chevron-left');
export const ChevronDown = makeIcon('chevron-down');
export const ChevronUp = makeIcon('chevron-up');
export const Package = makeIcon('package');
export const Settings = makeIcon('settings');
export const HelpCircle = makeIcon('help-circle');
export const LogOut = makeIcon('log-out');
export const MapPin = makeIcon('map-pin');
export const RefreshCw = makeIcon('refresh-cw');
export const CreditCard = makeIcon('credit-card');
export const ArrowLeft = makeIcon('arrow-left');
export const List = makeIcon('list');
export const Edit2 = makeIcon('edit-2');
export const Check = makeIcon('check');
export const X = makeIcon('x');
export const MoreVertical = makeIcon('more-vertical');
export const MoreHorizontal = makeIcon('more-horizontal');
export const FilePlus = makeIcon('file-plus');
export const FileText = makeIcon('file-text');
export const Info = makeIcon('info');
export const Share2 = makeIcon('share-2');
export const Share = makeIcon('share');
export const Clock = makeIcon('clock');
export const CheckCircle = makeIcon('check-circle');
export const AlertCircle = makeIcon('alert-circle');
export const XCircle = makeIcon('x-circle');
export const Shield = makeIcon('shield');
export const Award = makeIcon('award');
export const DollarSign = makeIcon('dollar-sign');
export const Edit = makeIcon('edit');
export const Filter = makeIcon('filter');
export const Sliders = makeIcon('sliders');
