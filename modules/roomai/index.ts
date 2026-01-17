// Reexport the native module. On web, it will be resolved to RoomaiModule.web.ts
// and on native platforms to RoomaiModule.ts
export { default } from './src/RoomaiModule';
export { default as RoomaiView } from './src/RoomaiView';
export * from  './src/Roomai.types';
