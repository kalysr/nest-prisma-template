export function buildUrlWithParams(baseUrl: string, params: Record<string, string | number>): string {
  const url = new URL(baseUrl);

  Object.keys(params).forEach((key) => {
    url.searchParams.append(key, String(params[key]));
  });

  return url.toString();
}
