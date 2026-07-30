import { supabase } from "./supabase";

export async function uploadAssignmentDocument(
  assignmentId: string,
  file: File
) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;

  const filePath = `${assignmentId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("assignment-documents")
    .upload(filePath, file);

  if (error) throw error;

  return data.path;
}

export async function listAssignmentDocuments(
  assignmentId: string
) {
  const { data, error } = await supabase.storage
    .from("assignment-documents")
    .list(assignmentId);

  if (error) throw error;

  return data;
}

export async function deleteAssignmentDocument(
  path: string
) {
  const { error } = await supabase.storage
    .from("assignment-documents")
    .remove([path]);

  if (error) throw error;
}

export async function getDocumentUrl(path: string) {
  const { data } = await supabase.storage
    .from("assignment-documents")
    .createSignedUrl(path, 3600);

  return data?.signedUrl;
}