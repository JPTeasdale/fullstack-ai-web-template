<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';

	let { data }: { data: PageData } = $props();

	let selectedPlan = $state<'basic' | 'pro' | null>(null);
	let selectedInterval = $state<string>('');
	let isLoading = $state(false);
	let dialogOpen = $state(false);

	// Format date
	function formatDate(dateString: string | null) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Format currency
	function formatCurrency(amount: number, currency: string) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency.toUpperCase()
		}).format(amount);
	}

	// Get status badge color
	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'trialing':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'past_due':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'canceled':
				return 'bg-gray-100 text-gray-800 border-gray-200';
			default:
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		}
	}

	// Plans data with features
	const plans = {
		basic: {
			name: 'Basic',
			fromPrice: 100 / 12,
			popular: false,
			description: 'for getting started',
			features: [
				'Up to 10 team members',
				'5GB storage',
				'Basic analytics',
				'Email support',
				'Standard integrations'
			],
			intervals: [
				{ id: 'basic_weekly', name: 'Weekly', price: 5, interval: 'week' },
				{ id: 'basic_monthly', name: 'Monthly', price: 10, interval: 'month' },
				{ id: 'basic_yearly', name: 'Yearly', price: 100, interval: 'year' }
			]
		},
		pro: {
			name: 'Pro',
			fromPrice: 250 / 12,
			popular: true,
			description: 'for growing teams',
			features: [
				'Unlimited team members',
				'100GB storage',
				'Advanced analytics & insights',
				'Priority email & chat support',
				'All integrations',
				'Custom workflows',
				'API access'
			],
			intervals: [
				{ id: 'pro_weekly', name: 'Weekly', price: 10, interval: 'week' },
				{ id: 'pro_monthly', name: 'Monthly', price: 25, interval: 'month' },
				{ id: 'pro_yearly', name: 'Yearly', price: 250, interval: 'year' }
			]
		}
	};

	function openPlanDialog(planType: 'basic' | 'pro') {
		selectedPlan = planType;
		selectedInterval = '';
		dialogOpen = true;
	}
</script>

