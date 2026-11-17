import bcrypt from "bcrypt";
import * as repository from "../repositories/userRepository.js";
import { toUserDto } from "../dtos/userDto.js";

const ROLES = ["member", "admin"];
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;
const DUPLICATE_KEY_CODE = 11000;
const LOGIN_ERROR = "Incorrect email or password.";

const fail = (status, message) => Object.assign(new Error(message), { status });

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

const validate = ({ email, password, role }) => {
  if (!email || !email.trim()) throw fail(400, "Email is required.");
  if (!/^\S+@\S+\.\S+$/.test(email.trim()))
    throw fail(400, "Please enter a valid email address.");
  if (!password || password.length < MIN_PASSWORD_LENGTH)
    throw fail(400, "Password must be at least 8 characters.");
  if (!ROLES.includes(role)) throw fail(400, "Role must be member or admin.");
};

export const signUp = async (input) => {
  const role = input.role || "member";
  validate({ ...input, role });

  const email = normalizeEmail(input.email);
  const existing = await repository.findByEmail(email);
  if (existing) throw fail(409, "An account with that email already exists.");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    const user = await repository.create({ email, passwordHash, role });
    return toUserDto(user);
  } catch (err) {
    if (err.code === DUPLICATE_KEY_CODE)
      throw fail(409, "An account with that email already exists.");
    throw err;
  }
};

export const login = async (input) => {
  const user = await repository.findByEmail(normalizeEmail(input.email));
  if (!user) throw fail(401, LOGIN_ERROR);

  const matches = await bcrypt.compare(input.password || "", user.passwordHash);
  if (!matches) throw fail(401, LOGIN_ERROR);

  return toUserDto(user);
};

export const getCurrentUser = async (id) => {
  const user = await repository.findById(id);
  if (!user) throw fail(401, "Not logged in.");
  return toUserDto(user);
};
