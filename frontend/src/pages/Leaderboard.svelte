<!-- add a leaderboard page. Use tailwind and make a table -->
<script>
    import fetch from "node-fetch";
    import { onMount } from "svelte";
    import { getCookie } from "svelte-cookie/dist";
    import { push } from "svelte-spa-router";
    let leaderboard = [
        { name: "User 1", score: 100 },
        { name: "User 2", score: 90 },
        { name: "User 4", score: 80 },
        { name: "User 5", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 1", score: 100 },
        { name: "User 2", score: 90 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 1", score: 100 },
        { name: "User 2", score: 90 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 1", score: 100 },
        { name: "User 2", score: 90 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        { name: "User 3", score: 80 },
        // ... add more users as needed
    ];

    let showAccountDropdown = false;

    onMount(async () => {
        const uid = getCookie("uid");
        if (!uid) {
            console.log("User is not logged in");
            // redirect to dashboard
            push("/");
            return;
        }

        // fetch leaderboard
        let response = await fetch(process.env.API_URL + "/leaderboard", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        let data = await response.json();
        let resData = data.data;
        // remove uid prop frm resData
        delete resData.uid;
        leaderboard = resData;
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

<div class="container mx-auto px-4">
    <h1 class="text-4xl font-bold mb-4 font-vag">Leaderboard</h1>
    <table class="table-auto w-full">
        <thead class="table table-fixed w-[100%]">
            <tr>
                <th class="px-4 py-2">Name</th>
                <th class="px-4 py-2">Score</th>
            </tr>
        </thead>
        <!-- TODO: add a filter feature -->
        <tbody class="h-[32rem] overflow-auto block">
            {#each leaderboard as { name, score }, i}
                <tr
                    class="table table-fixed w-[100%] {i % 2 == 0
                        ? 'bg-gray-200'
                        : ''}"
                >
                    <td class="border-gray-300 px-4 py-2">{name}</td>
                    <td class="border-gray-300 text-center px-4 py-2"
                        >{score}</td
                    >
                </tr>
            {/each}
        </tbody>
    </table>
    <!-- padding at bottom -->
    <p class="py-10"></p>
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
