export interface CameraControls {
  stop(): void;
}

export interface DecoderLibrary {
  BrowserMultiFormatReader: new (
    hints: undefined,
    options: {
      delayBetweenScanAttempts: number;
      delayBetweenScanSuccess: number;
    },
  ) => {
    decodeFromStream(
      stream: MediaStream,
      video: HTMLVideoElement,
      callback: (
        result: { getText(): string } | null,
        error: unknown,
        controls: CameraControls,
      ) => void,
    ): Promise<CameraControls>;
  };
}

declare global {
  interface Window {
    ZXingBrowser?: DecoderLibrary;
  }
}
