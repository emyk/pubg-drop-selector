import type { Location } from "../types.ts";
import styles from "./MapViewer.module.css";

interface LocationItemProps {
  location: Location;
}

export const LocationItem = ({ location }: LocationItemProps) => (
  <div className={styles.locationItem}>
    <div className={styles.locationName}>{location.name}</div>
    <div>{location.size === "L" ? "Large" : "Small"} </div>
    <div>
      ({location.x}, {location.y})
    </div>
  </div>
);
