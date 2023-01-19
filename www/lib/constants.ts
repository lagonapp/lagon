export type Region = {
  name: string;
  top: number;
  left: number;
};

export const ALL_REGIONS: Region[] = [
  {
    name: '🇫🇷 Paris',
    top: 155,
    left: 570,
  },
  {
    name: '🇫🇮 Helsinki',
    top: 93,
    left: 647,
  },
  {
    name: '🇩🇪 Nuremberg',
    top: 150,
    left: 598,
  },
  {
    name: '🇬🇧 London',
    top: 140,
    left: 561,
  },
  {
    name: '🇵🇱 Warsaw',
    top: 137,
    left: 634,
  },
  {
    name: '🇸🇬 Singapore',
    top: 340,
    left: 905,
  },
  {
    name: '🇦🇺 Sydney',
    top: 467,
    left: 1065,
  },
  {
    name: '🇨🇦 Beauharnois',
    top: 166,
    left: 306,
  },
  {
    name: '🇺🇸 Ashburn',
    top: 195,
    left: 294,
  },
  {
    name: '🇺🇸 Hillsboro',
    top: 167,
    left: 152,
  },
  {
    name: '🇯🇵 Tokyo',
    top: 212,
    left: 1024,
  },
  {
    name: '🇮🇳 Bangalore',
    top: 301,
    left: 822,
  },
  {
    name: '🇿🇦 Johannesburg',
    top: 446,
    left: 658,
  },
  {
    name: '🇺🇸 San Francisco',
    top: 203,
    left: 154,
  },
];

export const REGIONS = ALL_REGIONS.length;
