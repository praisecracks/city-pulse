import type { ProviderPhoto } from '@/state/app-state';
import { API_BASE_URL, MOCK_API } from './api-config';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Photo uploads carry a few hundred KB each and run over mobile data, so they
// get a longer budget than the 15s default used for JSON calls.
const UPLOAD_TIMEOUT_MS = 60_000;

// Mirrors MAX_FILE_SIZE_MB in the backend so an oversized file is rejected on
// the device, where the message can actually be acted on, instead of by the API
// with a bare status code.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type UploadedPhoto = {
  /** Public path stored on the Pulse, e.g. "/uploads/abc-123.jpg". */
  path: string;
  /** Absolute URL, useful for previewing before the listing exists. */
  url: string;
};

type UploadImagesResponse = {
  success: boolean;
  message?: string;
  data?: { images?: UploadedPhoto[] };
};

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function ascii(bytes: Uint8Array, start: number, end: number): string {
  let out = '';
  for (let i = start; i < end; i += 1) out += String.fromCharCode(bytes[i]);
  return out;
}

/**
 * Identifies an image from its first bytes.
 *
 * This check exists because reading a local file is not the failure-free step it
 * looks like. A URI the runtime cannot read (a raw `ph://` / `content://` picker
 * URI, a cache file the OS already evicted) makes `fetch` resolve with an error
 * *page* rather than throw, and `arrayBuffer()` hands back those bytes happily.
 * The upload then stores that text as the photo, the API serves it back with an
 * image content type, and every thumbnail in the app renders as an empty box.
 * Sniffing the bytes turns that silent corruption into an immediate, explicable
 * failure.
 */
function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === 'RIFF' &&
    ascii(bytes, 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

type LocalImage = { bytes: Uint8Array; mime: string };

/** Distinguishes "this file is unusable" from "this file is too big". */
class TooLargeError extends Error {}
class UnreadableError extends Error {}

/**
 * Reads a device-local file's bytes.
 *
 * Uses `expo-file-system` rather than `fetch(uri)`. React Native's `fetch` is
 * an HTTP client; handed a `file://` URI it does not reliably resolve, and on
 * SDK 57's bridgeless runtime it rejects outright. That rejection was what
 * surfaced to providers as "Photo 1 could not be read from this device. Pick it
 * again" on every single submission — the file was there the whole time, and the
 * message blamed the device rather than the reader.
 *
 * Returns null for a missing or empty file so the caller can try to normalize
 * the URI, and throws `TooLargeError` for a file that is simply too big, which
 * no amount of rewriting will fix.
 */
async function readFileBytes(uri: string): Promise<Uint8Array | null> {
  let file: File;

  try {
    file = new File(uri);
  } catch {
    // Thrown for a path that is not a file at all, e.g. a directory.
    return null;
  }

  if (!file.exists || file.size === 0) return null;
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new TooLargeError();
  }

  try {
    return await file.bytes();
  } catch {
    throw new UnreadableError();
  }
}

/**
 * Re-encodes a URI the filesystem could not open directly.
 *
 * Only a fallback: photos picked through this app were already resized and
 * written as JPEG by `processListingImages` at pick time. This exists for URIs
 * arriving from another entry point (a raw `content://` or `ph://` from the
 * system picker, a restored file), where normalising to a real `file://` path
 * is the only way to read them at all.
 */
async function normalizeThenRead(uri: string): Promise<Uint8Array> {
  let processedUri: string;

  try {
    const result = await ImageManipulator.manipulate(uri)
      .renderAsync()
      .then((image) =>
        image.saveAsync({ compress: 0.9, format: SaveFormat.JPEG })
      );
    processedUri = result.uri;
  } catch {
    throw new UnreadableError();
  }

  const bytes = await readFileBytes(processedUri);
  if (!bytes) throw new UnreadableError();
  return bytes;
}

/**
 * Reads a device-local image and refuses anything that is not actually image
 * data. The returned bytes are what gets uploaded, so the format is derived
 * from the file itself rather than assumed.
 */
async function readLocalImage(uri: string, position: number): Promise<LocalImage> {
  const label = `Photo ${position + 1}`;

  let bytes: Uint8Array;
  try {
    const direct = await readFileBytes(uri);
    bytes = direct ?? (await normalizeThenRead(uri));
  } catch (error) {
    if (error instanceof TooLargeError) {
      throw new Error(
        `${label} is larger than ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB. Pick a smaller photo.`,
      );
    }
    // One message for "gone", "wrong shape" and "unreadable", because the
    // provider's remedy is identical for all three: choose that photo again.
    throw new Error(`${label} could not be read from this device. Pick it again.`);
  }

  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error(
      `${label} is larger than ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB. Pick a smaller photo.`,
    );
  }

  const mime = sniffImageMime(bytes);
  if (!mime) {
    throw new Error(`${label} is not a readable image. Pick a JPEG or PNG photo.`);
  }

  return { bytes, mime };
}

/**
 * Uploads a provider's photos and returns them in the same order they were
 * sent, so the caller can pair them back up with captions and the cover flag.
 *
 * The whole batch goes up as one multipart request rather than N sequential
 * ones: fewer round trips on a high-latency mobile connection, and multer caps
 * the request at MAX_LISTING_PHOTOS server-side anyway.
 */
export async function uploadListingPhotos(
  photos: ProviderPhoto[],
  token?: string | null
): Promise<UploadedPhoto[]> {
  if (MOCK_API) return [];
  if (photos.length === 0) return [];

  const form = new FormData();

  // Expo SDK 57 installs a custom "winter" fetch that replaces the global
  // FormData serializer. Unlike React Native's legacy networking, it rejects
  // the { uri, name, type } append convention — only strings, Blobs, or
  // objects exposing a bytes() method are valid parts. Read each local file
  // into memory and provide its bytes through that interface instead.
  //
  // Every photo is read and validated up front so a bad file is reported
  // before a single byte goes over the wire, rather than leaving a half-used
  // request behind.
  const local: LocalImage[] = [];
  for (let index = 0; index < photos.length; index += 1) {
    local.push(await readLocalImage(photos[index].uri, index));
  }

  local.forEach((image, index) => {
    form.append('photos', {
      bytes: () => Promise.resolve(image.bytes),
      // Photos are normally re-encoded as JPEG by processListingImage, but the
      // extension follows the real bytes so a PNG is never saved as a .jpg.
      name: `listing-${index}.${EXTENSION_BY_MIME[image.mime] ?? 'jpg'}`,
      type: image.mime,
    } as unknown as Blob);
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/uploads/images`, {
      method: 'POST',
      body: form,
      // Content-Type is intentionally left unset so the runtime adds the
      // multipart boundary itself.
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    });

    const payload = (await response.json()) as UploadImagesResponse;

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'We could not upload your photos.');
    }

    const images = payload.data?.images || [];

    if (images.length !== photos.length) {
      throw new Error('Some photos did not upload. Please try again.');
    }

    return images;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Your photos took too long to upload. Check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
