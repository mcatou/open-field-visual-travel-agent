declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Env extends Cloudflare.Env {}
