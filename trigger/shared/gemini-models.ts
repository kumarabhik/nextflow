export function resolveGeminiModelId(modelId?: string) {
  switch (modelId) {
    case "gemini-fast":
      return "gemini-2.5-flash-lite";
    case "gemini-quality":
      return "gemini-2.5-pro";
    case "gemini-balanced":
    default:
      return "gemini-2.5-flash";
  }
}
