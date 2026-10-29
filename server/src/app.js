import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./config/passport.js";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import helmet from "helmet";
import  { apiLimiter } from "./middleware/rateLimit.js";
import { originCheck } from "./middleware/originCheck.js";

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(passport.initialize());


    app.set("trust proxy", 1);
    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    app.use(express.json({ limit: "2mb" }));
    app.use(cookieParser());
    app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
    app.use(passport.initialize());
 
    app.get("/health", (req, res) => res.json({ status: "ok" }));
    app.use("/api", apiLimiter, originCheck, routes);
 
    app.use(notFound);
    app.use(errorHandler);

export default app;
