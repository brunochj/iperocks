import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { name, username, email, password } = await req.json();

    if (!email || !name || !username || !password) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email ou nome de usuário já em uso.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: authData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, username },
      });

    if (createError || !authData.user) {
      console.error('Supabase createUser error:', createError);
      return NextResponse.json(
        { error: createError?.message ?? 'Não foi possível criar a conta.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        name,
        username,
        email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        rulesAccepted: true,
        image: true,
      },
    });

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      console.error('Sign in after register error:', error);
      return NextResponse.json(
        { error: 'Conta criada, mas não foi possível iniciar a sessão.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
