import { getCurrentWindow } from '@tauri-apps/api/window';

export function WindowResizeGrips() {
  const appWindow = getCurrentWindow();

  const startResize = (direction: Parameters<typeof appWindow.startResizeDragging>[0]) => {
    void appWindow.startResizeDragging(direction);
  };

  // Resize boundaries around the window edges
  return (
    <>
      <div
        className="absolute left-3 right-3 top-0 z-[60] h-1.5 cursor-n-resize"
        onMouseDown={() => startResize('North')}
      />
      <div
        className="absolute bottom-0 left-3 right-3 z-[60] h-1.5 cursor-s-resize"
        onMouseDown={() => startResize('South')}
      />
      <div
        className="absolute bottom-3 left-0 top-3 z-[60] w-1.5 cursor-w-resize"
        onMouseDown={() => startResize('West')}
      />
      <div
        className="absolute bottom-3 right-0 top-3 z-[60] w-1.5 cursor-e-resize"
        onMouseDown={() => startResize('East')}
      />
      <div
        className="absolute left-0 top-0 z-[60] h-4 w-4 cursor-nw-resize"
        onMouseDown={() => startResize('NorthWest')}
      />
      <div
        className="absolute right-0 top-0 z-[60] h-4 w-4 cursor-ne-resize"
        onMouseDown={() => startResize('NorthEast')}
      />
      <div
        className="absolute bottom-0 left-0 z-[60] h-4 w-4 cursor-sw-resize"
        onMouseDown={() => startResize('SouthWest')}
      />
      <div
        className="absolute bottom-0 right-0 z-[60] h-4 w-4 cursor-se-resize"
        onMouseDown={() => startResize('SouthEast')}
      />
    </>
  );
}
