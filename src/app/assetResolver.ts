const SPRITES = import.meta.glob('../assets/**/*', { as: 'url', eager: true }) as Record<string, string>;

export function assetUrlFromJsonPath(jsonPath: string, importerUrl: string): string {
  const marker = 'assets/';
  const i = jsonPath.lastIndexOf(marker);
  const tail = i >= 0 ? jsonPath.slice(i + marker.length) : jsonPath.replace(/^(\.\/|\/)/, '');
  const key = `../assets/${tail}`;
  const found = SPRITES[key];
  if (found) return found;
  try { return new URL(jsonPath, importerUrl).toString(); } catch { return jsonPath; }
}
