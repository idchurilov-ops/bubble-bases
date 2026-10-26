import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync } from 'expo-audio';
import Purchases, { INTRO_ELIGIBILITY_STATUS, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import gameHtml from './game/gameHtml';

// Which content the game shows. 'app-1.1' = free Gummy Bears + Full Pack yearly subscription.
const RELEASE = 'app-1.1';
const STORE_KEY = 'bubble-bases-store';
const PRO_KEY = 'bubble-bases-pro';

// RevenueCat checks the Apple subscription for us (no server needed).
// Paste your key from RevenueCat › Project settings › API keys › App Store (it starts with "appl_").
const REVENUECAT_IOS_KEY = 'appl_drSVhyRfDKTfwbHajzIlYQXTDdJ';
// Must match the entitlement identifier you create in RevenueCat.
const ENTITLEMENT = 'bubble_bases_pro';

// The only web pages the game may open (privacy policy, Apple terms, subscription settings).
const ALLOWED_LINKS = ['https://claude.ai/artifact/', 'https://www.apple.com/legal/', 'https://apps.apple.com/'];

type Saved = Record<string, unknown>;
let purchasesConfigured = false;

export default function App() {
  const [ready, setReady] = useState(false);
  const saved = useRef<Saved>({});
  const pro = useRef(false);
  const pkg = useRef<PurchasesPackage | null>(null);
  const trialDays = useRef(0); // length of the free trial in days, only if this Apple ID can still get it
  const web = useRef<WebView>(null);

  // Send a message into the game.
  const send = useCallback((msg: object) => {
    web.current?.injectJavaScript(`window.__bbNative && window.__bbNative(${JSON.stringify(msg)}); true;`);
  }, []);

  const sendPro = useCallback(() => {
    send({
      type: 'pro',
      active: pro.current,
      available: !!pkg.current,
      price: pkg.current ? pkg.current.product.priceString : null,
      trialDays: pro.current ? 0 : trialDays.current,
    });
  }, [send]);

  const applyInfo = useCallback((info: CustomerInfo) => {
    pro.current = info.entitlements.active[ENTITLEMENT] !== undefined;
    AsyncStorage.setItem(PRO_KEY, pro.current ? '1' : '0').catch(() => {});
    sendPro();
  }, [sendPro]);

  // Let the game's music and sounds play even when the ringer switch is on silent
  // (the iPhone treats Bubble Bases like a music app instead of muting it).
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }, []);

  // Load settings, scores and the last known subscription state saved on this phone.
  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORE_KEY), AsyncStorage.getItem(PRO_KEY)])
      .then(([raw, p]) => {
        if (raw) {
          try { saved.current = JSON.parse(raw) as Saved; } catch { saved.current = {}; }
        }
        pro.current = p === '1';
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Set up purchases, load the yearly Full Pack offer and the current subscription status.
  useEffect(() => {
    try {
      if (!purchasesConfigured) {
        Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
        purchasesConfigured = true;
      }
    } catch {
      return;
    }
    const listener = (info: CustomerInfo) => applyInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    Purchases.getOfferings()
      .then((offerings) => {
        const current = offerings.current;
        pkg.current = current ? (current.annual ?? current.availablePackages[0] ?? null) : null;
        sendPro();
        const product = pkg.current?.product;
        const intro = product?.introPrice;
        if (!product || !intro || intro.price !== 0) return;
        const perUnit: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };
        const days = (perUnit[String(intro.periodUnit).toUpperCase()] ?? 0) * intro.periodNumberOfUnits;
        return Purchases.checkTrialOrIntroductoryPriceEligibility([product.identifier]).then((result) => {
          const eligible = result[product.identifier]?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;
          trialDays.current = eligible ? days : 0;
          sendPro();
        });
      })
      .catch(() => {});
    Purchases.getCustomerInfo().then(applyInfo).catch(() => {});
    return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
  }, [applyInfo, sendPro]);

  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    let msg: { type?: string; key?: string; value?: unknown; url?: string };
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }
    if (!msg || typeof msg.type !== 'string') return;

    switch (msg.type) {
      case 'store': // the game saved settings or scores
        if (typeof msg.key === 'string') {
          saved.current = { ...saved.current, [msg.key]: msg.value };
          AsyncStorage.setItem(STORE_KEY, JSON.stringify(saved.current)).catch(() => {});
        }
        break;

      case 'hello': // the game has loaded and wants the subscription status
        sendPro();
        break;

      case 'purchase':
        if (!pkg.current) {
          send({ type: 'purchase-result', ok: false, error: 'unavailable' });
          break;
        }
        try {
          const { customerInfo } = await Purchases.purchasePackage(pkg.current);
          applyInfo(customerInfo);
          send({ type: 'purchase-result', ok: pro.current });
        } catch (e: unknown) {
          const cancelled = !!(e && typeof e === 'object' && (e as { userCancelled?: boolean }).userCancelled);
          send({ type: 'purchase-result', ok: false, error: cancelled ? '' : 'failed' });
        }
        break;

      case 'restore':
        try {
          const info = await Purchases.restorePurchases();
          applyInfo(info);
          send({ type: 'purchase-result', ok: pro.current, error: pro.current ? '' : 'notFound' });
        } catch {
          send({ type: 'purchase-result', ok: false, error: 'restoreFailed' });
        }
        break;

      case 'open':
        if (typeof msg.url === 'string' && ALLOWED_LINKS.some((p) => msg.url!.startsWith(p))) {
          Linking.openURL(msg.url).catch(() => {});
        }
        break;
    }
  }, [applyInfo, send, sendPro]);

  if (!ready) return <View style={styles.root} />;

  const boot =
    `window.__BB_INITIAL = ${JSON.stringify(saved.current)};` +
    `window.__BB_RELEASE = ${JSON.stringify(RELEASE)};` +
    `window.__BB_PRO = ${pro.current ? 'true' : 'false'};` +
    'true;';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <WebView
        ref={web}
        style={styles.web}
        originWhitelist={['*']}
        source={{ html: gameHtml }}
        injectedJavaScriptBeforeContentLoaded={boot}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={(req) => !/^https?:/i.test(req.url)}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        allowsLinkPreview={false}
        hideKeyboardAccessoryView
        setSupportMultipleWindows={false}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  web: { flex: 1, backgroundColor: '#ffffff' },
});
