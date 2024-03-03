<script>
    let value = "";
    export let placeholder;
</script>

<input
    class="appearance-none border-2 border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    bind:value
    {placeholder}
    type="text"
/>
