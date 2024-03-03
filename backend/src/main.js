import "dotenv/config";

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const corsOptions = {
    origin: "http://127.0.0.1:8080",
};

const app = express();
const port = process.env.PORT || 3000;

app.use(cors(corsOptions));
app.use(bodyParser.json());

import { router as userRouter } from "./routers/user-router.js";
app.use("/user", userRouter);

import { router as gameRouter } from "./routers/game-router.js";
app.use("/game", gameRouter);

import { router as defaultRouter } from "./routers/default-router.js";
app.use("/", defaultRouter);

app.listen(port, () => {
    console.log(`Backend is running on port ${port}`);
});
