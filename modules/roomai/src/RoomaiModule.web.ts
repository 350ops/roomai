import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './Roomai.types';

type RoomaiModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class RoomaiModule extends NativeModule<RoomaiModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(RoomaiModule, 'RoomaiModule');
