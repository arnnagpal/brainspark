import { Router } from "express";
import openai from "../openai.js";
import { userRespository } from "../models/User.js";

export const router = Router();

router.get("/", (req, res) => {
    const status = {
        status: "ok",
    };

    res.json(status);
});

router.get("/leaderboard", async (req, res) => {
    const users = await userRespository
        .search()
        .sortBy("score", "desc")
        .returnAll();

    let data = users.map((user) => {
        return {
            uid: user.uid,
            name: user.displayname,
            score: user.score,
        };
    });

    res.json({
        data: data,
    });
});

router.get("/questions", async (req, res) => {
    const questions = req.body;
    const assistantId = process.env.OPENAI_ASSOSICATE_ID;
    const instructions = `
    This GPT, named BrainSpark QuestionsGPT, is a specialized tool for generating questions and answers in a specific JSON format. It creates content based on inputs also provided in a JSON structure, focusing on topics and difficulty levels. The GPT exclusively accepts input in the format of {"topic": "<topic>", "difficulty": "<difficulty>", "numQuestions": <numQuestions>}, where <topic>, <difficulty>, and <numQuestions> can vary based on the user's needs. It then returns a set of questions, each with a question, multiple choices, and the correct answer, all formatted according to the specified JSON example.

Example: 
                "questions": [
                    {
                        "question": "<question>",
                        "choices": [
                            "<choice 1>",
                            "<choice 2>",
                            "<choice 3>",
                            "<choice 4>"
                        ],
                        "answer": "<correct choice>"
                    },
                    {
                        "question": "<question>",
                        "choices": [
                            "<choice 1>",
                            "<choice 2>",
                            "<choice 3>",
                            "<choice 4>"
                        ],
                        "answer": "<correct choice>"
                    },
... etc
                ]


The GPT is designed to work with a range of topics and difficulty levels, tailoring the questions to fit the provided criteria. It emphasizes clarity and precision, ensuring that the output strictly adheres to the requested JSON schema. The GPT will clarify or ask for more specifics if the initial request is too broad or unclear, ensuring the generated questions are relevant, clear, and correctly formatted.
    `;

    try {
        const thread = await openai.beta.threads.create();
        console.log("Created thread: " + thread.id);

        await openai.beta.threads.messages.create(
            // add the message to the thread
            thread.id, // Use the stored thread ID for this user
            {
                role: "user",
                content: JSON.stringify(questions),
            }
        );

        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: assistantId,
            instructions: instructions,
            tools: [],
        });

        console.log("Running query to generate questions, obj: " + run);

        // Periodically retrieve the Run to check on its status
        const retrieveRun = async () => {
            let keepRetrievingRun;

            while (run.status !== "completed") {
                keepRetrievingRun = await openai.beta.threads.runs.retrieve(
                    thread.id, // Use the stored thread ID for this user
                    run.id
                );

                console.log(`Run status: ${keepRetrievingRun.status}`);

                if (keepRetrievingRun.status === "completed") {
                    console.log("\n");
                    break;
                }
            }
        };

        retrieveRun();

        // Retrieve the Messages added by the Assistant to the Thread
        const waitForAssistantMessage = async () => {
            await retrieveRun();

            const allMessages = await openai.beta.threads.messages.list(
                thread.id // Use the stored thread ID for this user
            );

            const generated = JSON.parse(
                allMessages.data[0].content[0].text.value
            );

            // Send the response back to the front end
            res.status(200).json({
                data: generated,
            });
        };

        waitForAssistantMessage();
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
