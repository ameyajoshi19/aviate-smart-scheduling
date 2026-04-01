'use strict';

/**
 * Web-native SVG icon implementations.
 * Uses plain React.createElement('svg',...) — no react-native-svg,
 * no unstable_createElement, works in any browser context including
 * sandboxed iframes and Replit canvas preview.
 */

const React = require('react');

function createIcon(displayName, iconNode) {
  const Component = React.forwardRef(function LucideIcon(props, ref) {
    const {
      size = 24,
      color = '#000',
      strokeWidth = 2,
      absoluteStrokeWidth,
      children,
      style,
      ...rest
    } = props;

    const resolvedStrokeWidth = absoluteStrokeWidth
      ? (strokeWidth * 24) / size
      : strokeWidth;

    const svgProps = {
      ref,
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth: resolvedStrokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      style: Object.assign({ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }, style),
    };

    const svgChildren = iconNode.map(function (item, i) {
      const tag = item[0];
      const attrs = Object.assign({}, item[1]);
      delete attrs.key;
      return React.createElement(tag, Object.assign({ key: i }, attrs));
    });

    return React.createElement('svg', svgProps, svgChildren);
  });

  Component.displayName = displayName;
  return Component;
}

const SquareCheckBig = createIcon('SquareCheckBig', [
  ['path', { d: 'M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344' }],
  ['path', { d: 'm9 11 3 3L22 4' }],
]);

const Zap = createIcon('Zap', [
  ['path', { d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z' }],
]);

const Clock = createIcon('Clock', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'M12 6v6l4 2' }],
]);

const Settings = createIcon('Settings', [
  ['path', { d: 'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915' }],
  ['circle', { cx: '12', cy: '12', r: '3' }],
]);

const CircleAlert = createIcon('CircleAlert', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['line', { x1: '12', x2: '12', y1: '8', y2: '12' }],
  ['line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }],
]);

const Plus = createIcon('Plus', [
  ['path', { d: 'M5 12h14' }],
  ['path', { d: 'M12 5v14' }],
]);

const X = createIcon('X', [
  ['path', { d: 'M18 6 6 18' }],
  ['path', { d: 'm6 6 12 12' }],
]);

const SlidersHorizontal = createIcon('SlidersHorizontal', [
  ['path', { d: 'M10 5H3' }],
  ['path', { d: 'M12 19H3' }],
  ['path', { d: 'M14 3v4' }],
  ['path', { d: 'M16 17v4' }],
  ['path', { d: 'M21 12h-9' }],
  ['path', { d: 'M21 19h-5' }],
  ['path', { d: 'M21 5h-7' }],
  ['path', { d: 'M8 10v4' }],
  ['path', { d: 'M8 12H3' }],
]);

const CircleCheckBig = createIcon('CircleCheckBig', [
  ['path', { d: 'M21.801 10A10 10 0 1 1 17 3.335' }],
  ['path', { d: 'm9 11 3 3L22 4' }],
]);

const Info = createIcon('Info', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'M12 16v-4' }],
  ['path', { d: 'M12 8h.01' }],
]);

const List = createIcon('List', [
  ['path', { d: 'M3 5h.01' }],
  ['path', { d: 'M3 12h.01' }],
  ['path', { d: 'M3 19h.01' }],
  ['path', { d: 'M8 5h13' }],
  ['path', { d: 'M8 12h13' }],
  ['path', { d: 'M8 19h13' }],
]);

const Calendar = createIcon('Calendar', [
  ['path', { d: 'M8 2v4' }],
  ['path', { d: 'M16 2v4' }],
  ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2' }],
  ['path', { d: 'M3 10h18' }],
]);

const RefreshCw = createIcon('RefreshCw', [
  ['path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }],
  ['path', { d: 'M21 3v5h-5' }],
  ['path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }],
  ['path', { d: 'M8 16H3v5' }],
]);

const Link2Off = createIcon('Link2Off', [
  ['path', { d: 'M9 17H7A5 5 0 0 1 7 7' }],
  ['path', { d: 'M15 7h2a5 5 0 0 1 4 8' }],
  ['line', { x1: '8', x2: '12', y1: '12', y2: '12' }],
  ['line', { x1: '2', x2: '22', y1: '2', y2: '22' }],
]);

const Link = createIcon('Link', [
  ['path', { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }],
  ['path', { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }],
]);

const Check = createIcon('Check', [
  ['path', { d: 'M20 6 9 17l-5-5' }],
]);

const ChevronRight = createIcon('ChevronRight', [
  ['path', { d: 'm9 18 6-6-6-6' }],
]);

const ArrowRight = createIcon('ArrowRight', [
  ['path', { d: 'M5 12h14' }],
  ['path', { d: 'm12 5 7 7-7 7' }],
]);

const ChevronLeft = createIcon('ChevronLeft', [
  ['path', { d: 'm15 18-6-6 6-6' }],
]);

const Sunrise = createIcon('Sunrise', [
  ['path', { d: 'M12 2v8' }],
  ['path', { d: 'm4.93 10.93 1.41 1.41' }],
  ['path', { d: 'M2 18h2' }],
  ['path', { d: 'M20 18h2' }],
  ['path', { d: 'm19.07 10.93-1.41 1.41' }],
  ['path', { d: 'M22 22H2' }],
  ['path', { d: 'm8 6 4-4 4 4' }],
  ['path', { d: 'M16 18a4 4 0 0 0-8 0' }],
]);

const Sunset = createIcon('Sunset', [
  ['path', { d: 'M12 10V2' }],
  ['path', { d: 'm4.93 10.93 1.41 1.41' }],
  ['path', { d: 'M2 18h2' }],
  ['path', { d: 'M20 18h2' }],
  ['path', { d: 'm19.07 10.93-1.41 1.41' }],
  ['path', { d: 'M22 22H2' }],
  ['path', { d: 'm16 6-4 4-4-4' }],
  ['path', { d: 'M16 18a4 4 0 0 0-8 0' }],
]);

const Trash2 = createIcon('Trash2', [
  ['path', { d: 'M10 11v6' }],
  ['path', { d: 'M14 11v6' }],
  ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }],
  ['path', { d: 'M3 6h18' }],
  ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
]);

module.exports = {
  SquareCheckBig,
  Zap,
  Clock,
  Settings,
  CircleAlert,
  Plus,
  X,
  SlidersHorizontal,
  CircleCheckBig,
  Info,
  List,
  Calendar,
  RefreshCw,
  Link2Off,
  Link,
  Check,
  ChevronRight,
  ArrowRight,
  ChevronLeft,
  Sunrise,
  Sunset,
  Trash2,
};
