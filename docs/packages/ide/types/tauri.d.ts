interface TauriFsApi {
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  readDir(path: string): Promise<Array<{ name: string; path: string; isDirectory?: boolean }>>;
  remove(path: string, options?: { recursive?: boolean }): Promise<void>;
  rename(path: string, newPath: string): Promise<void>;
}

interface TauriDialogApi {
  open(options?: {
    multiple?: boolean;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | string[] | null>;
  save(options?: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | null>;
}

interface TauriClipboardApi {
  writeText(text: string): Promise<void>;
  readText(): Promise<string | null>;
}

interface TauriApi {
  fs: TauriFsApi;
  dialog: TauriDialogApi;
  clipboard: TauriClipboardApi;
}

interface Window {
  __TAURI__?: TauriApi;
}
