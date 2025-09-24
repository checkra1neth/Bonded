"use client";

import { useErrorHandlingContext } from "../providers/ErrorHandlingProvider";

export function useErrorHandling() {
  return useErrorHandlingContext();
}
