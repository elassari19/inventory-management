/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#24b70c';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#e8d706',
    tabIconDefault: '#e8d706',
    tabIconSelected: tintColorLight,
    error: '#FF3B30',
    border: '#E1E4E8',
    cardBackground: '#F8F9FA',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#e8d706',
    tabIconDefault: '#e8d706',
    tabIconSelected: tintColorDark,
    error: '#FF3B30',
    border: '#2C2F33',
    cardBackground: '#2C2F33',
  },
};
