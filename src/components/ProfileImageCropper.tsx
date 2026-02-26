'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Camera, Upload, ZoomIn, ZoomOut, RotateCw, Check, X, Loader2, ImageIcon } from 'lucide-react';

interface ProfileImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImage: string) => Promise<void>;
  currentImage?: string;
}

// Utility function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Resize to max 512x512 to keep file size reasonable
  const maxDimension = 512;
  const finalCanvas = document.createElement('canvas');
  const finalCtx = finalCanvas.getContext('2d');
  
  if (!finalCtx) {
    throw new Error('No 2d context for final canvas');
  }
  
  finalCanvas.width = maxDimension;
  finalCanvas.height = maxDimension;
  
  finalCtx.drawImage(canvas, 0, 0, maxDimension, maxDimension);
  
  // Return as base64 data URL with reduced quality (0.7 = ~70% quality)
  return finalCanvas.toDataURL('image/jpeg', 0.7);
};

export default function ProfileImageCropper({
  isOpen,
  onClose,
  onSave,
  currentImage
}: ProfileImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<string | null>(null);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setPreviewUrl(null);
        setZoom(1);
        setRotation(0);
        setCrop({ x: 0, y: 0 });
      });
      reader.readAsDataURL(file);
    }
  };

  const handlePreview = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      setPreviewUrl(croppedImage);
      
      // Calculate file size
      const sizeInBytes = croppedImage.length * 0.75; // Estimate binary size from base64
      let sizeDisplay = '';
      if (sizeInBytes > 1024 * 1024) {
        sizeDisplay = (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB';
      } else if (sizeInBytes > 1024) {
        sizeDisplay = (sizeInBytes / 1024).toFixed(2) + ' KB';
      } else {
        sizeDisplay = Math.round(sizeInBytes) + ' bytes';
      }
      setPreviewSize(sizeDisplay);
    } catch (e) {
      console.error('Error creating preview:', e);
    }
  }, [imageSrc, croppedAreaPixels, rotation]);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsSaving(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      
      // Check file size before sending
      const sizeInBytes = croppedImage.length * 0.75; // Estimate binary size
      const sizeInKB = sizeInBytes / 1024;
      const sizeInMB = sizeInKB / 1024;
      
      console.log(`Image size: ${sizeInMB > 1 ? sizeInMB.toFixed(2) + 'MB' : sizeInKB.toFixed(2) + 'KB'}`);
      
      if (sizeInMB > 5) {
        throw new Error(`Image too large: ${sizeInMB.toFixed(2)}MB (max 5MB)`);
      }
      
      await onSave(croppedImage);
      handleClose();
    } catch (e) {
      console.error('Error saving image:', e);
      throw e; // Re-throw so the profile page can handle the error
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setPreviewUrl(null);
    setPreviewSize(null);
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-5 text-emerald-600" />
            Update Profile Picture
          </DialogTitle>
          <DialogDescription>
            Upload and crop your profile picture. The image will be displayed as a circle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Section */}
          {!imageSrc && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:border-emerald-500 dark:hover:border-emerald-600 transition-colors">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4">
                <Upload className="size-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Choose a photo
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                Select a JPG, PNG, or GIF image up to 5MB
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl">
                  <ImageIcon className="size-5" />
                  Browse Files
                </div>
              </label>
              {currentImage && (
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Current image will be replaced
                </p>
              )}
            </div>
          )}

          {/* Cropper Section */}
          {imageSrc && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cropper */}
                <div className="relative h-64 md:h-80 bg-gray-900 rounded-2xl overflow-hidden">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>

                {/* Preview */}
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Preview</p>
                  <div className="relative">
                    {/* Outer ring for aesthetic */}
                    <div className="absolute -inset-2 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full blur-sm opacity-50" />
                    {/* Circle preview container */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                            Click preview to see result
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-gray-800 rounded-full" />
                  </div>
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    <Check className="size-4 mr-2" />
                    Preview
                  </Button>
                  {previewSize && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      File size: {previewSize}
                    </p>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                {/* Zoom */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <ZoomIn className="size-4 text-emerald-600" />
                      Zoom
                    </Label>
                    <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ZoomOut className="size-4 text-gray-400" />
                    <Slider
                      value={[zoom]}
                      min={1}
                      max={3}
                      step={0.01}
                      onValueChange={(val: number[]) => setZoom(val[0])}
                      className="flex-1"
                    />
                    <ZoomIn className="size-4 text-gray-400" />
                  </div>
                </div>

                {/* Rotation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <RotateCw className="size-4 text-emerald-600" />
                      Rotation
                    </Label>
                    <span className="text-sm text-gray-500">{rotation}°</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">-180°</span>
                    <Slider
                      value={[rotation]}
                      min={-180}
                      max={180}
                      step={1}
                      onValueChange={(val: number[]) => setRotation(val[0])}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-400">180°</span>
                  </div>
                </div>

                {/* Change Image Button */}
                <div className="pt-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      <Upload className="size-4" />
                      Choose Different Image
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            <X className="size-4 mr-2" />
            Cancel
          </Button>
          {imageSrc && (
            <Button
              onClick={handleSave}
              disabled={isSaving || !croppedAreaPixels}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="size-4 mr-2" />
                  Save Profile Picture
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
