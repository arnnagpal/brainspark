import pkg from "redis-om";

const { Schema, Repository } = pkg;
import client from "../client.js";

const gameSchema = new Schema("game", {
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
    questions: {
        type: "string",
    },
    powerups: {
        type: "string[]",
    },
    score: {
        type: "number",
    },
    streak: {
        type: "number",
    },
});

export const gameRepository = new Repository(gameSchema, client);
await gameRepository.createIndex();
