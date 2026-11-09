import app from "./app.js";
import { getDatabase } from "./database/db.js";
import { env } from "./config/env.js";

getDatabase();
console.log("Database initialized successfully");

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
