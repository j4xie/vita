// Global type definitions for PomeloX

declare global {
  interface QRScannerCallback {
    onScanSuccess?: (data: string) => void | Promise<void>;
    onScanError?: (error: string) => void;
  }

  interface QRScannerCallbacks {
    [callbackId: string]: QRScannerCallback;
  }

  var qrScannerCallbacks: QRScannerCallbacks | undefined;
}

export {};