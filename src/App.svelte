<script lang="ts">
    import Swal from 'sweetalert2';
    import {storage} from '@jill64/svelte-storage';
    import {string as serdeString} from '@jill64/svelte-storage/serde';
    import {generate_code, type Amount} from 'sgqr';
    import {fromByteArray} from 'base64-js';
    import Authenticator from 'netlify-auth-providers';
    import {Octokit} from '@octokit/rest';
    import {onMount} from 'svelte';
    import {getUsers, getTotalCoffee, logCoffee, resetUserData, createUser, type User} from './lib/service.js';

    const authenticator = new Authenticator({
        site_id: '154a9f66-7459-4468-bae8-1f43798c1334',
    });

    interface AuthenticatorResponse {
        provider: string;
        token: string;
    }

    const unitPrice = 0.60;
    const paymentPhoneNumber = '+6581982143';
    const paymentName = 'Kee';

    const customStorage = storage({
        ['oauth2Token']: serdeString,
        ['selectedUser']: serdeString,
    });

    let authenticated = $state<boolean>(false);
    let githubLogin = $state<string>();
    let githubName = $state<string | null>();
    let selectedUser = $state<string>(customStorage['selectedUser']);
    let coffeeCount = $state<number>();
    let users = $state<User[]>([]);
    let loadingUserInfo = $state<boolean>(false);
    let qrCode = $state<string>();

    onMount(() => {
        const oauth2Token = customStorage['oauth2Token'];
        if (oauth2Token !== '') {
            const octokit = new Octokit({
                auth: oauth2Token,
            });
            octokit.rest.users.getAuthenticated()
                .then(rsp => {
                    githubLogin = rsp.data.login;
                    githubName = rsp.data.name;
                });
        }
    });

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
                    .catch(e => showError(title, e));
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
                generate_code({
                    number: paymentPhoneNumber,
                    amount: (coffeeCount * unitPrice).toFixed(2) as Amount,
                    comments: `ARL Coffee (${coffeeCount} cups)`,
                    type: 'image/png',
                })
                    .then(rsp => {
                        if (rsp) {
                            qrCode = `data:image/png;base64,${fromByteArray(rsp)}`;
                        }
                    });
            })
            .catch(e => showError(title, e));
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
                        Swal.fire({
                            title: title,
                            text: 'Productivity UP!',
                        });
                        retrieveUserInfo();
                    })
                    .catch(e => showError(title, e));
            },
        });
    }

    function onPayAndReset() {
        const title = 'Pay & reset';
        const amountOwed = (coffeeCount !== undefined) ? (coffeeCount * unitPrice).toFixed(2) : 'amount owed';
        Swal.fire({
            title: title,
            html: `<p>Please use the SGQR for payment. Please inform ${paymentName} when payment is completed.</p><p><img src="${qrCode}" alt="SGQR"></p>`,
            confirmButtonText: 'Confirm payment and reset',
            showCancelButton: true,
        })
            .then(result => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: title,
                        didOpen: () => {
                            Swal.showLoading();
                            resetUserData(selectedUser ? selectedUser : '')
                                .then(() => {
                                    Swal.close();
                                    retrieveUserInfo();
                                })
                                .catch(e => showError(title, e));
                        },
                    });
                }
            });
    }

    function onSwitchUser() {
        selectedUser = '';
    }

    function onCreateNewUser() {
        const title = 'Create new user';
        Swal.fire({
            title: title,
            showCancelButton: true,
            input: 'text',
        })
            .then(rsp => {
                if (rsp.isDismissed || (rsp.value === undefined)) {
                    return;
                }
                const username = rsp.value as string;
                Swal.fire({
                    title: title,
                    didOpen: () => {
                        Swal.showLoading();
                        createUser(username)
                            .then(() => {
                                Swal.close();
                                retrieveUserList();
                            })
                            .catch(e => showError(title, e));
                    },
                });
            });
    }

    function onShowPaymentInfo() {
        Swal.fire({
            title: 'Payment info',
            text: `PayLah!/PayNow to ${paymentPhoneNumber}. Please inform ${paymentName} of your payment.`,
        });
    }

    function onLogin() {
        authenticator.authenticate({
            provider: 'github',
            scope: 'read:org',
        }, (err, data) => {
            if (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Authentication failure',
                });
                return;
            }
            const response = data as AuthenticatorResponse;
            const octokit = new Octokit({
                auth: response.token,
            });
            octokit.rest.orgs.listMembershipsForAuthenticatedUser({
                state: 'active',
            })
                .then(rsp => {
                    const entry = rsp.data.find(entry => {
                        if (entry.organization.login === 'org-arl') {
                            return true;
                        }
                    });
                    if (entry === undefined) {
                        showError('Unauthorized', 'Not a member of org-arl');
                        return;
                    }
                    octokit.rest.users.getAuthenticated()
                        .then(rsp => {
                            githubLogin = rsp.data.login;
                            githubName = rsp.data.name;
                        })
                        .catch(e => {
                            showError('Error retrieving user info', e);
                        });
                })
                .catch(e => {
                    showError('Error retrieving org memberships', e);
                });
        });
    }

    function showError(title: string, e: any) {
        console.log(e);
        Swal.close();
        Swal.fire({
            title: title,
            icon: 'error',
            text: e,
        });
    }
</script>

<main class="container centered">
    <span class="hero-icon">☕</span>
    <h1>ARL Productivity Logger</h1>

    {#if authenticated}
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
                <button onclick={onCreateNewUser}>Create new user</button>
            {/if}
        {/if}

        {#if (selectedUser !== '')}
            <article>
                <header>
                    <span>👤 {selectedUser}</span>
                </header>
                <div class="userInfo">
                    {#if loadingUserInfo}
                        Loading...
                        <progress></progress>
                    {/if}
                    {#if !loadingUserInfo}
                        {#if (coffeeCount !== undefined)}
                            <p>☕ x {coffeeCount}</p>
                            <p>Total: ${(coffeeCount * unitPrice).toFixed(2)}</p>
                        {/if}
                    {/if}
                </div>
                <footer>
                    <button onclick={onAddCup}>Add a cup ☕</button>
                    <button class="secondary"
                            onclick={onPayAndReset}
                            disabled={coffeeCount === undefined}>Pay & reset 💸️
                    </button>
                </footer>
            </article>

            <div>
                <button class="outline"
                        onclick={onSwitchUser}>Switch user 👤
                </button>
                <button class="outline"
                        onclick={onShowPaymentInfo}>Payment info 💸
                </button>
            </div>
        {/if}
    {/if}

    {#if !authenticated}
        <button onclick={onLogin}>Login</button>
    {/if}
</main>

<style>
    .centered {
        text-align: center;
    }

    .hero-icon {
        font-size: 5em;
    }

    .userInfo {
        padding-top: 2em;
        padding-bottom: 2em;
    }
</style>
