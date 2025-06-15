import type { Location, Size } from "../types.ts";
import { useState } from "react";
import styles from "./MapViewer.module.css";

interface EditFormProps {
  locationToEdit: Partial<Location>;
  onSave: (location: Location) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const EditForm = ({
  locationToEdit,
  onSave,
  onCancel,
  isEditing = false,
}: EditFormProps) => {
  const [editingLocation, setEditingLocation] = useState(locationToEdit);

  return (
    <div className={styles.modalOverlay}>
      <form
        className={styles.modal}
        onSubmit={() => onSave(editingLocation as Location)}
      >
        <h3 className={styles.modalTitle}>
          {isEditing ? "Edit Location" : "Add New Location"}
        </h3>

        <div className={styles.formFields}>
          <div>
            <label className={styles.label}>Name:</label>
            <input
              autoFocus
              type="text"
              value={editingLocation.name || ""}
              onChange={(e) =>
                setEditingLocation({ ...editingLocation, name: e.target.value })
              }
              className={styles.input}
              placeholder="Location name"
            />
          </div>

          <div className={styles.coordsContainer}>
            <div className={styles.coordField}>
              <label className={styles.label}>X:</label>
              <input
                type="number"
                readOnly
                value={editingLocation.x || 0}
                className={styles.input}
                min="0"
                max="1000"
              />
            </div>
            <div className={styles.coordField}>
              <label className={styles.label}>Y:</label>
              <input
                type="number"
                readOnly
                value={editingLocation.y || 0}
                className={styles.input}
                min="0"
                max="1000"
              />
            </div>
          </div>

          <div>
            <label className={styles.label}>Size:</label>
            <select
              value={editingLocation.size}
              className={styles.input}
              onChange={(e) =>
                setEditingLocation({
                  ...editingLocation,
                  size: e.target.value as Size,
                })
              }
            >
              <option value="S">Small</option>
              <option value="L">Large</option>
            </select>
          </div>
        </div>

        <div className={styles.modalButtons}>
          <button
            type={"submit"}
            disabled={!editingLocation.name}
            className={`${styles.button} ${styles.buttonGreen} ${styles.flexButton} ${!editingLocation.name ? styles.disabled : ""}`}
          >
            {isEditing ? "Update" : "Save"}
          </button>
          <button
            onClick={onCancel}
            className={`${styles.button} ${styles.buttonGray} ${styles.flexButton}`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
