import pkg from "redis-om";

const { Schema, Repository } = pkg;
import client from "../client.js";

const userSchema = new Schema("user", {
    //important data
    uid: {
        type: "string",
    },
    displayname: {
        type: "string",
    },
    username: {
        type: "string",
    },
    password: {
        type: "string",
    },

    // meta data
    "current-game": {
        // session id
        type: "string",
    },
    "games-played": {
        type: "number",
    },
    score: {
        type: "number",
        sortable: true,
    },
});

export const userRespository = new Repository(userSchema, client);

await userRespository.createIndex();
