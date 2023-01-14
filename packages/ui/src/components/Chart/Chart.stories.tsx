import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Chart } from '../';

export default {
  component: Chart,
} as ComponentMeta<typeof Chart>;

const now = Math.floor(Date.now() / 1000);

export const Default: ComponentStory<typeof Chart> = () => (
  <Chart
    labels={[now - 1000, now, now + 1000]}
    datasets={[
      {
        label: 'Dataset',
        color: '#ff0000',
        data: [10, 30, 20],
      },
    ]}
  />
);

export const MultipleDatasets: ComponentStory<typeof Chart> = () => (
  <Chart
    labels={[now - 1000, now, now + 1000]}
    datasets={[
      {
        label: 'First dataset',
        color: '#ff0000',
        data: [10, 30, 20],
      },
      {
        label: 'Second dataset',
        color: '#00ff00',
        data: [20, 10, 30],
      },
    ]}
  />
);
