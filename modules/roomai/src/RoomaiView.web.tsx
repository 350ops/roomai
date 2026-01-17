import * as React from 'react';

import { RoomaiViewProps } from './Roomai.types';

export default function RoomaiView(props: RoomaiViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
