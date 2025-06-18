<div class="typing-dots space-x-1">
	<div class="invisible w-1">T</div>
	<span class="bg-foreground"></span>
	<span class="bg-foreground"></span>
	<span class="bg-foreground"></span>
	<div class="invisible w-1">T</div>
</div>

<style lang="postcss">
	.typing-dots {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.typing-dots > span {
		content: '';
		animation: blink 2s infinite;
		animation-fill-mode: both;
		height: 0.25rem;
		width: 0.25rem;
		border-radius: 50%;
	}

	.typing-dots > span:nth-child(3) {
		animation-delay: 0.4s;
	}

	.typing-dots > span:nth-child(4) {
		animation-delay: 0.8s;
	}

	@keyframes blink {
		0% {
			opacity: 0.1;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.1;
		}
	}
</style>
