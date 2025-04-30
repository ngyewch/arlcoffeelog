<script lang="ts">
    import Swal from 'sweetalert2';
    import {onMount} from 'svelte';
    import {getUsers, getTotalCoffee} from './lib/service.js';

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
                getUsers().then(userList => {
                    userList
                        .sort((a, b) => a.username.localeCompare(b.username, undefined, {sensitivity: 'accent'}));
                    users = userList;
                    Swal.close();
                });
            },
        });
    });

    function onUserChanged(e: Event & {
        currentTarget: EventTarget & HTMLSelectElement;
    }) {
        if (selectedUser === undefined) {
            coffeeCount = undefined;
            return;
        }
        Swal.fire({
            title: 'Retrieving user info...',
            didOpen: () => {
                Swal.showLoading();
                getTotalCoffee(selectedUser ? selectedUser : '')
                    .then(count => {
                        coffeeCount = count;
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
