import { Alert, AlertButton } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// `ImageManipulator.manipulate()` is the imperative entry point and the only one
// usable from this file.
//
// `useImageManipulator` must NOT be used here. Despite reading like a utility,
// it is a React hook — it wraps `useReleasingSharedObject`, i.e. it calls React
// state internally. Calling it from a plain async function (as this file did
// previously) is an invalid hook call, and taking a photo tore the app down
// instead of returning a preview.
import { ImageManipulator, SaveFormat, type ImageRef } from 'expo-image-manipulator';

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_AVATAR_DIMENSION = 512;

// A provider listing can carry up to 4 photos. The cover shot is mandatory
// because it is the only hard proof a provider actually operates from a real
// place; the rest are optional and help customers recognise the shop.
// Keep MAX_FILES_PER_REQUEST in city-pulse-backend/src/config/uploads.js in sync.
export const MAX_LISTING_PHOTOS = 4;
export const REQUIRED_LISTING_PHOTOS = 1;

// Long edge for listing photos. Big enough to look sharp on a phone screen
// (and when a customer zooms), small enough to upload on a poor connection.
export const MAX_LISTING_DIMENSION = 1280;

export type PickSource = 'library' | 'camera';

export type ProcessedImage = {
  uri: string;
  width: number;
  height: number;
};

export async function requestPermissions(source: PickSource): Promise<boolean> {
  if (source === 'library') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
    return status === 'granted';
  } else {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }
}

export async function pickImage(source: PickSource): Promise<ImagePicker.ImagePickerAsset | null> {
  const granted = await requestPermissions(source);
  if (!granted) {
    Alert.alert('Permission Required', 'Please grant permission to access your media library or camera.');
    return null;
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  };

  let result: ImagePicker.ImagePickerResult;
  if (source === 'library') {
    result = await ImagePicker.launchImageLibraryAsync(options);
  } else {
    result = await ImagePicker.launchCameraAsync(options);
  }

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];

  const fileSize = asset.fileSize || 0;
  const sizeMB = fileSize / (1024 * 1024);
  if (fileSize > 0 && sizeMB > MAX_IMAGE_SIZE_MB) {
    Alert.alert(
      'Image Too Large',
      `Image is ${sizeMB.toFixed(1)}MB. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`,
    );
    return null;
  }

  return asset;
}

export async function processAvatarImage(uri: string): Promise<ProcessedImage> {
  const result = await ImageManipulator.manipulate(uri)
    .resize({ width: MAX_AVATAR_DIMENSION, height: MAX_AVATAR_DIMENSION })
    .renderAsync()
    .then((image) =>
      image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG })
    );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}

export function showImageSourceSheet(
  hasExistingAvatar: boolean,
  onPick: (source: PickSource) => void,
  onRemove?: () => void,
) {
  const buttons: AlertButton[] = [
    { text: 'Choose from Library', onPress: () => onPick('library') },
    { text: 'Take Photo', onPress: () => onPick('camera') },
  ];

  if (hasExistingAvatar && onRemove) {
    buttons.push({ text: 'Remove Photo', style: 'destructive', onPress: onRemove });
  }

  buttons.push({ text: 'Cancel', style: 'cancel' });

  Alert.alert('Profile Picture', 'Choose an option', buttons);
}

// --- Listing photos (provider onboarding) ---

export type PickedPhoto = {
  uri: string;
  width?: number;
  height?: number;
};

function photoSizeMB(fileSize?: number) {
  return (fileSize || 0) / (1024 * 1024);
}

function isOversized(fileSize?: number) {
  return Boolean(fileSize) && photoSizeMB(fileSize) > MAX_IMAGE_SIZE_MB;
}

/**
 * Picks one or more photos for a listing.
 * The library picker allows a multi-select up to `remaining`; the camera can
 * only take a single shot, so it always returns at most one photo.
 */
