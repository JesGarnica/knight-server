import express from 'express';
import cors from 'cors';

import dotenv from "dotenv";

import morgan from "morgan";
import api from "./api/index.js";
import connectToDb from "./lib/mongoose.js";

const app = express()
const port = process.env.PORT || 8000;

dotenv.config();

app.use(morgan("dev"));
app.use(express.json(), cors())


app.use("/", api);

// app.get("/hello", function (req, res, next) {
//     console.log("  -- req.query:", req.query)

//     res.status(200).send("Hello, World!")
// })
// // app.post()
// // app.patch()
// // app.delete()


/*
 * This route handler calls the function that populates the database.
 * You can configure this differently if you'd like to manually add
 * data to the mongoDB database.
 */
// app.use("/initDb", function (req, res, next) {
//     populateDb()
//         .then(() => {
//             res.status(200).json({ message: "Database populated successfully." });
//         })
//         .catch((err) => {
//             next(err);
//         });
// });

// app.use("*", function (req, res, next) {
//     res.status(404).json({
//         error: "Requested resource " + req.originalUrl + " does not exist",
//     });
// });

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use("*", function (err, req, res, next) {
    console.error("== Error:", err);
    res.status(500).send({
        err: "Server error.  Please try again later.",
    });
});

/*
 * Start the API server listening for requests after establishing a connection
 * to the database.
 */
connectToDb().then(() => {
    app.listen(port, () => {
        console.log(
            "[⚡️ server]: Server is running at https://localhost:%d",
            port
        );
    });
});
