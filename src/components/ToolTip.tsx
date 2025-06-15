import type { Coordinate, Location } from "../types.ts";
import styles from "./MapViewer.module.css";

interface TooltipProps {
  location: Location | null;
  position: Coordinate;
  visible: boolean;
}

export const Tooltip = ({ location, position, visible }: TooltipProps) => {
  if (!visible || !location) return null;

  return (
    <div
      className={styles.tooltip}
      style={{
        left: position.x - 60,
        top: position.y - 80,
      }}
    >
      <div className={styles.tooltipName}>{location.name}</div>
      <div>{location.size}</div>
      <div>
        ({location.x}, {location.y})
      </div>
    </div>
  );
};
