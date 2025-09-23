// Utility helpers for normalizing image URLs across the app
import { UPLOAD_BASE } from './api';

export function getAvatarSrc(avatar) {
  if (!avatar) return '/profile.png';
  if (typeof avatar === 'string' && avatar.includes('cloudinary.com')) return avatar;
  const name = String(avatar).split('/').pop();
  if (!name) return '/profile.png';
  // If the backend stored a placeholder filename, return local asset instead of hitting upload server
  const placeholders = new Set(['profile.png', 'logo_it.png', 'lo.png', 'placeholder-user.png', 'public/profile.png']);
  if (placeholders.has(name)) return `/${name === 'public/profile.png' ? 'profile.png' : name}`;
  return `${UPLOAD_BASE}/uploads/user/${name}?t=${Date.now()}`;
}
