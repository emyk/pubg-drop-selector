import React, { useState, useRef, useCallback } from 'react';

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

// Map and location data - easily editable
const initialMapData: MapDataCollection = {
    game_map: {
        name: "Game Map",
        image: "rondo.png",
        locations: [
            { name: "Jadena City", x: 850, y: 750, buildings: 45, type: "Major City" },
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
            { name: "Neox Factory", x: 500, y: 500, buildings: 7, type: "Industrial" },
            { name: "Tin Long Garden", x: 550, y: 850, buildings: 7, type: "Settlement" },
            { name: "Test Track", x: 450, y: 450, buildings: 4, type: "Facility" },
            { name: "Stadium", x: 250, y: 350, buildings: 1, type: "Special" }
        ]
    }
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
            className="fixed bg-black bg-opacity-90 text-white p-2 rounded border border-green-500 text-xs pointer-events-none z-50 backdrop-blur-sm"
            style={{
                left: position.x - 60,
                top: position.y - 80,
            }}
        >
            <div className="font-bold">{location.name}</div>
            <div>{location.type}</div>
            <div>{location.buildings} buildings</div>
            <div>({location.x}, {location.y})</div>
        </div>
    );
};

interface MarkerProps {
    location: Location;
    index: number;
    isSelected: boolean;
    isEditMode: boolean;
    onSelect: (index: number) => void;
    onHover: (e: React.MouseEvent, location: Location) => void;
    onLeave: () => void;
    onDelete?: (index: number) => void;
}

const Marker: React.FC<MarkerProps> = ({
                                           location,
                                           index,
                                           isSelected,
                                           isEditMode,
                                           onSelect,
                                           onHover,
                                           onLeave,
                                           onDelete
                                       }) => {
    const baseClasses = "absolute border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10";
    const normalClasses = "w-3 h-3 bg-red-500 hover:w-4 hover:h-4 hover:bg-red-400";
    const selectedClasses = "w-4 h-4 bg-green-500 shadow-lg animate-pulse";
    const editClasses = isEditMode ? "hover:bg-yellow-400" : "";

    const style: React.CSSProperties = {
        left: `${(location.x / 1000) * 100}%`,
        top: `${(location.y / 1000) * 100}%`,
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isEditMode && e.shiftKey && onDelete) {
            e.stopPropagation();
            onDelete(index);
        } else {
            onSelect(index);
        }
    };

    return (
        <div
            className={`${baseClasses} ${isSelected ? selectedClasses : normalClasses} ${editClasses}`}
            style={style}
            onClick={handleClick}
            onMouseEnter={(e) => onHover(e, location)}
            onMouseLeave={onLeave}
            title={isEditMode ? "Click to select, Shift+Click to delete" : "Click to select"}
        />
    );
};

interface LocationItemProps {
    location: Location;
}

const LocationItem: React.FC<LocationItemProps> = ({ location }) => (
    <div className="bg-gray-700 border border-gray-600 rounded p-3 text-xs">
        <div className="font-bold text-green-500">{location.name}</div>
        <div>{location.type}</div>
        <div>{location.buildings} buildings</div>
        <div>({location.x}, {location.y})</div>
    </div>
);

interface RandomResultProps {
    location: Location | null;
    visible: boolean;
}

