import type {Location} from "../types.ts";
import styles from "./MapViewer.module.css";

interface RandomResultProps {
    location: Location | null;
}

export const RandomResult = ({ location }: RandomResultProps) => {
    if (!location) return null;

    return (
        <div className={styles.randomResult}>
            <h3 className={styles.randomResultTitle}>Random Location Selected!</h3>
            <h4 className={styles.randomResultName}>{location.name}</h4>
            <p>
                <strong>Size:</strong> {location.size}
            </p>
            <p>
                <strong>Coordinates:</strong> ({location.x}, {location.y})
            </p>
        </div>
    );
};
