<script lang="ts">
    import Swal from 'sweetalert2';
    import {storage} from '@jill64/svelte-storage';
    import {string as serdeString} from '@jill64/svelte-storage/serde';
    import {generate_code, type Amount} from 'sgqr';
    import {fromByteArray} from 'base64-js';
    import Authenticator from 'netlify-auth-providers';
    import {Octokit} from '@octokit/rest';
    import {onMount} from 'svelte';
    import {getTotalCoffee, logCoffee, resetUserData} from './lib/service.js';
    import {findExistingUser} from './lib/users.js';

    const authenticator = new Authenticator({
        site_id: '154a9f66-7459-4468-bae8-1f43798c1334',
    });

    interface AuthenticatorResponse {
        provider: string;
        token: string;
    }

    type AppState = 'initializing' | 'authenticating' | 'retrievingUserLoginInfo' | 'unauthorized' | 'authorized';

    const unitPrice = 0.60;
    const paymentPhoneNumber = '+6581982143';
    const paymentName = 'Kee';

    const customStorage = storage({
        ['oauth2Token']: serdeString,
    });

    let appState = $state<AppState>('initializing');
    let githubLogin = $state<string>();
    let githubName = $state<string | null>();
    let username = $state<string>();
    let coffeeCount = $state<number>();
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
                    appState = 'retrievingUserLoginInfo';
                })
                .catch(e => {
                    console.log(e);
                    customStorage['oauth2Token'] = '';
                    appState = 'authenticating';
                });
        } else {
            appState = 'authenticating';
        }
    });

    $effect(() => {
        switch (appState) {
            case 'retrievingUserLoginInfo':
                retrieveUserLoginInfo();
                break;
            case 'authorized':
                retrieveUserInfo();
                break;
        }
    });

    function retrieveUserInfo() {
        if (username === undefined) {
            return;
        }
        const title = 'Retrieving user info...';
        loadingUserInfo = true;
        getTotalCoffee(username ? username : '')
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
        if ((username === undefined) || (username === '')) {
            return;
        }
        const title = 'Add a cup';
        Swal.fire({
            title: title,
            didOpen: () => {
                Swal.showLoading();
                logCoffee(username ? username : '', new Date(), 1)
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
            html: `<p>Please use the SGQR for payment.</p><p>Please inform ${paymentName} when payment is completed and whether Paylah/PayNow is used.</p><p><img src="${qrCode}" alt="SGQR"></p>`,
            confirmButtonText: 'Confirm payment and reset',
            showCancelButton: true,
        })
            .then(result => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: title,
                        didOpen: () => {
                            Swal.showLoading();
                            resetUserData(username ? username : '')
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
            customStorage['oauth2Token'] = response.token;
            appState = 'retrievingUserLoginInfo';
        });
    }

    function retrieveUserLoginInfo() {
        const octokit = new Octokit({
            auth: customStorage['oauth2Token'],
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
                    appState = 'unauthorized';
                    return;
                }
                octokit.rest.users.getAuthenticated()
                    .then(rsp => {
                        githubLogin = rsp.data.login;
                        githubName = rsp.data.name;
                        const existingUser = findExistingUser(githubLogin);
                        if (existingUser !== undefined) {
                            username = existingUser.username;
                        } else {
                            if ((githubName !== undefined) && (githubName !== null) && (githubName !== '')) {
                                username = githubName;
                            } else {
                                username = githubLogin;
                            }
                            // TODO
                            return;
                        }
                        appState = 'authorized';
                    })
                    .catch(e => {
                        showError('Error retrieving user info', e);
                    });
            })
            .catch(e => {
                showError('Error retrieving org memberships', e);
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

<main class="container">
    <span class="hero-icon">☕</span>
    <h1>ARL Productivity Logger</h1>

    {#if appState === 'initializing'}
        <span aria-busy="true">Checking auth...</span>
    {/if}

    {#if appState === 'authenticating'}
        <button onclick={onLogin}>Login</button>
    {/if}

    {#if appState === 'retrievingUserLoginInfo'}
        <span aria-busy="true">Retrieving user login info...</span>
    {/if}

    {#if appState === 'unauthorized'}
        Unauthorized
    {/if}

    {#if appState === 'authorized'}
        <article>
            <header>
                <span>👤 {username}</span>
                <span class="pill">{githubLogin}</span>
                {#if (githubName !== null) && (githubName !== undefined) && (githubName !== '')}
                    <span class="pill">{githubName}</span>
                {/if}
            </header>

            <div class="userInfo">
                {#if loadingUserInfo}
                    <span aria-busy="true">Retrieving user data...</span>
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
                    onclick={onShowPaymentInfo}>Payment info 💸
            </button>
        </div>
    {/if}
</main>

<style>
    .hero-icon {
        font-size: 5em;
    }

    .userInfo {
        padding-top: 2em;
        padding-bottom: 2em;
    }

    .pill {
        font-size: smaller;
        color: white;
        background-color: blue;
        border-radius: 8px;
        padding: 4px 8px;
    }
</style>
