import { publicEnv } from "@/lib/env";

export const EXPERIENCE_IMAGES_BUCKET = "experience-images";
export const REVIEW_IMAGES_BUCKET = "review-images";

// Public CDN URL for a review photo object key (or pass-through full URL).
export function reviewImageUrl(objectKey: string): string {
  if (/^https?:\/\//.test(objectKey)) return objectKey;
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${REVIEW_IMAGES_BUCKET}/${objectKey}`;
}

// Path convention enforced by storage RLS: {profile_id}/{booking_id}/{file}.
export function reviewImagePath(
  profileId: string,
  bookingId: string,
  fileName: string,
): string {
  return `${profileId}/${bookingId}/${fileName}`;
}

// Public CDN URL for a stored object key (path within the bucket). Seed/demo
// rows may store a full external URL — pass those through unchanged.
export function experienceImageUrl(objectKey: string): string {
  if (/^https?:\/\//.test(objectKey)) return objectKey;
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${EXPERIENCE_IMAGES_BUCKET}/${objectKey}`;
}

// Path convention enforced by storage RLS: {operator_id}/{experience_id}/{file}.
export function experienceImagePath(
  operatorId: string,
  experienceId: string,
  fileName: string,
): string {
  return `${operatorId}/${experienceId}/${fileName}`;
}
