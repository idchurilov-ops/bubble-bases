import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import gameHtml from './game/gameHtml';

// Which content the game shows. 'app-1.0' = free Gummy Bears world only.
// Remove this (or change it) when the Full Pack purchase is added in a later version.
const RELEASE = 'app-1.0';
const STORE_KEY = 'bubble-bases-store';

type Saved = Record<string, unknown>;

export default function App() {
  const [ready, setReady] = useState(false);
  const saved = useRef<Saved>({});

  // Load settings and scores saved on this phone before the game starts.
  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY)
      .then((raw) => {
        if (raw) {
          try { saved.current = JSON.parse(raw) as Saved; } catch { saved.current = {}; }
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // The game sends {type:'store', key, value} whenever it saves something.
  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg && msg.type === 'store' && typeof msg.key === 'string') {
        saved.current = { ...saved.current, [msg.key]: msg.value };
        AsyncStorage.setItem(STORE_KEY, JSON.stringify(saved.current)).catch(() => {});
      }
    } catch {
      // ignore anything that is not a save message
    }
  }, []);

  if (!ready) return <View style={styles.root} />;

  const boot =
    `window.__BB_INITIAL = ${JSON.stringify(saved.current)};` +
    `window.__BB_RELEASE = ${JSON.stringify(RELEASE)};` +
    'true;';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <WebView
        style={styles.web}
        originWhitelist={['*']}
        source={{ html: gameHtml }}
        injectedJavaScriptBeforeContentLoaded={boot}
        onMessage={onMessage}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        allowsLinkPreview={false}
        hideKeyboardAccessoryView
        setSupportMultipleWindows={false}
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  web: { flex: 1, backgroundColor: '#ffffff' },
});
