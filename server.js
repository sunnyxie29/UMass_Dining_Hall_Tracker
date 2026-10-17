import express from "express";
import menuItemRoutes from './routes/menuItemRoutes.js';
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = 3000;

app.use(express.json());
const dining_halls = [
  { title: "Worcester Dining Hall" },
  { title: "Franklin Dining Hall" },
  { title: "Berkshire Dining Hall" },
  { title: "Hampshire Dining Hall" },
];

app.get("/", (req, res) => {
  res.send("Welcome to our dining hall tracker.");
});

app.get("/menu", (req, res) => {
  res.send("Today's Dining Hall Menu");
});

app.get("/halls", (req, res) => {
  res.send(`
    <h1>Dining Halls</h1>
    <ul>
      ${dining_halls.map((hall) => `<li>${hall.title}</li>`).join("")}
    </ul>
  `);
});

app.use("/menu-items", menuItemRoutes); 
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
