
// Email templates for different action types

type EmailTemplateOptions = {
	token: string;
	redirectTo: string;
	siteUrl: string;
};

type EmailTemplate = {
	subject: string;
	html: string;
	text: string;
};

export const getEmailTemplate = (actionType: string, options: EmailTemplateOptions): EmailTemplate => {
	const { token, redirectTo, siteUrl } = options;
	
	switch (actionType) {
		case 'signup':
			return {
				subject: 'Confirm your account',
				html: `
					<h1>Welcome!</h1>
					<p>Thanks for signing up. Please confirm your account by clicking the link below:</p>
					<a href="${siteUrl}/auth/confirm?token=${token}&redirect_to=${encodeURIComponent(redirectTo)}">
						Confirm your account
					</a>
					<p>Or enter this code: <strong>${token}</strong></p>
				`,
				text: `Welcome! Thanks for signing up. Please confirm your account by visiting: ${siteUrl}/auth/confirm?token=${token}&redirect_to=${encodeURIComponent(redirectTo)} Or enter this code: ${token}`
			};
		
		case 'recovery':
			return {
				subject: 'Reset your password',
				html: `
					<h1>Password Reset</h1>
					<p>You requested a password reset. Click the link below to reset your password:</p>
					<a href="${siteUrl}/auth/reset-password?token=${token}&redirect_to=${encodeURIComponent(redirectTo)}">
						Reset your password
					</a>
					<p>Or enter this code: <strong>${token}</strong></p>
					<p>If you didn't request this, please ignore this email.</p>
				`,
				text: `You requested a password reset. Visit: ${siteUrl}/auth/reset-password?token=${token}&redirect_to=${encodeURIComponent(redirectTo)} Or enter this code: ${token}. If you didn't request this, please ignore this email.`
			};
		
		case 'invite':
			return {
				subject: 'You have been invited',
				html: `
					<h1>You're invited!</h1>
					<p>You have been invited to join our platform. Click the link below to accept the invitation:</p>
					<a href="${siteUrl}/auth/invite?token=${token}&redirect_to=${encodeURIComponent(redirectTo)}">
						Accept invitation
					</a>
					<p>Or enter this code: <strong>${token}</strong></p>
				`,
				text: `You have been invited to join our platform. Visit: ${siteUrl}/auth/invite?token=${token}&redirect_to=${encodeURIComponent(redirectTo)} Or enter this code: ${token}`
			};
		
		case 'magic_link':
			return {
				subject: 'Your magic link',
				html: `
					<h1>Sign in with magic link</h1>
					<p>Click the link below to sign in:</p>
					<a href="${siteUrl}/auth/callback?token=${token}&redirect_to=${encodeURIComponent(redirectTo)}">
						Sign in
					</a>
					<p>Or enter this code: <strong>${token}</strong></p>
				`,
				text: `Sign in with this magic link: ${siteUrl}/auth/callback?token=${token}&redirect_to=${encodeURIComponent(redirectTo)} Or enter this code: ${token}`
			};
		
		case 'email_change_confirm_new':
			return {
				subject: 'Confirm your new email address',
				html: `
					<h1>Confirm email change</h1>
					<p>Please confirm your new email address by clicking the link below:</p>
					<a href="${siteUrl}/auth/confirm?token=${token}&redirect_to=${encodeURIComponent(redirectTo)}">
						Confirm new email
					</a>
					<p>Or enter this code: <strong>${token}</strong></p>
				`,
				text: `Please confirm your new email address by visiting: ${siteUrl}/auth/confirm?token=${token}&redirect_to=${encodeURIComponent(redirectTo)} Or enter this code: ${token}`
			};
		
		case 'email_change_confirm_old':
			return {
				subject: 'Confirm email change from old address',
				html: `
					<h1>Confirm email change</h1>
					<p>Please confirm the email change by clicking the link below:</p>
					<a href="${siteUrl}/auth/confirm?token=${token}&redirect_to=${encodeURIComponent(redirectTo)}">
						Confirm email change
					</a>
					<p>Or enter this code: <strong>${token}</strong></p>
				`,
				text: `Please confirm the email change by visiting: ${siteUrl}/auth/confirm?token=${token}&redirect_to=${encodeURIComponent(redirectTo)} Or enter this code: ${token}`
			};
		
		default:
			return {
				subject: 'Authentication required',
				html: `
					<h1>Authentication</h1>
					<p>Please use the following code to authenticate:</p>
					<p><strong>${token}</strong></p>
				`,
				text: `Please use the following code to authenticate: ${token}`
			};
	}
};
