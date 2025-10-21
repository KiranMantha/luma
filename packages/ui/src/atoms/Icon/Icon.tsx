export const Icon = ({ name, size = 15, color = 'currentColor' }: { name: string; size?: number; color?: string }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" focusable="false" stroke={color} fill="none">
      <use id="useIcon" xlinkHref={`#${name}`}></use>
    </svg>
  );
};
