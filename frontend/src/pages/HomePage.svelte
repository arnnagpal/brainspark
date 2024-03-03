<script>
    import fetch from "node-fetch";
    import { onMount } from "svelte";
    import Button from "../components/Button.svelte";
    import AltButton from "../components/AltButton.svelte";
    import TextInput from "../components/TextInput.svelte";
    import { mathSubTopics } from "../data/mathSubTopics.js";
    import { scienceSubTopics } from "../data/scienceSubTopics.js";
    import { englishSubTopics } from "../data/englishSubTopics.js";
    import { historySubTopics } from "../data/historySubTopics.js";
    import { miscSubTopics } from "../data/miscSubTopics.js";
    import { push } from "svelte-spa-router";
    import { getCookie } from "svelte-cookie/dist";
    import { Circle2 } from "svelte-loading-spinners";

    let createGameModal = false;
    let showAccountDropdown = false;
    let selectedButton = null;
    let numQuestions = 1;
    let selectedSubTopics = [];
    let availableSubTopics = [];

    let gameHistory = [];
    let isLoading = false;

    onMount(() => {
        const uid = getCookie("uid");
        if (!uid) {
            console.log("User is not logged in");
            // redirect to dashboard
            push("/");
        }
        getGameHistory();
    });

    async function getGameHistory() {
        try {
            const uid = getCookie("uid");
            const response = await fetch(
                process.env.API_URL + "/user/" + uid + "/game-history",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();
            console.log(data);
            gameHistory = data["data"];
        } catch (error) {
            console.log(error);
        }
    }

    async function createGame() {
        if (selectedSubTopics.length == 0) {
            return;
        }

        try {
            const uid = getCookie("uid");

            isLoading = true;
            const response = await fetch(process.env.API_URL + "/game/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: uid,
                    category: selectedSubTopics[0],
                    numQuestions: numQuestions,
                    difficulty: "easy",
                }),
            });

            let json = await response.json();
            let data = json.data;

            if (!data.success) {
                console.log("Error creating game");
                return;
            }
            isLoading = false;
            push("/play");
        } catch (error) {
            console.log(error);
        }
    }
</script>

