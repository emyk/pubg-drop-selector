export type keysOf<o> = o extends readonly unknown[]
  ? number extends o["length"]
    ? `${number}`
    : keyof o & `${number}`
  : {
      [K in keyof o]: K extends string ? K : K extends number ? `${K}` : never;
    }[keyof o];

export const keysOf = <o extends object>(o: o) => Object.keys(o) as keysOf<o>[];


export const pointToLineDistance = (point: { x: number; y: number }, lineStart: { x: number; y: number }, lineEnd: { x: number; y: number }) => {
    const { x, y } = point;
    const { x: x1, y: y1 } = lineStart;
    const { x: x2, y: y2 } = lineEnd;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let xx, yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
};