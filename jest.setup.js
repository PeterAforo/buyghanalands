require('@testing-library/jest-dom');

// Polyfill Web Fetch APIs (Request, Response, Headers, fetch) which are
// required by `next/server` (route handlers) but not provided by the jsdom
// test environment. Node exposes these as globals, but jsdom strips them.
// undici (which provides the fetch implementation) also needs TextDecoder /
// TextEncoder, so we polyfill those from Node's util module first.
const { TextDecoder, TextEncoder } = require('node:util');
if (!global.TextDecoder) global.TextDecoder = TextDecoder;
if (!global.TextEncoder) global.TextEncoder = TextEncoder;

const { Request, Response, Headers, fetch } = require('undici');
if (!global.Request) global.Request = Request;
if (!global.Response) global.Response = Response;
if (!global.Headers) global.Headers = Headers;
if (!global.fetch) global.fetch = fetch;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
