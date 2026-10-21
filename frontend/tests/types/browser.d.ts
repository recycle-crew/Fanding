import type { WorkspaceState } from "../../src/types/workspace";
import type * as domain from "../../src/features/inventory/domain";
import type * as axe from "axe-core";
import "../../src/types/camera";

declare global {
  type CameraDecodeCallback = Parameters<
    InstanceType<
      NonNullable<Window["ZXingBrowser"]>["BrowserMultiFormatReader"]
    >["decodeFromStream"]
  >[2];
  interface Window {
    __workspaceTest: {
      run<T>(
        operation: (state: WorkspaceState, domain: typeof domain) => T,
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
