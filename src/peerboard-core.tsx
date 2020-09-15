const PEERBOARD_EMBED_SDK_URL = 'https://static.peerboard.org/embed/embed.js';

// TODO: Expose our internal embed sdk typings
export type ScrollTarget = 'iframe' | 'top';

interface Options {
  prefix?: string;
  jwtToken?: string;
  minHeight?: string;
  onPathChanged?: (forumPath: string) => void;
  onTitleChanged?: (title: string) => void;
  onCustomProfile?: (url: string) => void;
  onReady?: () => void;
  onFail?: () => void;

  // Dev only
  baseURL?: string;
  sdkURL?: string;
  resize?: boolean;
  scrollTarget?: ScrollTarget;
  hideMenu?: boolean;
}

export interface ForumAPI {
  destroy(): void;
}

export interface PeerboardSDK {
  createForum (
    forumID: number,
    container: HTMLElement,
    options: Options,
  ): ForumAPI
}

let forumSDK: PeerboardSDK | null = null;
let loadingSDK: Promise<void> | null = null;
const loadSdk = (embedSDKURL?: string) => {
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

export default {
  loadSdk: loadSdk,
  createForum(forumID: number, container: HTMLElement, options: Options) {
    const opts: Options = {
      resize: true,
      hideMenu: true,
      scrollTarget: 'top',
      baseURL: options.baseURL || `https://peerboard.${window.document.location.hostname}`,
      ...options
    };
    return loadSdk(options.sdkURL || PEERBOARD_EMBED_SDK_URL).then(() => {
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
  }
};
