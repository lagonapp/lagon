'use client';

import { Button } from '../../lib/components/Button';
import { Card } from '../../lib/components/Card';
import { Text } from '../../lib/components/Text';
import { CheckIcon } from '@heroicons/react/24/outline';
import { REGIONS } from '../../lib/constants';
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
      '5s/request',
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
      '30s/request',
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
      'Custom timeouts',
      'Advanced analytics',
      'Everything in Pro',
    ],
  },
];

export const Plans = () => {
  return (
    <>
      <motion.div
        className="relative z-10 flex flex-col items-center gap-4"
        initial={{ opacity: 0, top: 20 }}
        animate={{ opacity: 1, top: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      >
        <Text size="h2" className="text-white">
          Pricing
        </Text>
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
              <Text size="h3" className="text-white">
                {plan.price}
              </Text>
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
    </>
  );
};
