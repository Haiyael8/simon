// Stand-in for the plugin's virtual module, which does not exist under Vitest
export function registerSW() {
  return async () => {};
}
