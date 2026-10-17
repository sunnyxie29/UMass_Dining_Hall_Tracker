import express from "express";
import menuItemRoutes from "./routes/menuItemRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"));

app.use(express.json());
const dining_halls = [
  { title: "Worcester Dining Hall" },
  { title: "Franklin Dining Hall" },
  { title: "Berkshire Dining Hall" },
  { title: "Hampshire Dining Hall" },
];

app.get("/", (req, res) => {
  res.render("home", {
    title: "UMass Dining Hall Tracker",
    message:
      "Welcome to our dining hall tracker. Below you can find buttons that will lead you to the list of Dining Halls on campus, or the menu that is being offered at the halls.",
  });
});

app.get("/menu", (req, res) => {
  res.render("menu", { title: "Today's Menu" });
});

app.get("/halls", (req, res) => {
  res.render("halls", { title: "Dining Halls", dining_halls });
});

app.use("/menu-items", menuItemRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
