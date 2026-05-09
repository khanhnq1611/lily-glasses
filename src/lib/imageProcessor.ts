/**
 * Image processing for virtual try-on
 * Creates a processed image by overlaying glasses on the original portrait
 */

import { GlassesStyle } from '../constants/glasses';

/**
 * Polyfill for canvas roundRect if not supported
 */
function ensureRoundRectSupport(ctx: CanvasRenderingContext2D) {
  if (ctx.roundRect) return; // Already supported
  
  // Add polyfill implementation
  ctx.roundRect = function(x: number, y: number, w: number, h: number, r: any) {
    const radius = typeof r === 'number' ? r : r || 0;
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + w - radius, y);
    this.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.lineTo(x + w, y + h - radius);
    this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.lineTo(x + radius, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  } as any;
}

/**
 * Create a try-on image by drawing glasses on the portrait
 * This is a fallback when AI image generation is unavailable
 */
export async function createVirtualTryOnImage(
  portraitDataUrl: string,
  glasses: GlassesStyle
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // Create canvas with same dimensions as image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Ensure roundRect is supported
        ensureRoundRectSupport(ctx);

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Add a subtle enhancement filter (optional)
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;

        // Draw glasses overlay (simplified)
        drawGlassesOverlay(ctx, canvas.width, canvas.height, glasses);

        // Convert to data URL
        const result = canvas.toDataURL('image/jpeg', 0.95);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load portrait image'));
    };

    img.src = portraitDataUrl;
  });
}

/**
 * Draw glasses overlay on canvas
 * Uses glasses-specific properties for accurate rendering
 */
function drawGlassesOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  glasses: GlassesStyle
): void {
  // Standard portrait proportions
  const faceHeight = height * 0.6;
  const eyeLevel = height * (0.32 + glasses.verticalOffset); // Use glasses vertical offset
  
  // Use glasses widthFactor for accurate sizing
  const glassesWidth = width * glasses.widthFactor * 0.125; // Scale based on widthFactor
  
  // Calculate lens dimensions from glasses properties (in cm) converted to pixels
  // Assuming 96 DPI: 1 cm ≈ 37.8 pixels
  const pxPerCm = 37.8;
  const lensWidth = glasses.lensWidthCm * pxPerCm;
  const lensHeight = glasses.lensHeightCm * pxPerCm;
  const bridgeWidth = glasses.bridgeWidthCm * pxPerCm;
  
  // Calculate position (center horizontally, position vertically at eye level)
  const totalWidth = lensWidth * 2 + bridgeWidth;
  const x = (width - totalWidth) / 2;
  const y = eyeLevel - lensHeight / 2;

  // Get frame color (HEX code, not text name)
  const frameColor = glasses.color || '#000000';
  const rimColor = glasses.rimColor || frameColor;
  
  // Draw left lens
  drawLens(
    ctx,
    x,
    y,
    lensWidth,
    lensHeight,
    glasses.frameShape,
    frameColor,
    rimColor,
    glasses.thickness,
    glasses.reflectivity
  );
  
  // Draw bridge
  const bridgeX = x + lensWidth + (glasses.bridgeOffsetX || 0);
  const bridgeY = y + lensHeight * 0.3 + (glasses.bridgeOffsetY || 0);
  drawBridge(ctx, bridgeX, bridgeY, bridgeWidth, lensHeight * 0.4, frameColor, glasses.thickness);
  
  // Draw right lens
  const rightLensX = x + lensWidth + bridgeWidth;
  drawLens(
    ctx,
    rightLensX,
    y,
    lensWidth,
    lensHeight,
    glasses.frameShape,
    frameColor,
    rimColor,
    glasses.thickness,
    glasses.reflectivity
  );

  // Draw temples (arms)
  const templeLength = glasses.templeLengthCm * pxPerCm * 0.5;
  const templeThickness = Math.max(1, glasses.thickness * 2);
  
  // Left temple
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = templeThickness;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + lensHeight * 0.35);
  ctx.lineTo(x - templeLength * 0.5, y + lensHeight * 0.1);
  ctx.stroke();
  
  // Right temple
  ctx.beginPath();
  ctx.moveTo(rightLensX + lensWidth - 2, y + lensHeight * 0.35);
  ctx.lineTo(rightLensX + lensWidth + templeLength * 0.5, y + lensHeight * 0.1);
  ctx.stroke();
  
  ctx.globalAlpha = 1.0;
}

