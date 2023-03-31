'use client';

import { useState } from 'react';
import { MotionDiv, MotionP } from '../client';
import { FunctionCode } from './Code';

export const CodeWidget = () => {
  const [response, setResponse] = useState<{ text: string; time: number; region: string } | undefined>();
  const animate = [0, undefined].includes(response?.time) ? 'hidden' : 'visible';

  return (
    <>
      <FunctionCode onResponse={setResponse}>
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
      {response?.time ? (
        <MotionP
          className="text-grey absolute bottom-2 text-xs opacity-50"
          variants={{
            hidden: {
              opacity: 0,
            },
            visible: {
              opacity: 0.5,
            },
          }}
          animate={animate}
        >
          Edge Function replied in {response.time}ms, from {response.region}
        </MotionP>
      ) : null}
      <MotionDiv
        className="absolute left-[35%] flex -translate-x-1/2 transform flex-col items-center gap-2"
        variants={{
          hidden: {
            opacity: 0,
            top: 407,
          },
          visible: {
            opacity: 1,
            top: 397,
          },
        }}
        animate={animate}
      >
        <p className="text-green font-mono text-xs">{response?.text}</p>
        <div>
          <div className="from-blue-1 h-2 w-2 rounded-full bg-gradient-to-b to-[#1B76FF]" />
          <div className="bg-grey ml-[3px] mt-[1px] h-1 w-[2px] rounded-full" />
        </div>
      </MotionDiv>
    </>
  );
};
