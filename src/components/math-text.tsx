import { useState } from 'react';
import { Text, type TextStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import { splitMath, splitTables } from '@shared/math-segments';

import { useTheme } from '@/hooks/use-theme';

const KATEX = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist';

/** `__text__` marks the underlined portion of an ACT English passage. */
const UNDERLINE = /__(.+?)__/g;

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Prose and math of one run of text as HTML; math becomes spans that KaTeX renders. */
const inlineHtml = (s: string) =>
  splitMath(s)
    .map((g) =>
      g.kind === 'text'
        ? escapeHtml(g.value).replace(UNDERLINE, '<u><b>$1</b></u>')
        : `<span class="m" data-display="${g.kind === 'display'}">${escapeHtml(g.value)}</span>`,
    )
    .join('');


/**
 * Renders question text. Plain strings stay native Text (fast, accessible); strings with
 * $...$ / $$...$$ math go through a KaTeX WebView that reports its height back. Splitting
 * happens here (not KaTeX auto-render) so a money $ in prose is not taken as math.
 */
export function MathText({ children, style }: { children: string; style?: TextStyle }) {
  const theme = useTheme();
  const [height, setHeight] = useState(24);
  const size = style?.fontSize ?? 17;

  const segments = splitMath(children);
  const blocks = splitTables(children);

  if (segments.every((g) => g.kind === 'text') && blocks.every((b) => typeof b === 'string')) {
    const parts = segments.map((g) => g.value).join('').split(UNDERLINE);
    return (
      <Text style={[{ color: theme.text, fontSize: size, lineHeight: size * 1.45 }, style]}>
        {parts.map((p, i) =>
          i % 2 ? (
            <Text key={i} style={{ textDecorationLine: 'underline', fontWeight: '700' }}>
              {p}
            </Text>
          ) : (
            p
          ),
        )}
      </Text>
    );
  }

  const body = blocks
    .map((b) =>
      typeof b === 'string'
        ? inlineHtml(b)
        : `<table><thead><tr>${b.head.map((c) => `<th>${inlineHtml(c)}</th>`).join('')}</tr></thead><tbody>${b.rows
            .map((r) => `<tr>${r.map((c) => `<td>${inlineHtml(c)}</td>`).join('')}</tr>`)
            .join('')}</tbody></table>`,
    )
    .join('');
  const html = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="${KATEX}/katex.min.css">
<script src="${KATEX}/katex.min.js"></script>
<style>html,body{margin:0;padding:0;background:transparent;color:${theme.text};
font:500 ${size}px/1.45 -apple-system,system-ui}#c{white-space:pre-wrap}
table{border-collapse:collapse;margin:6px 0;font-size:0.88em;white-space:normal}
th,td{border:1px solid ${theme.backgroundSelected};padding:4px 8px;text-align:center}
th{font-weight:700}</style></head>
<body><div id="c">${body}</div><script>
const c=document.getElementById('c');
for(const m of c.querySelectorAll('.m')){try{katex.render(m.textContent,m,{displayMode:m.dataset.display==='true',throwOnError:false});}catch(e){}}
const post=()=>window.ReactNativeWebView.postMessage(String(Math.ceil(c.getBoundingClientRect().height)));
new ResizeObserver(post).observe(c);post();
document.fonts&&document.fonts.ready.then(post);
</script></body></html>`;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={{ height, backgroundColor: 'transparent' }}
      scrollEnabled={false}
      onMessage={(e) => setHeight(Number(e.nativeEvent.data) || height)}
    />
  );
}
