import * as authService from "../services/authService.js";
import { createSession, destroySession } from "../sessions.js";

const COOKIE_OPTIONS = { signed: true, httpOnly: true };

const startSession = (res, user) => {
  res.cookie("sessionId", createSession(user.id, user.role), COOKIE_OPTIONS);
};

const renderForm = (res, view, title, status, error, email) => {
  res.status(status).render(view, { title, error, email });
};

export const showSignUp = (req, res) => {
  res.render("signup", { title: "Sign up", error: null, email: "" });
};

export const showLogin = (req, res) => {
  res.render("login", { title: "Log in", error: null, email: "" });
};

export const signUp = async (req, res, next) => {
  const body = req.body ?? {};
  try {
    const user = await authService.signUp(body);
    startSession(res, user);
    res.redirect("/menu");
  } catch (err) {
    if (err.status && err.status < 500) {
      return renderForm(res, "signup", "Sign up", err.status, err.message, body.email ?? "");
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  const body = req.body ?? {};
  try {
    const user = await authService.login(body);
    startSession(res, user);
    res.redirect("/menu");
  } catch (err) {
    if (err.status && err.status < 500) {
      return renderForm(res, "login", "Log in", err.status, err.message, body.email ?? "");
    }
    next(err);
  }
};

export const logout = (req, res) => {
  const sessionId = req.signedCookies?.sessionId;
  if (sessionId) destroySession(sessionId);
  res.clearCookie("sessionId");
  res.redirect("/");
};

export const me = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not logged in." });
  }
  try {
    res.json(await authService.getCurrentUser(req.user.id));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};
