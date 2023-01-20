import { useState } from 'react';
import { FunctionCode } from '../Code';
import { CodeTab } from '../CodeTab';
import { WorldSideImage } from '../images/WorldSideImage';
import { Text } from '../Text';
import { motion } from 'framer-motion';

export const HomeSection = () => {
  const [tab, setTab] = useState(0);

  return (
    <section className="flex flex-col gap-24 relative h-[50vh]">
      <div className="absolute -top-[25%] -right-[12%]">
        <motion.div
          style={{ transformOrigin: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          <WorldSideImage />
        </motion.div>
      </div>
      <div className="flex flex-col gap-4 z-10">
        <div className="max-w-4xl">
          <Text size="h1" variant="linearGradiantGray">
            Deploy JavaScript Functions at the&nbsp;
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green to-[#5A7ACB]">Edge</span>, in
            seconds
          </Text>
        </div>
        <div className="w-5/12">
          <Text>
            Lagon is an open-source runtime and platform that allows developers to run JavaScript Serverless Functions
            close to users.
          </Text>
        </div>
      </div>
      <div className="w-fit">
        <div className="flex gap-1 ml-6">
          <CodeTab selected={tab === 0} onClick={() => setTab(0)}>
            vim
          </CodeTab>
          <CodeTab selected={tab === 1} onClick={() => setTab(1)}>
            zsh
          </CodeTab>
        </div>
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
