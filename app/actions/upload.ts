// app/actions/upload.ts
"use server";

import cloudinary from '@/lib/cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function uploadImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File;
    const blockId = formData.get('blockId') as string; // Recebe o ID do bloco para usar no nome do arquivo

    if (!file) {
      return { success: false, error: "Nenhum arquivo enviado." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cria um nome único para o arquivo
    const uniqueId = uuidv4();
    const filename = `blocks/${blockId}-${uniqueId}`;

    // Faz o upload para o Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'iperocks-blocks',
          public_id: filename,
          resource_type: 'image',
          tags: [blockId]
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      ).end(buffer);
    });

    // Invalida o cache da página do bloco para mostrar a nova imagem
    revalidatePath(`/croqui/${blockId}`);

    return { success: true, url: (result as any).secure_url };
  } catch (error) {
    console.error("Erro no upload:", error);
    return { success: false, error: "Falha no upload da imagem." };
  }
}