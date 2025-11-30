import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

//CROSS ORIGIN RESOURCE SHARING is used to connect the frontend with backend bypassing cors policy (same origin policy)
app.use(cors({
    origin: process.env.CORS_ORIGIN,
   credentials: true
}))

// some middleware or configs for accepting different types of data in different formats
app.use(express.json({limit: "16kb"}));

app.use(express.urlencoded({extended: true, limit: "16kb"}));

app.use(express.static("public"));

//cookie parser is used so server can access and manipulate cookies on clients browser
app.use(cookieParser())

//routes import
import userRouter from "./routes/user.routes.js"


//routes declaration
app.use("/api/v1/users", userRouter)
export { app };