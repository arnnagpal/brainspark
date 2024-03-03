<script>
    export let label = "Button";
    export let color = "purple";
    export let textColor = "black";
</script>

<button on:click
    class="
        py-2
        px-3
        rounded-md"
    style="background-color: {color}; color: {textColor}"
>
    {label}
</button>
