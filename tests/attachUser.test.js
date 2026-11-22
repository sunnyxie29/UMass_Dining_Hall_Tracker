import { jest } from '@jest/globals';
import { attachUser } from '../middleware/attachUser.js';
import { createSession } from '../sessions.js';

const run = (signedCookies) => {
  const req = { signedCookies };
  const next = jest.fn();
  attachUser(req, {}, next);
  return { req, next };
};

describe('attachUser', () => {
  test('attaches the id and role of a valid session and calls next', () => {
    const sessionId = createSession('u1', 'admin');

    const { req, next } = run({ sessionId });

    expect(req.user).toEqual({ id: 'u1', role: 'admin' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('leaves req.user unset when there is no cookie', () => {
    const { req, next } = run({});

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('leaves req.user unset when the cookie signature failed to verify', () => {
    const { req, next } = run({ sessionId: false });

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('leaves req.user unset when the session id matches nothing', () => {
    const { req, next } = run({ sessionId: 'forged-id' });

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('copes with a request that has no signedCookies at all', () => {
    const req = {};
    const next = jest.fn();

    attachUser(req, {}, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
