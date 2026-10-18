import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { contour, fmt, gridStep, pointsOfInterest, sampleFn, verticalPois, type LineResult, type Poi, type Viewport } from '@/lib/calc/model';

export const CURVE_COLORS = ['#C74440', '#2D70B3', '#388C46', '#6042A6', '#FA7E19', '#000000'];

/**
 * Graph paper with curves, Desmos-style gray points of interest for the selected line, pan
 * (one finger), pinch zoom, and tap-a-point to read its coordinates.
 */
export function CalcGraph({
  results,
  hidden,
  selected,
  view,
  onView,
  dark,
}: {
  results: LineResult[];
  hidden: boolean[];
  selected: number | null;
  view: Viewport;
  /** Receives an updater so rapid gesture events always apply to the latest view. */
  onView: (update: (v: Viewport) => Viewport) => void;
  dark: boolean;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [label, setLabel] = useState<Poi | null>(null);

  // Keep 1:1 units: the y-range follows the x-range and the box's aspect ratio.
  const v = useMemo((): Viewport => {
    if (!size.w || !size.h) return view;
    const cy = (view.ymin + view.ymax) / 2;
    const half = ((view.xmax - view.xmin) * size.h) / size.w / 2;
    return { ...view, ymin: cy - half, ymax: cy + half };
  }, [view, size]);

  const X = (x: number) => ((x - v.xmin) / (v.xmax - v.xmin)) * size.w;
  const Y = (y: number) => size.h - ((y - v.ymin) / (v.ymax - v.ymin)) * size.h;

  const fns = results.flatMap((r, i) => (r.kind === 'fn' && !hidden[i] ? [r.f] : []));
  const pois = useMemo(() => {
    if (selected === null || hidden[selected]) return [];
    const r = results[selected];
    if (r?.kind === 'fn') return pointsOfInterest(r.f, fns.filter((f) => f !== r.f), v);
    if (r?.kind === 'vertical') return verticalPois(r.x, fns);
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, hidden, selected, v]);

  // Gestures apply incremental changes (changeX, scaleChange) to the latest stored view.
  const pan = Gesture.Pan()
    .runOnJS(true)
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => setLabel(null))
    .onChange((e) =>
      onView((s) => {
        const dx = (-e.changeX / size.w) * (s.xmax - s.xmin);
        const dy = (e.changeY / size.w) * (s.xmax - s.xmin);
        return { xmin: s.xmin + dx, xmax: s.xmax + dx, ymin: s.ymin + dy, ymax: s.ymax + dy };
      }),
    );
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onChange((e) =>
      onView((s) => {
        const k = 1 / Math.max(0.2, e.scaleChange);
        const cy = (s.ymin + s.ymax) / 2;
        const halfY = ((s.xmax - s.xmin) * size.h) / size.w / 2;
        const fx = s.xmin + (e.focalX / size.w) * (s.xmax - s.xmin);
        const fy = cy + halfY - (e.focalY / size.h) * 2 * halfY;
        return { xmin: fx + (s.xmin - fx) * k, xmax: fx + (s.xmax - fx) * k, ymin: fy + (s.ymin - fy) * k, ymax: fy + (s.ymax - fy) * k };
      }),
    );
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      let best: Poi | null = null;
      let bestD = 28;
      for (const p of pois) {
        const d = Math.hypot(X(p.x) - e.x, Y(p.y) - e.y);
        if (d < bestD) [best, bestD] = [p, d];
      }
      setLabel(best);
    });

  const ink = dark ? '#E5E7EB' : '#111827';
  const minor = dark ? '#374151' : '#E5E7EB';
  const step = gridStep(v.xmax - v.xmin);
  const lines = (lo: number, hi: number) => {
    const out: number[] = [];
    for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) out.push(Math.round(t / step) * step);
    return out;
  };
  const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(Math.max(-1e6, Math.min(1e6, y))).toFixed(1)}`).join('');
  const ax = Math.min(Math.max(X(0), 0), size.w);
  const ay = Math.min(Math.max(Y(0), 0), size.h);

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pan, pinch, tap)}>
      <View style={styles.box} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {size.w > 0 && (
          <Svg width={size.w} height={size.h}>
            <Rect x={0} y={0} width={size.w} height={size.h} fill={dark ? '#111827' : '#FFFFFF'} />
            {lines(v.xmin, v.xmax).map((t) => (
              <Line key={`gx${t}`} x1={X(t)} x2={X(t)} y1={0} y2={size.h} stroke={minor} strokeWidth={1} />
            ))}
            {lines(v.ymin, v.ymax).map((t) => (
              <Line key={`gy${t}`} y1={Y(t)} y2={Y(t)} x1={0} x2={size.w} stroke={minor} strokeWidth={1} />
            ))}
            <Line x1={0} x2={size.w} y1={ay} y2={ay} stroke={ink} strokeWidth={1.5} />
            <Line y1={0} y2={size.h} x1={ax} x2={ax} stroke={ink} strokeWidth={1.5} />
            {lines(v.xmin, v.xmax)
              .filter((t) => t !== 0)
              .map((t) => (
                <SvgText key={`lx${t}`} x={X(t)} y={Math.min(ay + 14, size.h - 4)} fontSize={10} fill={ink} textAnchor="middle">
                  {fmt(t)}
                </SvgText>
              ))}
            {lines(v.ymin, v.ymax)
              .filter((t) => t !== 0)
              .map((t) => (
                <SvgText key={`ly${t}`} x={Math.max(ax - 4, 24)} y={Y(t) + 3} fontSize={10} fill={ink} textAnchor="end">
                  {fmt(t)}
                </SvgText>
              ))}

            {results.map((r, i) => {
              if (hidden[i]) return null;
              const color = CURVE_COLORS[i % CURVE_COLORS.length];
              const width = i === selected ? 3.5 : 2.5;
              if (r.kind === 'fn')
                return sampleFn(r.f, v).map((p, j) => <Path key={`f${i}-${j}`} d={path(p)} stroke={color} strokeWidth={width} fill="none" />);
              if (r.kind === 'vertical') return <Line key={`v${i}`} x1={X(r.x)} x2={X(r.x)} y1={0} y2={size.h} stroke={color} strokeWidth={width} />;
              if (r.kind === 'implicit')
                return (
                  <G key={`c${i}`}>
                    {contour(r.F, v).map(([x1, y1, x2, y2], j) => (
                      <Line key={j} x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} stroke={color} strokeWidth={width} strokeLinecap="round" />
                    ))}
                  </G>
                );
              if (r.kind === 'point') return <Circle key={`p${i}`} cx={X(r.x)} cy={Y(r.y)} r={5} fill={color} />;
              return null;
            })}

            {pois.map((p, i) => (
              <Circle key={`poi${i}`} cx={X(p.x)} cy={Y(p.y)} r={label === p ? 6 : 4.5} fill={label === p ? '#4B5563' : '#9CA3AF'} />
            ))}
            {label && (
              <G>
                <Rect x={Math.min(X(label.x) + 8, size.w - 190)} y={Math.max(Y(label.y) - 30, 2)} width={182} height={22} rx={6} fill={dark ? '#374151' : '#F3F4F6'} />
                <SvgText x={Math.min(X(label.x) + 16, size.w - 182)} y={Math.max(Y(label.y) - 15, 17)} fontSize={12} fill={ink}>
                  {label.label}
                </SvgText>
              </G>
            )}
          </Svg>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, overflow: 'hidden' },
});
