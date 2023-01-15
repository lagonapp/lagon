import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Chart } from '../';

export default {
  component: Chart,
} as ComponentMeta<typeof Chart>;

const now = Math.floor(Date.now() / 1000);

export const Default: ComponentStory<typeof Chart> = () => (
  <div style={{ width: 800, height: 400 }}>
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
  </div>
);

export const TransformTooltip: ComponentStory<typeof Chart> = () => (
  <div style={{ width: 800, height: 400 }}>
    <Chart
      labels={[now - 1000, now, now + 1000, now + 2000, now + 3000]}
      datasets={[
        {
          label: 'Dataset',
          color: '#529DF2',
          data: [3, 7, 5, 2, 10],
          transform: value => `${value} %`,
        },
      ]}
    />
  </div>
);

export const TransformAxis: ComponentStory<typeof Chart> = () => (
  <div style={{ width: 800, height: 400 }}>
    <Chart
      labels={[now - 1000, now, now + 1000, now + 2000, now + 3000]}
      datasets={[
        {
          label: 'Dataset',
          color: '#529DF2',
          data: [3, 7, 5, 2, 10],
        },
      ]}
      axisTransform={(self, ticks) => ticks.map(value => `${value} %`)}
    />
  </div>
);

export const MultipleDatasets: ComponentStory<typeof Chart> = () => (
  <div style={{ width: 800, height: 400 }}>
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
  </div>
);
