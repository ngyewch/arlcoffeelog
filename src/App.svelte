<script lang="ts">
    import Swal from 'sweetalert2';
    import {storage} from '@jill64/svelte-storage';
    import {string as serdeString} from '@jill64/svelte-storage/serde';
    import {getUsers, getTotalCoffee, logCoffee, type User} from './lib/service.js';

    const unitPrice = 0.60;

    const customStorage = storage({
        ['selectedUser']: serdeString,
    });

    let selectedUser = $state<string>(customStorage['selectedUser']);
    let coffeeCount = $state<number>();
    let users = $state<User[]>([]);
    let loadingUserInfo = $state<boolean>(false);

    $effect(() => {
        coffeeCount = undefined;
        if ((selectedUser === undefined) || (selectedUser === '')) {
            customStorage['selectedUser'] = '';
            retrieveUserList();
            return;
        } else {
            customStorage['selectedUser'] = selectedUser;
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
        loadingUserInfo = true;
        getTotalCoffee(selectedUser ? selectedUser : '')
            .then(count => {
                coffeeCount = count;
                loadingUserInfo = false;
            })
            .catch(e => {
                console.log(e);
                loadingUserInfo = false;
                Swal.fire({
                    title: title,
                    icon: 'error',
                    text: e,
                });
            });
    }

    function onAddCup() {
        if ((selectedUser === undefined) || (selectedUser === '')) {
            return;
        }
        const title = 'Add a cup';
        Swal.fire({
            title: title,
            didOpen: () => {
                Swal.showLoading();
                logCoffee(selectedUser ? selectedUser : '', new Date(), 1)
                    .then(() => {
                        Swal.close();
                        retrieveUserInfo();
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

    function onReset() {
        const title = 'Reset';
        const amountOwed = (coffeeCount !== undefined) ? (coffeeCount * unitPrice).toFixed(2) : 'amount owed';
        Swal.fire({
            icon: 'warning',
            title: title,
            text: `Please confirm you have paid $${amountOwed} to Kee before resetting.`,
            confirmButtonText: 'Confirm reset',
            showCancelButton: true,
        })
            .then(result => {
                if (result.isConfirmed) {
                    // TODO
                }
            });
    }

    function onSwitchUser() {
        selectedUser = '';
    }

    function onShowPaymentInfo() {
        Swal.fire({
            title: 'Payment info',
            text: 'PayLah!/PayNow to 81982143. Please inform Kee of your payment.',
        });
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
            <header>
                <span>👤 {selectedUser}</span>
            </header>
            <p class="userInfo">
                {#if loadingUserInfo}
                    Loading...
                    <progress></progress>
                {/if}
                {#if !loadingUserInfo}
                    {#if (coffeeCount !== undefined)}
                        ☕ x {coffeeCount} @ ${unitPrice.toFixed(2)} = ${(coffeeCount * unitPrice).toFixed(2)}
                    {/if}
                {/if}
            </p>
            <footer>
                <button onclick={onAddCup}>Add a cup ☕</button>
                <button class="secondary" onclick={onReset} disabled={coffeeCount === undefined}>Reset 🗑️</button>
            </footer>
        </article>

        <div>
            <button class="outline" onclick={onSwitchUser}>Switch user 👤</button>
            <button class="outline" onclick={onShowPaymentInfo}>Payment info 💸</button>
        </div>
    {/if}
</main>

<style>
    .hero-icon {
        font-size: 10em;
    }

    .userInfo {
        padding-top: 2em;
        padding-bottom: 2em;
    }
</style>