<div class="mx-auto w-full space-y-8">
	<div>
		<h1 class="text-3xl font-bold">Subscription Management</h1>
		<p class="text-muted-foreground mt-2">Manage your subscription and billing settings</p>
	</div>

	{#if data.checkoutSuccess}
		<div class="rounded-lg border border-green-200 bg-green-50 p-4">
			<div class="flex">
				<svg class="mt-0.5 h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/>
				</svg>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-green-800">Payment successful!</h3>
					<p class="mt-1 text-sm text-green-700">Your subscription has been activated.</p>
				</div>
			</div>
		</div>
	{/if}

	{#if data.subscription}
		<!-- Current Subscription -->
		<div class="bg-card rounded-lg border">
			<div class="p-6">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-semibold">Current Subscription</h2>
					<span
						class={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(data.subscription.status)}`}
					>
						{data.subscription.status.charAt(0).toUpperCase() +
							data.subscription.status.slice(1).replace(/_/g, ' ')}
					</span>
				</div>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<p class="text-muted-foreground text-sm">Plan</p>
						<p class="font-medium">{data.priceInfo?.productName || 'Subscription'}</p>
					</div>

					<div>
						<p class="text-muted-foreground text-sm">Price</p>
						<p class="font-medium">
							{#if data.priceInfo}
								{formatCurrency(data.priceInfo.amount, data.priceInfo.currency)} / {data.priceInfo
									.interval}
							{:else}
								N/A
							{/if}
						</p>
					</div>

					<div>
						<p class="text-muted-foreground text-sm">Current Period Ends</p>
						<p class="font-medium">
							{formatDate(data.subscription.current_period_end)}
						</p>
					</div>

					{#if data.subscription.trial_end}
						<div>
							<p class="text-muted-foreground text-sm">Trial Ends</p>
							<p class="font-medium">{formatDate(data.subscription.trial_end)}</p>
						</div>
					{/if}

					{#if data.subscription.cancel_at_period_end}
						<div class="col-span-full">
							<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
								<div class="flex flex-row justify-between items-center text-sm text-yellow-800">
									<div>
										Your subscription will end on {formatDate(data.subscription.current_period_end)}
									</div>

									<form
										method="POST"
										action="?/reactivate"
										use:enhance={() => {
											isLoading = true;
											return async ({ update }) => {
												await update();
												isLoading = false;
											};
										}}
									>
										<Button type="submit" variant="outline" disabled={isLoading}>
											<svg
												class="mr-2 h-4 w-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
												/>
											</svg>
											Reactivate
										</Button>
									</form>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Actions -->
				<div class="mt-6 flex flex-wrap gap-3">
					{#if data.subscription.status === 'active' || data.subscription.status === 'trialing'}
						<form
							method="POST"
							action="?/updatePaymentMethod"
							use:enhance={() => {
								isLoading = true;
								return async ({ update }) => {
									await update();
									isLoading = false;
								};
							}}
						>
							<Button type="submit" variant="outline" disabled={isLoading}>
								<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
									/>
								</svg>
								Update Payment Method
							</Button>
						</form>

						{#if data.subscription.cancel_at_period_end}
							<form
								method="POST"
								action="?/reactivate"
								use:enhance={() => {
									isLoading = true;
									return async ({ update }) => {
										await update();
										isLoading = false;
									};
								}}
							>
								<Button type="submit" disabled={isLoading}>
									<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
									Reactivate Subscription
								</Button>
							</form>
						{:else}
							<form
								method="POST"
								action="?/cancel"
								use:enhance={() => {
									isLoading = true;
									return async ({ update }) => {
										await update();
										isLoading = false;
									};
								}}
							>
								<Button type="submit" variant="destructive" disabled={isLoading}>
									<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
									Cancel Subscription
								</Button>
							</form>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- Billing History -->
		<!-- <div class="bg-card rounded-lg border">
			<div class="p-6">
				<h2 class="mb-4 text-xl font-semibold">Billing History</h2>
				<p class="text-muted-foreground">
					View your billing history and download invoices from your Stripe customer portal.
				</p>

				<form
					method="POST"
					action="?/updatePaymentMethod"
					class="mt-4"
					use:enhance={() => {
						isLoading = true;
						return async ({ update }) => {
							await update();
							isLoading = false;
						};
					}}
				>
					<Button type="submit" variant="outline" disabled={isLoading}>
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
						Open Customer Portal
					</Button>
				</form>
			</div>
		</div> -->
	{:else}
		<!-- No Subscription -->
		<div class="space-y-8">
			<div class="bg-secondary/50 flex flex-col gap-2 rounded-lg p-4">
				<h2 class="mb-2 text-2xl font-semibold">Choose Your Plan</h2>
				<p class="text-muted-foreground">
					This is configured to use a Stripe Development Sandbox and will not accept real payments.
					Use one one of the <a
						href="https://stripe.com/docs/testing#cards"
						target="_blank"
						class="text-primary">Stripe test cards</a
					> to test the checkout process.
				</p>
			</div>

			<div class="flex justify-start gap-6">
				{#each Object.entries(plans) as [key, plan]}
					<!-- Pro Plan Card -->
					<div
						class="bg-card w-sm relative max-w-sm cursor-pointer rounded-lg border p-6 transition-all hover:shadow-lg"
						onclick={() => openPlanDialog(key as 'basic' | 'pro')}
					>
						{#if plan.popular}
							<div
								class="bg-primary text-primary-foreground absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-medium"
							>
								Most Popular
							</div>
						{/if}
						<div class="mb-6">
							<h3 class="mb-2 text-xl font-semibold">{plan.name}</h3>
							<p class="text-muted-foreground mb-4">{plan.description}</p>
							<p class="mb-6">
								<span class="text-3xl font-bold">From {formatCurrency(plan.fromPrice, 'USD')}</span>
								<span class="text-muted-foreground"> /month</span>
							</p>
						</div>

						<ul class="mb-8 space-y-3">
							{#each plan.features as feature}
								<li class="flex items-start">
									<svg
										class="text-primary mr-3 mt-0.5 h-5 w-5 flex-shrink-0"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									<span class="text-sm">{feature}</span>
								</li>
							{/each}
						</ul>

						<Button class="w-full" onclick={() => openPlanDialog(key)}
							>Select {plan.name} Plan</Button
						>
					</div>
				{/each}
			</div>
		</div>

		<!-- Plan Selection Dialog -->
		<Dialog.Root bind:open={dialogOpen}>
			<Dialog.Content class="sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title>Select Your Billing Option</Dialog.Title>
					<Dialog.Description>
						Choose how often you'd like to be billed for your {selectedPlan
							? plans[selectedPlan].name
							: ''} plan
					</Dialog.Description>
				</Dialog.Header>

				{#if selectedPlan}
					<form
						method="POST"
						action="?/createSubscription"
						use:enhance={() => {
							isLoading = true;
							return async ({ update }) => {
								await update();
								isLoading = false;
								dialogOpen = false;
							};
						}}
					>
						<div class="flex flex-col gap-2 py-4">
							{#each plans[selectedPlan].intervals as interval}
								<label class="relative">
									<input
										type="radio"
										name="plan"
										value={interval.id}
										bind:group={selectedInterval}
										class="peer sr-only"
									/>
									<div
										class="peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-primary/5 cursor-pointer rounded-lg border-2 p-4 transition-all transition-all hover:shadow-lg"
									>
										<div class="flex items-center justify-between">
											<div>
												<h4 class="font-semibold">{interval.name}</h4>
												<p class="text-muted-foreground text-sm">
													Billed {interval.interval === 'week'
														? 'weekly'
														: interval.interval === 'month'
															? 'monthly'
															: 'yearly'}
												</p>
											</div>
											<div class="text-right">
												<p class="text-xl font-bold">${interval.price}</p>
												<p class="text-muted-foreground text-sm">/{interval.interval}</p>
											</div>
										</div>
									</div>
								</label>
							{/each}
						</div>

						<Dialog.Footer>
							<Button
								type="button"
								variant="outline"
								onclick={() => (dialogOpen = false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={!selectedInterval || isLoading}>
								{#if isLoading}
									<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Processing...
								{:else}
									Continue to Checkout
								{/if}
							</Button>
						</Dialog.Footer>
					</form>
				{/if}
			</Dialog.Content>
		</Dialog.Root>

		<div class="text-muted-foreground text-sm">
			Your card will be stored securely with Stripe. Cancel anytime.
		</div>
	{/if}
</div>
