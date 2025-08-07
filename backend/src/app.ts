import express, { Express } from "express";
import cors from "cors";
import authRouter from "./routes/auth.route";

const app: Express = express();
app.use(
  cors({
    origin: "*", 
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

app.use("/auth/", authRouter);

export { app };
