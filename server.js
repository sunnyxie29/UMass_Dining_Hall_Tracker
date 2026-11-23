import { randomUUID } from "crypto";
import express from "express";
import cookieParser from "cookie-parser";
import menuItemRoutes from "./routes/menuItemRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { attachUser } from "./middleware/attachUser.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { DINING_HALLS } from "./dtos/menuitemdto.js";
import connectDB from "./config/database.js";
import { ensureAdmin } from "./services/authService.js";

const app = express();
const PORT = 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || randomUUID();
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(SESSION_SECRET));
app.use(attachUser);
app.use((req, res, next) => {
  res.locals.user = req.user ?? null;
  next();
});
const dining_halls = [
  { title: "Worcester Dining Hall" },
  { title: "Franklin Dining Hall" },
  { title: "Berkshire Dining Hall" },
  { title: "Hampshire Dining Hall" },
];

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
  });
});

app.get("/", (req, res) => {
  res.render("home", {
    title: "UMass Dining Hall Tracker",
    message:
      "Welcome to our dining hall tracker. Below you can find buttons that will lead you to the list of Dining Halls on campus, or the menu that is being offered at the halls.",
  });
});

app.get("/menu", (req, res) => {
  res.render("menu", { title: "Today's Menu", halls: DINING_HALLS });
});

app.get("/halls", (req, res) => {
  res.render("halls", { title: "Dining Halls", dining_halls });
});

app.use("/", authRoutes);
app.use("/menu-items", menuItemRoutes);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      const admin = await ensureAdmin({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
      if (admin) console.log(`Created admin account ${admin.email}`);
    } else {
      console.warn(
        "No admin account created: set ADMIN_EMAIL and ADMIN_PASSWORD in .env",
      );
    }

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
