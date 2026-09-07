/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A minimal ZIP writer: STORE mode only, no dependencies.
 *
 * The whole point of this module is that a static-site export costs the project
 * nothing at install time. DEFLATE is deliberately not implemented - it would be
 * the only reason to take a dependency, and the two files an export actually
 * contains (a generated `index.html` and a bundle already on disk) compress to
 * roughly what a `.zip` of them would anyway once the transport gzips it. STORE
 * is the format's own "no compression" method (`0`), understood by every tool
 * that reads a zip at all.
 *
 * The byte layout below is PKZIP APPNOTE, written out literally, because a zip
 * is one of those formats where "roughly right" reads as corrupt: every offset
 * is little-endian, the central directory mirrors each local header, and the end
 * record points at where the central directory started. A single wrong offset
 * produces an archive that this module can round-trip perfectly and that `unzip`
 * refuses - which is why the test suite validates the output with an
 * independent extractor rather than with this file's own reader.
 *
 * Not supported, by design: DEFLATE, ZIP64 (archives >= 4 GiB or > 65535
 * entries throw rather than silently truncating a 32-bit field), encryption,
 * data descriptors, and directory entries.
 */

/** Reversed IEEE 802.3 polynomial - the one every zip CRC-32 uses. */
const CRC32_POLYNOMIAL = 0xedb88320;

/** Fixed-size portions of the three records, in bytes. */
const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const END_RECORD_SIZE = 22;

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const END_SIGNATURE = 0x06054b50;

/** ZIP 2.0: the floor that supports STORE with a UTF-8 name flag. */
const VERSION = 20;

/**
 * General purpose bit 11 (`0x0800`), the language encoding flag: filenames are
 * UTF-8, not the format's legacy CP437. Set unconditionally because
 * `TextEncoder` only speaks UTF-8, so claiming anything else would be a lie for
 * every non-ASCII name.
 */
const UTF8_FLAG = 0x0800;

/** STORE. The only method this writer emits. */
const METHOD_STORED = 0;

/** MS-DOS timestamps start here, and cannot represent anything earlier. */
const DOS_EPOCH_YEAR = 1980;

/** 32-bit field ceilings; crossing either is the ZIP64 boundary. */
const MAX_UINT32 = 0xffffffff;
const MAX_UINT16 = 0xffff;

const encoder = new TextEncoder();

/* ------------------ CRC-32 ------------------ */

/**
 * The 256-entry lookup table, computed once at module load.
 *
 * One shift-and-conditional-xor per bit, eight bits per entry: the standard
 * table-driven form, which turns the per-byte checksum below into a single
 * indexed xor.
 */
function buildCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (CRC32_POLYNOMIAL ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }

  return table;
}

const CRC_TABLE = buildCrcTable();

/**
 * CRC-32 of a byte sequence.
 *
 * Verified against the standard vector: `crc32(utf8('123456789'))` is
 * `0xCBF43926`. Any implementation that disagrees with that constant is wrong,
 * and the test suite asserts it directly.
 *
 * @param {Uint8Array} bytes
 * @returns {number} unsigned 32-bit checksum
 */
