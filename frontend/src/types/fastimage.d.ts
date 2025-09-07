// Web-compatible FastImage stub
// This prevents the requireNativeComponent error on web by providing a minimal type definition
// The actual implementation is handled by OptimizedImage component which does platform detection

declare module 'react-native-fast-image' {
  import { ImageProps } from 'react-native';
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

  // Web-compatible stub class
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