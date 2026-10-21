import '@testing-library/jest-dom/vitest';

// Each test starts with empty local storage so saved history never leaks between tests
beforeEach(() => {
  window.localStorage.clear();
});