const RandomResult: React.FC<RandomResultProps> = ({ location, visible }) => {
    if (!visible || !location) return null;

    return (
        <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-5 mt-5 text-center">
            <h3 className="text-green-500 text-lg mb-3">Random Location Selected!</h3>
            <h4 className="text-xl font-bold mb-2">{location.name}</h4>
            <p><strong>Type:</strong> {location.type}</p>
            <p><strong>Buildings:</strong> {location.buildings}</p>
            <p><strong>Coordinates:</strong> ({location.x}, {location.y})</p>
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
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
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

const EditForm: React.FC<EditFormProps> = ({ location, onLocationChange, onSave, onCancel }) => {
    const locationTypes = ["Major City", "Town", "Settlement", "Village", "Industrial", "Facility", "Special"];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96">
                <h3 className="text-green-500 text-lg mb-4">Add/Edit Location</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Name:</label>
                        <input
                            type="text"
                            value={location.name || ''}
                            onChange={(e) => onLocationChange({ ...location, name: e.target.value })}
                            className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white text-sm focus:outline-none focus:border-green-500"
                            placeholder="Location name"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm mb-1">X:</label>
                            <input
                                type="number"
                                value={location.x || 0}
                                onChange={(e) => onLocationChange({ ...location, x: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white text-sm focus:outline-none focus:border-green-500"
                                min="0"
                                max="1000"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm mb-1">Y:</label>
                            <input
                                type="number"
                                value={location.y || 0}
                                onChange={(e) => onLocationChange({ ...location, y: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white text-sm focus:outline-none focus:border-green-500"
                                min="0"
                                max="1000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Buildings:</label>
                        <input
                            type="number"
                            value={location.buildings || 1}
                            onChange={(e) => onLocationChange({ ...location, buildings: parseInt(e.target.value) || 1 })}
                            className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white text-sm focus:outline-none focus:border-green-500"
                            min="1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Type:</label>
                        <select
                            value={location.type || 'Village'}
                            onChange={(e) => onLocationChange({ ...location, type: e.target.value })}
                            className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white text-sm focus:outline-none focus:border-green-500"
                        >
                            {locationTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onSave}
                        disabled={!location.name}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
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
    const [currentMap, setCurrentMap] = useState<string>('game_map');
    const [minBuildings, setMinBuildings] = useState<number>(1);
    const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, location: null, position: { x: 0, y: 0 } });
    const [mapImage, setMapImage] = useState<string>(initialMapData.game_map.image);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editingLocation, setEditingLocation] = useState<Partial<Location> | null>(null);
    const [showEditForm, setShowEditForm] = useState<boolean>(false);

    const currentMapData = mapData[currentMap];
    const filteredLocations = currentMapData.locations.filter(loc => loc.buildings >= minBuildings);
    const selectedLocation = selectedMarker !== null ? currentMapData.locations[selectedMarker] : null;

    const handleMarkerSelect = useCallback((index: number) => {
        setSelectedMarker(selectedMarker === index ? null : index);
    }, [selectedMarker]);

    const handleMarkerHover = useCallback((e: React.MouseEvent, location: Location) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            visible: true,
            location,
            position: {
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY
            }
        });
    }, []);

    const handleMarkerLeave = useCallback(() => {
        setTooltip({ visible: false, location: null, position: { x: 0, y: 0 } });
    }, []);

    const handleMarkerDelete = useCallback((index: number) => {
        setMapData(prev => ({
            ...prev,
            [currentMap]: {
                ...prev[currentMap],
                locations: prev[currentMap].locations.filter((_, i) => i !== index)
            }
        }));
        setSelectedMarker(null);
    }, [currentMap]);

    const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isEditMode) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const img = e.currentTarget.querySelector('img');
        if (!img) return;

        const imgRect = img.getBoundingClientRect();
        const x = Math.round(((e.clientX - imgRect.left) / imgRect.width) * 1000);
        const y = Math.round(((e.clientY - imgRect.top) / imgRect.height) * 1000);

        setEditingLocation({
            name: '',
            x,
            y,
            buildings: 1,
            type: 'Village'
        });
        setShowEditForm(true);
    }, [isEditMode]);

    const handleLocationSave = useCallback(() => {
        if (!editingLocation || !editingLocation.name) return;

        const newLocation: Location = {
            name: editingLocation.name,
            x: editingLocation.x || 0,
            y: editingLocation.y || 0,
            buildings: editingLocation.buildings || 1,
            type: editingLocation.type || 'Village'
        };

        setMapData(prev => ({
            ...prev,
            [currentMap]: {
                ...prev[currentMap],
                locations: [...prev[currentMap].locations, newLocation]
            }
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
            alert('No locations found with the specified minimum building count.');
            return;
        }

        const randomLocation = filteredLocations[Math.floor(Math.random() * filteredLocations.length)];
        const locationIndex = currentMapData.locations.indexOf(randomLocation);
        setSelectedMarker(locationIndex);
    }, [filteredLocations, currentMapData.locations]);

    const clearSelection = useCallback(() => {
        setSelectedMarker(null);
    }, []);

    const handleImageUpload = useCallback((imageSrc: string) => {
        setMapImage(imageSrc);
        setMapData(prev => ({
            ...prev,
            [currentMap]: {
                ...prev[currentMap],
                image: imageSrc
            }
        }));
    }, [currentMap]);

    const exportMapData = useCallback(() => {
        const dataStr = JSON.stringify(mapData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'mapData.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [mapData]);

    const toggleEditMode = useCallback(() => {
        setIsEditMode(prev => !prev);
        setSelectedMarker(null);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto p-5">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                        Interactive Map Viewer
                    </h1>
                    <p className="text-gray-300">Select a map, filter locations by building count, and discover random locations</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-5 mb-8 justify-center items-center">
                    <div className="flex items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-600">
                        <label className="text-sm">Map:</label>
                        <select
                            value={currentMap}
                            onChange={(e) => setCurrentMap(e.target.value)}
                            className="p-2 border border-gray-600 rounded bg-gray-700 text-white text-sm focus:outline-none focus:border-green-500"
                        >
                            {Object.keys(mapData).map(key => (
                                <option key={key} value={key}>{mapData[key].name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-600">
                        <label className="text-sm">Min Buildings:</label>
                        <input
                            type="number"
                            value={minBuildings}
                            onChange={(e) => setMinBuildings(parseInt(e.target.value) || 1)}
                            min="1"
                            max="100"
                            className="p-2 border border-gray-600 rounded bg-gray-700 text-white text-sm w-20 focus:outline-none focus:border-green-500"
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-600">
                        <button
                            onClick={selectRandomLocation}
                            disabled={isEditMode}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
                        >
                            Get Random Location
                        </button>
                        <button
                            onClick={clearSelection}
                            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Clear Selection
                        </button>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-600">
                        <FileUpload onImageUpload={handleImageUpload} />
                    </div>

                    <div className="flex items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-600">
                        <button
                            onClick={toggleEditMode}
                            className={`px-4 py-2 rounded font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${
                                isEditMode
                                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            }`}
                        >
                            {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
                        </button>
                        <button
                            onClick={exportMapData}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Export JSON
                        </button>
                    </div>
                </div>

                {/* Edit Mode Instructions */}
                {isEditMode && (
                    <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6 text-center">
                        <p className="text-yellow-200">
                            <strong>Edit Mode Active:</strong> Click on the map to add new locations.
                            Shift+Click on markers to delete them.
                        </p>
                    </div>
                )}

                {/* Map Container */}
                <div
                    className={`relative inline-block border-2 border-gray-600 rounded-lg overflow-hidden shadow-2xl mx-auto block ${
                        isEditMode ? 'cursor-crosshair' : ''
                    }`}
                    onClick={handleMapClick}
                >
                    <img
                        src={mapImage}
                        alt="Map"
                        className="block max-w-full h-auto"
                    />

                    {/* Markers */}
                    {currentMapData.locations.map((location, index) => (
                        <Marker
                            key={index}
                            location={location}
                            index={index}
                            isSelected={selectedMarker === index}
                            isEditMode={isEditMode}
                            onSelect={handleMarkerSelect}
                            onHover={handleMarkerHover}
                            onLeave={handleMarkerLeave}
                            onDelete={handleMarkerDelete}
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
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-5 mt-8">
                    <h3 className="text-green-500 text-xl mb-4">
                        All Locations ({filteredLocations.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
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