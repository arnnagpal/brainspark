<!-- basic page that shows a question, four option choices. Use tailwind -->
<script>
    import AltButton from "../components/AltButton.svelte";

    let question = "What is the capital of France?";
    let options = ["Paris", "London", "Berlin", "Madrid"];
    let colors = [
        "bg-fuchsia-900",
        "bg-purple-900",
        "bg-violet-950",
        "bg-indigo-950",
    ];

    let djAvail = true;
    let twoAvail = true;
    let psAvail = true;
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
            <AltButton label="Exit Game" color="#dc3545" textColor="white"
                >Exit Game</AltButton
            >
        </ul>
    </nav>
</header>

<div
    class="flex flex-col items-center justify-center bg-gray-100 p-10 overflow-hidden"
>
    <div class="p-20 bg-white rounded-2xl shadow-lg">
        <h2 class="text-6xl mb-10">{question}</h2>
        <ul class="grid grid-cols-4 gap-[1px]">
            {#each options as option, i}
                <li class="">
                    <button
                        class="{colors[
                            i
                        ]} w-full hover:bg-opacity-90 active:bg-opacity-85 text-3xl text-white text-left border-b {i ===
                        0
                            ? 'rounded-tl-2xl'
                            : ''} {i === 3 ? 'rounded-tr-2xl' : ''} {i === 0
                            ? 'rounded-bl-2xl'
                            : ''} {i === 3 ? 'rounded-br-2xl' : ''}"
                    >
                        <p class="pl-7 pr-44 py-12">{option}</p>
                    </button>
                </li>
            {/each}
        </ul>
        <!-- add a bar with powerups -->

        <div class="flex mt-10 -mb-8 gap-2">
            {#if djAvail}
                <button on:click class="py-5 px-5 rounded-full bg-[#d4edda]">
                    <img
                        src="./assets/powerups/double_jeap.svg"
                        alt="Double Jeapordy"
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
                        alt="Double Jeapordy"
                        class="w-7"
                        style=""
                    />
                </button>
            {/if}
            {#if twoAvail}
                <button on:click class="py-2 px-3.5 rounded-full bg-[#cce5ff]"
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
                    on:click
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
        </div>
    </div>
</div>
