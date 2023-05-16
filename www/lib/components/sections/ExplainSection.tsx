import { DeploymentWidget } from '../DeploymentWidget';
import { Text } from '../Text';

export const ExplainSection = () => {
  return (
    <section id="features" className="pt-20">
      <div className="flex flex-col gap-12 md:gap-16 lg:flex-row">
        <div className="to-blue-1 hover:shadow-blue-1/40 group flex-1 rounded-3xl bg-gradient-to-br from-[#C9E2FF] p-[1px] transition duration-300 hover:shadow-2xl">
          <div className="bg-dark flex flex-col gap-4 rounded-3xl p-6 md:p-16">
            <div
              className="rounded-t-2xl p-[1px]"
              style={{ background: 'linear-gradient(rgb(37, 32, 46), rgba(37, 32, 46, 0)' }}
            >
              <div className="from-dark-gray to-dark h-80 rounded-t-2xl bg-gradient-to-b">
                <div style={{ borderColor: 'rgb(37, 32, 46)' }} className="flex gap-2 border-b p-4">
                  <span className="h-4 w-4 rounded-full bg-red-500" />
                  <span className="h-4 w-4 rounded-full bg-yellow-500" />
                  <span className="h-4 w-4 rounded-full bg-lime-500" />
                </div>
                <DeploymentWidget />
              </div>
            </div>
            <div className="from-purple/10 to-blue-1/10 pointer-events-none absolute h-80 w-80 translate-x-[-30%] translate-y-[-30%] transform rounded-full bg-gradient-to-br opacity-0 blur-3xl transition duration-300 group-hover:opacity-100" />
            <Text size="h2" className="text-white">
              Deploy in seconds
            </Text>
            <Text paragraph>
              Your Deployments are live all around the world in a few seconds. Deploy with the CLI, the Playground on
              the Dashboard, or automate with a GitHub Action.
            </Text>
          </div>
        </div>
        <div className="to-blue-1 hover:shadow-blue-1/40 flex-1 rounded-3xl bg-gradient-to-br from-[#C9E2FF] p-[1px] transition duration-300 hover:shadow-2xl">
          <div className="bg-dark flex h-full flex-col justify-between rounded-3xl p-6 md:p-16">
            <img src="/images/run-button.svg" alt="Run Button" loading="lazy" />
            <div className="flex flex-col gap-4">
              <Text size="h2" className="text-white">
                2ms cold starts
              </Text>
              <Text>
                Lagon&apos;s Runtime is written in Rust and uses V8, Chrome&apos;s JavaScript engine. Your Functions
                start in single-digit milliseconds and stay warm for subsequent requests.
              </Text>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