export function crc32(bytes) {
  let crc = 0xffffffff;

  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/* ------------------ DOS TIMESTAMPS ------------------ */

/**
 * The MS-DOS `(time, date)` pair a zip records modification time in.
 *
 * Two packed 16-bit fields with two-second resolution, and a date that cannot
 * predate 1980 - anything earlier is clamped there rather than wrapping into a
 * date no extractor will believe.
 *
 * @param {Date} [date]
 * @returns {{time: number, date: number}}
 */
export function dosTimestamp(date = new Date()) {
  const year = Math.max(date.getFullYear(), DOS_EPOCH_YEAR);

  const time = (date.getHours() << 11)
    | (date.getMinutes() << 5)
    | (Math.floor(date.getSeconds() / 2));

  const packedDate = ((year - DOS_EPOCH_YEAR) << 9)
    | ((date.getMonth() + 1) << 5)
    | date.getDate();

  return { time: time & MAX_UINT16, date: packedDate & MAX_UINT16 };
}

/* ------------------ ENTRY NORMALISATION ------------------ */

/** Coerce one `{ name, content }` declaration into the bytes the writer stores. */
function toEntry(file) {
  if (!file || typeof file.name !== 'string' || file.name.length === 0) {
    throw new TypeError('createZip: every file needs a non-empty `name`');
  }

  const content = file.content;
  const data = content instanceof Uint8Array ? content : encoder.encode(String(content ?? ''));
  const name = encoder.encode(file.name);

  return {
    name,
    data,
    crc: crc32(data),
    stamp: dosTimestamp(file.date instanceof Date ? file.date : undefined),
    offset: 0
  };
}

/** Total archive length, and the ZIP64 boundary this writer refuses to cross. */
function measureArchive(entries) {
  let local = 0;
  let central = 0;

  for (const entry of entries) {
    local += LOCAL_HEADER_SIZE + entry.name.length + entry.data.length;
    central += CENTRAL_HEADER_SIZE + entry.name.length;
  }

  const total = local + central + END_RECORD_SIZE;
  if (entries.length > MAX_UINT16 || total > MAX_UINT32) {
    throw new RangeError('createZip: archive exceeds the 32-bit ZIP limits (ZIP64 is not supported)');
  }

  return { local, central, total };
}

/* ------------------ RECORD WRITERS ------------------ */

/** Local File Header + the stored bytes. Returns the offset just past them. */
function writeLocalHeader(view, bytes, offset, entry) {
  entry.offset = offset;

  view.setUint32(offset, LOCAL_SIGNATURE, true);
  view.setUint16(offset + 4, VERSION, true);
  view.setUint16(offset + 6, UTF8_FLAG, true);
  view.setUint16(offset + 8, METHOD_STORED, true);
  view.setUint16(offset + 10, entry.stamp.time, true);
  view.setUint16(offset + 12, entry.stamp.date, true);
  view.setUint32(offset + 14, entry.crc, true);
  // STORE: the compressed and uncompressed sizes are the same number.
  view.setUint32(offset + 18, entry.data.length, true);
  view.setUint32(offset + 22, entry.data.length, true);
  view.setUint16(offset + 26, entry.name.length, true);
  view.setUint16(offset + 28, 0, true);

  bytes.set(entry.name, offset + LOCAL_HEADER_SIZE);
  bytes.set(entry.data, offset + LOCAL_HEADER_SIZE + entry.name.length);

  return offset + LOCAL_HEADER_SIZE + entry.name.length + entry.data.length;
}

/**
 * Central Directory File Header: the local header's fields again, plus the
 * offset the local header was written at. The extractor reads this table, not
 * the local headers, so the two disagreeing is the classic corrupt-zip defect.
 */
function writeCentralHeader(view, bytes, offset, entry) {
  view.setUint32(offset, CENTRAL_SIGNATURE, true);
  view.setUint16(offset + 4, VERSION, true);
  view.setUint16(offset + 6, VERSION, true);
  view.setUint16(offset + 8, UTF8_FLAG, true);
  view.setUint16(offset + 10, METHOD_STORED, true);
  view.setUint16(offset + 12, entry.stamp.time, true);
  view.setUint16(offset + 14, entry.stamp.date, true);
  view.setUint32(offset + 16, entry.crc, true);
  view.setUint32(offset + 20, entry.data.length, true);
  view.setUint32(offset + 24, entry.data.length, true);
  view.setUint16(offset + 28, entry.name.length, true);
  view.setUint16(offset + 30, 0, true);
  view.setUint16(offset + 32, 0, true);
  view.setUint16(offset + 34, 0, true);
  view.setUint16(offset + 36, 0, true);
  view.setUint32(offset + 38, 0, true);
  view.setUint32(offset + 42, entry.offset, true);

  bytes.set(entry.name, offset + CENTRAL_HEADER_SIZE);
  return offset + CENTRAL_HEADER_SIZE + entry.name.length;
}

/** End Of Central Directory: where the table is, how big it is, how many entries. */
function writeEndRecord(view, offset, count, size, start) {
  view.setUint32(offset, END_SIGNATURE, true);
  view.setUint16(offset + 4, 0, true);
  view.setUint16(offset + 6, 0, true);
  view.setUint16(offset + 8, count, true);
  view.setUint16(offset + 10, count, true);
  view.setUint32(offset + 12, size, true);
  view.setUint32(offset + 16, start, true);
  view.setUint16(offset + 20, 0, true);
}

/* ------------------ PUBLIC API ------------------ */

/**
 * Package files into an uncompressed ZIP archive.
 *
 * @param {Array<{name: string, content: string|Uint8Array, date?: Date}>} files
 *   `content` is either a UTF-8 string (encoded here) or raw bytes (stored as-is)
 * @returns {Uint8Array} the complete archive
 * @throws {TypeError} on a missing name, {RangeError} past the 32-bit limits
 */
export function createZip(files) {
  if (!Array.isArray(files)) {
    throw new TypeError('createZip: expected an array of { name, content } files');
  }

  const entries = files.map(toEntry);
  const { local, central, total } = measureArchive(entries);

  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);

  let offset = 0;
  for (const entry of entries) {
    offset = writeLocalHeader(view, bytes, offset, entry);
  }
  for (const entry of entries) {
    offset = writeCentralHeader(view, bytes, offset, entry);
  }
  writeEndRecord(view, offset, entries.length, central, local);

  return bytes;
}

/**
 * Build an archive and hand it to the browser as a download.
 *
 * The temporary anchor is the only mechanism a page has for naming a downloaded
 * blob, and the object URL is revoked immediately after the synthetic click:
 * the browser has already taken its own reference to the blob by then, so
 * holding the URL open would only leak it for the lifetime of the document.
 *
 * @param {string} filename
 * @param {Array<{name: string, content: string|Uint8Array}>} files
 * @returns {boolean} false when there is no document to download into
 */
export function downloadZip(filename, files) {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return false;

  const blob = new Blob([createZip(files)], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename || 'archive.zip';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return true;
}
