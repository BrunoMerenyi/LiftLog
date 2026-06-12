import { connection } from "next/server";
import Link from "next/link";
import { MongoClient, ServerApiVersion } from "mongodb";

export const runtime = "nodejs";

type MongoStatus = {
  checkedAt: string;
  host?: string;
  appName?: string;
  latencyMs?: number;
  message: string;
  ok: boolean;
  title: string;
};
console.log("test");

function getMongoMetadata(uri: string) {
  try {
    const parsed = new URL(uri);

    return {
      appName: parsed.searchParams.get("appName") ?? "not set",
      host: parsed.host,
    };
  } catch {
    return {
      appName: "invalid URI",
      host: "invalid URI",
    };
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "MongoDB returned an unknown error.";
}

async function checkMongoConnection(): Promise<MongoStatus> {
  await connection();

  const checkedAt = new Date().toISOString();
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return {
      checkedAt,
      message: "Add MONGODB_URI to .env.local, then restart the dev server.",
      ok: false,
      title: "MongoDB URI missing",
    };
  }

  const metadata = getMongoMetadata(uri);
  const startedAt = Date.now();
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 5000,
  });

  try {
    const response = await client.db("admin").command({
      ping: 1,
    });
    const isConnected = response.ok === 1;

    return {
      checkedAt,
      ...metadata,
      latencyMs: Date.now() - startedAt,
      message: isConnected
        ? "Atlas replied to the server-side ping."
        : `MongoDB replied with ok=${response.ok}.`,
      ok: isConnected,
      title: isConnected ? "MongoDB connected" : "MongoDB replied",
    };
  } catch (error) {
    return {
      checkedAt,
      ...metadata,
      latencyMs: Date.now() - startedAt,
      message: getErrorMessage(error),
      ok: false,
      title: "MongoDB connection failed",
    };
  } finally {
    await client.close().catch(() => undefined);
  }
}

function Detail({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="border-t border-zinc-200 py-4 first:border-t-0">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words font-mono text-sm text-zinc-950">
        {value}
      </dd>
    </div>
  );
}

export default async function Home() {
  const status = await checkMongoConnection();
  const checkedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(status.checkedAt));

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950 sm:px-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
              LiftLog database
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
              MongoDB connection check
            </h1>
          </div>

          <Link
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            href="/"
          >
            Run check again
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section
            className={`rounded-lg border p-6 shadow-sm ${
              status.ok
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div
                  className={`inline-flex rounded-md px-3 py-1 text-sm font-semibold ${
                    status.ok
                      ? "bg-emerald-600 text-white"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  {status.ok ? "Connected" : "Needs attention"}
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-normal">
                  {status.title}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-700">
                  {status.message}
                </p>
              </div>

              <div className="rounded-lg border border-white/80 bg-white/70 p-4 text-left">
                <p className="text-sm font-medium text-zinc-500">Latency</p>
                <p className="mt-1 text-3xl font-semibold">
                  {status.latencyMs === undefined
                    ? "N/A"
                    : `${status.latencyMs}ms`}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-normal">
              Connection details
            </h2>
            <dl className="mt-4">
              <Detail label="Host" value={status.host ?? "not configured"} />
              <Detail
                label="App name"
                value={status.appName ?? "not configured"}
              />
              <Detail label="Command" value="admin.ping" />
              <Detail label="Checked at" value={checkedAt} />
            </dl>
          </section>
        </div>
      </section>
    </main>
  );
}
