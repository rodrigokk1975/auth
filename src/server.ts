import app from "./app.js";
import { getDatabase } from "./database/db.js";

const PORT = process.env.PORT ?? 3000;

getDatabase();
console.log("Database initialized successfully");

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
