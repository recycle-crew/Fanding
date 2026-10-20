import type { DemoState } from "../../src/types/demo";
import type * as domain from "../../src/features/demo/domain";
import type * as axe from "axe-core";
import "../../src/types/demo/camera";

declare global {
  type CameraDecodeCallback = Parameters<
    InstanceType<
      NonNullable<Window["ZXingBrowser"]>["BrowserMultiFormatReader"]
    >["decodeFromStream"]
  >[2];
  interface Window {
    __demoTest: {
      run<T>(
        operation: (state: DemoState, domain: typeof domain) => T,
      ): Promise<T>;
    };
    __spaDocument: string;
    axe: typeof axe;
    requestedCamera: { video: { facingMode: { exact: string } } };
    cameraTest: {
      tracksStopped: number;
      decoderStopped: number;
      requests: number;
      pendingAllows: (() => void)[];
      constraints?: MediaStreamConstraints;
      allow?: () => void;
      emit?: (barcode: string | null) => void;
    };
  }
}
