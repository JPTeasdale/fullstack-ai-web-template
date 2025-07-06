<script lang="ts">
	import { authModal } from '$lib/stores/authModal';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import InputOtp from '$lib/components/InputOtp.svelte';
	import { fetchApi } from '$lib/api/apiclient';

	let email = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let step = $state<'email' | 'otp'>('email');
	let otpCode = $state('');

	const handleRequestOtp = async () => {
		if (!email) {
			error = 'Please enter your email address';
			return;
		}

		isLoading = true;
		error = null;

		try {
			const { data, error } = await fetchApi('/api/v1/auth/otp-request', {
				method: 'POST',
				body: { email }
			});

			if (error) {
				throw new Error(error.message || 'Failed to send OTP');
			}

			step = 'otp';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send OTP';
		} finally {
			isLoading = false;
		}
	};

	const handleConfirmOtp = async (code: string) => {
		isLoading = true;
		error = null;

		try {
			const { data, error } = await fetchApi<{ redirect: string }>('/api/v1/auth/otp-confirm', {
				method: 'POST',
				body: { email, otp: code }
			});

			if (error) {
				throw new Error(error.message || 'Invalid OTP');
			}

			// Successfully logged in
			authModal.close();

			// Redirect to the specified URL or refresh the page
			if (data.redirect) {
				window.location.href = data.redirect;
			} else {
				window.location.reload();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to verify OTP';
			otpCode = '';
		} finally {
			isLoading = false;
		}
	};

	const resetModal = () => {
		email = '';
		otpCode = '';
		error = null;
		step = 'email';
		isLoading = false;
	};

	// Reset when modal closes
	$effect(() => {
		if (!$authModal.isOpen) {
			resetModal();
		}
	});
</script>

<Dialog open={$authModal.isOpen} onOpenChange={(open) => !open && authModal.close()}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>
				{step === 'email' ? 'Sign in or Sign up' : 'Enter verification code'}
			</DialogTitle>
			<DialogDescription>
				{step === 'email'
					? 'Enter your email to receive a one-time login code'
					: `We've sent a 6-digit code to ${email}`}
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			{#if error}
				<div class="rounded-md bg-red-50 p-3">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			{/if}

			{#if step === 'email'}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleRequestOtp();
					}}
					class="space-y-4"
				>
					<div>
						<Label for="email">Email address</Label>
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							bind:value={email}
							disabled={isLoading}
							required
							class="mt-1"
						/>
					</div>

					<Button type="submit" class="w-full" disabled={isLoading || !email}>
						{isLoading ? 'Sending code...' : 'Send login code'}
					</Button>
				</form>
			{:else}
				<div class="space-y-4">
					<div class="flex justify-center">
						<InputOtp numInputs={6} onComplete={handleConfirmOtp} disabled={isLoading} />
					</div>

					<div class="text-muted-foreground text-center text-sm">
						Didn't receive the code?
						<button
							onclick={() => {
								step = 'email';
								otpCode = '';
							}}
							class="text-primary ml-1 hover:underline"
							disabled={isLoading}
						>
							Try again
						</button>
					</div>
				</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>
