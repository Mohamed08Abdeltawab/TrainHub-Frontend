import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Objective 2: Forms Validation Production Readiness', () => {
  const rootDir = path.resolve('src');

  describe('RFC 7807 Backend Error Mapping (getFieldErrors)', () => {
    it('should map PascalCase validation keys to camelCase for form fields', async () => {
      const { getFieldErrors } = await import('../src/utils/errorPresentation.ts');
      const apiError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            title: 'One or more validation errors occurred.',
            errors: {
              Title: ['The Title field is required.'],
              StartTime: ['StartTime must be in the future.'],
              Email: ['Email is invalid.'],
            },
          },
        },
      };

      const fieldErrors = getFieldErrors(apiError);
      assert.equal(fieldErrors.title, 'The Title field is required.');
      assert.equal(fieldErrors.startTime, 'StartTime must be in the future.');
      assert.equal(fieldErrors.email, 'Email is invalid.');
      assert.equal(fieldErrors.Title, 'The Title field is required.');
      assert.equal(fieldErrors.StartTime, 'StartTime must be in the future.');
    });

    it('should support extensions.errors fallback and string array messages', async () => {
      const { getFieldErrors } = await import('../src/utils/errorPresentation.ts');
      const apiError = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            extensions: {
              errors: {
                DurationHours: ['Duration must be at least 1.'],
                Category: 'Category is required.',
              },
            },
          },
        },
      };

      const fieldErrors = getFieldErrors(apiError);
      assert.equal(fieldErrors.durationHours, 'Duration must be at least 1.');
      assert.equal(fieldErrors.category, 'Category is required.');
    });

    it('should return empty dictionary for non-validation errors or network drops', async () => {
      const { getFieldErrors } = await import('../src/utils/errorPresentation.ts');
      assert.deepEqual(getFieldErrors(new Error('Network error')), {});
      assert.deepEqual(getFieldErrors({ isAxiosError: true }), {});
      assert.deepEqual(getFieldErrors({ isAxiosError: true, response: { status: 500, data: {} } }), {});
    });
  });

  describe('Accessible Form Field Semantics (Input Component)', () => {
    it('Input should bind error to aria-invalid and aria-describedby', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/ui/Input.tsx'), 'utf-8');
      assert.ok(content.includes('aria-invalid={error ? true : props["aria-invalid"]}'), 'Input must set aria-invalid when error is present');
      assert.ok(content.includes('const errorId = error ? `${inputId}-error` : undefined'), 'Input must generate unique error id');
      assert.ok(content.includes('role="alert"'), 'Input error message must declare role="alert"');
      assert.ok(content.includes('aria-describedby={describedByIds}'), 'Input must connect aria-describedby to error id');
    });

    it('Input should have accessible visual error indicators and focus rings', () => {
      const content = fs.readFileSync(path.join(rootDir, 'components/ui/Input.tsx'), 'utf-8');
      assert.ok(content.includes('aria-invalid:border-destructive'), 'Input must highlight border on invalid');
      assert.ok(content.includes('aria-invalid:ring-destructive/20'), 'Input must display focus ring on invalid');
    });
  });

  describe('Feature Forms Validation Rules & Sanitization', () => {
    it('StudentsList should validate minimum length, email regex, phone regex, and duplicates', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/students/components/StudentsList.tsx'), 'utf-8');
      assert.ok(content.includes('name.length < 2'), 'StudentsList must check name >= 2 chars');
      assert.ok(content.includes('.test(email)'), 'StudentsList must validate email regex');
      assert.ok(content.includes('.test(form.phone.trim())'), 'StudentsList must validate phone regex');
      assert.ok(content.includes('student.email.toLowerCase() === email'), 'StudentsList must prevent duplicate email');
      assert.ok(content.includes('getFieldErrors(error)'), 'StudentsList must map server field errors');
      assert.ok(content.includes('noValidate'), 'StudentsList form must disable default browser bubble');
    });

    it('InstructorsList should validate minimum length, email regex, phone regex, and duplicates', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/instructors/components/InstructorsList.tsx'), 'utf-8');
      assert.ok(content.includes('name.length < 2'), 'InstructorsList must check name >= 2 chars');
      assert.ok(content.includes('.test(email)'), 'InstructorsList must validate email regex');
      assert.ok(content.includes('.test(form.phone.trim())'), 'InstructorsList must validate phone regex');
      assert.ok(content.includes('instructor.email.toLowerCase() === email'), 'InstructorsList must prevent duplicate email');
      assert.ok(content.includes('getFieldErrors(error)'), 'InstructorsList must map server field errors');
      assert.ok(content.includes('noValidate'), 'InstructorsList form must disable default browser bubble');
    });

    it('CoursesList should validate title length, category presence, duration bounds, and duplicates', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/courses/components/CoursesList.tsx'), 'utf-8');
      assert.ok(content.includes('title.length < 2'), 'CoursesList must check title >= 2 chars');
      assert.ok(content.includes('!category'), 'CoursesList must require category');
      assert.ok(content.includes('durationHours < 1 || form.durationHours > 10000'), 'CoursesList must bound duration between 1 and 10000');
      assert.ok(content.includes('course.title.toLocaleLowerCase() === title.toLocaleLowerCase()'), 'CoursesList must prevent duplicate title');
      assert.ok(content.includes('getFieldErrors(error)'), 'CoursesList must map server field errors');
      assert.ok(content.includes('noValidate'), 'CoursesList form must disable default browser bubble');
    });

    it('GroupsList should validate name length, course selection, date range sequence, and duplicates', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/courses/components/GroupsList.tsx'), 'utf-8');
      assert.ok(content.includes('name.length < 2'), 'GroupsList must check name >= 2 chars');
      assert.ok(content.includes('!courseById.has(form.courseId)'), 'GroupsList must require valid course');
      assert.ok(content.includes('form.endDate < form.startDate'), 'GroupsList must ensure endDate >= startDate');
      assert.ok(content.includes('form.capacity < 1 || form.capacity > 10000'), 'GroupsList must bound capacity');
      assert.ok(content.includes('group.name.toLocaleLowerCase() === name.toLocaleLowerCase()'), 'GroupsList must prevent duplicate group name');
      assert.ok(content.includes('getFieldErrors(error)'), 'GroupsList must map server field errors');
      assert.ok(content.includes('noValidate'), 'GroupsList form must disable default browser bubble');
    });

    it('SessionsList should validate title length, cohort, date/time sequence, location bounds, and clash', () => {
      const content = fs.readFileSync(path.join(rootDir, 'features/sessions/components/SessionsList.tsx'), 'utf-8');
      assert.ok(content.includes('title.length < 2'), 'SessionsList must check title >= 2 chars');
      assert.ok(content.includes('!groupById.has(form.groupId)'), 'SessionsList must require valid cohort');
      assert.ok(content.includes('form.endTime <= form.startTime'), 'SessionsList must ensure endTime > startTime');
      assert.ok(content.includes('form.location.trim().length > 50'), 'SessionsList must limit location to 50 chars');
      assert.ok(content.includes('^https?:\\/\\/'), 'SessionsList must check meetingUrl starts with http(s)');
      assert.ok(content.includes('session.startTime === form.startTime'), 'SessionsList must prevent cohort schedule clash');
      assert.ok(content.includes('getFieldErrors(error)'), 'SessionsList must map server field errors');
      assert.ok(content.includes('noValidate'), 'SessionsList form must disable default browser bubble');
    });
  });
});
