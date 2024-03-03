<script>
    import { onMount } from "svelte";
    export let value = "";
    export let disabled = false;
    export let show = false;

    let inputElement;

    onMount(() => {
        inputElement.type = "password";
    });

    $: show, updateType();

    function updateType() {
        if (!inputElement) {
            return;
        }
        console.log("Showing password: " + show);
        if (show) {
            inputElement.type = "text";
        } else {
            inputElement.type = "password";
        }
    }
</script>

<input
    class="appearance-none border-2 border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    bind:value
    placeholder="Password"
    type="password"
    {disabled}
    bind:this={inputElement}
/>
