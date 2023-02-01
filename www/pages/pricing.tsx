import { Button } from '../lib/components/Button';
import { Card } from '../lib/components/Card';
import { Text } from '../lib/components/Text';
import { CheckIcon } from '@heroicons/react/24/outline';
import { REGIONS } from '../lib/constants';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { HTMLAttributeAnchorTarget } from 'react';

type Plan = {
  name: string;
  gradientFrom: string;
  gradientTo: string;
  price: string;
  cta: string;
  href: string;
  target?: HTMLAttributeAnchorTarget;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: 'Personal',
    gradientFrom: 'from-green',
    gradientTo: 'to-blue-1',
    price: 'Free',
    cta: 'Join the waitlist',
    href: 'https://tally.so/r/n9q1Rp',
    target: '_blank',
    features: [
      '3,000,000 free requests/month',
      `${REGIONS} regions`,
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
    price: '$10/month',
    cta: 'Join the waitlist',
    href: 'https://tally.so/r/n9q1Rp',
    target: '_blank',
    features: [
      '5,000,000 free requests/month',
      '$1/million additional requests',
      '50ms/request',
      '10 Organization members',
      'Everything in Personal',
    ],
  },
  {
    name: 'Enterprise',
    gradientFrom: 'from-purple',
    gradientTo: 'to-blue-1',
    price: 'Contact us',
    cta: 'Contact us',
    href: 'mailto:contact@lagon.app',
    features: [
      'Unlimited requests/month',
      'On-demand regions',
      'Up to 1s/request',
      'Advanced analytics',
      'Everything in Pro',
    ],
  },
];

const Pricing = () => {
  return (
    <section className="flex flex-col gap-16">
      <Head>
        <title>Pricing - Lagon</title>
      </Head>
      <motion.div
        className="relative z-10 flex flex-col items-center gap-4"
        initial={{ opacity: 0, top: 20 }}
        animate={{ opacity: 1, top: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      >
        <Text size="h2">Pricing</Text>
        <Text>Simple pricing that grows with you.</Text>
      </motion.div>
      <motion.div
        className="flex flex-col items-center justify-center gap-4 xl:flex-row xl:items-stretch"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {PLANS.map(plan => (
          <Card
            key={plan.name}
            className="flex w-full flex-col justify-between gap-6 rounded-2xl p-6 md:w-96 md:p-12"
            lineAnimation
          >
            <div className="flex flex-col gap-4">
              <Text
                className={`bg-gradient-to-r bg-clip-text font-semibold !text-transparent ${plan.gradientFrom} ${plan.gradientTo}`}
              >
                {plan.name}
              </Text>
              <Text size="h3">{plan.price}</Text>
              <div className="my-6 flex flex-col gap-4">
                {plan.features.map(feature => (
                  <Text key={feature} className="flex items-center gap-2">
                    <CheckIcon className="text-blue-1 h-4 w-4" />
                    {feature}
                  </Text>
                ))}
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="justify-center justify-self-end"
              href={plan.href}
              target={plan.target}
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </motion.div>
      <div className="overflow-x-scroll whitespace-nowrap lg:overflow-x-visible">
        <table className="text-grey mt-16 w-full table-auto">
          <thead className="bg-dark/50 sticky top-[74px] text-left backdrop-blur">
            <tr>
              <th></th>
              <th className="pb-8 text-2xl font-semibold text-white">Personal</th>
              <th className="pb-8 text-2xl font-semibold text-white">Pro</th>
              <th className="pb-8 text-2xl font-semibold text-white">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pt-2 text-base font-semibold text-white">Functions</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Free requests/month</td>
              <td>3,000,000</td>
              <td>5,000,000</td>
              <td>Custom</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Additional requests/month</td>
              <td></td>
              <td>$1/million</td>
              <td>Custom</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">CPU time</td>
              <td>10ms/request</td>
              <td>50ms/request</td>
              <td>Up to 1s/request</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">CPU startup time</td>
              <td>100ms</td>
              <td>200ms</td>
              <td>Up to 1s</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Memory</td>
              <td>128MB</td>
              <td>128MB</td>
              <td>Up to 1GB</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Code size</td>
              <td>10MB</td>
              <td>10MB</td>
              <td>Custom</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Asset size</td>
              <td>10MB</td>
              <td>10MB</td>
              <td>Custom</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Assets per Deployment</td>
              <td>100</td>
              <td>100</td>
              <td>Custom</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Automatic HTTPS</td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Custom domains</td>
              <td>10</td>
              <td>10</td>
              <td>Custom</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Environment variables</td>
              <td>100</td>
              <td>100</td>
              <td>Custom</td>
            </tr>
            <tr>
              <td className="pt-8 pb-2 text-base font-semibold text-white">Platform</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Regions</td>
              <td>{REGIONS}</td>
              <td>{REGIONS}</td>
              <td>On-demand regions</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Preview deployments</td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Cron triggers</td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Organization members</td>
              <td>1</td>
              <td>10</td>
              <td>Unlimited</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Logs</td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Analytics</td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
            </tr>
            <tr>
              <td className="text-grey mr-8 py-4 text-base">Advanced analytics</td>
              <td></td>
              <td></td>
              <td>
                <CheckIcon className="text-blue-1 h-4 w-4" />
              </td>
            </tr>
            <tr>
              <td></td>
              <td>
                <Button variant="primary" href="https://tally.so/r/n9q1Rp" target="_blank" className="mr-8 w-48">
                  Join the waitlist
                </Button>
              </td>
              <td>
                <Button variant="primary" href="https://tally.so/r/n9q1Rp" target="_blank" className="mr-8 w-48">
                  Join the waitlist
                </Button>
              </td>
              <td>
                <Button variant="primary" href="mailto:contact@lagon.app" className="w-48">
                  Contact us
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Pricing;
