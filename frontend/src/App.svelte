<script>
    import Router from "svelte-spa-router";

    import LandingPage from "./pages/LandingPage.svelte";
    import HomePage from "./pages/HomePage.svelte";
    import PlayPage from "./pages/PlayPage.svelte";
    import Leaderboard from "./pages/Leaderboard.svelte";
    import AccountPage from "./pages/AccountPage.svelte";
    import Logout from "./pages/LogoutPage.svelte";

    const routes = {
        "/": LandingPage,
        "/home": HomePage,
        "/play": PlayPage,
        "/leaderboard": Leaderboard,
        "/account": AccountPage,
        "/logout": Logout,
    };
</script>

<Router {routes} />
