export const Icon = ({ name, size = 15, color = '#000' }: { name: string; size?: number; color?: string }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" focusable="false" stroke={color} fill="none">
      <use id="useIcon" xlinkHref={`#${name}`}></use>
    </svg>
  );
};
