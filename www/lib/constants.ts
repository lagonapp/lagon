export type Region = {
  name: string;
  top: number;
  left: number;
};

export const ALL_REGIONS: Region[] = [
  {
    name: '🇫🇷 Paris',
    top: 155,
    left: 576,
  },
  {
    name: '🇫🇮 Helsinki',
    top: 93,
    left: 653,
  },
  {
    name: '🇩🇪 Nuremberg',
    top: 150,
    left: 604,
  },
  {
    name: '🇬🇧 London',
    top: 141,
    left: 567,
  },
  {
    name: '🇵🇱 Warsaw',
    top: 137,
    left: 640,
  },
  {
    name: '🇸🇬 Singapore',
    top: 340,
    left: 911,
  },
  {
    name: '🇦🇺 Sydney',
    top: 467,
    left: 1071,
  },
  {
    name: '🇨🇦 Beauharnois',
    top: 166,
    left: 312,
  },
  {
    name: '🇺🇸 Ashburn',
    top: 195,
    left: 300,
  },
  {
    name: '🇺🇸 Hillsboro',
    top: 167,
    left: 158,
  },
  {
    name: '🇯🇵 Tokyo',
    top: 212,
    left: 1030,
  },
  {
    name: '🇮🇳 Bangalore',
    top: 301,
    left: 828,
  },
  {
    name: '🇿🇦 Johannesburg',
    top: 446,
    left: 664,
  },
  {
    name: '🇺🇸 San Francisco',
    top: 203,
    left: 160,
  },
];

export const REGIONS = ALL_REGIONS.length;
