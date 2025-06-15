import React, { useState, useRef, useCallback } from "react";
import styles from "./MapViewer.module.css";
import type { MapDataCollection, Location, Size } from "./types.ts";
import mapData from "./mapData.json" with { type: "json" };
import { keysOf, pointToLineDistance } from "./util.ts";

const initialMapData = mapData as MapDataCollection;

interface TooltipState {
  visible: boolean;
  location: Location | null;
  position: { x: number; y: number };
}

interface DragState {
  isDragging: boolean;
  dragIndex: number | null;
  startPos: { x: number; y: number };
  offset: { x: number; y: number };
  justFinishedDrag: boolean;
}

interface TooltipProps {
  location: Location | null;
  position: { x: number; y: number };
  visible: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ location, position, visible }) => {
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

const Marker: React.FC<MarkerProps> = ({
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
}) => {
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
    console.log(e);

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
        console.log("redigerer", index, location);
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

interface LocationItemProps {
  location: Location;
}

const LocationItem: React.FC<LocationItemProps> = ({ location }) => (
  <div className={styles.locationItem}>
    <div className={styles.locationName}>{location.name}</div>
    <div>{location.size === "L" ? "Large" : "Small"} </div>
    <div>
      ({location.x}, {location.y})
    </div>
  </div>
);

interface RandomResultProps {
  location: Location | null;
}

const SelectedMarker: React.FC<RandomResultProps> = ({ location }) => {
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

interface EditFormProps {
  locationToEdit: Partial<Location>;
  onSave: (location: Location) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const EditForm: React.FC<EditFormProps> = ({
  locationToEdit,
  onSave,
  onCancel,
  isEditing = false,
}) => {
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

const MapViewer: React.FC = () => {
  const [mapData, setMapData] = useState<MapDataCollection>(initialMapData);
  const [currentMap, setCurrentMap] =
    useState<keyof MapDataCollection>("vikendi");
  const [sizeFilter, setSizeFilter] = useState<Size | undefined>(undefined);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(
    null,
  );
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    location: null,
    position: { x: 0, y: 0 },
  });
  const [drawLine, setDrawLine] = useState<{
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
  }>({ start: null, end: null });
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 },
  );
  const [maximumDistanceFromLine, setMaximumDistanceFromLine] =
    useState<number>(200);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] =
    useState<Partial<Location> | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    startPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    justFinishedDrag: false,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const mapCoordToPixels = (loc: { x: number; y: number }) => ({
    x: (loc.x / 1000) * imageSize.width,
    y: (loc.y / 1000) * imageSize.height,
  });

  const currentMapData = mapData[currentMap];
  const filteredLocations = currentMapData.locations.filter(
    (loc) => !sizeFilter || loc.size === sizeFilter,
  );
  const selectedLocation =
    selectedMarkerIndex !== null
      ? currentMapData.locations[selectedMarkerIndex]
      : null;

  const handleMarkerSelect = useCallback(
    (index: number) => {
      if (!dragState.isDragging) {
        setSelectedMarkerIndex(selectedMarkerIndex === index ? null : index);
      }
    },
    [selectedMarkerIndex, dragState.isDragging],
  );

  const handleMarkerEdit = useCallback(
    (index: number) => {
      const location = currentMapData.locations[index];
      setEditingLocation({ ...location });
      setEditingIndex(index);
    },
    [currentMapData.locations],
  );

  const handleMarkerHover = useCallback(
    (e: React.MouseEvent, location: Location) => {
      if (!dragState.isDragging) {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
          visible: true,
          location,
          position: {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
          },
        });
      }
    },
    [dragState.isDragging],
  );

  const handleMarkerLeave = useCallback(() => {
    if (!dragState.isDragging) {
      setTooltip({ visible: false, location: null, position: { x: 0, y: 0 } });
    }
  }, [dragState.isDragging]);

  const handleMarkerDelete = useCallback(
    (index: number) => {
      setMapData((prev) => ({
        ...prev,
        [currentMap]: {
          ...prev[currentMap],
          locations: prev[currentMap].locations.filter((_, i) => i !== index),
        },
      }));
      setSelectedMarkerIndex(null);
    },
    [currentMap],
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent, index: number) => {
      const mapContainer = mapContainerRef.current;
      if (!mapContainer) return;

      const img = mapContainer.querySelector("img");
      if (!img) return;

      const imgRect = img.getBoundingClientRect();
      const location = currentMapData.locations[index];

      // Calculate the offset from the mouse position to the marker position
      const markerScreenX = imgRect.left + (location.x / 1000) * imgRect.width;
      const markerScreenY = imgRect.top + (location.y / 1000) * imgRect.height;

      setDragState({
        isDragging: true,
        dragIndex: index,
        startPos: { x: e.clientX, y: e.clientY },
        offset: {
          x: e.clientX - markerScreenX,
          y: e.clientY - markerScreenY,
        },
        justFinishedDrag: false,
      });

      // Hide tooltip during drag
      setTooltip({ visible: false, location: null, position: { x: 0, y: 0 } });
    },
    [currentMapData.locations],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || dragState.dragIndex === null) return;

      const mapContainer = mapContainerRef.current;
      if (!mapContainer) return;

      const img = mapContainer.querySelector("img");
      if (!img) return;

      const imgRect = img.getBoundingClientRect();

      // Calculate new position relative to the image
      const x = Math.max(
        0,
        Math.min(
          1000,
          ((e.clientX - dragState.offset.x - imgRect.left) / imgRect.width) *
            1000,
        ),
      );
      const y = Math.max(
        0,
        Math.min(
          1000,
          ((e.clientY - dragState.offset.y - imgRect.top) / imgRect.height) *
            1000,
        ),
      );

      // Update the location in real-time
      setMapData((prev) => ({
        ...prev,
        [currentMap]: {
          ...prev[currentMap],
          locations: prev[currentMap].locations.map((loc, index) =>
            index === dragState.dragIndex
              ? { ...loc, x: Math.round(x), y: Math.round(y) }
              : loc,
          ),
        },
      }));
    },
    [dragState, currentMap],
  );

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        dragIndex: null,
        startPos: { x: 0, y: 0 },
        offset: { x: 0, y: 0 },
        justFinishedDrag: true,
      });

      // Clear the flag after a short delay to prevent map click
      setTimeout(() => {
        setDragState((prev) => ({ ...prev, justFinishedDrag: false }));
      }, 10);
    }
  }, [dragState.isDragging]);

  // Add global mouse event listeners for dragging
  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none"; // Prevent text selection during drag

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "";
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        e.ctrlKey &&
        !isEditMode &&
        !dragState.isDragging &&
        !dragState.justFinishedDrag
      ) {
        const img = e.currentTarget.querySelector("img");
        if (!img) return;

        const imgRect = img.getBoundingClientRect();
        const x = ((e.clientX - imgRect.left) / imgRect.width) * 1000;
        const y = ((e.clientY - imgRect.top) / imgRect.height) * 1000;

        if (!drawLine.start || (drawLine.start && drawLine.end)) {
          setDrawLine({ start: { x, y }, end: null });
        } else {
          setDrawLine((prev) => ({ ...prev, end: { x, y } }));
        }

        return;
      }

      if (
        !isEditMode ||
        dragState.isDragging ||
        dragState.justFinishedDrag ||
        e.shiftKey
      )
        return;

      const img = e.currentTarget.querySelector("img");
      if (!img) return;

      const imgRect = img.getBoundingClientRect();
      const x = Math.round(((e.clientX - imgRect.left) / imgRect.width) * 1000);
      const y = Math.round(((e.clientY - imgRect.top) / imgRect.height) * 1000);

      setEditingLocation({
        name: `Cluster ${currentMapData.locations.length + 1}`,
        x,
        y,
        size: sizeFilter || "S",
      });
      setEditingIndex(null); // null means we're adding a new location
    },
    [
      isEditMode,
      dragState.isDragging,
      dragState.justFinishedDrag,
      currentMapData.locations.length,
      drawLine,
      sizeFilter,
    ],
  );

  const handleLocationSave = useCallback(
    (editedLocation: Location) => {
      setMapData((prev) => {
        if (editingIndex !== null) {
          // Edit existing location
          return {
            ...prev,
            [currentMap]: {
              ...prev[currentMap],
              locations: prev[currentMap].locations.map((loc, index) =>
                index === editingIndex ? editedLocation : loc,
              ),
            },
          };
        } else {
          // Add new location
          return {
            ...prev,
            [currentMap]: {
              ...prev[currentMap],
              locations: [...prev[currentMap].locations, editedLocation],
            },
          };
        }
      });

      setEditingLocation(null);
      setEditingIndex(null);
    },
    [editingIndex, currentMap],
  );

  const handleLocationCancel = useCallback(() => {
    setEditingLocation(null);
    setEditingIndex(null);
  }, []);

  const selectRandomLocation = useCallback(() => {
    if (filteredLocations.length === 0) {
      alert("No locations found with the specified size.");
      return;
    }

    let candidates = filteredLocations;

    if (drawLine.start && drawLine.end) {
      candidates = candidates.filter((loc) => {
        const dist = pointToLineDistance(loc, drawLine.start!, drawLine.end!);
        return dist <= maximumDistanceFromLine;
      });
    }

    if (candidates.length === 0) {
      alert("No locations found within range of the line.");
      return;
    }

    const randomLocation =
      candidates[Math.floor(Math.random() * candidates.length)];
    const locationIndex = filteredLocations.findIndex(
      (loc) => loc === randomLocation,
    );
    setSelectedMarkerIndex(locationIndex);
  }, [filteredLocations, drawLine]);

  const clearSelection = useCallback(() => {
    setSelectedMarkerIndex(null);
  }, []);

  const exportMapData = useCallback(() => {
    const dataStr = JSON.stringify(mapData, null, 2);

    navigator.clipboard.writeText(dataStr).then();
    /*const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "mapData.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);*/
  }, [mapData]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
    setSelectedMarkerIndex(null);
    // Reset drag state when toggling edit mode
    setDragState({
      isDragging: false,
      dragIndex: null,
      startPos: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      justFinishedDrag: false,
    });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
      <div className={styles.header}>
        <h1 className={styles.title}>PUBG Drop Selector</h1>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Map:</label>
          <select
            value={currentMap}
            onChange={(e) =>
              setCurrentMap(e.target.value as keyof MapDataCollection)
            }
            className={styles.select}
          >
            {keysOf(mapData).map((key) => (
              <option key={key} value={key}>
                {mapData[key].name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Size:</label>
          <select
            value={sizeFilter}
            className={styles.input}
            onChange={(e) => setSizeFilter(e.target.value as Size)}
          >
            <option value={""}>All</option>
            <option value="S">Small</option>
            <option value="L">Large</option>
          </select>

          <label className={styles.controlLabel}>
            Max distance from line in px:
          </label>
          <input
            value={maximumDistanceFromLine}
            className={styles.input}
            style={{ maxWidth: "50px" }}
            onChange={(e) => {
              if (isNaN(parseInt(e.target.value))) return;
              setMaximumDistanceFromLine(parseInt(e.target.value));
            }}
          />
        </div>

        <div className={styles.controlGroup}>
          <button
            onClick={selectRandomLocation}
            disabled={isEditMode}
            className={`${styles.button} ${styles.buttonGreen} ${isEditMode ? styles.disabled : ""}`}
          >
            Get Random Location
          </button>
          <button
            onClick={clearSelection}
            className={`${styles.button} ${styles.buttonGray}`}
          >
            Clear Selection
          </button>
          {drawLine.start && drawLine.end && (
            <button
              onClick={() => setDrawLine({ start: null, end: null })}
              className={`${styles.button} ${styles.buttonGray}`}
            >
              Clear Line
            </button>
          )}
        </div>

        <div className={styles.controlGroup}>
          <button
            onClick={toggleEditMode}
            className={`${styles.button} ${isEditMode ? styles.buttonYellow : styles.buttonBlue}`}
          >
            {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
          </button>
          <button
            onClick={exportMapData}
            className={`${styles.button} ${styles.buttonPurple}`}
          >
            Export JSON
          </button>
        </div>
      </div>

      {isEditMode ? (
        <div className={styles.editInstructions}>
          <p>
            <strong>Edit Mode Active:</strong> Click on the map to add new
            locations. Click on markers to edit them. Drag markers to move them.
            Shift+Click on markers to delete them.
          </p>
        </div>
      ) : (
        <div className={styles.editInstructions}>
          <p>
            <strong>Tip:</strong> Hold ctrl and click to draw a flight path.
            Drops will be chosen along the path.
          </p>
        </div>
      )}

      <div
        ref={mapContainerRef}
        className={`${styles.mapContainer} ${isEditMode ? styles.editCursor : ""}`}
        onClick={handleMapClick}
        style={{ cursor: dragState.isDragging ? "grabbing" : "default" }}
      >
        {drawLine.start && (
          <svg
            className={styles.lineOverlay}
            style={{ width: imageSize.width, height: imageSize.height }}
          >
            {/* Start Circle */}
            <circle
              cx={mapCoordToPixels(drawLine.start).x}
              cy={mapCoordToPixels(drawLine.start).y}
              r={6}
              fill="blue"
              stroke="white"
              strokeWidth={2}
            />

            {/* Optional Line and End Circle */}
            {drawLine.end && (
              <>
                <line
                  x1={mapCoordToPixels({ x: 25, y: 25 }).x}
                  y1={mapCoordToPixels({ x: 25, y: 25 }).y}
                  x2={
                    mapCoordToPixels({
                      x: 25 + maximumDistanceFromLine,
                      y: 25,
                    }).x
                  }
                  y2={mapCoordToPixels({ x: 25, y: 25 }).y}
                  stroke="red"
                  strokeWidth={20}
                />
                <text
                  style={{ fill: "white" }}
                  x={mapCoordToPixels({ x: 25, y: 30 }).x}
                  y={mapCoordToPixels({ x: 25, y: 30 }).y}
                >
                  Max drop dist.
                </text>
                <line
                  x1={mapCoordToPixels(drawLine.start).x}
                  y1={mapCoordToPixels(drawLine.start).y}
                  x2={mapCoordToPixels(drawLine.end).x}
                  y2={mapCoordToPixels(drawLine.end).y}
                  stroke="red"
                  strokeWidth={2}
                />
                <circle
                  cx={mapCoordToPixels(drawLine.end).x}
                  cy={mapCoordToPixels(drawLine.end).y}
                  r={6}
                  fill="blue"
                  stroke="white"
                  strokeWidth={2}
                />
              </>
            )}
          </svg>
        )}

        <img
          src={mapData[currentMap].image}
          alt="Map"
          className={styles.mapImage}
          onLoad={(e) => {
            const { width, height } = e.currentTarget.getBoundingClientRect();
            setImageSize({ width, height });
          }}
        />

        {filteredLocations.map((location) => {
          const listIndex = currentMapData.locations.findIndex(
            (loc) => loc === location,
          );

          return (
            <Marker
              key={listIndex}
              location={location}
              index={listIndex}
              isSelected={selectedMarkerIndex === listIndex}
              isEditMode={isEditMode}
              isDragging={
                dragState.isDragging && dragState.dragIndex === listIndex
              }
              onSelect={handleMarkerSelect}
              onHover={handleMarkerHover}
              onLeave={handleMarkerLeave}
              onDelete={handleMarkerDelete}
              onDragStart={handleDragStart}
              onEdit={handleMarkerEdit}
            />
          );
        })}
      </div>

      <Tooltip
        location={tooltip.location}
        position={tooltip.position}
        visible={tooltip.visible}
      />

      {editingLocation && (
        <EditForm
          locationToEdit={editingLocation}
          onSave={handleLocationSave}
          onCancel={handleLocationCancel}
          isEditing={editingIndex !== null}
        />
      )}

      <SelectedMarker location={selectedLocation} />

      <div className={styles.infoPanel}>
        <h3 className={styles.infoPanelTitle}>
          Filtered Locations ({filteredLocations.length})
        </h3>
        <div className={styles.locationsGrid}>
          {filteredLocations.map((location, index) => (
            <LocationItem key={index} location={location} />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default MapViewer;
