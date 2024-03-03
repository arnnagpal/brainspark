<!-- Create an account page that shows your username and password (uneditable), and your score and games played, along with a red logout button using tailwind & svelte -->

<script>
    import fetch from "node-fetch";
    import { getCookie } from "svelte-cookie";
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import TextInput from "../components/TextInput.svelte";
    import PasswordInput from "../components/PasswordInput.svelte";

    let showAccountDropdown = false;

    let username = "user123";
    let password = "password123";
    let score = 100;
    let gamesPlayed = 10;

    let show = false;

    onMount(() => {
        const uid = getCookie("uid");
        if (!uid) {
            console.log("User is not logged in");
            // redirect to dashboard
            push("/");
        }

        // fetch user data
        fetch(process.env.API_URL + "/user/" + uid, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => res.json())
            .then((a) => a.data)
            .then((data) => {
                username = data.name;
                password = data.password;
                score = data.score;
                gamesPlayed = data["games-played"];
            })
            .catch((err) => {
                console.error(err);
            });
    });
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
            <li class="font-bold"><a href="/">Home</a></li>
            <li class="px-2"></li>
            <li class="font-bold"><a href="/#/leaderboard">Leaderboard</a></li>
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

<div
    class="flex flex-col items-center justify-center bg-gray-100 p-10 overflow-hidden"
>
    <div
        class="p-40 pt-20 pb-20 bg-white rounded-2xl shadow-lg justify-center items-center"
    >
        <!-- move account title to the top of the div -->
        <h2 class="text-6xl mb-10 text-center">Account</h2>

        <!-- make them up and down -->
        <h3 class="text-3xl">Username:</h3>

        <div class="flex flex-col items-center gap-5">
            <!-- add 2 textboxes for username and password but make them grayed out -->
            <TextInput
                placeholder="Username"
                bind:value={username}
                disabled="true"
            />
        </div>

        <br />

        <h3 class="text-3xl">Password:</h3>
        <!-- make the eye go on the right side of the textbox for password -->
        <div class="relative">
            <PasswordInput bind:value={password} disabled="true" bind:show />
            <button
                class="h-10 w-10 absolute inset-y-0 right-0 pr-3"
                on:click|preventDefault={() => {
                    show = !show;
                }}
            >
                {#if show}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="red"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                    </svg>
                {:else}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                {/if}
            </button>
        </div>
        <div class="flex justify-between mt-10">
            <div class="pr-40">
                <h3 class="text-3xl">Score: {score}</h3>
            </div>
            <div>
                <h3 class="text-3xl">Games Played: {gamesPlayed}</h3>
            </div>
        </div>
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
