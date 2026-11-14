/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The browser harness's request-to-disk containment rule.
 *
 * A request is resolved against the served root and then measured with
 * `path.relative`; anything that escapes yields a `..` prefix or an absolute
 * result and is refused. A component beginning with `.` is refused at any
 * depth, which keeps `/.git/config` and `/.env` unreachable even though they
 * sit inside the root, and so is an encoded spelling (`%2egit`), because the
 * pathname is decoded before it is measured.
 *
 * `node_modules` is closed except for the packages a page resolves through its
 * import map (`SERVED_PACKAGES`): the core this library is written against.
 *
 * Zero dependencies, by design.
 */

import path from 'node:path';

/** Installed packages a page may load, each only at `/node_modules/<name>/...`. */
export const SERVED_PACKAGES = Object.freeze(['cloudcanvas']);

const NODE_MODULES = 'node_modules';

/** Decoded request path with the query stripped, or null when the URL will not parse. */
export function pathnameOf(requestUrl) {
  try {
    return decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  } catch {
    return null;
  }
}

/** True when `candidate` is `rootDir` itself or lies inside it. */
export function isWithin(rootDir, candidate) {
  const relative = path.relative(rootDir, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/** True when `node_modules` appears anywhere but as the head of a served package's path. */
function reachesClosedModules(segments) {
  const at = segments.indexOf(NODE_MODULES);
  if (at === -1) return false;
  if (at !== 0 || !SERVED_PACKAGES.includes(segments[1])) return true;
  return segments.indexOf(NODE_MODULES, 1) !== -1;
}

/**
 * Where a decoded pathname lands inside `rootDir`, or null when it may not be served.
 *
 * `path.resolve` collapses `..` before the check, so traversal is caught by the
 * relative measurement rather than by pattern-matching the raw URL.
 *
 * @returns {{ resolved: string, segments: string[] } | null}
 */
export function containRequest(rootDir, pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return null;

  const resolved = path.resolve(rootDir, `.${pathname}`);
  const relative = path.relative(rootDir, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;

  const segments = relative.split(path.sep);
  if (segments.some((segment) => segment.startsWith('.'))) return null;
  if (reachesClosedModules(segments)) return null;

  return { resolved, segments };
}
