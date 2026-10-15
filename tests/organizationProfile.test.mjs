import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

describe('Organization Profile Management & API Integration', () => {
  const rootDir = path.resolve('src');
  const profileSchema = z.object({
    name: z.string().trim().min(2, 'Enter an organization name with at least 2 characters.').max(100, 'Organization name must be 100 characters or fewer.'),
    email: z.string().trim().email('Enter a valid contact email address.').max(254),
    phone: z.string().trim().max(30),
    website: z.string().trim().max(200).refine((value) => !value || z.url().safeParse(value).success, 'Enter a valid website URL, including https://.'),
    address: z.string().trim().max(180),
    description: z.string().trim().max(500),
  });

  it('should validate a complete valid profile', () => {
    const input = {
      name: 'Alpha Training Academy',
      email: 'admin@alpha.edu',
      phone: '+20 100 123 4567',
      website: 'https://alpha.edu',
      address: '10 Cairo Road, Smart Village',
      description: 'Premier IT training and software engineering academy.',
    };

    const result = profileSchema.safeParse(input);
    assert.equal(result.success, true);
  });

  it('should reject invalid website URL or invalid email in profile', () => {
    const badWebsite = {
      name: 'Alpha Training Academy',
      email: 'admin@alpha.edu',
      phone: '+20 100 123 4567',
      website: 'not-a-valid-url',
      address: 'Cairo',
      description: 'Premier training center.',
    };

    const badEmail = {
      name: 'Alpha Training Academy',
      email: 'not-an-email',
      phone: '+20 100 123 4567',
      website: 'https://alpha.edu',
      address: 'Cairo',
      description: 'Premier training center.',
    };

    assert.equal(profileSchema.safeParse(badWebsite).success, false);
    assert.equal(profileSchema.safeParse(badEmail).success, false);
  });

  it('should declare organizationsApi with endpoints for current organization', () => {
    const apiFile = fs.readFileSync(path.join(rootDir, 'api/organizationsApi.ts'), 'utf-8');
    assert.ok(apiFile.includes('getCurrent()'), 'organizationsApi must declare getCurrent()');
    assert.ok(apiFile.includes('updateCurrent('), 'organizationsApi must declare updateCurrent()');
    assert.ok(apiFile.includes('/organizations/current'), 'organizationsApi must target /organizations/current');
  });

  it('OrganizationProfile component should connect to organizationsApi in non-demo mode', () => {
    const componentFile = fs.readFileSync(path.join(rootDir, 'features/dashboard/components/OrganizationProfile.tsx'), 'utf-8');
    assert.ok(componentFile.includes('organizationsApi.getCurrent()'), 'Must call getCurrent() in non-demo mode');
    assert.ok(componentFile.includes('organizationsApi.updateCurrent('), 'Must call updateCurrent() on submit');
    assert.ok(componentFile.includes('!isDemo'), 'Must differentiate demo from authenticated mode');
  });
});
