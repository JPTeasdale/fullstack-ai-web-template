import { error, type RequestHandler } from "@sveltejs/kit";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { CLOUDFLARE_R2_ROOT_BUCKET_NAME } from "$env/static/private";
import { createFileUploadKey } from "$lib/utils/fileUpload";

export const GET: RequestHandler = async ({ locals: { supabase, s3 }, params }) => {
    const fileId = params.fileId;

    // Add check for fileId
    if (!fileId) {
        throw error(400, "File ID is missing from the request");
    }

    // 2. Fetch file info
    const { data: fileUpload, error: fileError } = await supabase
        .from("files")
        .select("organization_id, id, mime_type, name") // Ensure org_id is selected
        .eq("id", fileId)
        .maybeSingle(); // Use specific type

    if (fileError) {
        console.error("Supabase error fetching file upload:", fileError);
        throw error(500, "Failed to retrieve file information");
    }
    if (!fileUpload) {
        throw error(404, "File not found");
    }

    // 4. Construct R2 key
    const key = createFileUploadKey(fileUpload);

    // 5. Fetch from R2 and return stream
    try {
        const command = new GetObjectCommand({
            Bucket: CLOUDFLARE_R2_ROOT_BUCKET_NAME,
            Key: key,
        });

        const s3Response = await s3.send(command);

        // Check if body exists. AWS SDK v3 for node should provide ReadableStream
        if (!s3Response.Body) {
             console.error("S3 response body is missing for key:", key);
             throw error(500, "Failed to read file from storage");
        }

        const bodyStream = s3Response.Body as ReadableStream; // Assume ReadableStream

        // 6. Return response with secure headers
        return new Response(bodyStream, {
            headers: {
                "Content-Type": s3Response.ContentType ??
                    fileUpload ?? "application/octet-stream",
                ...(s3Response.ContentLength && {
                    "Content-Length": s3Response.ContentLength.toString(),
                }),
                // Use filename* for better cross-browser support of special characters
                "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileUpload.filename ?? "download")}`,
                 // Add security headers
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (e: unknown) {
        // Type check before accessing properties
        if (typeof e === "object" && e !== null && "name" in e && e.name === "NoSuchKey") {
            // If DB record exists but R2 object doesn't, it's likely a 404 or inconsistency
            console.warn(`File not found in R2: ${key} for fileId: ${fileId}. DB record exists.`);
            throw error(404, "File data not found in storage");
        }
        console.error(`Error fetching file from R2 (key: ${key}):`, e);
        throw error(500, "Failed to fetch file from storage");
    }
};
