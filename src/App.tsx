import React, { useState, useRef, useCallback } from "react";
import styles from "./MapViewer.module.css";

// TypeScript interfaces
interface Location {
  name: string;
  x: number;
  y: number;
  buildings: number;
  type: string;
}

interface MapData {
  name: string;
  image: string;
  locations: Location[];
}

interface MapDataCollection {
  [key: string]: MapData;
}

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

// Map and location data - easily editable
const initialMapData: MapDataCollection = {
  game_map: {
    name: "Game Map",
    image: "rondo.png",
    locations: [
      {
        name: "Jadena City",
        x: 850,
        y: 750,
        buildings: 45,
        type: "Major City",
      },
      { name: "Jao Tin", x: 200, y: 400, buildings: 28, type: "Town" },
      { name: "Hemoy Town", x: 900, y: 200, buildings: 23, type: "Town" },
      { name: "Nan Chuan", x: 350, y: 150, buildings: 18, type: "Settlement" },
      { name: "Dan Ching", x: 500, y: 700, buildings: 18, type: "Settlement" },
      { name: "Bin Jiang", x: 250, y: 900, buildings: 15, type: "Settlement" },
      { name: "Rai An", x: 500, y: 150, buildings: 13, type: "Village" },
      { name: "Mu Ho Ben", x: 750, y: 200, buildings: 13, type: "Village" },
      { name: "Yu Lin", x: 300, y: 550, buildings: 13, type: "Village" },
      { name: "Hung Shan", x: 400, y: 800, buildings: 13, type: "Village" },
      { name: "Bei Li", x: 150, y: 250, buildings: 10, type: "Village" },
      { name: "Kun Xin", x: 650, y: 150, buildings: 10, type: "Village" },
      { name: "Fong Tun", x: 150, y: 650, buildings: 10, type: "Village" },
      { name: "Mey Ran", x: 700, y: 450, buildings: 10, type: "Village" },
      { name: "Min Ju", x: 100, y: 150, buildings: 8, type: "Village" },
      {
        name: "Neox Factory",
        x: 500,
        y: 500,
        buildings: 7,
        type: "Industrial",
      },
      {
        name: "Tin Long Garden",
        x: 550,
        y: 850,
        buildings: 7,
        type: "Settlement",
      },
      { name: "Test Track", x: 450, y: 450, buildings: 4, type: "Facility" },
      { name: "Stadium", x: 250, y: 350, buildings: 1, type: "Special" },
    ],
  },
};

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
      <div>{location.type}</div>
      <div>{location.buildings} buildings</div>
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
}) => {
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
    } else if (isEditMode && onDragStart) {
      e.stopPropagation();
      onDragStart(e, index);
    } else {
      onSelect(index);
    }
  };

  const getTitle = () => {
    if (isEditMode) {
      return "Drag to move, Shift+Click to delete, Click to select";
    }
    return "Click to select";
  };

  return (
    <div
      className={markerClasses}
      style={style}
      onMouseDown={handleMouseDown}
      onMouseEnter={(e) => !isDragging && onHover(e, location)}
      onMouseLeave={() => !isDragging && onLeave()}
      title={getTitle()}
    />
  );
};

interface LocationItemProps {
  location: Location;
}

const LocationItem: React.FC<LocationItemProps> = ({ location }) => (
  <div className={styles.locationItem}>
    <div className={styles.locationName}>{location.name}</div>
    <div>{location.type}</div>
    <div>{location.buildings} buildings</div>
    <div>
      ({location.x}, {location.y})
    </div>
  </div>
);

interface RandomResultProps {
  location: Location | null;
  visible: boolean;
}

const RandomResult: React.FC<RandomResultProps> = ({ location, visible }) => {
  if (!visible || !location) return null;

  return (
    <div className={styles.randomResult}>
      <h3 className={styles.randomResultTitle}>Random Location Selected!</h3>
      <h4 className={styles.randomResultName}>{location.name}</h4>
      <p>
        <strong>Type:</strong> {location.type}
      </p>
      <p>
        <strong>Buildings:</strong> {location.buildings}
      </p>
      <p>
        <strong>Coordinates:</strong> ({location.x}, {location.y})
      </p>
    </div>
  );
};

