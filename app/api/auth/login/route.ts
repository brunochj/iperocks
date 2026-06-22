import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/username e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Buscar usuário no Neon
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
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

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 2. Tentar login com Supabase
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error) {
      // 2.1 Verificar se a conta foi criada via Google
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: authUser, error: adminError } = await adminClient.auth.admin.getUserById(user.id);

      if (!adminError && authUser.user) {
        // Verifica se o usuário tem identidade do Google
        const hasGoogleIdentity = authUser.user.identities?.some(
          (identity) => identity.provider === 'google'
        );

        if (hasGoogleIdentity) {
          return NextResponse.json(
            {
              error: 'Conta criada com Google. Faça login com o botão "Continuar com Google".',
              code: 'GOOGLE_ONLY',
            },
            { status: 401 }
          );
        }
      }

      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // 3. Login bem-sucedido
    return NextResponse.json({
      success: true,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        rulesAccepted: user.rulesAccepted,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}