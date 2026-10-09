import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Objective 1: Error States Production Readiness', () => {
  const rootDir = path.resolve('src');
  const enLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'i18n/locales/en.json'), 'utf-8'));
  const arLocale = JSON.parse(fs.readFileSync(path.join(rootDir, 'i18n/locales/ar.json'), 'utf-8'));

  describe('ErrorState Component Contract & Accessibility', () => {
    it('ErrorState should provide accessible assertive alert attributes', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/errors/ErrorState.tsx'), 'utf-8');
      assert.ok(content.includes('role="alert"'), 'ErrorState must declare role="alert"');
      assert.ok(content.includes('aria-live="assertive"'), 'ErrorState must declare aria-live="assertive"');
    });

    it('ErrorState should display HTTP status code badge when available', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/errors/ErrorState.tsx'), 'utf-8');
      assert.ok(content.includes('fallback.statusCode'), 'ErrorState must check fallback.statusCode');
      assert.ok(content.includes('<Badge variant="destructive"'), 'ErrorState must render status badge');
    });

    it('ErrorState should provide retry button with icon and localized label', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/errors/ErrorState.tsx'), 'utf-8');
      assert.ok(content.includes('RotateCcw'), 'ErrorState must render RotateCcw icon');
      assert.ok(content.includes('onRetry'), 'ErrorState must accept onRetry prop');
      assert.ok(content.includes("t('Try again')"), 'ErrorState must fallback to localized Try again');
    });

    it('ErrorState should be exported from UI component library', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/ui/index.ts'), 'utf-8');
      assert.ok(content.includes('ErrorState'), 'UI index must export ErrorState');
    });
  });

  describe('DataTable Component Integration with ErrorState', () => {
    it('DataTable should accept onErrorRetry prop and pass it to ErrorState', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/ui/DataTable.tsx'), 'utf-8');
      assert.ok(content.includes('onErrorRetry?: () => void;'), 'DataTable must define onErrorRetry prop');
      assert.ok(content.includes('<ErrorState'), 'DataTable must render ErrorState component on error');
      assert.ok(content.includes('onRetry={onErrorRetry}'), 'DataTable must wire onErrorRetry to onRetry');
    });

    it('DataTable should replace table content with ErrorState when error is present', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/ui/DataTable.tsx'), 'utf-8');
      assert.ok(content.includes('{error ? ('), 'DataTable must conditionally render on error');
    });
  });

  describe('RFC 7807 Error Model Parsing & Classification', () => {
    it('should classify 400 Bad Request as non-retryable with status code', async () => {
      const { getErrorPresentation } = await import('../src/utils/errorPresentation.ts');
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            title: 'Bad Request',
            detail: 'The provided parameters are invalid.',
          },
        },
      };
      const presentation = getErrorPresentation(error);
      assert.equal(presentation.statusCode, 400);
      assert.equal(presentation.retryable, false);
      assert.equal(presentation.title, 'Bad Request');
      assert.equal(presentation.description, 'The provided parameters are invalid.');
    });

    it('should classify 401 Unauthorized as session expired', async () => {
      const { getErrorPresentation } = await import('../src/utils/errorPresentation.ts');
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {},
        },
      };
      const presentation = getErrorPresentation(error);
      assert.equal(presentation.statusCode, 401);
      assert.equal(presentation.retryable, false);
      assert.equal(presentation.title, 'Session expired');
    });

    it('should classify 403 Forbidden as access denied', async () => {
      const { getErrorPresentation } = await import('../src/utils/errorPresentation.ts');
      const error = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {},
        },
      };
      const presentation = getErrorPresentation(error);
      assert.equal(presentation.statusCode, 403);
      assert.equal(presentation.retryable, false);
      assert.equal(presentation.title, 'Access denied');
    });

    it('should classify 404 Not Found appropriately', async () => {
      const { getErrorPresentation } = await import('../src/utils/errorPresentation.ts');
      const error = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {},
        },
      };
      const presentation = getErrorPresentation(error);
      assert.equal(presentation.statusCode, 404);
      assert.equal(presentation.retryable, false);
      assert.equal(presentation.title, 'Not found');
    });

    it('should classify 409 Conflict as non-retryable conflict', async () => {
      const { getErrorPresentation } = await import('../src/utils/errorPresentation.ts');
      const error = {
        isAxiosError: true,
        response: {
          status: 409,
          data: { detail: 'A cohort with this code already exists.' },
        },
      };
      const presentation = getErrorPresentation(error);
      assert.equal(presentation.statusCode, 409);
      assert.equal(presentation.retryable, false);
      assert.equal(presentation.description, 'A cohort with this code already exists.');
    });

    it('should classify 429 Rate Limit as retryable request delayed', async () => {
      const { getErrorPresentation } = await import('../src/utils/errorPresentation.ts');
      const error = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {},
        },
      };
      const presentation = getErrorPresentation(error);
      assert.equal(presentation.statusCode, 429);
      assert.equal(presentation.retryable, true);
    });

    it('should classify 500+ as retryable service unavailable', async () => {
      const { getErrorPresentation } = await import('../src/utils/errorPresentation.ts');
      const error = {
        isAxiosError: true,
        response: {
          status: 503,
          data: {},
        },
      };
      const presentation = getErrorPresentation(error);
      assert.equal(presentation.statusCode, 503);
      assert.equal(presentation.retryable, true);
      assert.equal(presentation.title, 'Service unavailable');
    });

    it('should classify network drop (no response) as retryable connection problem', async () => {
      const { getErrorPresentation } = await import('../src/utils/errorPresentation.ts');
      const error = {
        isAxiosError: true,
        request: {},
      };
      const presentation = getErrorPresentation(error);
      assert.equal(presentation.retryable, true);
      assert.equal(presentation.title, 'Connection problem');
    });
  });

  describe('Feature Components Error State & Recovery Integration', () => {
    it('StudentsList should pass onErrorRetry to DataTable and render AlertCircle on modal saveError', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/students/components/StudentsList.tsx'), 'utf-8');
      assert.ok(content.includes('onErrorRetry={() => void loadStudents()}'), 'StudentsList must pass onErrorRetry');
      assert.ok(content.includes('AlertCircle'), 'StudentsList must render AlertCircle icon on modal error');
      assert.ok(content.includes('role="alert"'), 'StudentsList modal error must have role="alert"');
    });

    it('InstructorsList should pass onErrorRetry to DataTable and render AlertCircle on modal saveError', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/instructors/components/InstructorsList.tsx'), 'utf-8');
      assert.ok(content.includes('onErrorRetry={() => void loadInstructors()}'), 'InstructorsList must pass onErrorRetry');
      assert.ok(content.includes('AlertCircle'), 'InstructorsList must render AlertCircle icon on modal error');
      assert.ok(content.includes('role="alert"'), 'InstructorsList modal error must have role="alert"');
    });

    it('CoursesList should render ErrorState for query failure and modal alert for save/delete error', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/courses/components/CoursesList.tsx'), 'utf-8');
      assert.ok(content.includes('<ErrorState'), 'CoursesList must render ErrorState on loadError');
      assert.ok(content.includes('onRetry={() => void load()}'), 'CoursesList must wire load retry');
      assert.ok(content.includes('deletingCourse'), 'CoursesList must have dedicated deletingCourse state');
      assert.ok(content.includes('confirmDeleteCourse'), 'CoursesList must have confirmDeleteCourse handler');
    });

    it('GroupsList should render ErrorState for query failure and modal alert for saveError', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/courses/components/GroupsList.tsx'), 'utf-8');
      assert.ok(content.includes('<ErrorState'), 'GroupsList must render ErrorState on loadError');
      assert.ok(content.includes('onRetry={() => void load()}'), 'GroupsList must wire load retry');
      assert.ok(content.includes('AlertCircle'), 'GroupsList must render AlertCircle on save error');
    });
  });

  describe('Bilingual Localization for Error States', () => {
    it('should have error strings in English and Arabic locales', () => {
      const keys = [
        'Could not load courses',
        'Could not load course groups',
        'You do not have permission to delete this course.',
        'Delete course',
        'Are you sure you want to delete this course?',
      ];
      for (const key of keys) {
        assert.ok(key in enLocale, `en.json must contain "${key}"`);
        assert.ok(key in arLocale, `ar.json must contain "${key}"`);
        assert.ok(typeof arLocale[key] === 'string' && arLocale[key].trim().length > 0, `ar translation for "${key}" must not be empty`);
      }
    });
  });
});
