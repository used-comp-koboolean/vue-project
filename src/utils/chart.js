export const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
export const palette = ['#2563eb', '#f59e0b', '#16a34a', '#ef4444', '#9ca3af', '#8b5cf6'];

export const randomInt = (min, max) => Math.round(min + Math.random() * (max - min));

export const randomPoints = (count, withRadius = false) =>
  Array.from({ length: count }, () => ({
    x: randomInt(0, 100),
    y: randomInt(0, 100),
    ...(withRadius && { r: randomInt(4, 20) }),
  }));

export const baseOptions = (title, extra = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  ...extra,
  plugins: {
    title: { display: true, text: title },
    ...extra.plugins,
  },
});
