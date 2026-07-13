// Мокові дані для декоративного колажу в хіро-блоці головної сторінки.

export interface HomeCollageTile {
  image: string
  label: string
  count: string
  className: string
  dark?: boolean
}

export const HOME_COLLAGE: HomeCollageTile[] = [
  {
    image: 'https://images.unsplash.com/photo-1596466596120-2d8173f3e19c?auto=format&fit=crop&w=400&q=80',
    label: 'Tattoo',
    count: '3k',
    className: 'col-span-1 row-span-1',
  },
  {
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80',
    label: 'Poster',
    count: '4k',
    className: 'col-span-1 row-span-1',
    dark: false,
  },
  {
    image: 'https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?auto=format&fit=crop&w=500&q=80',
    label: 'Advert',
    count: '9k',
    className: 'col-span-2 row-span-1',
  },
  {
    image: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?auto=format&fit=crop&w=400&q=80',
    label: 'Deck',
    count: '5k',
    className: 'col-span-1 row-span-2',
  },
  {
    image: 'https://images.unsplash.com/photo-1509966756634-9c23dd6e6815?auto=format&fit=crop&w=500&q=80',
    label: '3d Designe',
    count: '2k',
    className: 'col-span-2 row-span-1',
  },
  {
    image: 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?auto=format&fit=crop&w=400&q=80',
    label: 'Graphics',
    count: '25k',
    className: 'col-span-1 row-span-1',
    dark: false,
  },
  {
    image: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=400&q=80',
    label: 'Ai',
    count: '30k',
    className: 'col-span-1 row-span-1',
  },
]