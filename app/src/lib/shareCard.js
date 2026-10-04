/*
 * Draws a creation's share card on a canvas: 1080×1920 for stories, 1080×1080 for posts.
 * The portrait, the name and the two lines, the café that made it, and the ode mark.
 */
import { portrait, INGREDIENT_COLORS, mix } from '../brand/portrait';
import { quoteMark, sealMark } from '../brand/marks';
import { cafe } from '../data/demoCafe';

const svgImage = (svg) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
});

export async function drawShareCard(canvas, c, format = 'story') {
  const W = 1080, H = format === 'story' ? 1920 : 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  await Promise.all([
    document.fonts.load('300 120px Fraunces'), document.fonts.load('italic 300 60px Fraunces'),
    document.fonts.load('500 60px Fraunces'), document.fonts.load('600 32px Figtree'),
  ]).catch(() => {});

  const colors = c.recipe.ingredients.filter((i) => i.id !== 'ice').map((i) => INGREDIENT_COLORS[i.id] || i.color);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, mix(colors[0], '#FAF6F0', 0.8));
  g.addColorStop(0.55, '#F7EFE6');
  g.addColorStop(1, mix(colors[colors.length - 1], '#FAF6F0', 0.7));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const story = format === 'story';
  const art = story ? 900 : 560;
  const artX = (W - art) / 2, artY = story ? 170 : 90;
  const img = await svgImage(portrait({ colors, mood: c.mood.primary, seed: c.id, width: art, height: art, id: 'sc' }));
  ctx.save();
  roundRect(ctx, artX, artY, art, art, story ? 64 : 48);
  ctx.clip();
  ctx.drawImage(img, artX, artY, art, art);
  ctx.restore();

  const center = W / 2;
  let y = artY + art + (story ? 120 : 78);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#A86870';
  ctx.font = '600 26px Figtree';
  ctx.letterSpacing = '8px';
  ctx.fillText('AN ODE, WRITTEN FOR ME', center, y);
  ctx.letterSpacing = '0px';
  y += story ? 120 : 92;
  ctx.fillStyle = '#3A3530';
  ctx.font = `300 ${story ? 112 : 84}px Fraunces`;
  ctx.fillText(c.name, center, y);
  y += story ? 96 : 70;
  ctx.fillStyle = '#A86870';
  ctx.font = `italic 300 ${story ? 50 : 38}px Fraunces`;
  for (const line of c.lines) { ctx.fillText(line, center, y); y += story ? 70 : 52; }

  // footer: café on the left, the mark and seal on the right
  const fy = H - (story ? 130 : 70);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#3A3530';
  ctx.font = '600 34px Figtree';
  ctx.fillText(cafe.name, 80, fy);
  ctx.fillStyle = '#8A8A72';
  ctx.font = '500 28px Figtree';
  ctx.fillText(cafe.handle, 80, fy + 42);

  const mark = await svgImage(quoteMark({ size: 64 }));
  ctx.drawImage(mark, W - 230, fy - 70, 64, 64);
  ctx.fillStyle = '#3A3530';
  ctx.font = '500 72px Fraunces';
  ctx.textAlign = 'left';
  ctx.fillText('ode', W - 168, fy + 6);
  if (story) {
    const seal = await svgImage(sealMark({ size: 150, id: 'scs' }));
    ctx.globalAlpha = 0.95;
    ctx.drawImage(seal, W - 210, artY + art - 120, 150, 150);
    ctx.globalAlpha = 1;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function canvasBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
