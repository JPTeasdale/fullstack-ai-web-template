<script lang="ts">
	const { size = 64, class: className = '' } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 64 64"
	class={className}
	xmlns="http://www.w3.org/2000/svg"
>
	<defs>
		<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
			<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
		</linearGradient>
	</defs>

	<!-- Background rounded rectangle -->
	<rect x="4" y="4" width="56" height="56" rx="12" ry="12" fill="url(#gradient)" />

	<!-- App icon symbol - abstract geometric shape -->
	<g fill="white" fill-opacity="0.9">
		<!-- Main shape -->
		<circle cx="32" cy="24" r="8" />
		<rect x="20" y="32" width="24" height="4" rx="2" />
		<rect x="24" y="40" width="16" height="4" rx="2" />
		<rect x="28" y="48" width="8" height="4" rx="2" />
	</g>
</svg>
