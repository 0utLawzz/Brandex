# Private Storage Backup & Restore Procedures

**Bucket name:** `trademark-files`  
**Type:** Private Supabase Storage bucket  
**Purpose:** Trademark logos, application documents, and related files (PNG, JPEG, WebP, PDF)  
**Max file size:** 10 MB  

This document describes how to back up and restore objects from the private storage bucket. Keep this procedure up to date whenever the bucket configuration changes.

---

## 1. Prerequisites

- Supabase project access with service-role key (server-side only)
- Supabase CLI or a script that uses the service-role key
- Secure storage location for the backup (encrypted disk or private object storage)

Never place the service-role key in any `VITE_*` variable or frontend code.

---

## 2. Listing objects

Using the Supabase JavaScript client (service role):

```js
const { data, error } = await supabase.storage
  .from('trademark-files')
  .list('', { limit: 1000, offset: 0 });
```

Or recursively list with a small script that walks folders if path prefixes are used.

---

## 3. Creating a backup

Recommended approach:

1. Generate a list of all object paths.
2. For each path, create a long-lived signed URL (or download the bytes directly with the service role).
3. Store the files in a dated, encrypted archive together with a manifest that records:
   - original storage path
   - file name
   - mime type
   - size
   - related trademark_id (if available from `trademark_files` table)

Example manifest entry:

```json
{
  "storage_path": "logos/abc123.png",
  "file_name": "logo.png",
  "mime_type": "image/png",
  "size_bytes": 245760,
  "trademark_id": "uuid-or-text-id",
  "backed_up_at": "2026-09-10T12:00:00Z"
}
```

Store the archive offline or in a separate private bucket with a different encryption key.

---

## 4. Restore procedure

1. Restore the database records first (especially `trademarks` and `trademark_files` rows) if they were also lost.
2. Upload each file back to the exact original `storage_path` using the service role.
3. Verify that the corresponding row in `public.trademark_files` still points to the restored path.
4. Test a short-lived signed URL from the application to confirm accessibility.

---

## 5. Operational notes

- The application only issues short-lived signed URLs (typically 1 hour) when a record is opened. Long-term access always goes through the service role.
- Keep RLS and storage policies enabled.
- After any restore, re-run a sample of signed-URL generation from the frontend to confirm the private bucket policies are intact.
- Rotate any temporary credentials used during the backup/restore process immediately afterwards.

---

## 6. Related tables

- `public.trademark_files` – metadata and storage paths
- `public.trademarks.logo_path` – convenience reference used by the UI

Always keep the database metadata and the storage objects in sync.

---

*Document created 10 September 2026 as part of the medium-priority improvements listed in Progress.md.*
