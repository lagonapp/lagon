import { REGIONS } from '../../constants';
import { Button } from '../Button';
import { FunctionCode } from '../Code';
import { WorldBottomImage } from '../images/WorldBottomImage';
import { Text } from '../Text';

export const HomeSection = () => {
  return (
    <section className="flex flex-col gap-8 items-center justify-center">
      <div className="flex flex-col gap-4 text-center items-center">
        <button
          type="button"
          className="text-grey text-base px-4 py-2 rounded-full bg-dark-gray hover:bg-blue-3 hover:text-white transition"
        >
          Get email updates
        </button>
        <Text size="h1" variant="radialGradientWhite">
          Deploy Serverless
          <br />
          Functions at the&nbsp;
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green via-[#5A7ACB] to-purple">
            Edge
          </span>
        </Text>
        <Text>
          Lagon is an open-source runtime and platform
          <br />
          that allows developers to run JavaScript in
          <br />
          {REGIONS} regions all around the world.
        </Text>
      </div>
      <div className="flex gap-4">
        <Button variant="primary" size="lg" href="https://dash.lagon.app">
          Deploy now!
        </Button>
        <Button variant="secondary" size="lg" href="#features" scroll={false}>
          Discover
        </Button>
      </div>
      <WorldBottomImage />
      <div className="border-l border-dashed border-[#86B6FF] h-12 mt-44" />
      <div className="-mt-8">
        <FunctionCode>
          export function <span className="text-blue-1">handler</span>(request:&nbsp;
          <span className="text-purple">Request</span>) &#123;
          <br />
          &nbsp;&nbsp;const ip = request.headers.get(<span className="text-green">&apos;X-Forwarded-For&apos;</span>
          )
          <br />
          &nbsp;&nbsp;return new <span className="text-purple">Response</span>(
          <span className="text-green">`Your IP is: </span>
          {'${ip}'}
          <span className="text-green">`</span>)
          <br />
          &#125;
        </FunctionCode>
      </div>
    </section>
  );
};
