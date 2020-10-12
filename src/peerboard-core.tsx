const PEERBOARD_EMBED_SDK_URL = 'https://static.peerboard.com/embed/embed.js';

// TODO: Expose our internal embed sdk typings
interface Options {
  prefix?: string;
  jwtToken?: string;
  // Number is the main approach *px string is legacy
  minHeight?: number|string;
  onPathChanged?: (forumPath: string) => void;
  onTitleChanged?: (title: string) => void;
  onCustomProfile?: (url: string) => void;
  onReady?: () => void;
  onFail?: () => void;

  // If something is broken with requested path autodetect
  path?: string;

  // Dev only
  baseURL?: string;
  sdkURL?: string;
  resize?: boolean;
  hideMenu?: boolean;
}

interface InternalSDKOptions {
  prefix?: string;
  prefixProxy?: string;
  baseURL?: string;

  // Authentication parameters
  jwtToken?: string;
  wpPayload?: string;

  path?: string;

  // Auto resize iframe to occupy
  // all necessary space to render full page
  // i.e. make it behave like simple div
  resize?: boolean;
  // Number is the main approach *px string is legacy
  minHeight?: string|number;
  hideMenu?: boolean;
  disableViewportSync?: boolean;

  onPathChanged?: (forumPath: string) => void;
  onTitleChanged?: (title: string) => void;
  onCustomProfile?: (url: string) => void;
  onReady?: () => void;
  onFail?: () => void;

  // Internal parameters
  scrollToTopOnNavigationChanged?: boolean;
  sendReferrer?: boolean;
}

export interface ForumAPI {
  destroy(): void;
}

export interface PeerboardSDKEmbedScript {
  createForum (
    forumID: number,
    container: HTMLElement,
    options: InternalSDKOptions,
  ): ForumAPI
}

const trimLeftSlash = (str: string): string =>
  str.startsWith('/') ? str.substr(1) : str;

let forumSDK: PeerboardSDKEmbedScript | null = null;
let loadingSDK: Promise<void> | null = null;
export const loadSdk = (embedSDKURL?: string) => {
  if (forumSDK !== null) {
    return Promise.resolve();
  }
  if (loadingSDK !== null) {
    return loadingSDK;
  }

  return loadingSDK = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = embedSDKURL || PEERBOARD_EMBED_SDK_URL;
    script.setAttribute("async", "");
    script.setAttribute("data-skip-init", "");
    script.onload = () => {
      forumSDK = (window as any).PeerboardSDK;
      resolve();
    }
    script.onerror = () => {
      console.error('failed to download sdk');
      reject();
      loadingSDK = null;
    };

    document.head.append(script);
  });
}

const defaultOptions: Readonly<Options> = {
  resize: true,
  hideMenu: true,
  baseURL: `https://peerboard.${window.document.location.hostname}`,
  sdkURL: PEERBOARD_EMBED_SDK_URL,
  onTitleChanged: title => window.document.title = title,
  onPathChanged: newPath => window.history.replaceState({}, window.document.title, newPath)
};

export const createForum = (forumID: number, container: HTMLElement, options: Readonly<Options>) => {
  const opts: InternalSDKOptions = {
    ...defaultOptions,
    scrollToTopOnNavigationChanged: true,
  };

  if (options.prefix) {
    // Auto resolve redirect
    const prefixRgx = new RegExp(`^\/${trimLeftSlash(options.prefix)}`);
    const pathnameWithoutPrefix = document.location.pathname.replace(prefixRgx, '');
    opts.path = pathnameWithoutPrefix + document.location.search + document.location.hash;
  }

  Object.assign(opts, options);

  return loadSdk(options.sdkURL).then(() => {
    if (!forumSDK) {
      throw new Error("Forum should be loaded at the moment.");
    }
    forumSDK.createForum(forumID, container, opts);
  }).catch((err) => {
    console.error("Error creating forum: ", err)
    if (options.onFail) {
      options.onFail();
    }
  });
};
