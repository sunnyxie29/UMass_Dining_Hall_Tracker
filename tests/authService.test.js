import { jest } from '@jest/globals';

const repository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const bcrypt = { hash: jest.fn(), compare: jest.fn() };

jest.unstable_mockModule('../repositories/userRepository.js', () => repository);
jest.unstable_mockModule('bcrypt', () => ({ default: bcrypt }));

const service = await import('../services/authService.js');

const validInput = { email: 'student@umass.edu', password: 'password123', role: 'member' };

const EMAIL_REQUIRED = 'Email is required.';
const EMAIL_INVALID = 'Please enter a valid email address.';
const PASSWORD_ERROR = 'Password must be at least 8 characters.';
const LOGIN_ERROR = 'Incorrect email or password.';

const storedUser = {
  _id: 'u1',
  email: 'student@umass.edu',
  passwordHash: 'stored-hash',
  role: 'admin',
};

const invalidInputs = [
  ['a missing email', { ...validInput, email: undefined }, EMAIL_REQUIRED],
  ['a blank email', { ...validInput, email: '   ' }, EMAIL_REQUIRED],
  ['an email without an @', { ...validInput, email: 'student.umass.edu' }, EMAIL_INVALID],
  ['an email without a domain', { ...validInput, email: 'student@' }, EMAIL_INVALID],
  ['a missing password', { ...validInput, password: undefined }, PASSWORD_ERROR],
  ['a password that is too short', { ...validInput, password: 'short' }, PASSWORD_ERROR],
];

beforeEach(() => {
  jest.resetAllMocks();
  bcrypt.hash.mockResolvedValue('hashed-password');
  bcrypt.compare.mockResolvedValue(false);
  repository.findByEmail.mockResolvedValue(null);
  repository.findById.mockResolvedValue(null);
  repository.create.mockImplementation(async (user) => ({ _id: 'u1', ...user }));
});

describe('signUp validation', () => {
  test.each(invalidInputs)('rejects %s with a 400', async (label, input, message) => {
    await expect(service.signUp(input)).rejects.toMatchObject({ status: 400, message });
    expect(repository.findByEmail).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });
});

describe('signUp success', () => {
  test('creates a member account and returns the public user', async () => {
    await expect(service.signUp(validInput)).resolves.toEqual({
      id: 'u1',
      email: 'student@umass.edu',
      role: 'member',
    });
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  test('always creates a member, even when the request asks for admin', async () => {
    await service.signUp({ ...validInput, role: 'admin' });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'member' }));
  });

  test('creates a member when no role is given', async () => {
    await service.signUp({ email: validInput.email, password: validInput.password });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'member' }));
  });

  test('trims and lowercases the email before looking it up and saving it', async () => {
    await service.signUp({ ...validInput, email: '  Student@UMass.edu ' });

    expect(repository.findByEmail).toHaveBeenCalledWith('student@umass.edu');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'student@umass.edu' }),
    );
  });

  test('saves a hash of the password and never the password itself', async () => {
    await service.signUp(validInput);

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', expect.any(Number));
    const saved = repository.create.mock.calls[0][0];
    expect(saved.passwordHash).toBe('hashed-password');
    expect(saved).not.toHaveProperty('password');
  });

  test('does not return the password hash', async () => {
    const user = await service.signUp(validInput);

    expect(user).not.toHaveProperty('passwordHash');
    expect(user).not.toHaveProperty('password');
  });
});

