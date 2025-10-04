"use client";

import React, { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Utility: load image for canvas ops
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getCroppedBlob(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
  mime: string = "image/jpeg",
  quality = 0.92
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(croppedAreaPixels.width));
  canvas.height = Math.max(1, Math.floor(croppedAreaPixels.height));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  (ctx as CanvasRenderingContext2D).imageSmoothingQuality = "high" as ImageSmoothingQuality;

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Failed to create blob"));
      resolve(blob);
    }, mime, quality);
  });
}

interface AvatarCropDialogProps {
  isOpen: boolean;
  src: string | null;
  onOpenChange: (open: boolean) => void;
  onCropped: (blob: Blob) => Promise<void> | void;
  aspect?: number;
  cropShape?: "rect" | "round";
  dialogTitle?: string;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  confirmLabel?: string;
}

export default function AvatarCropDialog({ isOpen, src, onOpenChange, onCropped, aspect = 1, cropShape = "round", dialogTitle = "Adjust your avatar", initialZoom = 1, minZoom = 1, maxZoom = 4, confirmLabel = "Save" }: AvatarCropDialogProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom);
  const [croppedPixels, setCroppedPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(initialZoom);
      setCroppedPixels(null);
    }
  }, [isOpen, src, initialZoom]);

  const onCropComplete = useCallback((_area: any, areaPixels: any) => {
    setCroppedPixels(areaPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!src || !croppedPixels) return;
    setSaving(true);
    try {
      console.debug("AvatarCropDialog: confirming crop, pixels=", croppedPixels);
      const blob = await getCroppedBlob(src, croppedPixels, "image/jpeg", 0.92);
      console.debug("AvatarCropDialog: created blob", blob);
      await onCropped(blob);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }, [src, croppedPixels, onCropped, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-[360px] overflow-hidden rounded-lg bg-muted">
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition={true}
              minZoom={minZoom}
              maxZoom={maxZoom}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image selected</div>
          )}
        </div>

        {maxZoom > minZoom && (
          <div className="space-y-2 mt-3">
            <div className="text-xs">Zoom</div>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!src || !croppedPixels || saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
