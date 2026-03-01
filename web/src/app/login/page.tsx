import Image from "next/image";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // We won't await searchParams in render — use it synchronously via the prop
  // Actually in Next.js 15 with app router, searchParams is a promise in page components
  return <LoginContent searchParams={searchParams} />;
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="bg-[#14141f] border border-[#2a2a3a] rounded-xl p-8 max-w-md w-full mx-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">CS2 Loadout</h1>
        <p className="text-gray-400 mb-8">
          Sign in with Steam to customize your loadout
        </p>

        {params?.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6 text-red-400 text-sm">
            Authentication failed. Please try again.
          </div>
        )}

        <a
          href="/api/auth/steam"
          className="inline-flex items-center gap-3 bg-[#171a21] hover:bg-[#1b2838] border border-[#2a475e] text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Image
            src="https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg"
            alt="Steam"
            width={32}
            height={32}
            className="rounded"
            unoptimized
          />
          Sign in with Steam
        </a>

        <p className="text-gray-500 text-xs mt-6">
          Your Steam credentials are handled securely by Steam.
          <br />
          We only receive your public profile info.
        </p>
      </div>
    </div>
  );
}
