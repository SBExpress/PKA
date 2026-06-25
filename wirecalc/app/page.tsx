import { WireCalculator } from "@/components/wire-calculator"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-3xl">
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight">Express Wire & Conduit Calculator</h1>
        <WireCalculator />
      </div>
    </main>
  )
}
