import { Router } from "express";
import { userRespository } from "../models/User.js";

import { uuid } from "uuidv4";
import { gameRepository } from "../models/Game.js";

export const router = Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    let loginName = username.toLowerCase();

    const user = await userRespository
        .search()
        .where("username")
        .eq(loginName)
        .where("password")
        .eq(password)
        .returnAll();

    if (user.length == 0) {
        res.status(400).json({
            data: {
                success: false,
                message: "Invalid username or password",
                debug: user,
            },
        });

        return;
    }

    res.json({
        data: {
            success: true,
            uid: user[0].uid,
        },
    });
});

router.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    let displayName = username;
    let loginName = username.toLowerCase();

    // check if username already exists
    const existingUser = await userRespository
        .search()
        .where("username")
        .eq(loginName)
        .returnAll();

    if (existingUser.length > 0) {
        res.status(400).json({
            data: {
                success: false,
                message: "Username already exists",
                debug: existingUser,
            },
        });
        return;
    }

    let uid = uuid();

    // check if uid already exists
    let existingUid = await userRespository
        .search()
        .where("uid")
        .eq(uid)
        .returnAll();

    while (existingUid.length > 0) {
        uid = uuid();
        existingUid = await userRespository.fetch({
            uid: uid,
        });
    }

    // create user

    await userRespository.save({
        uid: uid,
        displayname: displayName,
        username: loginName,
        password: password,

        "current-game": "",
        "games-played": 0,
        score: 0,
    });

    res.json({
        data: {
            success: true,
            uid: uid,
        },
    });
});

router.get("/:uid", async (req, res) => {
    const { uid } = req.params;

    const user = await userRespository
        .search()
        .where("uid")
        .eq(uid)
        .returnAll();

    if (user == null) {
        res.status(400).json({
            data: {
                success: false,
                message: "User not found",
            },
        });

        return;
    }

    res.json({
        data: {
            uid: user.uid,
            name: user.displayname,
            debug: user,
        },
    });
});

router.get("/:uid/correctanswer", async (req, res) => {
    const { uid } = req.params;

    const users = await userRespository
        .search()
        .where("uid")
        .eq(uid)
        .returnAll();

    if (users.length == 0) {
        res.status(400).json({
            data: {
                success: false,
                message: "User not found",
            },
        });

        return;
    }

    const user = users[0];

    // get game
    const games = await gameRepository
        .search()
        .where("gid")
        .eq(user["current-game"])
        .returnAll();

    if (games.length == 0) {
        res.status(400).json({
            data: {
                success: false,
                message: "User is not in a game",
            },
        });

        return;
    }

    const game = games[0];
    const all_powerups = ["double-jeaporady", "double-score", "streak-boost"];
    let powersAdded = [];

    game.streak += 1;
    let score = 100;

    if (
        game.powerups.includes("double-jeaporady") ||
        game.powerups.includes("double-score")
    ) {
        score *= 2;
    }

    game.score += score;

    if (game.streak % 3 === 0) {
        game.score += 25;

        // pick a random powerup
        const powerup =
            all_powerups[Math.floor(Math.random() * all_powerups.length)];

        // add powerup to user
        if (game.powerups == null) {
            game.powerups = [];
        }

        game.powerups.push(powerup);
        powersAdded.push(powerup);
    }

    await gameRepository.save(game);

    res.json({
        data: {
            uid: user.uid,
            score: game.score,
            streak: game.streak,
            powerupsAdded: powersAdded,
        },
    });
});

router.get("/:uid/incorrectanswer", async (req, res) => {
    const { uid } = req.params;

    const users = await userRespository
        .search()
        .where("uid")
        .eq(uid)
        .returnAll();

    if (users.length == 0) {
        res.status(400).json({
            data: {
                success: false,
                message: "User not found",
            },
        });

        return;
    }

    const user = users[0];

    // get game
    const games = await gameRepository
        .search()
        .where("gid")
        .eq(user["current-game"])
        .returnAll();

    if (games.length == 0) {
        res.status(400).json({
            data: {
                success: false,
                message: "User is not in a game",
            },
        });

        return;
    }

    const game = games[0];

    game.streak = 0;
    game.score -= 50;

    await gameRepository.save(game);

    res.json({
        data: {
            uid: user.uid,
            score: game.score,
            streak: 0,
            powerupsAdded: [],
        },
    });
});
