import React from 'react';
import { measureRenders } from 'reassure';
import HomeScreen from '../index';

jest.setTimeout(120000); // 2 minutes for reassure performance measurements

describe('Performance testing', () => {
  it('HomeScreen renders fast enough', async () => {
    await measureRenders(<HomeScreen />);
  });
});
