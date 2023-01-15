import uPlot from 'uplot';

// TODO: remove the @ts-expect-error
// Not sure what this function does, is used to generate gradients
// From this example
// https://github.com/leeoniya/uPlot/blob/master/demos/axis-autosize.html
export function scaleGradient(
  u: uPlot,
  scaleKey: string,
  ori: number,
  scaleStops: [number, string][],
  discrete = false,
) {
  const can = document.createElement('canvas');
  const ctx = can.getContext('2d');

  const scale = u.scales[scaleKey];

  let minStopIdx;
  let maxStopIdx;

  for (let i = 0; i < scaleStops.length; i++) {
    const stopVal = scaleStops[i][0];

    // @ts-expect-error should not be undefined
    if (stopVal <= scale.min || minStopIdx == null) minStopIdx = i;

    maxStopIdx = i;

    // @ts-expect-error should not be undefined
    if (stopVal >= scale.max) break;
  }

  // @ts-expect-error should not be undefined
  if (minStopIdx == maxStopIdx) return scaleStops[minStopIdx][1];

  // @ts-expect-error should not be undefined
  let minStopVal = scaleStops[minStopIdx][0];
  // @ts-expect-error should not be undefined
  let maxStopVal = scaleStops[maxStopIdx][0];

  if (minStopVal == -Infinity) minStopVal = scale.min;

  if (maxStopVal == Infinity) maxStopVal = scale.max;

  const minStopPos = u.valToPos(minStopVal, scaleKey, true);
  const maxStopPos = u.valToPos(maxStopVal, scaleKey, true);

  const range = minStopPos - maxStopPos;

  let x0, y0, x1, y1;

  if (ori == 1) {
    x0 = x1 = 0;
    y0 = minStopPos;
    y1 = maxStopPos;
  } else {
    y0 = y1 = 0;
    x0 = minStopPos;
    x1 = maxStopPos;
  }

  // @ts-expect-error should not be undefined
  const grd = ctx.createLinearGradient(x0, y0, x1, y1);

  let prevColor;

  // @ts-expect-error should not be undefined
  for (let i = minStopIdx; i <= maxStopIdx; i++) {
    // @ts-expect-error should not be undefined
    const s = scaleStops[i];

    const stopPos = i == minStopIdx ? minStopPos : i == maxStopIdx ? maxStopPos : u.valToPos(s[0], scaleKey, true);
    const pct = (minStopPos - stopPos) / range;

    // @ts-expect-error should not be undefined
    if (discrete && i > minStopIdx) grd.addColorStop(pct, prevColor);

    grd.addColorStop(pct, (prevColor = s[1]));
  }

  return grd;
}
