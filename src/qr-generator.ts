/**
 * QR Code Generator
 * 
 * Handles QR code generation for URLs using the qrcode package.
 * Provides compressed, optimized QR codes for storage and sharing.
 */

import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate a QR code for a URL as a base64 data URL
 * 
 * @param url The URL to encode in the QR code
 * @param options QR code generation options
 * @returns Base64 data URL of the QR code image
 */
export async function generateQRCode(
  url: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const {
      width = 256,
      margin = 2,
      color = {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel = 'M'
    } = options;

    // Generate QR code as data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width,
      margin,
      color,
      errorCorrectionLevel
    });

    return qrCodeDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a QR code with optimized settings for storage
 * 
 * @param url The URL to encode
 * @returns Compressed base64 QR code data URL
 */
export async function generateOptimizedQRCode(url: string): Promise<string> {
  return generateQRCode(url, {
    width: 200, // Smaller size for storage efficiency
    margin: 1,  // Minimal margin
    errorCorrectionLevel: 'L' // Lower error correction for smaller size
  });
}

/**
 * Validate if a string is a valid QR code data URL
 * 
 * @param qrCodeDataUrl The data URL to validate
 * @returns True if valid, false otherwise
 */
export function isValidQRCodeDataUrl(qrCodeDataUrl: string): boolean {
  if (!qrCodeDataUrl || typeof qrCodeDataUrl !== 'string') {
    return false;
  }
  
  // Check if it's a valid data URL format
  const dataUrlPattern = /^data:image\/(png|jpeg|gif|webp);base64,/;
  return dataUrlPattern.test(qrCodeDataUrl);
} 