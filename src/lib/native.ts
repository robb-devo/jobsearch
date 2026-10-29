interface NativeResponse {
  status: number;
  data: unknown;
}

declare global {
  interface Window {
    /** Bridge exposed by the Electron preload script (desktop app only). */
    desktop?: { getJson(url: string, headers: Record<string, string>): Promise<NativeResponse> };
  }
}

const capacitor = () => (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;

export const isAndroidApp = () => Boolean(capacitor()?.isNativePlatform?.());
export const isNativeApp = () => Boolean(window.desktop) || isAndroidApp();

/** GET without browser CORS limits – only available inside the desktop and Android apps. */
export async function nativeGetJson(url: string, headers: Record<string, string>): Promise<NativeResponse> {
  if (window.desktop) return window.desktop.getJson(url, headers);
  const { CapacitorHttp } = await import('@capacitor/core');
  const res = await CapacitorHttp.get({ url, headers });
  return { status: res.status, data: res.data };
}

/** Android has no browser downloads: write the file to the app cache and open the share sheet. */
export async function shareFile(filename: string, content: string) {
  const [{ Directory, Encoding, Filesystem }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
  const { uri } = await Filesystem.writeFile({ path: filename, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: filename, files: [uri] });
}
