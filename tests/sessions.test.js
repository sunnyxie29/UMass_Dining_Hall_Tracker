import { createSession, getSession, destroySession } from '../sessions.js';

describe('sessions', () => {
  test('createSession returns an id that getSession resolves to the stored user and role', () => {
    const id = createSession('u1', 'admin');

    expect(typeof id).toBe('string');
    expect(getSession(id)).toEqual({ userId: 'u1', role: 'admin' });
  });

  test('every session gets a different id', () => {
    expect(createSession('u1', 'member')).not.toBe(createSession('u1', 'member'));
  });

  test('getSession returns undefined for an id that was never created', () => {
    expect(getSession('not-a-real-session')).toBeUndefined();
  });

  test('destroySession makes the id worthless', () => {
    const id = createSession('u1', 'member');

    destroySession(id);

    expect(getSession(id)).toBeUndefined();
  });

  test('destroySession leaves other sessions alone', () => {
    const first = createSession('u1', 'member');
    const second = createSession('u2', 'admin');

    destroySession(first);

    expect(getSession(second)).toEqual({ userId: 'u2', role: 'admin' });
  });
});
