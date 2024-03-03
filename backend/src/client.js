import { createClient } from "redis";

const url = process.env.REDIS_URL || "redis://localhost:6379";

const client = await createClient({
    url: url,
})
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

export default client;
