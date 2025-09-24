"use client";

import { useMobileExperienceContext } from "../providers/MobileExperienceProvider";

export function useMobileExperience() {
  return useMobileExperienceContext();
}
