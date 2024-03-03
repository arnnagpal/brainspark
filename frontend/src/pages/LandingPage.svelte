<script>
    import Button from "../components/Button.svelte";
    import TextInput from "../components/TextInput.svelte";
    import PasswordInput from "../components/PasswordInput.svelte";
    import fetch from "node-fetch";

    import { setCookie, getCookie, deleteCookie } from "svelte-cookie";
    import { push } from "svelte-spa-router";
    import { onMount } from "svelte";

    export let signupModal = false;
    export let loginModal = false;

    export let usernameTaken = false;

    let username = "";
    let password = "";

    onMount(() => {
        const uid = getCookie("uid");
        if (uid) {
            console.log("User is logged in");
            // redirect to dashboard
            push("/home");
        }
    });

    function signup() {
        const endpoint = process.env.API_URL + "/user/signup";
        const body = {
            username: username,
            password: password,
        };

        fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.data.success) {
                    signupModal = false;
                    setCookie("uid", data.data.uid, {
                        sameSite: "strict",
                        path: "/",
                        maxAge: 60 * 60 * 24 * 7, // 7 days
                    });
                    push("/home");
                } else {
                    console.log(data.data.message);
                    usernameTaken = true;
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                usernameTaken = true;
            });
    }

    function login() {
        const endpoint = process.env.API_URL + "/user/login";
        const body = {
            username: username,
            password: password,
        };

        fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
            .then((response) => response.json())
            .then((data) => {
                signupModal = false;
                if (data.data.success) {
                    setCookie("uid", data.data.uid, {
                        sameSite: "strict",
                        path: "/",
                        maxAge: 60 * 60 * 24 * 7, // 7 days
                    });
                    push("/home");
                } else {
                    console.log(data.data.message);
                }
            })
            .catch((error) => console.error("Error:", error));
    }
</script>

<div class="flex flex-col min-h-screen bg-white">
    <header class="flex justify-between p-10 items-center">
        <!--logo-->
        <div class="flex">
            <a href="/">
                <img src="./assets/logo_expanded.svg" alt="logo" class="w-60" />
            </a>
        </div>
        <nav>
            <ul class="flex">
                <li class="font-bold"><a href="/">Home</a></li>
                <!-- <li class="px-2"></li> -->
                <!-- <li><a href="/">Create a Game</li> -->
                <li class="px-2"></li>
                <li class="font-bold"><a href="/about">About</a></li>
                <li class="px-2"></li>
                <li class="font-bold">
                    <button
                        on:click={() => {
                            signupModal = true;
                        }}>Sign Up</button
                    >
                </li>
            </ul>
        </nav>
    </header>

    <div class="p-10 flex flex-col">
        <!-- create a starter page for an app that helps students learn via games, powerups, and the goal being to earn the max points-->
        <div class="flex">
            <div class="w-1/2">
                <h1 class="text-7xl font-vag font-bold">Quiz. Play. Learn.</h1>
                <!--padding-->
                <p class="py-3"></p>
                <p class="text-2xl max-w-[850px]">
                    The one-stop study tool to unleash your potential,
                    BrainSpark transforms learning into an exhilarating journey,
                    where each quiz invites you into a world of discovery,
                    guided by custom questions and powerups to ignite your
                    curiosity.
                </p>
                <p class="py-3"></p>
                <button
                    on:click={() => {
                        signupModal = true;
                    }}
                    class="bg-gradient-to-br from-[#5c4f9e] to-[#342d59] text-white py-4 px-9 text-xl rounded-md"
                >
                    Get Started
                </button>
            </div>
            <div class="w-1/2 pr-10">
                <img
                    class="rounded-2xl border shadow-xl hover:scale-110 transition duration-500 ease-in-out"
                    src="./assets/game_screen.png"
                    alt="game screen"
                />
            </div>
        </div>
    </div>

    <!--add a modal-->
    {#if signupModal}
        <div
            class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center"
        >
            <div class="bg-white p-10 rounded-md">
                <div class="flex">
                    <h2 class="text-3xl font-bold font-vag">
                        Welcome to BrainSpark
                    </h2>
                    <button
                        class="ml-auto flex"
                        on:click={() => {
                            signupModal = false;
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
                <p>
                    BrainSpark is a platform that helps students learn via
                    games, powerups, and customized learning.
                </p>
                <p class="py-3"></p>
                <TextInput placeholder="Username" bind:value={username} />
                <p class="py-3"></p>
                <PasswordInput bind:value={password} />
                <p class="py-3"></p>
                <Button
                    label="Sign Up"
                    on:click={() => {
                        signup();
                    }}
                />
                <!-- username is taken -->
                {#if usernameTaken}
                    <p class="py-3"></p>
                    <p class="text-red-500">Username is taken</p>
                {/if}
                <!-- aleady has an account -->
                <p class="py-3"></p>
                <div class="flex">
                    Already have an account?{" "}
                    <p class="px-1"></p>
                    <button
                        class="text-blue-500"
                        on:click={() => {
                            loginModal = true;
                            signupModal = false;
                        }}>Log in</button
                    >
                </div>
            </div>
        </div>
    {:else if loginModal}
        <div
            class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center"
        >
            <div class="bg-white p-10 rounded-md">
                <div class="flex items-center justify-center">
                    <h2 class="text-3xl font-bold font-vag">
                        Login to BrainSpark
                    </h2>
                    <p class="px-10"></p>
                    <button
                        class="ml-auto flex"
                        on:click={() => {
                            loginModal = false;
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
                <TextInput placeholder="Username" bind:value={username} />
                <p class="py-3"></p>
                <PasswordInput bind:value={password} />
                <p class="py-3"></p>
                <Button
                    label="Login"
                    on:click={() => {
                        login();
                    }}
                />
                <!-- username is taken -->
                {#if usernameTaken}
                    <p class="py-3"></p>
                    <p class="text-red-500">Username is taken</p>
                {/if}
                <!-- aleady has an account -->
                <p class="py-3"></p>
                <div class="flex">
                    Need an account?{" "}
                    <p class="px-1"></p>
                    <button
                        class="text-blue-500"
                        on:click={() => {
                            loginModal = false;
                            signupModal = true;
                        }}>Sign Up</button
                    >
                </div>
            </div>
        </div>
    {/if}

    <footer class="w-full md:p-6 mt-auto p-10">
        <div class="flex justify-between">
            <div>
                <p class="text-2xl font-bold font-vag">BrainSpark</p>
                <p class="text-xl">© 2024 BrainSpark</p>
            </div>
        </div>
    </footer>
</div>
