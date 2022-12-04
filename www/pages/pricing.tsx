import { Button } from '../lib/components/Button';
import { Card } from '../lib/components/Card';
import { Text } from '../lib/components/Text';

type Plan = {
  name: string;
  gradientFrom: string;
  gradientTo: string;
  price: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: 'Personal',
    gradientFrom: 'from-green',
    gradientTo: 'to-blue-1',
    price: 'Free',
    features: [
      '1,000,000 requests/month',
      '10ms/request',
      'Preview deployments',
      'Automatic HTTPS',
      'Custom domains',
      'Logs and analytics',
    ],
  },
  {
    name: 'Pro',
    gradientFrom: 'from-blue-1',
    gradientTo: 'to-blue-2',
    price: '$10/mo',
    features: ['5,000,000 requests/month', '50ms/request', '+ $1/M additional requests'],
  },
  {
    name: 'Enterprise',
    gradientFrom: 'from-purple',
    gradientTo: 'to-blue-1',
    price: 'Contact us',
    features: ['Custom requests/month', 'Up to 1s/request'],
  },
];

const Pricing = () => {
  return (
    <section className="flex flex-col gap-16">
      <div className="flex flex-col items-center gap-4">
        <Text size="h2">Pricing</Text>
        <Text>Generous free tier, powerful pro tier, extanded enterprise tier.</Text>
      </div>
      <div className="flex gap-4 justify-center">
        {PLANS.map(plan => (
          <Card key={plan.name} className="rounded-2xl w-96 flex flex-col justify-between gap-6 p-12" lineAnimation>
            <div className="flex flex-col gap-6">
              <Text
                className={`text-transparent bg-clip-text bg-gradient-to-r font-semibold ${plan.gradientFrom} ${plan.gradientTo}`}
              >
                {plan.name}
              </Text>
              <Text size="h3">{plan.price}</Text>
              <div className="flex flex-col gap-4 my-6">
                {plan.features.map(feature => (
                  <Text key={feature}>{feature}</Text>
                ))}
              </div>
            </div>
            <Button variant="primary" size="lg" className="justify-self-end">
              Get started
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default Pricing;
