import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import draftsRouter from "./routes/draftsRoutes.js";
import transactionsRouter from "./routes/transactionsRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/drafts", draftsRouter);
app.use("/transactions", transactionsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
