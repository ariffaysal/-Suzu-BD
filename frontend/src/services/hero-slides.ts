import type { HeroSlide } from '@/types';
import { apiGet } from './api';

/** Active homepage hero slides, ordered by position. */
export function getHeroSlides() {
  return apiGet<HeroSlide[]>('/hero-slides');
}
