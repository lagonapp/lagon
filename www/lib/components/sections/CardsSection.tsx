import { Card } from '../Card';
import { Text } from '../Text';

export const CardsSection = () => {
  return (
    <section className="grid gap-6 grid-cols-1 grid-rows-6 sm:grid-cols-2 sm:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#8dc2fb] to-[#446EFF]">
          <div className="rounded-full bg-gradient-to-b from-blue-1 to-[#446EFF] flex items-center justify-center h-full">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 31.6666C26.4433 31.6666 31.6667 26.4432 31.6667 19.9999C31.6667 13.5566 26.4433 8.33325 20 8.33325M20 31.6666C13.5567 31.6666 8.33334 26.4432 8.33334 19.9999C8.33334 13.5566 13.5567 8.33325 20 8.33325M20 31.6666C13.3333 24.9999 13.3334 14.9999 20 8.33325M20 31.6666C26.6667 24.9999 26.6666 14.9999 20 8.33325M31.6667 17.5C25 24.1666 15 24.1666 8.33334 17.4999"
                stroke="#050211"
                stroke-width="2"
              />
            </svg>
          </div>
        </div>
        <Text size="h3">Trigger via HTTP or CRON</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#86fbd5] to-[#14BDB3]">
          <div className="rounded-full bg-gradient-to-b from-green to-[#14BDB3] flex items-center justify-center h-full">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 20L20 10L20 30L10 20Z"
                stroke="#050211"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M31 10C31 9.59557 30.7564 9.23093 30.3827 9.07615C30.009 8.92137 29.5789 9.00692 29.2929 9.29292L24.1667 14.4191V17.2476L29 12.4142L29 27.5858L24.1667 22.7525V25.5809L29.2929 30.7071C29.5789 30.9931 30.009 31.0787 30.3827 30.9239C30.7564 30.7691 31 30.4045 31 30L31 10ZM20.8333 22.2476V17.7525L19.2929 19.2929C19.1054 19.4805 19 19.7348 19 20C19 20.2652 19.1054 20.5196 19.2929 20.7071L20.8333 22.2476Z"
                fill="#050211"
              />
            </svg>
          </div>
        </div>
        <Text size="h3">Rollback to any deployment in seconds</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#c797fa] to-[#6C04AC]">
          <div className="rounded-full bg-gradient-to-b from-purple to-[#6C04AC] flex items-center justify-center h-full">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13.3333 30L13.3333 25M20 30V23.3333M26.6666 30V20M26.6666 10C25 16.6667 18.3333 20 13.3333 20M26.6666 10L21.6666 11.6667M26.6666 10L28.3333 15"
                stroke="#050211"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
        <Text size="h3">Statistics and real-time logs</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#86fbd5] to-[#14BDB3]">
          <div className="rounded-full bg-gradient-to-b from-green to-[#14BDB3] flex items-center justify-center h-full">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15.0001 23.3333V28.3333H11.6667M11.6667 28.3333C11.6667 29.714 10.5474 30.8333 9.16666 30.8333C7.78595 30.8333 6.66666 29.714 6.66666 28.3333C6.66666 26.9525 7.78595 25.8333 9.16666 25.8333C10.5474 25.8333 11.6667 26.9525 11.6667 28.3333ZM18.3333 23.3333V31.6666H21.6667M21.6667 31.6666C21.6667 33.0473 22.786 34.1666 24.1667 34.1666C25.5474 34.1666 26.6667 33.0473 26.6667 31.6666C26.6667 30.2859 25.5474 29.1666 24.1667 29.1666C22.786 29.1666 21.6667 30.2859 21.6667 31.6666ZM30 28.3333C30 29.714 31.1193 30.8333 32.5 30.8333C33.8807 30.8333 35 29.714 35 28.3333C35 26.9525 33.8807 25.8333 32.5 25.8333C31.1193 25.8333 30 26.9525 30 28.3333ZM30 28.3333H26.6667V23.3333M8.33333 16.6666C8.33333 12.0642 12.0643 8.33325 16.6667 8.33325C19.4721 8.33325 21.9537 9.71953 23.4639 11.8444C23.957 11.7281 24.4713 11.6666 25 11.6666C28.6819 11.6666 31.6667 14.6514 31.6667 18.3333C31.6667 20.024 31.0373 21.5677 30 22.743C28.9627 23.9182 12.3761 24.1302 10.8333 22.6178C9.29053 21.1053 8.33333 18.9977 8.33333 16.6666Z"
                stroke="black"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
        <Text size="h3">Use the Web APIs you know</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#c797fa] to-[#6C04AC]">
          <div className="rounded-full bg-gradient-to-b from-purple to-[#6C04AC] flex items-center justify-center h-full">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 8.33325V31.6666M26.6667 14.9999C26.6667 12.2385 23.6819 9.99992 20 9.99992C16.3181 9.99992 13.3333 12.2385 13.3333 14.9999C13.3333 21.6666 26.6667 18.3333 26.6667 24.9999C26.6667 27.7613 23.6819 29.9999 20 29.9999C16.3181 29.9999 13.3333 27.7613 13.3333 24.9999"
                stroke="#050211"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
        </div>
        <Text size="h3">Pay only for what you use</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 p-[1px] bg-gradient-to-b from-[#8dc2fb] to-[#446EFF]">
          <div className="rounded-full bg-gradient-to-b from-blue-1 to-[#446EFF] flex items-center justify-center h-full">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15 10C11.3181 10 8.33331 12.9848 8.33331 16.6667C8.33331 25.8333 20 30 20 30C20 30 31.6666 25.8333 31.6666 16.6667C31.6666 12.9848 28.6819 10 25 10C23.0088 10 21.2216 10.8729 20 12.257C18.7784 10.8729 16.9911 10 15 10Z"
                stroke="#050211"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
        <Text size="h3">We love Open Source</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
    </section>
  );
};
