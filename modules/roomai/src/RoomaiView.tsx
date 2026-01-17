import { requireNativeView } from 'expo';
import * as React from 'react';

import { RoomaiViewProps } from './Roomai.types';

const NativeView: React.ComponentType<RoomaiViewProps> =
  requireNativeView('Roomai');

export default function RoomaiView(props: RoomaiViewProps) {
  return <NativeView {...props} />;
}
