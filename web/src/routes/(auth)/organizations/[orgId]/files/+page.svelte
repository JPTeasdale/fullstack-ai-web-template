<script lang="ts">
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { formatBytes, formatDate } from '$lib/utils/format';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let isDragging = $state(false);
	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let uploadError = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	const allowedTypes = {
		images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
		documents: [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'text/plain'
		]
	};

	const allAllowedTypes = [...allowedTypes.images, ...allowedTypes.documents];

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			await uploadFiles(files);
		}
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			await uploadFiles(files);
		}
	}

	async function uploadFiles(files: FileList) {
		for (const file of files) {
			if (!allAllowedTypes.includes(file.type)) {
				uploadError = `File type ${file.type} is not supported. Please upload images or documents.`;
				continue;
			}

			await uploadFile(file);
		}
	}

	async function uploadFile(file: File) {
		isUploading = true;
		uploadProgress = 0;
		uploadError = null;

		const formData = new FormData();
		formData.append('file', file);

		try {
			const xhr = new XMLHttpRequest();

			// Track upload progress
			xhr.upload.addEventListener('progress', (event) => {
				if (event.lengthComputable) {
					uploadProgress = Math.round((event.loaded / event.total) * 100);
				}
			});

			// Create a promise to handle the XHR request
			const uploadPromise = new Promise((resolve, reject) => {
				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						resolve(JSON.parse(xhr.responseText));
					} else {
						reject(new Error(xhr.responseText));
					}
				};
				xhr.onerror = () => reject(new Error('Upload failed'));
			});

			xhr.open('POST', `/api/v1/organizations/${$page.params.orgId}/files`);
			xhr.send(formData);

			await uploadPromise;

			// Refresh the file list
			await invalidateAll();
		} catch (error) {
			console.error('Upload error:', error);
			uploadError = error instanceof Error ? error.message : 'Failed to upload file';
		} finally {
			isUploading = false;
			uploadProgress = 0;
			// Clear file input
			if (fileInput) {
				fileInput.value = '';
			}
		}
	}

	function getFileIcon(mimeType: string) {
		if (mimeType.startsWith('image/')) {
			return '🖼️';
		} else if (mimeType === 'application/pdf') {
			return '📄';
		} else if (mimeType.includes('word')) {
			return '📝';
		} else {
			return '📎';
		}
	}

	async function deleteFile(fileId: string) {
		if (!confirm('Are you sure you want to delete this file?')) {
			return;
		}

		try {
			const response = await fetch(`/api/v1/organizations/${$page.params.orgId}/files/${fileId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete file');
			}

			await invalidateAll();
		} catch (error) {
			console.error('Delete error:', error);
			uploadError = error instanceof Error ? error.message : 'Failed to delete file';
		}
	}
</script>

<div class="container mx-auto p-6 max-w-6xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Files</h1>
		<p class="text-gray-600">Upload and manage your organization's files</p>
	</div>

	<!-- Upload Area -->
	<div class="mb-8">
		<div
			class="border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 {isDragging
				? 'border-blue-500 bg-blue-50'
				: 'border-gray-300 hover:border-gray-400'}"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			<input
				bind:this={fileInput}
				type="file"
				id="file-input"
				class="hidden"
				multiple
				accept={allAllowedTypes.join(',')}
				onchange={handleFileSelect}
			/>

			<div class="flex flex-col items-center">
				<div class="text-4xl mb-4">📁</div>
				<p class="text-lg font-medium mb-2">
					{isDragging ? 'Drop files here' : 'Drag and drop files here'}
				</p>
				<p class="text-sm text-gray-500 mb-4">or</p>
				<Button
					onclick={() => fileInput?.click()}
					disabled={isUploading}
					variant="default"
				>
					Choose Files
				</Button>
				<p class="text-xs text-gray-500 mt-4">
					Supported: Images (JPEG, PNG, GIF, WebP) and Documents (PDF, Word, Text)
				</p>
			</div>
		</div>

		<!-- Upload Progress -->
		{#if isUploading}
			<div class="mt-4">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-medium">Uploading...</span>
					<span class="text-sm text-gray-500">{uploadProgress}%</span>
				</div>
				<div class="w-full bg-gray-200 rounded-full h-2">
					<div
						class="bg-blue-500 h-2 rounded-full transition-all duration-300"
						style="width: {uploadProgress}%"
					></div>
				</div>
			</div>
		{/if}

		<!-- Error Message -->
		{#if uploadError}
			<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
				<p class="text-sm text-red-700">{uploadError}</p>
			</div>
		{/if}
	</div>

	<!-- Files List -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Uploaded Files ({data.files.length})</h2>

		{#if data.files.length === 0}
			<div class="text-center py-12 bg-gray-50 rounded-lg">
				<p class="text-gray-500">No files uploaded yet</p>
			</div>
		{:else}
			<div class="grid gap-4">
				{#each data.files as file}
					<div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-4">
								<div class="text-2xl">{getFileIcon(file.mime_type)}</div>
								<div>
									<h3 class="font-medium text-gray-900">{file.name}</h3>
									<div class="flex items-center space-x-4 mt-1">
										<span class="text-sm text-gray-500">{formatBytes(file.size)}</span>
										<span class="text-sm text-gray-500">•</span>
										<span class="text-sm text-gray-500">{formatDate(file.created_at)}</span>
										{#if file.openai_file_id}
											<span class="text-sm text-gray-500">•</span>
											<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
												AI-Ready
											</span>
										{/if}
									</div>
								</div>
							</div>
							<div class="flex items-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									onclick={() => window.open(`/api/v1/organizations/${$page.params.orgId}/files/${file.id}`, '_blank')}
								>
									Download
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => deleteFile(file.id)}
									class="text-red-600 hover:text-red-700 hover:bg-red-50"
								>
									Delete
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
