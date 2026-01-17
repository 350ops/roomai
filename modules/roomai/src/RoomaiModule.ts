import { NativeModule, requireNativeModule } from 'expo';

import { RoomaiModuleEvents } from './Roomai.types';

declare class RoomaiModule extends NativeModule<RoomaiModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<RoomaiModule>('Roomai');