describe('signUp duplicates', () => {
  test('rejects with a 409 when the email is already registered', async () => {
    repository.findByEmail.mockResolvedValue(storedUser);

    await expect(service.signUp(validInput)).rejects.toMatchObject({
      status: 409,
      message: 'An account with that email already exists.',
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('rejects with a 409 when the database reports a duplicate key', async () => {
    repository.create.mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000 }));

    await expect(service.signUp(validInput)).rejects.toMatchObject({ status: 409 });
  });

  test('passes any other repository error through unchanged', async () => {
    const error = new Error('connection lost');
    repository.create.mockRejectedValue(error);

    await expect(service.signUp(validInput)).rejects.toBe(error);
  });
});

describe('login', () => {
  test('returns the public user when the password matches', async () => {
    repository.findByEmail.mockResolvedValue(storedUser);
    bcrypt.compare.mockResolvedValue(true);

    await expect(service.login({ email: 'student@umass.edu', password: 'password123' })).resolves.toEqual({
      id: 'u1',
      email: 'student@umass.edu',
      role: 'admin',
    });
  });

  test('compares the typed password against the stored hash', async () => {
    repository.findByEmail.mockResolvedValue(storedUser);
    bcrypt.compare.mockResolvedValue(true);

    await service.login({ email: 'student@umass.edu', password: 'password123' });

    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'stored-hash');
  });

  test('trims and lowercases the email before looking it up', async () => {
    repository.findByEmail.mockResolvedValue(storedUser);
    bcrypt.compare.mockResolvedValue(true);

    await service.login({ email: '  Student@UMass.edu ', password: 'password123' });

    expect(repository.findByEmail).toHaveBeenCalledWith('student@umass.edu');
  });

  test('does not return the password hash', async () => {
    repository.findByEmail.mockResolvedValue(storedUser);
    bcrypt.compare.mockResolvedValue(true);

    const user = await service.login({ email: 'student@umass.edu', password: 'password123' });

    expect(user).not.toHaveProperty('passwordHash');
  });

  test('rejects an unknown email with a 401 and never compares passwords', async () => {
    await expect(service.login({ email: 'nobody@umass.edu', password: 'password123' })).rejects.toMatchObject({
      status: 401,
      message: LOGIN_ERROR,
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test('rejects a wrong password with the same 401 message as an unknown email', async () => {
    repository.findByEmail.mockResolvedValue(storedUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(service.login({ email: 'student@umass.edu', password: 'wrong-password' })).rejects.toMatchObject({
      status: 401,
      message: LOGIN_ERROR,
    });
  });

  test('rejects a missing password with a 401', async () => {
    repository.findByEmail.mockResolvedValue(storedUser);

    await expect(service.login({ email: 'student@umass.edu' })).rejects.toMatchObject({ status: 401 });
  });

  test('rejects a missing email with a 401', async () => {
    await expect(service.login({ password: 'password123' })).rejects.toMatchObject({ status: 401 });
  });
});

describe('getCurrentUser', () => {
  test('returns the public user for a known id', async () => {
    repository.findById.mockResolvedValue(storedUser);

    await expect(service.getCurrentUser('u1')).resolves.toEqual({
      id: 'u1',
      email: 'student@umass.edu',
      role: 'admin',
    });
    expect(repository.findById).toHaveBeenCalledWith('u1');
  });

  test('rejects with a 401 when the user no longer exists', async () => {
    await expect(service.getCurrentUser('gone')).rejects.toMatchObject({
      status: 401,
      message: 'Not logged in.',
    });
  });
});

describe('ensureAdmin', () => {
  test('creates the admin account when it does not exist yet', async () => {
    await expect(
      service.ensureAdmin({ email: 'admin@umass.edu', password: 'admin1234' }),
    ).resolves.toEqual({ id: 'u1', email: 'admin@umass.edu', role: 'admin' });

    expect(repository.create).toHaveBeenCalledWith({
      email: 'admin@umass.edu',
      passwordHash: 'hashed-password',
      role: 'admin',
    });
  });

  test('hashes the admin password and never saves it as plain text', async () => {
    await service.ensureAdmin({ email: 'admin@umass.edu', password: 'admin1234' });

    expect(bcrypt.hash).toHaveBeenCalledWith('admin1234', expect.any(Number));
    expect(repository.create.mock.calls[0][0]).not.toHaveProperty('password');
  });

  test('trims and lowercases the admin email', async () => {
    await service.ensureAdmin({ email: '  Admin@UMass.edu ', password: 'admin1234' });

    expect(repository.findByEmail).toHaveBeenCalledWith('admin@umass.edu');
  });

  test('does nothing when the admin account already exists', async () => {
    repository.findByEmail.mockResolvedValue({ ...storedUser, email: 'admin@umass.edu' });

    await expect(
      service.ensureAdmin({ email: 'admin@umass.edu', password: 'admin1234' }),
    ).resolves.toBeNull();
    expect(repository.create).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  test('rejects a password that is too short and creates nothing', async () => {
    await expect(
      service.ensureAdmin({ email: 'admin@umass.edu', password: 'short' }),
    ).rejects.toMatchObject({ status: 400, message: PASSWORD_ERROR });
    expect(repository.create).not.toHaveBeenCalled();
  });
});
