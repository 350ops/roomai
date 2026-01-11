import { ImageSourcePropType } from 'react-native';

export type FeaturedDesign = {
  id: string;
  title: string;
  style: string;
  room: string;
  image: ImageSourcePropType;
  description: string;
  tags: string[];
  keyElements: string[];
  palette: string[];
};

export const FEATURED_DESIGNS: FeaturedDesign[] = [
  {
    id: 'modern-kitchen',
    title: 'Modern Kitchen Design',
    style: 'Contemporary',
    room: 'Kitchen',
    image: require('@/assets/img/kitch.png'),
    description:
      'Clean lines, warm wood, and layered lighting keep this kitchen bright while staying grounded.',
    tags: ['Island seating', 'Mixed metals', 'Quartz counters'],
    keyElements: [
      'Handleless cabinetry',
      'Integrated appliances',
      'Statement pendant lighting',
      'Warm oak accents',
    ],
    palette: ['#F5F1EB', '#D2C5B5', '#8D7766', '#1F1E1C'],
  },
  {
    id: 'cozy-living',
    title: 'Cozy Living Space',
    style: 'Scandinavian',
    room: 'Living Room',
    image: require('@/assets/img/livin.png'),
    description:
      'Soft textures, rounded shapes, and light neutrals create a lounge that feels relaxed and inviting.',
    tags: ['Textured throws', 'Rounded forms', 'Soft neutrals'],
    keyElements: [
      'Low profile sofa',
      'Boucle accent chair',
      'Layered rugs',
      'Soft ambient lighting',
    ],
    palette: ['#F7F4EF', '#DAD4C8', '#B48A6D', '#3A3A3A'],
  },
  {
    id: 'serene-bedroom',
    title: 'Serene Bedroom Retreat',
    style: 'Minimalist',
    room: 'Bedroom',
    image: require('@/assets/img/bedr.png'),
    description:
      'A quiet palette with soft linens and built-in storage keeps the bedroom calm and uncluttered.',
    tags: ['Neutral palette', 'Hidden storage', 'Soft lighting'],
    keyElements: [
      'Floating nightstands',
      'Linen bedding',
      'Wall sconces',
      'Flush closet doors',
    ],
    palette: ['#F2F0EC', '#CFC7BD', '#8C857A', '#2B2A29'],
  },
  {
    id: 'luxury-bathroom',
    title: 'Luxury Bathroom',
    style: 'Modern Spa',
    room: 'Bathroom',
    image: require('@/assets/img/bathr.png'),
    description:
      'Spa-inspired finishes, subtle contrast, and warm metallic touches elevate everyday routines.',
    tags: ['Stone surfaces', 'Warm metals', 'Steam shower'],
    keyElements: [
      'Frameless glass shower',
      'Stone-look tile',
      'Backlit mirror',
      'Floating vanity',
    ],
    palette: ['#F6F3EE', '#D7CFC4', '#A59786', '#1E1C1A'],
  },
];

export const getFeaturedDesign = (id?: string | string[]) => {
  const designId = Array.isArray(id) ? id[0] : id;
  if (!designId) return undefined;
  return FEATURED_DESIGNS.find((design) => design.id === designId);
};
