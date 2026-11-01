// Файлы лежат в assets/fonts/ под своими оригинальными именами.
export const fontAssets = {
  'UklonRuhCaps-Semibold': require('../../assets/fonts/UklonRuhCaps/UklonRuhCaps-Semibold.ttf'),
  'UklonRuhCaps-Bold': require('../../assets/fonts/UklonRuhCaps/UklonRuhCaps-Bold.ttf'),
  'UklonRuhCaps-Extrabold': require('../../assets/fonts/UklonRuhCaps/UklonRuhCaps-Extrabold.ttf'),
  'UklonRuhCaps-Black': require('../../assets/fonts/UklonRuhCaps/UklonRuhCaps-Black.ttf'),
  'MiSans-Regular': require('../../assets/fonts/MiSans/MiSans-Regular.ttf'),
  'MiSans-Medium': require('../../assets/fonts/MiSans/MiSans-Medium.ttf'),
  'MiSans-Semibold': require('../../assets/fonts/MiSans/MiSans-Semibold.ttf'),
  'MiSans-Bold': require('../../assets/fonts/MiSans/MiSans-Bold.ttf'),
};

// accent — заголовки и акценты (Uklon Ruh Caps), остальное — MiSans.
// fontWeight с кастомными шрифтами не используем: на Android он ломает
// подбор начертания, поэтому у каждого веса своё имя семейства.
export const fonts = {
  accent: 'UklonRuhCaps-Bold',
  accentSemibold: 'UklonRuhCaps-Semibold',
  accentExtrabold: 'UklonRuhCaps-Extrabold',
  accentBlack: 'UklonRuhCaps-Black',
  regular: 'MiSans-Regular',
  medium: 'MiSans-Medium',
  semibold: 'MiSans-Semibold',
  bold: 'MiSans-Bold',
};
