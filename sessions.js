import { randomUUID } from "crypto";

const sessions = new Map();

export const createSession = (userId, role) => {
  const id = randomUUID();
  sessions.set(id, { userId, role });
  return id;
};

export const getSession = (id) => sessions.get(id);

export const destroySession = (id) => {
  sessions.delete(id);
};
