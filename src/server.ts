import { connectDB } from "./shared/config/database.js";
import app from "./app.js";

const port = process.env.PORT || 3000;

// start server AFTER connecting to MongoDB
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
      console.log("🚀 Server ready");
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
