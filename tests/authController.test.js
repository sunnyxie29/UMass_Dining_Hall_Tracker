import { jest } from '@jest/globals';

const service = {
  signUp: jest.fn(),
  login: jest.fn(),
  getCurrentUser: jest.fn(),
};

jest.unstable_mockModule('../services/authService.js', () => service);

const controller = await import('../controllers/authController.js');
const { createSession, getSession } = await import('../sessions.js');

const makeReq = ({ body = {}, signedCookies = {}, user } = {}) => ({ body, signedCookies, user });

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.render = jest.fn(() => res);
  res.redirect = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.cookie = jest.fn(() => res);
  res.clearCookie = jest.fn(() => res);
  return res;
};

const adminUser = { id: 'u1', email: 'student@umass.edu', role: 'admin' };
const memberUser = { id: 'u2', email: 'student@umass.edu', role: 'member' };
const body = { email: 'student@umass.edu', password: 'password123' };

beforeEach(() => {
  jest.resetAllMocks();
});

describe('showSignUp and showLogin', () => {
  test('render the sign-up page with no error', () => {
    const res = makeRes();

    controller.showSignUp(makeReq(), res);

    expect(res.render).toHaveBeenCalledWith('signup', { title: 'Sign up', error: null, email: '' });
  });

  test('render the login page with no error', () => {
    const res = makeRes();

    controller.showLogin(makeReq(), res);

    expect(res.render).toHaveBeenCalledWith('login', { title: 'Log in', error: null, email: '' });
  });
});

describe('signUp', () => {
  test('starts a signed httpOnly session cookie and redirects to the menu', async () => {
    service.signUp.mockResolvedValue(memberUser);
    const res = makeRes();

    await controller.signUp(makeReq({ body }), res, jest.fn());

    expect(service.signUp).toHaveBeenCalledWith(body);
    expect(res.cookie).toHaveBeenCalledWith('sessionId', expect.any(String), {
      signed: true,
      httpOnly: true,
    });
    expect(res.redirect).toHaveBeenCalledWith('/menu');
  });

  test('stores the new member id and role in the session behind that cookie', async () => {
    service.signUp.mockResolvedValue(memberUser);
    const res = makeRes();

    await controller.signUp(makeReq({ body }), res, jest.fn());

    const sessionId = res.cookie.mock.calls[0][1];
    expect(getSession(sessionId)).toEqual({ userId: 'u2', role: 'member' });
  });

  test('re-renders the form with the message and typed email on a 400', async () => {
    service.signUp.mockRejectedValue(
      Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 }),
    );
    const res = makeRes();

    await controller.signUp(makeReq({ body }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.render).toHaveBeenCalledWith('signup', {
      title: 'Sign up',
      error: 'Password must be at least 8 characters.',
      email: 'student@umass.edu',
    });
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('re-renders the form with a 409 for a duplicate email', async () => {
    service.signUp.mockRejectedValue(
      Object.assign(new Error('An account with that email already exists.'), { status: 409 }),
    );
    const res = makeRes();

    await controller.signUp(makeReq({ body }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.cookie).not.toHaveBeenCalled();
  });

  test('passes an unexpected error to next', async () => {
    const error = new Error('connection lost');
    service.signUp.mockRejectedValue(error);
    const res = makeRes();
    const next = jest.fn();

    await controller.signUp(makeReq({ body }), res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.render).not.toHaveBeenCalled();
  });
});

describe('login', () => {
  test('starts a signed httpOnly session cookie and redirects to the menu', async () => {
    service.login.mockResolvedValue(adminUser);
    const res = makeRes();

    await controller.login(makeReq({ body }), res, jest.fn());

    expect(service.login).toHaveBeenCalledWith(body);
    expect(res.cookie).toHaveBeenCalledWith('sessionId', expect.any(String), {
      signed: true,
      httpOnly: true,
    });
    expect(getSession(res.cookie.mock.calls[0][1])).toEqual({ userId: 'u1', role: 'admin' });
    expect(res.redirect).toHaveBeenCalledWith('/menu');
  });

  test('re-renders the login form with a 401 and sets no cookie', async () => {
    service.login.mockRejectedValue(
      Object.assign(new Error('Incorrect email or password.'), { status: 401 }),
    );
    const res = makeRes();

    await controller.login(makeReq({ body }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.render).toHaveBeenCalledWith('login', {
      title: 'Log in',
      error: 'Incorrect email or password.',
      email: 'student@umass.edu',
    });
    expect(res.cookie).not.toHaveBeenCalled();
  });

  test('passes an unexpected error to next', async () => {
    const error = new Error('connection lost');
    service.login.mockRejectedValue(error);
    const next = jest.fn();

    await controller.login(makeReq({ body }), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('logout', () => {
  test('destroys the session, clears the cookie and redirects home', () => {
    const sessionId = createSession('u1', 'member');
    const res = makeRes();

    controller.logout(makeReq({ signedCookies: { sessionId } }), res);

    expect(getSession(sessionId)).toBeUndefined();
    expect(res.clearCookie).toHaveBeenCalledWith('sessionId');
    expect(res.redirect).toHaveBeenCalledWith('/');
  });

  test('still clears the cookie and redirects when nobody is logged in', () => {
    const res = makeRes();

    controller.logout(makeReq(), res);

    expect(res.clearCookie).toHaveBeenCalledWith('sessionId');
    expect(res.redirect).toHaveBeenCalledWith('/');
  });
});

describe('me', () => {
  test('answers 401 as JSON when nobody is logged in', async () => {
    const res = makeRes();

    await controller.me(makeReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not logged in.' });
    expect(service.getCurrentUser).not.toHaveBeenCalled();
  });

  test('returns the public user for the logged-in user', async () => {
    service.getCurrentUser.mockResolvedValue(adminUser);
    const res = makeRes();

    await controller.me(makeReq({ user: { id: 'u1', role: 'admin' } }), res, jest.fn());

    expect(service.getCurrentUser).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(adminUser);
  });

  test('answers 401 as JSON when the session points at a deleted user', async () => {
    service.getCurrentUser.mockRejectedValue(
      Object.assign(new Error('Not logged in.'), { status: 401 }),
    );
    const res = makeRes();

    await controller.me(makeReq({ user: { id: 'gone', role: 'member' } }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not logged in.' });
  });

  test('passes an unexpected error to next', async () => {
    const error = new Error('connection lost');
    service.getCurrentUser.mockRejectedValue(error);
    const next = jest.fn();

    await controller.me(makeReq({ user: { id: 'u1', role: 'member' } }), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
