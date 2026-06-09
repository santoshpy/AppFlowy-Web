/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  // Backend connection (see dev.env / deploy.env)
  readonly APPFLOWY_BASE_URL?: string;
  readonly APPFLOWY_GOTRUE_BASE_URL?: string;
  readonly APPFLOWY_WS_BASE_URL?: string;
  // Brand identity (see src/application/brand.ts). All optional; default to AppFlowy.
  readonly APPFLOWY_BRAND_NAME?: string;
  readonly APPFLOWY_BRAND_DESCRIPTION?: string;
  readonly APPFLOWY_BRAND_URL?: string;
  readonly APPFLOWY_BRAND_TWITTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  refresh_token: (token: string) => void;
  invalid_token: () => void;
  WebFont?: {
    load: (options: { google: { families: string[] } }) => void;
  };
  toast: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    success: (message: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (message: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: (props: any) => void;
    clear: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: (message: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warning: (message: any) => void;
  };

  Prism: {
    tokenize: (text: string, grammar: Prism.Grammar) => Prism.Token[];
    languages: Record<string, Prism.Grammar>;
    plugins: {
      autoloader: {
        languages_path: string;
      };
    };
  };
  hljs: {
    highlightAuto: (code: string) => { language: string };
  };
}

namespace Prism {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Token {
    type: string;
    content: string | Token[];
    length: number;
  }
}
