import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Platform Users View & Multi-Tenant Security Integration', () => {
  const rootDir = path.resolve('src');
  const componentPath = path.join(rootDir, 'features/platform/components/PlatformUsersView.tsx');

  it('PlatformUsersView component should exist and target /roles/users endpoint', () => {
    const componentFile = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(componentFile.includes("apiClient.get<PlatformUser[]>('/roles/users')"), 'Must call /roles/users endpoint');
  });

  it('PlatformUsersView should differentiate demo from live authenticated mode', () => {
    const componentFile = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(componentFile.includes('useAuth'), 'Must import and use useAuth context');
    assert.ok(componentFile.includes('isDemo'), 'Must determine isDemo flag from auth context');
  });

  it('PlatformUsersView should not silently display fake demo users on live API failure', () => {
    const componentFile = fs.readFileSync(componentPath, 'utf-8');
    // Live mode failure must clear or keep users array empty rather than falling back to defaultPlatformUsers
    assert.ok(componentFile.includes('setUsers([])'), 'Live mode failure must reset users to empty array');
    assert.ok(componentFile.includes('Please check your connection and retry'), 'Live mode failure must present genuine error feedback');
  });

  it('PlatformUsersView should handle empty response arrays from backend without demo overwrite', () => {
    const componentFile = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(componentFile.includes('setUsers(response.data || [])'), 'Must accept and render empty array without falling back to demo users');
  });
});
