// Helper de composition de classes — concat clsx sans bruit.
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}