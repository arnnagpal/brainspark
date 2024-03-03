import pkg from "redis-om";

const { Schema, Repository } = pkg;
import client from "../client.js";

const gameHistorySchema = new Schema("gameHistory", {
    //important data
    gid: {
        type: "string",
    },
    uid: {
        type: "string",
    },
    category: {
        type: "string",
    },
    difficulty: {
        type: "string",
    },
    numQuestions: {
        type: "number",
    },
    numRight: {
        type: "number",
    },
    score: {
        type: "number",
    },
    timestamp: {
        type: "number",
        sortable: true,
    },
});

export const gameHistoryRepository = new Repository(gameHistorySchema, client);
await gameHistoryRepository.createIndex();
