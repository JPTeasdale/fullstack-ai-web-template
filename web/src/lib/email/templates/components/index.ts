import { APP_NAME } from '$lib/app/constants';
import type { EmailTemplate } from '$lib/email';
import { htmlToText } from 'html-to-text';

// Style utilities
export const styles = {
	fontFamily: "'Quicksand', -apple-system, BlinkMacSystemFont, sans-serif",
	colors: {
		primary: '#1a1862',
		secondary: '#6d68a8',
		text: '#0b0530',
		muted: '#9896c3',
		background: '#f3f2f5',
		white: '#ffffff',
		card: '#faf6f1',
		ctaText: '#fafafb'
	},
	spacing: {
		container: '40px 0',
		header: '40px 40px 20px',
		content: '30px 40px 40px',
		footer: '30px 40px'
	}
};

/**
 * Email Template Components
 *
 * We use table-based layouts for maximum email client compatibility.
 * Many email clients (especially Outlook) have poor CSS support and
 * tables are the most reliable way to ensure consistent rendering.
 *
 * For more info: https://www.caniemail.com/
 */

// Main container wrapper
export function EmailContainer(...content: string[]): string {
	return `
			<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		</head>
		<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #faf6f1;">
		<table role="presentation" style="width: 100%; border-collapse: collapse;">
			<tr>
				<td align="center" style="padding: ${styles.spacing.container};">
					<table role="presentation" style="width: 600px; max-width: 100%; background-color: ${styles.colors.white}; border-radius: 12px; box-shadow: 0 4px 6px rgba(11, 5, 48, 0.1);">
						${content.join('')}
					</table>
				</td>
			</tr>
		</table>
		</body>
		</html>
	`;
}

// Email header component
export function EmailHeader(subtitle: string, title: string): string {
	return `
		<tr>
			<td style="padding: ${styles.spacing.header}; text-align: center; background-color: ${styles.colors.background}; border-radius: 12px 12px 0 0;">
				<h1 style="margin: 0; color: ${styles.colors.primary}; font-size: 36px; font-weight: 700; letter-spacing: -0.02em; font-family: ${styles.fontFamily};">${title}</h1>
				${subtitle ? `<p style="margin: 10px 0 0; color: ${styles.colors.secondary}; font-size: 16px; font-family: ${styles.fontFamily};">${subtitle}</p>` : ''}
			</td>
		</tr>
	`;
}

// Email content wrapper
export function EmailContent(...content: string[]): string {
	return `
		<tr>
			<td style="padding: ${styles.spacing.content};">
				${content.join('')}
			</td>
		</tr>
	`;
}

// Title component
export function EmailTitle(text: string): string {
	return `<h2 style="margin: 0 0 20px; color: ${styles.colors.text}; font-size: 26px; font-weight: 600; font-family: ${styles.fontFamily};">${text}</h2>`;
}

// Paragraph component
export function EmailParagraph(
	text: string,
	variant: 'primary' | 'secondary' | 'muted' = 'primary'
): string {
	const colorMap = {
		primary: styles.colors.text,
		secondary: styles.colors.secondary,
		muted: styles.colors.muted
	};

	return `<p style="margin: 0 0 20px; color: ${colorMap[variant]}; font-size: 16px; line-height: 1.6; font-family: ${styles.fontFamily};">${text}</p>`;
}

// Small text component
export function EmailSmallText(text: string, centered = true): string {
	return `<p style="margin: 20px 0 0; color: ${styles.colors.muted}; font-size: 13px; line-height: 1.6; ${centered ? 'text-align: center;' : ''} font-family: ${styles.fontFamily};">${text}</p>`;
}

// Button component
export function EmailButton(text: string, href: string): string {
	return `
		<table role="presentation" style="margin: 0 auto;">
			<tr>
				<td style="text-align: center;">
					<a href="${href}" style="display: inline-block; padding: 14px 32px; background-color: ${styles.colors.primary}; color: ${styles.colors.ctaText}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; font-family: ${styles.fontFamily}; transition: background-color 0.2s;">
						${text}
					</a>
				</td>
			</tr>
		</table>
	`;
}

// Link display component
export function EmailLinkDisplay(href: string, label?: string): string {
	return `
		<p style="margin: 30px 0 0; color: ${styles.colors.secondary}; font-size: 14px; line-height: 1.6; text-align: center; font-family: ${styles.fontFamily};">
			${label || 'Or copy and paste this link into your browser:'}<br>
			<a href="${href}" style="color: ${styles.colors.primary}; text-decoration: none; word-break: break-all;">${href}</a>
			<br>
			<button onclick="navigator.clipboard.writeText('${href}')" style="background: none; border: 1px solid ${styles.colors.muted}; color: ${styles.colors.muted}; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-top: 8px; font-family: ${styles.fontFamily};">
				Click to copy
			</button>
		</p>
	`;
}

// Footer component
export function EmailFooter(email?: string): string {
	const year = new Date().getFullYear();
	const footerContent = [
		`© ${year} ${APP_NAME}. All rights reserved.`,
		email && `This email was sent to ${email}`
	]
		.filter(Boolean)
		.join('<br>');

	return `
		<tr>
			<td style="padding: ${styles.spacing.footer}; background-color: ${styles.colors.background}; border-radius: 0 0 12px 12px; border-top: 1px solid #e6e5ed;">
				<p style="margin: 0; color: ${styles.colors.muted}; font-size: 12px; text-align: center; font-family: ${styles.fontFamily};">
					${footerContent}
				</p>
			</td>
		</tr>
	`;
}

// Helper to build complete email
export function buildEmailTemplate(subject: string, html: string): EmailTemplate {
	return {
		subject,
		html,
		text: htmlToText(html).replace('button', 'link')
	};
}
