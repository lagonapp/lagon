import { Card } from '../Card';
import { Text } from '../Text';

export const CardsSection = () => {
  return (
    <section className="grid gap-6 grid-cols-1 grid-rows-6 sm:grid-cols-2 sm:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 bg-blue-500" />
        <Text size="h3">Trigger via HTTP or CRON</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 bg-lime-500" />
        <Text size="h3">Rollback to any deployment in seconds</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 bg-violet-500" />
        <Text size="h3">Statistics and real-time logs</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 bg-lime-500" />
        <Text size="h3">Use the Web APIs you know</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 bg-violet-500" />
        <Text size="h3">Pay only for what you use</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
      <Card lineAnimation className="flex flex-col gap-4 p-12 rounded-2xl">
        <div className="rounded-full w-16 h-16 bg-blue-500" />
        <Text size="h3">We love Open Source</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque sit varius in ut sit varius rhoncus. Purus
          viverra at faucibus donec placerat amet, tempus.
        </Text>
      </Card>
    </section>
  );
};
