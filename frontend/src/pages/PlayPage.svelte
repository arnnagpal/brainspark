<!-- basic page that shows a question, four option choices. Use tailwind -->
<script>
    import Button from "./../components/Button.svelte";
    import { getCookie } from "svelte-cookie";
    import { onMount } from "svelte";
    import AltButton from "../components/AltButton.svelte";
    import { push } from "svelte-spa-router";
    import fetch from "node-fetch";

    let gid;

    let questionsArray = [];

    let question = "What is the capital of France?";
    let options = ["Paris", "London", "Berlin", "Madrid"];

    let correctOption = "Paris";

    let colors = [
        "bg-fuchsia-900",
        "bg-purple-900",
        "bg-violet-950",
        "bg-indigo-950",
    ];

    let questionNumber = 1;
    let numQuestions = 0;
    let numRight = 0;

    let score = 0;
    let streak = 0;

    let activePowerup = "";

    let djAvail = false;
    let twoAvail = false;
    let psAvail = false;

    let endScreenModal = false;

    onMount(async () => {
        const uid = getCookie("uid");

        if (!uid) {
            console.log("User is not logged in");
            // redirect to dashboard
            push("/");
            return;
        }

        // fetch current game id
        gid = await fetchCurrentGame(uid);
        if (!gid) {
            console.log("User is not in a game");

            push("/");
            return;
        }

        questionsArray = await fetchQuestions(gid);
        console.log(questionsArray);

        await loadQuestion(1);
    });

    async function loadQuestion(num) {
        question = questionsArray[num - 1].question;
        options = questionsArray[num - 1].choices;

        numQuestions = questionsArray.length;

        correctOption = questionsArray[num - 1].answer;
    }

    async function endGame() {
        try {
            await fetch(process.env.API_URL + "/game/" + gid + "/end", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
        } catch (error) {
            console.log(error);
        }
    }

    async function fetchCurrentGame(uid) {
        try {
            const response = await fetch(process.env.API_URL + "/user/" + uid, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            let json = await response.json();
            let data = json.data;
            return data["current-game"];
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchQuestions(gid) {
        try {
            const response = await fetch(process.env.API_URL + "/game/" + gid, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const json = await response.json();
            let data = json.data;
            return JSON.parse(data.questions);
        } catch (error) {
            console.error(error);
        }
    }

    async function processPowerups(powerupsAdded) {
        activePowerup = "";
        for (let powerup in powerupsAdded) {
            powerup = powerupsAdded[powerup].toLowerCase();
            console.log(powerup);
            if (powerup === "double-jeaporady") {
                djAvail = true;
            } else if (powerup === "double-score") {
                twoAvail = true;
            } else if (powerup === "streak-boost") {
                psAvail = true;
            }
        }
    }

    async function selectOption(option) {
        try {
            const uid = getCookie("uid");
            const correct =
                option.toLowerCase() === correctOption.toLowerCase();

            if (correct) numRight++;

            const endpoint =
                process.env.API_URL +
                "/user/" +
                uid +
                "/" +
                (correct ? "correctanswer" : "incorrectanswer");

            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const json = await response.json();
            let data = json.data;

            score = data.score;
            streak = data.streak;

            await processPowerups(data.powerupsAdded);

            if (questionNumber < numQuestions) {
                questionNumber++;
                await loadQuestion(questionNumber);
            } else {
                console.log("game over");
                endScreenModal = true;
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function usePowerup(powerup) {
        try {
            const endpoint = process.env.API_URL + "/game/activate-powerup/";

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    powerup: powerup,
                    gid: gid,
                }),
            });

            const json = await response.json();
            let data = json.data;

            if (data.success) {
                console.log("powerup activated");
                activePowerup = powerup;

                if (powerup === "double-jeaporady") {
                    djAvail = false;
                } else if (powerup === "double-score") {
                    twoAvail = false;
                } else if (powerup === "streak-boost") {
                    psAvail = false;
                }
            } else {
                console.log("powerup failed to activate: " + data);
            }
        } catch (error) {
            console.error(error);
        }
    }
</script>

<header class="flex justify-between p-10 items-center">
    <!--logo-->
    <div class="flex">
        <a href="/">
            <img src="./assets/logo_expanded.svg" alt="logo" class="w-60" />
        </a>
    </div>
    <nav>
        <ul class="flex items-center">
            <AltButton
                label="Exit Game"
                color="#dc3545"
                textColor="white"
                on:click={async () => {
                    await endGame();
                    push("/");
                    window.location.reload();
                }}
            />
        </ul>
    </nav>
</header>

<div
    class="flex flex-col items-center justify-center bg-gray-100 p-10 overflow-hidden"
>
    <div class="p-20 pt-10 bg-white rounded-2xl shadow-lg">
        <!-- add a div that keeps the question label on the left and the score one on the right -->
        <div class="flex justify-between">
            <h1 class="text-2xl mb-10">
                Question {questionNumber}/{numQuestions}
            </h1>
            <h1 class="text-2xl mb-10">Score: {score}</h1>
        </div>
        <h2 class="text-6xl mb-10">{question}</h2>
        <ul class="grid grid-cols-4 gap-[1px]">
            {#each options as option, i}
                <li class="">
                    <button
                        on:click={async () => {
                            await selectOption(option);
                        }}
                        class="{colors[
                            i
                        ]} w-full h-full hover:bg-opacity-90 active:bg-opacity-85 text-3xl text-white text-left border-b {i ===
                        0
                            ? 'rounded-tl-2xl'
                            : ''} {i === 3 ? 'rounded-tr-2xl' : ''} {i === 0
                            ? 'rounded-bl-2xl'
                            : ''} {i === 3 ? 'rounded-br-2xl' : ''}"
                    >
                        <p class="pl-7 pr-7 py-12">{option}</p>
                    </button>
                </li>
            {/each}
        </ul>
        <!-- add a bar with powerups -->

        <div class="flex mt-10 -mb-8 justify-between items-center">
            <div class="flex gap-2 justify-center">
                {#if djAvail}
                    <button
                        on:click={async () => {
                            await usePowerup("double-jeaporady");
                        }}
                        class="py-5 px-5 rounded-full bg-[#d4edda]"
                    >
                        <img
                            src="./assets/powerups/double_jeap.svg"
                            alt="Double Jeopardy"
                            class="w-7"
                            style=""
                        />
                    </button>
                {:else}
                    <button
                        on:click
                        class="cursor-not-allowed py-5 px-5 rounded-full bg-gray-200"
                    >
                        <img
                            src="./assets/powerups/double_jeap_disabled.svg"
                            alt="Double Jeopardy"
                            class="w-7"
                            style=""
                        />
                    </button>
                {/if}
                {#if twoAvail}
                    <button
                        on:click={async () => {
                            await usePowerup("double-score");
                        }}
                        class="py-2 px-3.5 rounded-full bg-[#cce5ff]"
                        ><img
                            src="./assets/powerups/2x.svg"
                            alt="2x"
                            class="w-10"
                        />
                    </button>
                {:else}
                    <button
                        on:click
                        class="cursor-not-allowed py-2 px-3.5 rounded-full bg-gray-200"
                        ><img
                            src="./assets/powerups/2x_disabled.svg"
                            alt="2x"
                            class="w-10"
                        />
                    </button>
                {/if}
                {#if psAvail}
                    <button
                        on:click={async () => {
                            await usePowerup("streak-boost");
                        }}
                        class="py-2 px-[18px] rounded-full bg-[#ede2d4]"
                        ><img
                            src="./assets/powerups/streak_boost.svg"
                            alt="2x"
                            class="w-8"
                        /></button
                    >
                {:else}
                    <button
                        on:click
                        class="cursor-not-allowed py-2 px-[18px] rounded-full bg-gray-200"
                        ><img
                            src="./assets/powerups/streak_boost_disabled.svg"
                            alt="2x"
                            class="w-8"
                        /></button
                    >
                {/if}

                {#if activePowerup}
                    <div
                        class="self-center ml-5 flex gap-2 items-center justify-center"
                    >
                        <h1 class="text-2xl">Active Powerup:</h1>
                        <!-- add the svg image at the right size when appropriate powerup activated-->
                        {#if activePowerup === "double-jeaporady"}
                            <img
                                src="./assets/powerups/double_jeap.svg"
                                alt="Double Jeopardy"
                                class="w-7"
                                style=""
                            />
                        {:else if activePowerup === "double-score"}
                            <img
                                src="./assets/powerups/2x.svg"
                                alt="2x"
                                class="w-10"
                                style=""
                            />
                        {:else if activePowerup === "streak-boost"}
                            <img
                                src="./assets/powerups/streak_boost.svg"
                                alt="2x"
                                class="w-8"
                                style=""
                            />
                        {/if}
                    </div>
                {/if}
            </div>
            <div class="flex">
                <h1 class="text-2xl">Streak: {streak}</h1>
            </div>
        </div>

        <!-- add streak counter on the bottom right -->
    </div>
</div>

{#if endScreenModal}
    <div
        class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center"
    >
        <div class="bg-white p-10 rounded-md flex flex-col items-center">
            <div class="flex items-center justify-center px-40">
                <h2 class="text-3xl font-bold font-vag text-center">
                    Game Over!
                </h2>
            </div>
            <!-- add details about the game -->
            <p class="py-3"></p>
            <h2 class="text-2xl text-center">
                Score: {score}
            </h2>
            <h2 class="text-2xl text-center">
                Questions: {numRight}/{numQuestions}
            </h2>
            <h2 class="text-xl text-center">
                (Percent: {Math.floor((numRight / numQuestions) * 100)}%)
            </h2>

            <div>
                {#if numRight / numQuestions >= 0.8}
                    <p class="py-3"></p>
                    <h2 class="text-2xl text-center text-green-500">
                        Great job! Keep it up :)
                    </h2>
                {:else if numRight / numQuestions >= 0.6}
                    <p class="py-3"></p>
                    <h2 class="text-2xl text-center text-blue-600">
                        Not bad! Keep practicing.
                    </h2>
                {:else if numRight / numQuestions >= 0.4}
                    <p class="py-3"></p>
                    <h2 class="text-2xl text-center text-orange-400">
                        You can do better. Keep practicing.
                    </h2>
                {:else}
                    <p class="py-3"></p>
                    <h2 class="text-2xl text-center text-red-500">
                        You suck! Get better.
                    </h2>
                {/if}
            </div>
            <div>
                <p class="py-3"></p>
                <Button
                    label="Return to Dashboard"
                    on:click={async () => {
                        await endGame();
                        push("/");
                        window.location.reload();
                    }}
                />
            </div>
        </div>
    </div>
{/if}