interface FileUploadProps {
  onImageUpload: (imageSrc: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) onImageUpload(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`${styles.button} ${styles.buttonGreen}`}
      >
        Upload Map Image
      </button>
    </>
  );
};

interface EditFormProps {
  location: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditForm: React.FC<EditFormProps> = ({
  location,
  onLocationChange,
  onSave,
  onCancel,
}) => {
  const locationTypes = [
    "Major City",
    "Town",
    "Settlement",
    "Village",
    "Industrial",
    "Facility",
    "Special",
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>Add/Edit Location</h3>

        <div className={styles.formFields}>
          <div>
            <label className={styles.label}>Name:</label>
            <input
              type="text"
              value={location.name || ""}
              onChange={(e) =>
                onLocationChange({ ...location, name: e.target.value })
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
                value={location.x || 0}
                onChange={(e) =>
                  onLocationChange({
                    ...location,
                    x: parseInt(e.target.value) || 0,
                  })
                }
                className={styles.input}
                min="0"
                max="1000"
              />
            </div>
            <div className={styles.coordField}>
              <label className={styles.label}>Y:</label>
              <input
                type="number"
                value={location.y || 0}
                onChange={(e) =>
                  onLocationChange({
                    ...location,
                    y: parseInt(e.target.value) || 0,
                  })
                }
                className={styles.input}
                min="0"
                max="1000"
              />
            </div>
          </div>

          <div>
            <label className={styles.label}>Buildings:</label>
            <input
              type="number"
              value={location.buildings || 1}
              onChange={(e) =>
                onLocationChange({
                  ...location,
                  buildings: parseInt(e.target.value) || 1,
                })
              }
              className={styles.input}
              min="1"
            />
          </div>

          <div>
            <label className={styles.label}>Type:</label>
            <select
              value={location.type || "Village"}
              onChange={(e) =>
                onLocationChange({ ...location, type: e.target.value })
              }
              className={styles.select}
            >
              {locationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.modalButtons}>
          <button
            onClick={onSave}
            disabled={!location.name}
            className={`${styles.button} ${styles.buttonGreen} ${styles.flexButton} ${!location.name ? styles.disabled : ""}`}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className={`${styles.button} ${styles.buttonGray} ${styles.flexButton}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const MapViewer: React.FC = () => {
  const [mapData, setMapData] = useState<MapDataCollection>(initialMapData);
  const [currentMap, setCurrentMap] = useState<string>("game_map");
  const [minBuildings, setMinBuildings] = useState<number>(1);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    location: null,
    position: { x: 0, y: 0 },
  });
  const [mapImage, setMapImage] = useState<string>(
    initialMapData.game_map.image,
  );
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] =
    useState<Partial<Location> | null>(null);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    startPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    justFinishedDrag: false,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const currentMapData = mapData[currentMap];
  const filteredLocations = currentMapData.locations.filter(
    (loc) => loc.buildings >= minBuildings,
  );
  const selectedLocation =
    selectedMarker !== null ? currentMapData.locations[selectedMarker] : null;

  const handleMarkerSelect = useCallback(
    (index: number) => {
      if (!dragState.isDragging) {
        setSelectedMarker(selectedMarker === index ? null : index);
      }
    },
    [selectedMarker, dragState.isDragging],
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
      setSelectedMarker(null);
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
      if (!isEditMode || dragState.isDragging || dragState.justFinishedDrag)
        return;

      const img = e.currentTarget.querySelector("img");
      if (!img) return;

      const imgRect = img.getBoundingClientRect();
      const x = Math.round(((e.clientX - imgRect.left) / imgRect.width) * 1000);
      const y = Math.round(((e.clientY - imgRect.top) / imgRect.height) * 1000);

      setEditingLocation({
        name: "",
        x,
        y,
        buildings: 1,
        type: "Village",
      });
      setShowEditForm(true);
    },
    [isEditMode, dragState.isDragging, dragState.justFinishedDrag],
  );

  const handleLocationSave = useCallback(() => {
    if (!editingLocation || !editingLocation.name) return;

    const newLocation: Location = {
      name: editingLocation.name,
      x: editingLocation.x || 0,
      y: editingLocation.y || 0,
      buildings: editingLocation.buildings || 1,
      type: editingLocation.type || "Village",
    };

    setMapData((prev) => ({
      ...prev,
      [currentMap]: {
        ...prev[currentMap],
        locations: [...prev[currentMap].locations, newLocation],
      },
    }));

    setShowEditForm(false);
    setEditingLocation(null);
  }, [editingLocation, currentMap]);

  const handleLocationCancel = useCallback(() => {
    setShowEditForm(false);
    setEditingLocation(null);
  }, []);

  const selectRandomLocation = useCallback(() => {
    if (filteredLocations.length === 0) {
      alert("No locations found with the specified minimum building count.");
      return;
    }

    const randomLocation =
      filteredLocations[Math.floor(Math.random() * filteredLocations.length)];
    const locationIndex = currentMapData.locations.indexOf(randomLocation);
    setSelectedMarker(locationIndex);
  }, [filteredLocations, currentMapData.locations]);

  const clearSelection = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const handleImageUpload = useCallback(
    (imageSrc: string) => {
      setMapImage(imageSrc);
      setMapData((prev) => ({
        ...prev,
        [currentMap]: {
          ...prev[currentMap],
          image: imageSrc,
        },
      }));
    },
    [currentMap],
  );

  const exportMapData = useCallback(() => {
    const dataStr = JSON.stringify(mapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "mapData.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [mapData]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
    setSelectedMarker(null);
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
      <div className={styles.maxWidth}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Interactive Map Viewer</h1>
          <p className={styles.subtitle}>
            Select a map, filter locations by building count, and discover
            random locations
          </p>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Map:</label>
            <select
              value={currentMap}
              onChange={(e) => setCurrentMap(e.target.value)}
              className={styles.select}
            >
              {Object.keys(mapData).map((key) => (
                <option key={key} value={key}>
                  {mapData[key].name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Min Buildings:</label>
            <input
              type="number"
              value={minBuildings}
              onChange={(e) => setMinBuildings(parseInt(e.target.value) || 1)}
              min="1"
              max="100"
              className={`${styles.input} ${styles.numberInput}`}
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
          </div>

          <div className={styles.controlGroup}>
            <FileUpload onImageUpload={handleImageUpload} />
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

        {/* Edit Mode Instructions */}
        {isEditMode && (
          <div className={styles.editInstructions}>
            <p>
              <strong>Edit Mode Active:</strong> Click on the map to add new
              locations. Drag markers to move them. Shift+Click on markers to
              delete them.
            </p>
          </div>
        )}

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className={`${styles.mapContainer} ${isEditMode ? styles.editCursor : ""}`}
          onClick={handleMapClick}
          style={{ cursor: dragState.isDragging ? "grabbing" : "default" }}
        >
          <img src={mapImage} alt="Map" className={styles.mapImage} />

          {/* Markers */}
          {currentMapData.locations.map((location, index) => (
            <Marker
              key={index}
              location={location}
              index={index}
              isSelected={selectedMarker === index}
              isEditMode={isEditMode}
              isDragging={dragState.isDragging && dragState.dragIndex === index}
              onSelect={handleMarkerSelect}
              onHover={handleMarkerHover}
              onLeave={handleMarkerLeave}
              onDelete={handleMarkerDelete}
              onDragStart={handleDragStart}
            />
          ))}
        </div>

        {/* Tooltip */}
        <Tooltip
          location={tooltip.location}
          position={tooltip.position}
          visible={tooltip.visible}
        />

        {/* Edit Form Modal */}
        {showEditForm && editingLocation && (
          <EditForm
            location={editingLocation}
            onLocationChange={setEditingLocation}
            onSave={handleLocationSave}
            onCancel={handleLocationCancel}
          />
        )}

        {/* Random Result */}
        <RandomResult
          location={selectedLocation}
          visible={selectedMarker !== null && !isEditMode}
        />

        {/* Info Panel */}
        <div className={styles.infoPanel}>
          <h3 className={styles.infoPanelTitle}>
            All Locations ({filteredLocations.length})
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
