<script>
    import { onMount } from "svelte";
    import { deleteCookie, getCookie } from "svelte-cookie/dist";
    import { push } from "svelte-spa-router";
    onMount(() => {
        const uid = getCookie("uid");
        if (!uid) {
            console.log("User is not logged in");
        } else {
            deleteCookie("uid", { path: "/" });
        }

        push("/");
    });
</script>

<div class="flex">
    <img src="./assets/logo.svg" alt="logo" class="w-20" />
    <h1 class="text-3xl font-bold ml-3">BrainSpark</h1>
</div>
