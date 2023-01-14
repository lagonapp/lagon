import { useEffect, useId, useMemo, useRef } from 'react';
import uPlot from 'uplot';
import type { Series } from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { stone } from 'tailwindcss/colors';

type ChartProps = {
  labels: number[];
  datasets: {
    label: string;
    color: string;
    data: number[];
    transform?: (value: number) => string;
  }[];
};

const newShade = (hexColor: string, magnitude: number) => {
  hexColor = hexColor.replace(`#`, ``);
  if (hexColor.length === 6) {
    const decimalColor = parseInt(hexColor, 16);
    let r = (decimalColor >> 16) + magnitude;
    r > 255 && (r = 255);
    r < 0 && (r = 0);
    let g = (decimalColor & 0x0000ff) + magnitude;
    g > 255 && (g = 255);
    g < 0 && (g = 0);
    let b = ((decimalColor >> 8) & 0x00ff) + magnitude;
    b > 255 && (b = 255);
    b < 0 && (b = 0);
    return `#${(g | (b << 8) | (r << 16)).toString(16)}`;
  } else {
    return hexColor;
  }
};

export const Chart = ({ labels, datasets }: ChartProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot>(null);
  const id = useId();
  const tooltipId = useMemo(() => `tooltip-${id}`, [id]);

  useEffect(() => {
    if (!ref.current) return;

    const data = [labels, ...datasets.map(dataset => dataset.data)];
    const uplot = new uPlot(
      {
        width: 800,
        height: 300,
        padding: [10, 0, 0, 0],
        cursor: {
          move: (plot, left, top) => {
            const idx = plot.posToIdx(left);
            let content = '';

            for (let i = 1; i < plot.data.length; i++) {
              let finalValue: string;

              const transform = datasets[i - 1]?.transform;

              if (transform) {
                finalValue = transform(plot.data[i][idx] ?? 0) ?? 0;
              } else {
                finalValue = String(plot.data[i][idx] ?? 0);
              }

              content += `${plot.series[i].label}: ${finalValue}\n`;
            }

            const tooltip = document.getElementById(tooltipId);

            if (tooltip) {
              // When the cursor is outside the chart, hide the tooltip
              if (top === -10 && left === -10) {
                tooltip.style.display = 'none';
              } else {
                tooltip.style.display = 'block';
                tooltip.style.top = `${Math.round(top)}px`;
                tooltip.style.left = `${Math.round(left + 60)}px`;
                tooltip.textContent = content;
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
            width: 1,
            alpha: 0.8,
            fill: newShade(dataset.color, 50),
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
          },
          {
            stroke: stone[500],
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
  }, [ref]);

  useEffect(() => {
    if (!uplotRef.current) return;

    const data = [labels, ...datasets.map(dataset => dataset.data)];
    // @ts-expect-error not assignable
    uplotRef.current.setData(data);
  }, [labels, datasets]);

  return (
    <div className="relative" ref={ref}>
      <span
        className="absolute z-10 px-2 py-1 bg-stone-800 text-white text-sm rounded hidden pointer-events-none whitespace-pre"
        id={tooltipId}
      />
    </div>
  );
};
