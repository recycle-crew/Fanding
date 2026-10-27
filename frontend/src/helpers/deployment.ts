export function workspaceHref(path: string) {
  return import.meta.env.VITE_GITHUB_PAGES === "true"
    ? `${import.meta.env.BASE_URL}#${path}`
    : path;
}

export function staticAssetHref(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
