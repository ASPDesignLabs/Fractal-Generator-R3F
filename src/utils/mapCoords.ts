// Map between screen pixels and normalized fractal coords [-1, 1] with aspect
export const screenToNorm = (
  x: number,
  y: number,
  width: number,
  height: number
): [number, number] => {
  const nx = (x / width) * 2 - 1;
  const ny = -((y / height) * 2 - 1);
  const aspect = width / Math.max(1, height);
  return [nx * aspect, ny];
};

export const normToScreen = (
  nx: number,
  ny: number,
  width: number,
  height: number
): [number, number] => {
  const aspect = width / Math.max(1, height);
  const x = ((nx / aspect + 1) * 0.5) * width;
  const y = ((-ny + 1) * 0.5) * height;
  return [x, y];
};