{#if isLoading}
    <div class="flex justify-center min-h-screen items-center bg-gray-200">
        <Circle2 />
    </div>
{:else}
    <header class="flex justify-between p-10 items-center">
        <!--logo-->
        <div class="flex">
            <a href="/">
                <img src="./assets/logo_expanded.svg" alt="logo" class="w-60" />
            </a>
        </div>
        <nav>
            <ul class="flex items-center">
                <li class="font-bold"><a href="/">Home</a></li>
                <li class="px-2"></li>
                <li class="font-bold">
                    <a href="/#/leaderboard">Leaderboard</a>
                </li>
                <li class="px-2"></li>
                <li class="font-bold"><a href="/about">About</a></li>
                <li class="px-2"></li>
                <li class="font-bold">
                    <button
                        class="flex items-center"
                        on:click={() =>
                            (showAccountDropdown = !showAccountDropdown)}
                    >
                        <img
                            src="../../assets/account.png"
                            alt="user"
                            class="w-10"
                        />
                        <p class="px-1"></p>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                        </svg>
                    </button>
                </li>
            </ul>
        </nav>
    </header>
    <!-- add title with "Your Games" and cards to show existing games-->
    <div class="py-3 px-10">
        <div class="flex justify-between">
            <h1 class="text-4xl font-bold font-vag">Game History</h1>
            <Button
                label="Create a Game"
                on:click={() => {
                    createGameModal = true;
                }}
            />
        </div>
        <p class="py-3"></p>
        <div class="grid grid-cols-3 gap-5">
            {#each gameHistory as game, i}
                <div class="bg-white rounded-md p-5 flex flex-col gap-2">
                    <h2
                        class="text-2xl font-bold font-vag flex justify-between"
                    >
                        Game {i + 1}
                        <p>
                            {Math.round(
                                (game.numRight / game.numQuestions) * 100
                            )}%
                        </p>
                    </h2>
                    <p class="-mt-1">Category: {game.category}</p>
                    <div class="border" />
                    <p class="text-xl font-bold">Score: {game.score}</p>
                    <div>
                        <p>
                            Difficulty: {game.difficulty
                                .charAt(0)
                                .toUpperCase() + game.difficulty.slice(1)}
                        </p>
                        <p>Questions: {game.numRight}/{game.numQuestions}</p>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    {#if showAccountDropdown}
        <div
            class="fixed top-0 right-0 mt-[7rem] mr-10 bg-white p-5 rounded-md shadow-lg"
        >
            <ul>
                <li class="py-2">
                    <a href="/#/account">Account</a>
                </li>
                <li class="py-2">
                    <a href="/#/logout">Logout</a>
                </li>
            </ul>
        </div>
    {/if}

    <!-- add a modal for creating a game -->
    {#if createGameModal}
        <div
            class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center"
        >
            <div class="bg-white p-10 rounded-md">
                <div class="flex items-center">
                    <h2 class="text-3xl font-bold font-vag">Create a Game</h2>
                    <p class="px-10"></p>
                    <button
                        class="ml-auto flex"
                        on:click={() => {
                            createGameModal = false;
                        }}
                    >
                        Close
                        <!--padding-->
                        <p class="px-1"></p>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-6 h-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <p class="py-3"></p>
                <!-- add a slider to pick # of questions. ranges from 1-20 -->

                <p>Number of questions: {numQuestions}</p>

                <input
                    type="range"
                    class="
                        appearance-none
                        w-full
                        h-1
                        bg-gray-300
                        rounded-full
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-[20px]
                        [&::-webkit-slider-thumb]:h-[20px]
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-[#5c4f9e]
                    "
                    min="1"
                    max="20"
                    bind:value={numQuestions}
                />

                <p class="py-3"></p>
                <!-- add filters for class and subject for theg ame i want to create. make it like a drop down menu-->
                <p>Select your subject:</p>
                <div class="flex">
                    <!-- add buttons that have a darker background when selected -->

                    <div class="flex">
                        <button
                            class="px-4 py-2 my-2 rounded-full {selectedButton ===
                            'Math'
                                ? 'bg-violet-200'
                                : 'bg-gray-200'}"
                            on:click={() => {
                                selectedButton = "Math";
                                availableSubTopics = mathSubTopics;
                            }}
                        >
                            Math
                        </button>
                        <button
                            class="px-4 py-2 my-2 ml-2 rounded-full {selectedButton ===
                            'Science'
                                ? 'bg-violet-200'
                                : 'bg-gray-200'}"
                            on:click={() => {
                                selectedButton = "Science";
                                availableSubTopics = scienceSubTopics;
                            }}
                        >
                            Science
                        </button>
                        <button
                            class="px-4 py-2 my-2 mx-2 rounded-full {selectedButton ===
                            'English'
                                ? 'bg-violet-200'
                                : 'bg-gray-200'}"
                            on:click={() => {
                                selectedButton = "English";
                                availableSubTopics = englishSubTopics;
                            }}
                        >
                            English
                        </button>
                        <button
                            class="px-4 py-2 my-2 rounded-full {selectedButton ===
                            'History'
                                ? 'bg-violet-200'
                                : 'bg-gray-200'}"
                            on:click={() => {
                                selectedButton = "History";
                                availableSubTopics = historySubTopics;
                            }}
                        >
                            History
                        </button>
                        <button
                            class="px-4 py-2 my-2 ml-2 rounded-full {selectedButton ===
                            'Miscellaneous'
                                ? 'bg-violet-200'
                                : 'bg-gray-200'}"
                            on:click={() => {
                                selectedButton = "Miscellaneous";
                                availableSubTopics = miscSubTopics;
                            }}
                        >
                            Miscellaneous
                        </button>
                    </div>
                </div>
                <p class="py-1"></p>
                {#if availableSubTopics.length != 0}
                    <p>Select your subtopic:</p>
                    <p class="py-1"></p>
                    {#each availableSubTopics as subTopic, i}
                        <button
                            class="flex items-center px-4 py-2 {i == 0
                                ? 'rounded-t-md'
                                : ''} {i == availableSubTopics.length - 1
                                ? 'rounded-b-md'
                                : ''} w-full border-neutral-400 {i != 0
                                ? 'border-t-[1px]'
                                : ''} text-left {selectedSubTopics.includes(
                                subTopic
                            )
                                ? 'bg-violet-200'
                                : 'bg-gray-200'}"
                            on:click={() => {
                                if (selectedSubTopics.includes(subTopic)) {
                                    delete selectedSubTopics[
                                        selectedSubTopics.indexOf(subTopic)
                                    ];
                                    selectedSubTopics = selectedSubTopics;
                                } else {
                                    selectedSubTopics = [
                                        //...selectedSubTopics,
                                        subTopic,
                                    ];
                                }
                            }}
                        >
                            {#if selectedSubTopics.includes(subTopic)}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke-width="1.5"
                                    stroke="currentColor"
                                    class="w-5 h-5"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="m4.5 12.75 6 6 9-13.5"
                                    />
                                </svg>
                                <p class="px-1"></p>
                            {/if}
                            {subTopic}
                        </button>
                    {/each}
                {/if}
                <p class="py-3"></p>
                <Button
                    on:click={async () => await createGame()}
                    label="Create"
                />
            </div>
        </div>
    {/if}
{/if}
