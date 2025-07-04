import { SendEmailCommand, type SESClient } from '@aws-sdk/client-ses';

export class EmailService {
	private sesClient: SESClient;
	constructor(sesClient: SESClient) {
		this.sesClient = sesClient;
	}

	sendAuthEmail = async (email: string, subject: string, html: string, text: string) => {
		this.sesClient.send(
			new SendEmailCommand({
				Source: 'noreply@johnteasdale.com',
				Destination: {
					ToAddresses: [email]
				},
				Message: {
					Subject: {
						Data: subject,
						Charset: 'UTF-8'
					},
					Body: {
						Html: {
							Data: html,
							Charset: 'UTF-8'
						},
						Text: {
							Data: text,
							Charset: 'UTF-8'
						}
					}
				}
			})
		);
	};
}
