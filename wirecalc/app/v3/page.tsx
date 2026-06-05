import { WireCalculatorV3 } from "@/components/wire-calculator-v3"

export default function V3Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Wire & Conduit Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            v3.0 Beta — With NEC Tables & Voltage Drop Optimization
          </p>
        </div>
        <WireCalculatorV3 />
      </div>
    </main>
  )
}
