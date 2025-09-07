declare module 'react-native-fast-image' {
  import { ImageProps, ImageResizeMode } from 'react-native';
  import { Component } from 'react';

  export interface Source {
    uri?: string;
    headers?: { [key: string]: string };
    priority?: 'low' | 'normal' | 'high';
    cache?: 'immutable' | 'web' | 'cacheOnly';
  }

  export interface FastImageProps extends Omit<ImageProps, 'source'> {
    source: Source | number;
    resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  }

  export interface FastImageStatic {
    resizeMode: {
      contain: 'contain';
      cover: 'cover';
      stretch: 'stretch';
      center: 'center';
    };
    priority: {
      low: 'low';
      normal: 'normal';
      high: 'high';
    };
    cacheControl: {
      immutable: 'immutable';
      web: 'web';
      cacheOnly: 'cacheOnly';
    };
    preload: (sources: Source[]) => void;
    clearMemoryCache: () => Promise<void>;
    clearDiskCache: () => Promise<void>;
  }

  declare class FastImage extends Component<FastImageProps> {
    static resizeMode: FastImageStatic['resizeMode'];
    static priority: FastImageStatic['priority'];
    static cacheControl: FastImageStatic['cacheControl'];
    static preload: FastImageStatic['preload'];
    static clearMemoryCache: FastImageStatic['clearMemoryCache'];
    static clearDiskCache: FastImageStatic['clearDiskCache'];
  }

  export default FastImage;
}

// Global namespace for FastImage
declare namespace FastImage {
  export type ResizeMode = 'contain' | 'cover' | 'stretch' | 'center';
  export type Priority = 'low' | 'normal' | 'high';
  export type CacheControl = 'immutable' | 'web' | 'cacheOnly';
}