export async function pickPhotos(
  source: PickSource,
  remaining: number
): Promise<PickedPhoto[]> {
  if (remaining <= 0) return [];

  const granted = await requestPermissions(source);
  if (!granted) {
    Alert.alert('Permission Required', 'Please grant permission to access your media library or camera.');
    return [];
  }

  if (source === 'camera') {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.length) return [];

    const asset = result.assets[0];
    if (isOversized(asset.fileSize)) {
      Alert.alert(
        'Image Too Large',
        `Image is ${photoSizeMB(asset.fileSize).toFixed(1)}MB. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`
      );
      return [];
    }

    return [{ uri: asset.uri, width: asset.width, height: asset.height }];
  }

  // allowsEditing cannot be combined with a multi-select, so gallery photos are
  // cropped to a uniform aspect ratio at display time instead.
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.9,
  });

  if (result.canceled || !result.assets?.length) return [];

  const accepted: PickedPhoto[] = [];
  for (const asset of result.assets) {
    if (isOversized(asset.fileSize)) {
      Alert.alert(
        'Image Skipped',
        `"${asset.fileName || 'Photo'}" is ${photoSizeMB(asset.fileSize).toFixed(1)}MB. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`
      );
      continue;
    }
    accepted.push({ uri: asset.uri, width: asset.width, height: asset.height });
  }

  return accepted;
}

/**
 * Downscales and re-encodes a photo so it uploads fast.
 * Always saves as JPEG: the camera can hand back HEIC on iOS, which the upload
 * API does not accept, and normalising the format here keeps that concern in
 * one place.
 */
/**
 * Reads an image's natural size, then releases the native objects used to get
 * it. These are shared native references: `useImageManipulator` frees them for
 * you because it is a hook with a cleanup, so doing the work imperatively means
 * releasing by hand. Skipping this leaks one context plus one image per photo,
 * and the photos screen is a screen people retry on.
 */
async function measureImage(uri: string): Promise<{ width: number; height: number }> {
  const context = ImageManipulator.manipulate(uri);
  let image: ImageRef | null = null;

  try {
    image = await context.renderAsync();
    return { width: image.width, height: image.height };
  } finally {
    context.release();
    image?.release();
  }
}

async function resizeAndEncode(
  uri: string,
  size: { width?: number; height?: number } | null
): Promise<ProcessedImage> {
  const context = ImageManipulator.manipulate(uri);
  let image: ImageRef | null = null;

  try {
    if (size) context.resize(size);
    image = await context.renderAsync();
    const result = await image.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
    return { uri: result.uri, width: result.width, height: result.height };
  } finally {
    context.release();
    image?.release();
  }
}

export async function processListingImage(uri: string): Promise<ProcessedImage> {
  // The dimensions are measured first rather than resized blindly, because
  // resizing a small screenshot up to 1280px would turn it into a large,
  // wasteful file instead of leaving it alone.
  const { width, height } = await measureImage(uri);
  const oversized = width > MAX_LISTING_DIMENSION || height > MAX_LISTING_DIMENSION;

  return resizeAndEncode(uri, oversized ? { width: MAX_LISTING_DIMENSION } : null);
}

/** Resize + encode several photos, reporting progress for the upload UI. */
export async function processListingImages(
  uris: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<ProcessedImage[]> {
  const processed: ProcessedImage[] = [];
  let firstError: unknown = null;

  for (let index = 0; index < uris.length; index += 1) {
    try {
      processed.push(await processListingImage(uris[index]));
    } catch (error) {
      // One unreadable photo should not block the rest of the batch, so the
      // loop keeps going. The reason is still recorded: discarding it here is
      // what turned every real failure into a silent "That image could not be
      // read.", with nothing in the UI or the Metro logs to explain why.
      console.warn('[image-upload] Failed to process photo:', error);
      if (!firstError) firstError = error;
    }
    onProgress?.(index + 1, uris.length);
  }

  // Partial success returns what worked. Total failure rethrows the underlying
  // cause so the caller can show something specific.
  if (processed.length === 0 && firstError) {
    throw firstError instanceof Error
      ? firstError
      : new Error('That image could not be read. Try a different one.');
  }

  return processed;
}

export function showPhotoSourceSheet(
  hasPhoto: boolean,
  onPick: (source: PickSource) => void,
  onRemove?: () => void,
  title = 'Add a photo'
) {
  const buttons: AlertButton[] = [
    { text: 'Choose from Library', onPress: () => onPick('library') },
    { text: 'Take Photo', onPress: () => onPick('camera') },
  ];

  if (hasPhoto && onRemove) {
    buttons.push({ text: 'Remove Photo', style: 'destructive', onPress: onRemove });
  }

  buttons.push({ text: 'Cancel', style: 'cancel' });

  Alert.alert(title, 'Choose an option', buttons);
}

