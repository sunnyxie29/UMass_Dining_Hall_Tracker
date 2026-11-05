import { jest } from '@jest/globals';
import { errorHandler } from '../middleware/errorHandler.js';

const makeReq = (htmx) => ({
  get: (name) => (htmx && name === 'HX-Request' ? 'true' : undefined),
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.render = jest.fn(() => res);
  res.set = jest.fn(() => res);
  return res;
};

const clientError = Object.assign(new Error('Item name is required.'), { status: 400 });

describe('errorHandler', () => {
  test('answers a plain request with the error as JSON', () => {
    const res = makeRes();

    errorHandler(clientError, makeReq(false), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Item name is required.' });
    expect(res.render).not.toHaveBeenCalled();
  });

  test('answers an HTMX request with an error partial retargeted at the error area', () => {
    const res = makeRes();

    errorHandler(clientError, makeReq(true), res, jest.fn());

    expect(res.set).toHaveBeenCalledWith({ 'HX-Retarget': '#form-error', 'HX-Reswap': 'innerHTML' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.render).toHaveBeenCalledWith('partials/error', { message: 'Item name is required.' });
    expect(res.json).not.toHaveBeenCalled();
  });

  test('hides the details of an unexpected error', () => {
    const res = makeRes();

    errorHandler(new Error('database exploded'), makeReq(true), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith('partials/error', {
      message: 'Something went wrong on the server.',
    });
  });
});
