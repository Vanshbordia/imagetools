import Vips from 'wasm-vips';

let vipsInstance: any = null;

export async function initializeVips(): Promise<any> {
  if (vipsInstance) return vipsInstance;
  try {
    vipsInstance = await Vips({
      locateFile: (file) => {
        const path = `/${file}`;
        console.log('Locating file:', file, 'to', path);
        return path;
      }
    });
    console.log('VIPS initialized');
    return vipsInstance;
  } catch (error) {
    console.error('Failed to initialize VIPS:', error);
    throw error;
  }
}

export function getVips(): any {
  if (!vipsInstance) {
    throw new Error('VIPS not initialized. Call initializeVips() first.');
  }
  return vipsInstance;
}