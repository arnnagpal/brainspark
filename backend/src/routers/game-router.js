import { Router } from "express";
import axios from "axios";
import { gameRepository } from "../models/Game.js";
import { userRespository } from "../models/User.js";
import { uuid } from "uuidv4";
import { EntityId } from "redis-om";

export const router = Router();

router.get("/:gid", async (req, res) => {
    const gid = req.params.gid;

    const game = await gameRepository.search().where("gid").eq(gid).returnAll();

    if (game.length == 0) {
        res.status(404).json({
            success: false,
            message: "Game not found",
        });

        return;
    }

    res.json({
        data: game[0],
    });
});

router.post("/create", async (req, res) => {
    const { uid, category, difficulty, numQuestions } = req.body;

    if (numQuestions > 20) {
        numQuestions = 20;
    }

    if (numQuestions < 1) {
        numQuestions = 1;
    }

    const gid = uuid();

    const results = await gameRepository
        .search()
        .where("gid")
        .eq(gid)
        .returnAll();

    // make gid unique
    while (results.length > 0) {
        gid = uuid();
        results = await gameRepository
            .search()
            .where("gid")
            .eq(gid)
            .returnAll();
    }

    // generate questions, save to game
    // call our questions endpoint
    axios
        .request({
            method: "GET",
            url: `http://localhost:${process.env.PORT || 3000}/questions`,
            data: {
                topic: category,
                difficulty: difficulty,
                numQuestions: numQuestions,
            },
        })
        .then(async function (response) {
            console.log(JSON.stringify(response.data.data));
            await gameRepository.save({
                gid,
                uid,
                category,
                difficulty,
                numQuestions,
                questions: JSON.stringify(response.data.data.questions),
                powerups: [],
                score: 0,
                streak: 0,
            });

            // update user
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
            user["current-game"] = gid;

            await userRespository.save(user);

            res.json({
                data: {
                    uid: uid,
                    gid: gid,
                },
            });
        })
        .catch(function (error) {
            console.error(error);
            res.status(500).json({
                error: "Failed to generate questions",
            });
        });
});

router.get("/:gid/end", async (req, res) => {
    const gid = req.params.gid;

    const game = await gameRepository.search().where("gid").eq(gid).returnAll();

    if (game.length == 0) {
        res.status(404).json({
            success: false,
            message: "Game not found",
        });

        return;
    }

    // add score to user
    const user = await userRespository
        .search()
        .where("uid")
        .eq(game[0].uid)
        .returnAll();

    if (user.length == 0) {
        res.status(404).json({
            success: false,
            message: "User not found",
        });

        return;
    }

    user[0].score += game[0].score;
    user[0]["games-played"] += 1;

    await userRespository.save(user[0]);
    await gameRepository.remove(game[0][EntityId]);

    res.json({
        data: {
            success: true,
            message: "Game ended successfully",
            uid: user[0].uid,
            userScore: user[0].score,
        },
    });
});
