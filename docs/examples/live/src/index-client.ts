// src/index-client.ts
// Simple use typescript in your client side code.
console.log('abcd');
// this is needed because of tsconfig isolatedModules flag
export {}


const BannerStatus = {
    ok: 'ok',
    none: 'none',
    pending: 'pending'
} as const;
type BannerStatus = typeof BannerStatus[keyof typeof BannerStatus];


