/**
 * QR Code Storage Utility
 * 
 * Handles uploading QR codes to Supabase Storage bucket.
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Convert base64 data URL to Buffer
 */
function base64ToBuffer(dataUrl: string): Buffer {
  // Remove data URL prefix (e.g., "data:image/png;base64,")
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Upload QR code to Supabase Storage bucket
 * 
 * @param client Supabase client instance
 * @param base64DataUrl QR code as base64 data URL
 * @param entityType Entity type (e.g., 'product', 'user')
 * @param entityId Entity ID (e.g., 'laptop-123')
 * @param bucketName Bucket name (default: 'qr-codes')
 * @returns Public URL of uploaded QR code
 */
export async function uploadQRCodeToBucket(
  client: SupabaseClient<any, 'public', any>,
  base64DataUrl: string,
  entityType: string,
  entityId: string,
  bucketName: string = 'qr-codes'
): Promise<string> {
  try {
    // Convert base64 to buffer
    const buffer = base64ToBuffer(base64DataUrl);
    
    // Generate path: {entity_type}/{entity_id}.png
    const filePath = `${entityType}/${entityId}.png`;
    
    // Upload to bucket (overwrite if exists)
    const { data: uploadData, error: uploadError } = await client.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true, // Overwrite if file exists
        cacheControl: '3600' // Cache for 1 hour
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload QR code to bucket: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: urlData } = client.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded QR code');
    }
    
    return urlData.publicUrl;
  } catch (error) {
    throw new Error(
      `QR code upload failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

