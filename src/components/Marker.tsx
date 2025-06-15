import type { Location } from "../types.ts";
import React, { useState } from "react";
import styles from "./MapViewer.module.css";

interface MarkerProps {
  location: Location;
  index: number;
  isSelected: boolean;
  isEditMode: boolean;
  isDragging: boolean;
  onSelect: (index: number) => void;
  onHover: (e: React.MouseEvent, location: Location) => void;
  onLeave: () => void;
  onDelete?: (index: number) => void;
  onDragStart?: (e: React.MouseEvent, index: number) => void;
  onEdit?: (index: number) => void;
}

export const Marker = ({
  location,
  index,
  isSelected,
  isEditMode,
  isDragging,
  onSelect,
  onHover,
  onLeave,
  onDelete,
  onDragStart,
  onEdit,
}: MarkerProps) => {
  const [mouseDownPos, setMouseDownPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const markerClasses = [
    styles.marker,
    isSelected ? styles.markerSelected : styles.markerNormal,
    isEditMode ? styles.markerEditMode : "",
    isDragging ? styles.markerDragging : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style: React.CSSProperties = {
    left: location.x,
    top: location.y,
    cursor: isEditMode ? (isDragging ? "grabbing" : "grab") : "pointer",
    zIndex: isDragging ? 1000 : "auto",
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode && e.shiftKey && onDelete) {
      e.stopPropagation();
      onDelete(index);
      return;
    }

    // Store mouse position for drag detection
    setMouseDownPos({ x: e.clientX, y: e.clientY });

    if (isEditMode && onDragStart) {
      e.stopPropagation();
      onDragStart(e, index);
    } else {
      onSelect(index);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!mouseDownPos) return;

    // Calculate distance moved since mouse down
    const distance = Math.sqrt(
      Math.pow(e.clientX - mouseDownPos.x, 2) +
        Math.pow(e.clientY - mouseDownPos.y, 2),
    );

    // If mouse didn't move much (less than 5 pixels), treat as click
    if (distance < 5) {
      if (isEditMode && onEdit) {
        e.stopPropagation();
        onEdit(index);
      }
    }

    setMouseDownPos(null);
  };

  const getTitle = () => {
    if (isEditMode) {
      return "Click to edit, Drag to move, Shift+Click to delete";
    }
    return "Click to select";
  };

  return (
    <div
      className={markerClasses}
      style={style}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={(e) => !isDragging && onHover(e, location)}
      onMouseLeave={() => !isDragging && onLeave()}
      title={getTitle()}
    >
      {location.size}
    </div>
  );
};
