<script lang="ts">
    import Swal from 'sweetalert2';
    import ky from 'ky';
    import {onMount} from 'svelte';

    const baseUrl = 'https://script.google.com/macros/s/AKfycbym-ODmhPDbYIfd0oSaD2FYdtZCbpNyPWctBOQmu3C-_LbJQADixgXg-So8foXMXdSR/exec';
    const unitPrice = 0.60;

    interface User {
        username: string;
    }

    let users = $state<User[]>([]);
    let selectedUser = $state<string>();
    let coffeeCount = $state<number>();

    onMount(() => {
        Swal.fire({
            title: 'Retrieving user list...',
            didOpen: () => {
                Swal.showLoading();
                ky.get(makeUrl({action: 'getUsers'}))
                    .then(rsp => rsp.json())
                    .then(rsp => {
                        const userList = rsp as User[];
                        userList
                            .sort((a, b) => a.username.localeCompare(b.username, undefined, {sensitivity: 'accent'}));
                        users = userList;
                        Swal.close();
                    });
            },
        });
    });

    function makeUrl(params: Record<string, string>): string {
        const urlSearchParams = new URLSearchParams(params);
        return `${baseUrl}?${urlSearchParams.toString()}`;
    }

    function onUserChanged(e: InputEvent) {
        if (selectedUser === undefined) {
            coffeeCount = undefined;
            return;
        }
        Swal.fire({
            title: 'Retrieving user info...',
            didOpen: () => {
                Swal.showLoading();
                ky.get(makeUrl({action: 'getTotalCoffee', username: selectedUser ? selectedUser : ''}))
                    .then(rsp => rsp.json())
                    .then(rsp => {
                        coffeeCount = rsp as number;
                        Swal.close();
                    });
            },
        });
    }
</script>

<main>
    <span style="font-size: 10em;">&#9749</span>
    <h1>ARL Productivity Logger</h1>

    {#if users.length > 0}
        <select bind:value={selectedUser} onchange={onUserChanged}>
            <option selected disabled value="">
                Select user...
            </option>
            {#each users as user}
                <option>{user.username}</option>
            {/each}
        </select>
    {/if}

    {#if (selectedUser !== undefined) && (coffeeCount !== undefined)}
        &#9749 x {coffeeCount} @ ${unitPrice.toFixed(2)} = ${(coffeeCount * unitPrice).toFixed(2)}
    {/if}
</main>

<style>
</style>
