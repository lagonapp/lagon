import { ComponentStory, ComponentMeta } from '@storybook/react';
import Chart from '.';

export default {
  component: Chart,
} as ComponentMeta<typeof Chart>;

export const Default: ComponentStory<typeof Chart> = () => (
  <Chart
    labels={['First label', 'Second label', 'Third label']}
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
    labels={['First label', 'Second label', 'Third label']}
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
