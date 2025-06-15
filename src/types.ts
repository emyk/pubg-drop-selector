export type Coordinate = { x: number; y: number };

export type Size = "L" | "S";

export interface Location {
  name: string;
  x: number;
  y: number;
  size: Size;
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
