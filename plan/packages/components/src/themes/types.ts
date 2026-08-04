export interface ThemeConfig {
  name: string;
  label: string;
  description: string;
  colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  radius: string;
  fontFamily?: string;
}
