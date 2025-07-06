import { apiValidate, createApiHandler } from '$lib/server/api/helpers';
import { successResponse } from '$lib/server/api/response';
import { z } from 'zod';
import { OperationError, UnauthorizedError } from '$lib/server/errors';

const confirmOtpSchema = z.object({
	email: z.string().email(),
	otp: z.string().length(6)
});

export const POST = createApiHandler(async (event) => {
	const { email, otp } = await apiValidate(confirmOtpSchema, event);

	const { supabase } = event.locals;

	// Verify OTP using Supabase's built-in verification
	const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
		email,
		token: otp,
		type: 'email'
	});

	if (verifyError || !sessionData.session) {
		console.error('Failed to verify OTP:', verifyError);
		if (verifyError?.message?.includes('expired')) {
			throw new UnauthorizedError('OTP has expired');
		}
		throw new UnauthorizedError('Invalid OTP');
	}

	// The Supabase client in hooks.server.ts will automatically handle setting the cookies
	// when we return a successful response, as long as the session was created through
	// the local supabase client

	// Return success with redirect instruction
	return successResponse({
		success: true,
		redirect: '/',
		user: {
			id: sessionData.user?.id,
			email: sessionData.user?.email
		}
	});
});
