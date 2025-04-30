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
        const title = 'Retrieving user list...';
        Swal.fire({
            title: title,
            didOpen: () => {
                Swal.showLoading();
                getUsers()
                    .then(userList => {
                        userList
                            .sort((a, b) => a.username.localeCompare(b.username, undefined, {sensitivity: 'accent'}));
                        users = userList;
                        Swal.close();
                    })
                    .catch(e => {
                        console.log(e);
                        Swal.close();
                        Swal.fire({
                            title: title,
                            icon: 'error',
                            text: e,
                        });
                    });
            },
        });
    });

    function onUserChanged(e: Event & {
        currentTarget: EventTarget & HTMLSelectElement;
    }) {
        const title = 'Retrieving user info...';
        if (selectedUser === undefined) {
            coffeeCount = undefined;
            return;
        }
        Swal.fire({
            title: title,
            didOpen: () => {
                Swal.showLoading();
                getTotalCoffee(selectedUser ? selectedUser : '')
                    .then(count => {
                        coffeeCount = count;
                        Swal.close();
                    })
                    .catch(e => {
                        console.log(e);
                        Swal.close();
                        Swal.fire({
                            title: title,
                            icon: 'error',
                            text: e,
                        });
                    });
            },
        });
    }
</script>

<main>
    <span class="hero-icon">&#9749</span>
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
    .hero-icon {
        font-size: 10em;
    }
</style>
