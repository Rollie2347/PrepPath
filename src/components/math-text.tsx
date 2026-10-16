import { useState } from 'react';
import { Text, type TextStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import { useTheme } from '@/hooks/use-theme';

const KATEX = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist';

/** `__text__` marks the underlined portion of an ACT English passage. */
const UNDERLINE = /__(.+?)__/g;

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Renders question text. Plain strings stay native Text (fast, accessible); strings with
 * $...$ / $$...$$ math go through a KaTeX WebView that reports its height back.
 */
export function MathText({ children, style }: { children: string; style?: TextStyle }) {
  const theme = useTheme();
  const [height, setHeight] = useState(24);
  const size = style?.fontSize ?? 17;

  if (!children.includes('$')) {
    const parts = children.split(UNDERLINE);
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

  const body = escapeHtml(children).replace(UNDERLINE, '<u><b>$1</b></u>');
  const html = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="${KATEX}/katex.min.css">
<script src="${KATEX}/katex.min.js"></script>
<script src="${KATEX}/contrib/auto-render.min.js"></script>
<style>html,body{margin:0;padding:0;background:transparent;color:${theme.text};
font:500 ${size}px/1.45 -apple-system,system-ui;white-space:pre-wrap}</style></head>
<body><div id="c">${body}</div><script>
renderMathInElement(document.getElementById('c'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});
const post=()=>window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));
new ResizeObserver(post).observe(document.body);post();
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
