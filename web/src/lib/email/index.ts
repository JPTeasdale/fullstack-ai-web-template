export type EmailTemplateOptions = {
	siteUrl: string;
	token: string;
	redirectTo: string;
};

export type EmailTemplate = {
	subject: string;
	html: string;
	text: string;
};

export function getEmailTemplate(email: string, options: EmailTemplateOptions): EmailTemplate {
	return {
		subject: 'Confirm your email',
		html: 'Confirm your email',
		text: 'Confirm your email'
	};
}