/**
 * Draw a single lens based on shape
 */
function drawLens(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  shape: string,
  color: string,
  rimColor: string,
  thickness: number,
  reflectivity: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, thickness * 3); // Scale line width by thickness
  ctx.globalAlpha = 0.9;

  ctx.beginPath();

  switch (shape.toLowerCase()) {
    case 'cat-eye':
    case 'cateye':
      // Cat-eye shape: higher on outside
      ctx.moveTo(x + width * 0.2, y + 2);
      ctx.bezierCurveTo(
        x + width * 0.7, y - height * 0.15,
        x + width, y,
        x + width * 0.95, y + height * 0.5
      );
      ctx.bezierCurveTo(
        x + width, y + height - 2,
        x + width * 0.2, y + height - 2,
        x, y + height * 0.4
      );
      ctx.quadraticCurveTo(x, y + 2, x + width * 0.2, y + 2);
      break;

    case 'oval':
      // Oval shape
      ctx.ellipse(x + width / 2, y + height / 2, width / 2.2, height / 2, 0, 0, Math.PI * 2);
      break;

    case 'round':
    case 'circle':
      // Round shape
      ctx.ellipse(x + width / 2, y + height / 2, width / 2.3, height / 2.3, 0, 0, Math.PI * 2);
      break;

    case 'square':
    case 'rectangle':
      // Square/rectangular style with sharp corners
      ctx.roundRect(x, y, width, height, Math.min(width * 0.05, 2));
      break;

    case 'wayfarer':
      // Wayfarer: rectangular with slightly rounded corners
      ctx.roundRect(x, y, width, height, Math.min(width * 0.1, 5));
      break;

    case 'browline':
      // Browline: angular top, curved bottom
      ctx.moveTo(x, y + height * 0.3);
      ctx.lineTo(x + width * 0.2, y);
      ctx.lineTo(x + width * 0.8, y);
      ctx.lineTo(x + width, y + height * 0.3);
      ctx.quadraticCurveTo(x + width, y + height, x + width * 0.5, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height * 0.3);
      break;

    case 'geometric':
    case 'hexagon':
      // Geometric/hexagon shape
      const angle = Math.PI / 3; // 60 degrees
      const cx = x + width / 2;
      const cy = y + height / 2;
      const rx = width / 2.2;
      const ry = height / 2.2;
      for (let i = 0; i < 6; i++) {
        const vx = cx + rx * Math.cos(angle * i);
        const vy = cy + ry * Math.sin(angle * i);
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      break;

    case 'aviator':
      // Aviator: double bridge, teardrop shape
      const tearX = x + width / 2;
      const tearY = y + height / 2;
      const tearRx = width / 2.3;
      const tearRy = height / 2;
      ctx.ellipse(tearX, tearY, tearRx, tearRy, 0, 0, Math.PI * 2);
      break;

    default:
      // Default to wayfarer
      ctx.roundRect(x, y, width, height, Math.min(width * 0.1, 5));
      break;
  }

  ctx.stroke();
  
  // Add lens tint based on reflectivity
  ctx.globalAlpha = 0.05 + reflectivity * 0.1; // More reflective = more tint
  ctx.fillStyle = color;
  ctx.fill();
  
  // Add subtle highlight for reflectivity
  if (reflectivity > 0.3) {
    ctx.globalAlpha = reflectivity * 0.15;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.ellipse(x + width * 0.3, y + height * 0.3, width * 0.15, height * 0.2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Draw glasses bridge
 */
function drawBridge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  thickness: number
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  
  // Scale thickness
  const actualThickness = Math.max(1, thickness * 3);
  ctx.lineWidth = actualThickness;
  ctx.strokeStyle = color;
  
  // Draw bridge as a line with caps for better appearance
  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.moveTo(x, y + height / 2);
  ctx.lineTo(x + width, y + height / 2);
  ctx.stroke();
  
  ctx.restore();
}
