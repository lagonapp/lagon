import { useEffect, useId, useMemo, useRef } from 'react';
import uPlot from 'uplot';
import type { Series, Axis } from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { stone } from 'tailwindcss/colors';
import { scaleGradient } from './gradient';

type ChartProps = {
  labels: number[];
  datasets: {
    label: string;
    color: string;
    data: number[];
    transform?: (value: number) => string;
  }[];
  axisTransform?: Axis['values'];
};

export const Chart = ({ labels, datasets, axisTransform }: ChartProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot>(null);
  const id = useId();
  const tooltipId = useMemo(() => `tooltip-${id}`, [id]);

  useEffect(() => {
    const onResize = () => {
      if (!ref.current || !uplotRef.current) return;

      const parentSize = ref.current.parentElement?.getBoundingClientRect();

      uplotRef.current.setSize({
        width: parentSize?.width ?? 0,
        height: parentSize?.height ?? 0,
      });
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [ref]);

  useEffect(() => {
    if (!ref.current) return;

    const parentSize = ref.current.parentElement?.getBoundingClientRect();

    const data = [labels, ...datasets.map(dataset => dataset.data)];
    const uplot = new uPlot(
      {
        width: parentSize?.width ?? 0,
        height: parentSize?.height ?? 0,
        padding: [10, 0, 0, 0],
        cursor: {
          move: (plot, left, top) => {
            const idx = plot.posToIdx(left);
            const childrens = [];

            for (let i = 1; i < plot.data.length; i++) {
              let finalValue: string;

              const transform = datasets[i - 1]?.transform;

              if (transform) {
                finalValue = transform(plot.data[i][idx] ?? 0) ?? 0;
              } else {
                finalValue = String(plot.data[i][idx] ?? 0);
              }

              const children = document.createElement('div');
              children.className = 'flex justify-between gap-6';

              const label = document.createElement('p');
              label.className = 'flex gap-1 items-center';
              const color = document.createElement('span');
              color.className = 'w-2 h-2 rounded-full';
              color.style.backgroundColor = datasets[i - 1].color;
              label.appendChild(color);
              label.appendChild(document.createTextNode(String(plot.series[i].label)));

              const value = document.createElement('p');
              value.innerText = finalValue;

              children.appendChild(label);
              children.appendChild(value);

              childrens.push(children);
            }

            const tooltip = document.getElementById(tooltipId);
            const tooltipDate = document.getElementById(`${tooltipId}-date`);
            const tooltipContent = document.getElementById(`${tooltipId}-content`);

            if (tooltip && tooltipDate && tooltipContent) {
              // When the cursor is outside the chart, hide the tooltip
              if (top === -10 && left === -10) {
                tooltip.style.display = 'none';
              } else {
                tooltip.style.display = 'block';
                tooltip.style.top = `${Math.round(top - (plot.data.length - 1) * 10)}px`;
                // @ts-expect-error _size does exist
                tooltip.style.left = `${Math.round(left + 10 + plot.axes[1]._size)}px`;
                tooltipDate.textContent = new Date(labels[idx] * 1000).toLocaleDateString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                tooltipContent.innerHTML = '';

                for (const children of childrens) {
                  tooltipContent.appendChild(children);
                }
              }
            }

            return [left, top];
          },
          y: false,
        },
        series: [
          {},
          ...datasets.map<Series>(dataset => ({
            label: dataset.label,
            stroke: dataset.color,
            width: 2,
            // From this example
            // https://github.com/leeoniya/uPlot/blob/master/demos/gradients.html#
            fill: (u, seriesIdx) => {
              const s = u.series[seriesIdx];
              // @ts-expect-error shouldn't be undefined
              const sc = u.scales[s.scale];

              let min = Infinity;
              let max = -Infinity;

              // get in-view y range for this scale
              u.series.forEach(ser => {
                if (ser.show && ser.scale == s.scale) {
                  // @ts-expect-error shouldn't be undefined
                  min = Math.min(min, ser.min);
                  // @ts-expect-error shouldn't be undefined
                  max = Math.max(max, ser.max);
                }
              });

              let range = max - min;

              if (range == 0) {
                range = sc.max - sc.min;
                min = sc.min;
              }

              return scaleGradient(u, s.scale ?? '', 1, [
                [min + range * 0.0, `${dataset.color}20`],
                [min + range * 1.0, `${dataset.color}A0`],
              ]);
            },
            points: {
              show: false,
            },
          })),
        ],
        legend: {
          show: false,
        },
        axes: [
          {
            stroke: stone[500],
            grid: {
              show: false,
            },
          },
          {
            stroke: stone[500],
            values: axisTransform,
            // From this example
            // https://github.com/leeoniya/uPlot/blob/master/demos/axis-autosize.html
            size: (self, values, axisIdx, cycleNum) => {
              const axis = self.axes[axisIdx];

              // @ts-expect-error _size exists but missing type
              if (cycleNum > 1) return axis._size;

              // @ts-expect-error should not be undefined
              let axisSize = axis.ticks?.size + axis.gap;

              const longestVal = (values ?? []).reduce((acc, val) => (val.length > acc.length ? val : acc), '');

              if (longestVal != '') {
                self.ctx.font = axis.font?.[0] ?? '';
                axisSize += self.ctx.measureText(longestVal).width / devicePixelRatio;
              }

              return Math.ceil(axisSize);
            },
          },
        ],
      },
      // @ts-expect-error not assignable
      data,
      ref.current,
    );

    // @ts-expect-error not assignable
    uplotRef.current = uplot;

    return () => {
      uplot.destroy();
    };
  }, [ref, labels, datasets]);

  return (
    <div className="relative" ref={ref}>
      <div
        className="pointer-events-none absolute z-[10000] hidden whitespace-pre rounded bg-white px-2 py-1 text-sm text-stone-800 shadow-md dark:bg-stone-900 dark:text-stone-200"
        id={tooltipId}
      >
        <p className="mb-1 text-xs text-stone-500 dark:text-stone-400" id={`${tooltipId}-date`} />
        <div id={`${tooltipId}-content`} />
      </div>
    </div>
  );
};
