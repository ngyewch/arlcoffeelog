<script lang="ts">
    import Swal from 'sweetalert2';
    import {getUsers, getTotalCoffee, type User} from './lib/service.js';

    const unitPrice = 0.60;

    let selectedUser = $state<string>('');
    let coffeeCount = $state<number>();
    let users = $state<User[]>([]);

    $effect(() => {
        console.log('selectedUser', selectedUser);
        coffeeCount = undefined;
        if ((selectedUser === undefined) || (selectedUser === '')) {
            retrieveUserList();
            return;
        } else {
            retrieveUserInfo();
        }
    });

    function retrieveUserList() {
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
    }

    function retrieveUserInfo() {
        if ((selectedUser === undefined) || (selectedUser === '')) {
            return;
        }
        const title = 'Retrieving user info...';
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

    function onSwitchUser() {
        selectedUser = '';
    }
</script>

<main>
    <span class="hero-icon">☕</span>
    <h1>ARL Productivity Logger</h1>

    {#if (selectedUser === '')}
        {#if users.length > 0}
            <select bind:value={selectedUser}>
                <option selected disabled value="">
                    Select user...
                </option>
                {#each users as user}
                    <option>{user.username}</option>
                {/each}
            </select>
        {/if}
    {/if}

    {#if (selectedUser !== '')}
        <article>
            <header>👤 {selectedUser}</header>
            <p>
                {#if (coffeeCount !== undefined)}
                    ☕ x {coffeeCount} @ ${unitPrice.toFixed(2)} = ${(coffeeCount * unitPrice).toFixed(2)}
                {/if}
            </p>
            <footer>
                <button>Add a cup ☕</button>
                <button class="secondary">Reset 🗑️</button>
                <button class="secondary" onclick={onSwitchUser}>Switch user 👤</button>
            </footer>
        </article>
    {/if}
</main>

<style>
    .hero-icon {
        font-size: 10em;
    }
</style>
