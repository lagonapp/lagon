import { HomeSection } from '../lib/components/sections/HomeSection';
import { ExplainSection } from '../lib/components/sections/ExplainSection';
import { CardsSection } from '../lib/components/sections/CardsSection';
import { FeaturesSection } from '../lib/components/sections/FeaturesSection';
import { EdgeNetworkSection } from '../lib/components/sections/EdgeNetworkSection';
import { Ball } from '../lib/components/Ball';

export const metadata = {
  title: 'Deploy Serverless Functions at the Edge - Lagon',
};

export default function Home() {
  return (
    <>
      <Ball />
      <HomeSection />
      <ExplainSection />
      <FeaturesSection />
      <CardsSection />
      <EdgeNetworkSection />
    </>
  );
}
