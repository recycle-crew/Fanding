import type { CameraControls, DecoderLibrary } from "@/types/demo/camera";
import { useEffect, useRef, useState } from "react";

let decoderPromise: Promise<DecoderLibrary> | null = null;
async function loadDecoder() {
  if (window.ZXingBrowser) return window.ZXingBrowser;
  if (!decoderPromise)
    decoderPromise = new Promise<DecoderLibrary>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${import.meta.env.BASE_URL}vendor/zxing-browser-0.2.1.min.js`;
      script.onload = () =>
        window.ZXingBrowser
          ? resolve(window.ZXingBrowser)
          : reject(new Error("條碼辨識套件未正常載入"));
      script.onerror = () => {
        script.remove();
        reject(new Error("無法載入條碼辨識套件，請重試"));
      };
      document.head.append(script);
    }).catch((error) => {
      decoderPromise = null;
      throw error;
    });
  return decoderPromise;
}
// 相機與辨識資源只在使用者點擊時取得，離開頁面或取消即釋放。
export function useCamera(onBarcode: (barcode: string) => void, scope: string) {
  const video = useRef<HTMLVideoElement>(null);
  const session = useRef(0);
  const stream = useRef<MediaStream | null>(null);
  const controls = useRef<CameraControls | null>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("");
  function stop() {
    session.current++;
    controls.current?.stop();
    controls.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setVisible(false);
  }
  async function start() {
    stop();
    const current = session.current;
    setVisible(true);
    setStatus("正在開啟相機，請允許相機存取…");
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "相機需要 HTTPS 或 localhost，請改用安全網址；也可使用掃碼槍或手動輸入",
        );
      const decoder = await loadDecoder();
      if (current !== session.current) return;
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (current !== session.current) {
        cameraStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = cameraStream;
      const reader = new decoder.BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 150,
        delayBetweenScanSuccess: 500,
      });
      const cameraControls = await reader.decodeFromStream(
        cameraStream,
        video.current,
        (result, _error, scanControls) => {
          if (current !== session.current || !result) return;
          const barcode = result.getText().trim();
          if (!barcode) return;
          controls.current = scanControls;
          stop();
          onBarcode(barcode);
        },
      );
      if (current !== session.current) {
        cameraControls.stop();
        return;
      }
      controls.current = cameraControls;
      setStatus("請將條碼置於畫面中央；辨識成功後會自動查詢。");
    } catch (error) {
      if (current !== session.current) return;
      stop();
      setVisible(true);
      const messages: Record<string, string> = {
        NotAllowedError: "相機權限未開啟，請在瀏覽器允許相機後重試。",
        NotFoundError: "找不到後鏡頭，請使用掃碼槍或手動輸入條碼。",
        OverconstrainedError:
          "無法使用後鏡頭，請確認裝置及瀏覽器支援；也可使用掃碼槍或手動輸入。",
        NotReadableError: "相機無法使用，請關閉其他使用相機的程式後重試。",
      };
      setStatus(
        error instanceof Error
          ? (messages[error.name] ?? error.message)
          : String(error),
      );
    }
  }
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [scope]);
  return { video, visible, status, start, stop };
}
