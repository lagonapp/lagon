import { Button } from '../../lib/components/Button';
import { CheckIcon } from '@heroicons/react/24/outline';
import { REGIONS } from '../../lib/constants';
import { Plans } from '../../lib/components/Plans';

export const metadata = {
  title: 'Pricing - Lagon',
};

export default function Pricing() {
  return (
    <section className="flex flex-col gap-16">
      <Plans />
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
              <td className="text-grey mr-8 py-4 text-base">Maximum request duration</td>
              <td>5s/request</td>
              <td>30s/request</td>
              <td>Custom</td>
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
              <td>Custom</td>
            </tr>
            <tr className="border-b border-[#1f1f2e]">
              <td className="text-grey mr-8 py-4 text-base">Functions</td>
              <td>10</td>
              <td>50</td>
              <td>Custom</td>
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
}
