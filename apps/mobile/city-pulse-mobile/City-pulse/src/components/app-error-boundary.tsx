import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { DevSettings, Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * The last line of defence against a blank screen.
 *
 * Without this, any error thrown while React is rendering the app leaves the
 * user staring at nothing: the router has no screen to show, and the native
 * splash screen — which the app hides itself once the first screen mounts —
 * is still covering the window. The result is an app that looks broken with
 * no way out and no way back.
 *
 * The boundary catches render errors anywhere below it and replaces them with
 * a screen that says what happened and offers a way to continue.
 *
 * It deliberately uses no app context — no theme, no app state, no router —
 * because it has to keep working when those very things are what broke.
 */

const BRAND_TEAL = '#129E9E';
const COLOR_BG = '#FAF6EE';
const COLOR_TEXT_MAIN = '#0F172A';
const COLOR_TEXT_MUTED = '#64748B';
const COLOR_BORDER = '#E2E8F0';
const COLOR_DANGER = '#EF4444';

type Props = {
  children: ReactNode;
};

type State = {
  /** The error that took the app down, or null while the app is healthy. */
  error: Error | null;
  /**
   * Bumped on every retry.
   *
   * It is used as the key of the child subtree, so retrying remounts that
   * subtree from scratch. Without the remount, React would re-render the same
   * broken tree and fail in exactly the same place.
   */
  attempt: number;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      '[AppErrorBoundary] The app failed while rendering:',
      error,
      info.componentStack,
    );

    // The native splash is hidden by the app itself once the first screen has
    // mounted. A crash during startup happens before that, so the splash
    // would stay on top of the recovery screen and the user would still see
    // a blank window. Hide it here, where the failure is known.
    SplashScreen.hideAsync().catch(() => {
      // Nothing useful to do: the recovery screen is already on its way.
    });
  }

  handleRetry = () => {
    this.setState((current) => ({
      error: null,
      attempt: current.attempt + 1,
    }));
  };

  handleReload = () => {
    // `DevSettings.reload` restarts the JavaScript app. It only does anything
    // in a development build, so it is offered there and nowhere else.
    DevSettings.reload('Recovery screen: restart the app');
  };

  render() {
    const { error, attempt } = this.state;

    if (!error) {
      return <React.Fragment key={attempt}>{this.props.children}</React.Fragment>;
    }

    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning-outline" size={28} color={COLOR_DANGER} />
          </View>

          <Text style={styles.title}>City Pulse could not start</Text>
          <Text style={styles.body}>
            Something went wrong while loading the app. Your account and saved
            listings are untouched — this is a problem with the screen, not
            with your data.
          </Text>

          {__DEV__ ? (
            <Text style={styles.detail} numberOfLines={6}>
              {error.message}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={this.handleRetry}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>

          {__DEV__ ? (
            <Pressable
              accessibilityRole="button"
              onPress={this.handleReload}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Restart the app</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLOR_BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLOR_TEXT_MAIN,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: COLOR_TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 16,
  },
  detail: {
    fontSize: 12,
    lineHeight: 18,
    color: COLOR_TEXT_MUTED,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 10,
    marginBottom: 16,
    textAlign: 'left',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: BRAND_TEAL,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLOR_TEXT_MAIN,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
