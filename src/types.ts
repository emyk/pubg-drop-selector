export type Size = 'L' | 'S';

export interface Location {
    name: string; // name or description of location
    x: number; // x coordinate
    y: number; // 7 coordinate
    size: Size
}

export interface MapData {
    name: keyof MapDataCollection;
    image: string;
    locations: Location[];
}

export interface MapDataCollection {
    rondo: MapData;
    vikendi: MapData;
}