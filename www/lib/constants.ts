export type Region = {
  name: string;
  top: string;
  left: string;
};

export const ALL_REGIONS: Region[] = [
  {
    name: '🇫🇷 Paris',
    top: '28%',
    left: '48%',
  },
  {
    name: '🇫🇮 Helsinki',
    top: '18%',
    left: '54%',
  },
  {
    name: '🇩🇪 Nuremberg',
    top: '27.5%',
    left: '50.5%',
  },
  {
    name: '🇬🇧 London',
    top: '26%',
    left: '47%',
  },
  {
    name: '🇵🇱 Warsaw',
    top: '25.5%',
    left: '53%',
  },
  {
    name: '🇸🇬 Singapore',
    top: '59%',
    left: '75.5%',
  },
  {
    name: '🇦🇺 Sydney',
    top: '83%',
    left: '88.5%',
  },
  {
    name: '🇨🇦 Beauharnois',
    top: '30.5%',
    left: '26.5%',
  },
  {
    name: '🇺🇸 Ashburn',
    top: '36%',
    left: '25%',
  },
  {
    name: '🇺🇸 Hillsboro',
    top: '30%',
    left: '13%',
  },
  {
    name: '🇯🇵 Tokyo',
    top: '37%',
    left: '86%',
  },
  {
    name: '🇮🇳 Bangalore',
    top: '53.5%',
    left: '68.7%',
  },
  {
    name: '🇿🇦 Johannesburg',
    top: '77.7%',
    left: '54.5%',
  },
  {
    name: '🇺🇸 San Francisco',
    top: '37%',
    left: '13.5%',
  },
];

export const REGIONS = ALL_REGIONS.length;

export const SHORT_DESCRIPTION = 'Deploy Serverless Functions at the Edge';
export const DESCRIPTION = `Lagon is an open-source runtime and platform that allows developers to run TypeScript and JavaScript Serverless Functions at the Edge, close to users.`;
