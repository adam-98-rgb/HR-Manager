import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function getIsFemale(gender?: string): boolean {
  if (!gender) return false;
  const g = gender.toLowerCase().trim();
  return g === 'female' || g === 'femme' || g === 'f';
}
