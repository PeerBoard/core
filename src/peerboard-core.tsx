const PEERBOARD_EMBED_SDK_URL = 'https://static.peerboard.com/embed/embed.js';

export enum ExcludeOptions {
  Subdomain = 'subdomain',
  QueryParams = 'query'
}

export interface UrlOptions {
  /**
   * May be used for testing or if a customer or platform has several
   * subdomains and want to show the same forum everywhere
   * Also this option is used to implement proxy integration type in WordPress
   * baseUrl+prefixProxy TODO: Remove the prefixProxy parameter on WP side
   */
  baseURL?: string;
}

export interface TitleOptions {
  onTitleChanged?: (title: string) => void;
}

export interface SdkUrlOptions {
  sdkURL?: string;
}

export interface LoginOptions {
  /**
   * Authentication parameters
   */
  jwtToken?: string;
}

export interface FunctionOptions {
  // TODO: Should we stick with Promise.catch style instead?
  onReady?: () => void;
  onFail?: () => void; // TODO: Also call on init errors.
  onLogout?: () => void;
}

export interface PostOptions {
  title?: string,
  content?: string,
}

export interface WidgetOptions extends FunctionOptions, LoginOptions, SdkUrlOptions, TitleOptions, UrlOptions {
  postOptions?: PostOptions,
}

// TODO: Expose our internal embed sdk typings
interface Options extends FunctionOptions, LoginOptions, SdkUrlOptions, TitleOptions, UrlOptions {
  prefix?: string;
  anon?: boolean;
  // Number is the main approach *px string is legacy
  minHeight?: number|string;
  onPathChanged?: (forumPath: string) => void;
  onCustomProfile?: (url: string) => void;

  // If something is broken with requested path autodetect
  path?: string;

  // Dev only
  resize?: boolean;
  hideMenu?: boolean;

  usePathFromQs?: boolean;
}

interface InternalSDKOptions extends FunctionOptions, LoginOptions{
  prefix?: string;
  prefixProxy?: string;
  baseURL?: string;

  anon?: boolean; // Will logout user if she is logged in
  wpPayload?: string;

  path?: string;


  resize?: boolean;
  minHeight?: string|number;

  hideMenu?: boolean;
  disableViewportSync?: boolean;

  onPathChanged?: (forumPath: string) => void;
  onTitleChanged?: (title: string) => void;
  onCustomProfile?: (url: string) => void;

  // Internal parameters
  scrollToTopOnNavigationChanged?: boolean;
  sendReferrer?: boolean;
  usePathFromQs?: boolean;
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
  createCommentWidget (
    communityID: number,
    exclude: ExcludeOptions[],
    container: HTMLElement,
    spaceID: number,
    options: WidgetOptions
  ) : ForumAPI
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

export const createForum = (forumID: number, container: HTMLElement, options: Readonly<Options>): Promise<ForumAPI> => {
  const opts: InternalSDKOptions = {
    ...defaultOptions,
    scrollToTopOnNavigationChanged: true,
  };

  if (!opts.usePathFromQs) {
    // Auto resolve redirect
    opts.path = (
      (options.prefix && options.prefix !== "/")
        ? document.location.pathname.replace(new RegExp(`^\/${trimLeftSlash(options.prefix)}`), '')
        : document.location.pathname
    ) + document.location.search + document.location.hash;
  }

  Object.assign(opts, options);

  return loadSdk(options.sdkURL).then((): Promise<ForumAPI> => {
    if (!forumSDK) {
      throw new Error("Forum should be loaded at the moment.");
    }

    return new Promise((resolve, reject) => {
      const api = (forumSDK as PeerboardSDKEmbedScript).createForum(forumID, container, {
        ...opts,
        onFail: () => {
          if (opts.onFail) {
            opts.onFail();
          }
          reject(new Error("failed to initialize PeerBoard iframe internals"))
        },
        onReady: () => {
          if (opts.onReady) {
            opts.onReady();
          }
          resolve(api);
        },
      });
    });
  }).catch((err) => {
    console.error("Error creating forum: ", err)
    if (options.onFail) {
      options.onFail();
    }
    throw err;
  });
};

export const createCommentWidget = (
  communityID: number,
  container: HTMLElement,
  exclude: ExcludeOptions[],
  spaceID: number = 0,
  options: Readonly<WidgetOptions>,
): Promise<ForumAPI> => {
  const opts: InternalSDKOptions = {
    ...defaultOptions,
    scrollToTopOnNavigationChanged: true,
    onPathChanged: () => true,
  };

  Object.assign(opts, options);

  return loadSdk(options.sdkURL).then((): Promise<ForumAPI> => {
    if (!forumSDK) {
      throw new Error("Forum should be loaded at the moment.");
    }

    return new Promise((resolve, reject) => {
      const api = (forumSDK as PeerboardSDKEmbedScript).createCommentWidget(communityID, exclude, container, spaceID, {
        ...opts,
        onFail: () => {
          if (opts.onFail) {
            opts.onFail();
          }
          reject(new Error("failed to initialize PeerBoard iframe internals"))
        },
        onReady: () => {
          if (opts.onReady) {
            opts.onReady();
          }
          resolve(api);
        },
      });
    });
  }).catch((err) => {
    console.error("Error creating forum: ", err)
    if (opts.onFail) {
      opts.onFail();
    }
    throw err;
  });
}
