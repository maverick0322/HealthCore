import { describe, expect, it } from 'vitest';

import { appRouter } from './AppRouter';

describe('appRouter', () => {
  it('creates the browser router without invalid nested route paths', () => {
    expect(appRouter).toBeDefined();
  });
});
